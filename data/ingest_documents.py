"""
Synvera Document Ingestion — RAG v0

Extracts text chunks from source PDFs and inserts them into the
`document_chunks` PostgreSQL table for Full Text Search (FTS).

This script must be run manually by the user after placing the source PDFs
in data/pdfs/. It does NOT run automatically as part of CI or migrations.

Requirements:
    pip install pdfplumber psycopg[binary]

Usage:
    DATABASE_URL="postgres://..." python data/ingest_documents.py

PDFs expected in data/pdfs/:
    cbhpm_2022.pdf          — CBHPM 2022
    cbhpm_2025_2026.pdf     — CBHPM 2025-2026
    sbn_neurocirurgia_2018.pdf  — Manual SBN Neurocirurgia 2018
    coluna_3ed_2025.pdf     — Manual Cirurgia de Coluna 3ª ed. 2025

The script is idempotent: it clears existing chunks for each document
before reinserting, identified by (name, version_label).
"""

import os
import re
import sys
import textwrap
from pathlib import Path
from typing import Iterator

try:
    import pdfplumber
except ImportError:
    sys.exit("ERROR: pdfplumber not installed. Run: pip install pdfplumber")

try:
    import psycopg
except ImportError:
    sys.exit("ERROR: psycopg not installed. Run: pip install 'psycopg[binary]'")


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL environment variable is not set.")

DATA_DIR = Path(__file__).parent
PDF_DIR  = DATA_DIR / "raw_pdfs"

DOCUMENTS = [
    {
        "name": "CBHPM",
        "version_label": "2022",
        "document_type": "cbhpm",
        "pdf": PDF_DIR / "CBHPM-2022.pdf",
    },
    {
        "name": "CBHPM",
        "version_label": "2025-2026",
        "document_type": "cbhpm",
        "pdf": PDF_DIR / "COMUNICADO-CBHPM-2025_2026.pdf",
    },
    {
        "name": "Manual SBN Neurocirurgia",
        "version_label": "2018",
        "document_type": "sbn_manual",
        "pdf": PDF_DIR / "Manual_De_Diretrizes_De_Codificacao_Dos_Procedimentos_Em_Neurocirurgia-2018.pdf",
    },
    {
        "name": "Manual Cirurgia de Coluna",
        "version_label": "3ª ed. 2025",
        "document_type": "spine_manual",
        "pdf": PDF_DIR / "Manual_De_Diretrizes_De_Codificacao_Em_Cirurgia_De_Coluna_Vertebral-3ed-2025.pdf",
    },
]

# Approximate characters per chunk. FTS performs well on chunks of ~600–800 chars.
CHUNK_SIZE = 700
# Overlap between consecutive chunks so that context is not lost at boundaries.
CHUNK_OVERLAP = 120

# Heading patterns for Portuguese medical documents.
# A line is treated as a section heading when it matches one of these heuristics.
HEADING_RE = re.compile(
    r"""
    ^\s*(?:
        \d+(?:\.\d+)*\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]  |   # numbered heading: 1.2 Título
        [A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}               |   # ALL-CAPS heading
        (?:Capítulo|Seção|Artigo|Tabela)\s      # explicit structural keywords
    )
    """,
    re.VERBOSE,
)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def extract_pages(pdf_path: Path) -> Iterator[tuple[int, str]]:
    """Yield (page_number, text) for every page that has extractable text."""
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text and text.strip():
                yield i, text


def infer_section(text: str) -> str | None:
    """Return the first heading-like line found in the text block, or None."""
    for line in text.splitlines():
        if HEADING_RE.match(line):
            return line.strip()[:200]
    return None


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    """Split text into overlapping word-boundary chunks of approximately `size` chars."""
    words = text.split()
    chunks: list[str] = []
    start = 0
    while start < len(words):
        segment = words[start:]
        current = ""
        end = start
        for word in segment:
            if len(current) + len(word) + 1 > size and current:
                break
            current = (current + " " + word).lstrip()
            end += 1
        chunks.append(current)
        # Advance by (chunk_length - overlap) words.
        advance = max(1, end - start - max(1, int(overlap / 6)))
        start += advance
    return chunks


def extract_chunks(pdf_path: Path) -> list[dict]:
    """Return list of {page_number, section_title, chunk_text} from a PDF."""
    chunks: list[dict] = []
    current_section: str | None = None

    for page_num, page_text in extract_pages(pdf_path):
        # Update running section heading if a new heading is detected on this page.
        detected = infer_section(page_text)
        if detected:
            current_section = detected

        for chunk in chunk_text(page_text, CHUNK_SIZE, CHUNK_OVERLAP):
            clean = chunk.strip()
            if len(clean) < 60:
                # Skip near-empty fragments (page numbers, headers/footers).
                continue
            chunks.append({
                "page_number": page_num,
                "section_title": current_section,
                "chunk_text": clean,
            })

    return chunks


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def upsert_document(conn, name: str, version_label: str, document_type: str) -> str:
    """
    Return the UUID of the documents row matching (name, version_label),
    inserting it if it does not exist. The seed rows from migration 024 use
    deterministic UUIDs; this function handles documents added after migration.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO documents (name, version_label, document_type)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (name, version_label, document_type),
        )
        cur.execute(
            "SELECT id FROM documents WHERE name = %s AND version_label = %s",
            (name, version_label),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError(f"Could not find or insert document: {name} {version_label}")
        return str(row[0])


def replace_chunks(conn, document_id: str, chunks: list[dict]) -> int:
    """
    Replace all chunks for document_id with the provided list.
    Returns the number of inserted rows.
    """
    with conn.cursor() as cur:
        cur.execute("DELETE FROM document_chunks WHERE document_id = %s", (document_id,))
        if not chunks:
            return 0
        cur.executemany(
            """
            INSERT INTO document_chunks (document_id, page_number, section_title, chunk_text)
            VALUES (%s, %s, %s, %s)
            """,
            [
                (document_id, c["page_number"], c["section_title"], c["chunk_text"])
                for c in chunks
            ],
        )
        return len(chunks)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    missing = [d for d in DOCUMENTS if not d["pdf"].exists()]
    if missing:
        names = [str(m["pdf"]) for m in missing]
        print("WARNING: The following PDFs were not found and will be skipped:")
        for n in names:
            print(f"  {n}")
        print()

    available = [d for d in DOCUMENTS if d["pdf"].exists()]
    if not available:
        print("No PDFs found. Place source PDFs in data/pdfs/ and re-run.")
        sys.exit(0)

    with psycopg.connect(DATABASE_URL) as conn:
        for doc in available:
            print(f"Processing: {doc['name']} {doc['version_label']} ...")
            chunks = extract_chunks(doc["pdf"])
            doc_id = upsert_document(conn, doc["name"], doc["version_label"], doc["document_type"])
            inserted = replace_chunks(conn, doc_id, chunks)
            conn.commit()
            print(f"  ✓ {inserted} chunks inserted (document_id={doc_id})")

    print("\nIngestion complete.")


if __name__ == "__main__":
    main()
