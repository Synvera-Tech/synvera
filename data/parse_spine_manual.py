"""
parse_spine_manual.py — Structured ETL for the Spine Surgery coding manual.

Parses the "Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral
— 3ª ed. 2025" PDF and extracts every structured procedure FICHE as a
1-procedure → N-CBHPM-codes record, mirroring the SBN manual pipeline
(synvera_parser.py → procedures.json → generate_seed.py).

Every ficha is rendered by the manual as a single bordered table:

    ['Nome do Procedimento', '<N.N — TÍTULO>', ...]
    [None,                   '<SUBTÍTULO>', ...]          (optional continuation)
    ['Descrição do procedimento', '<texto>', ...]
    ['CIDs do Procedimento', '<cids>', ...]
    ['Indicação', '<texto>', ...]
    ['Caráter da Indicação', '<texto>', ...]
    ['Contraindicação', '<texto>', ...]
    ['Exames da Indicação', '<texto>', ...]
    ['Códigos CBHPM', 'Descrição do procedimento', ..., 'Porte']   ← table header
    ['<code>', '<descrição>', ..., '<porte>']                       ← one row per code
    ...
    ['OPMEs', ...] / ['Internação', ...]                            ← table ends

Table extraction (pdfplumber.extract_tables) yields these cells directly, which
is far more reliable than text heuristics for the code/description/porte columns.

Usage:
    python3 data/parse_spine_manual.py            # writes data/spine_procedures.json
    python3 data/parse_spine_manual.py --debug    # prints per-ficha diagnostics

Dependencies:
    pdfplumber (pip install pdfplumber)
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber is required:  pip install pdfplumber")

ROOT = Path(__file__).resolve().parents[1]
SPINE_PDF = ROOT / "data" / "raw_pdfs" / "Manual_De_Diretrizes_De_Codificacao_Em_Cirurgia_De_Coluna_Vertebral-3ed-2025.pdf"
EXISTING_CATALOG = ROOT / "backend" / "internal" / "repository" / "procedures.json"
OUTPUT_JSON = ROOT / "data" / "spine_procedures.json"

SOURCE_DOCUMENT = "Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral"
SOURCE_VERSION = "3ª ed. 2025"

CODE_RE = re.compile(r"^\d\.\d{2}\.\d{2}\.\d{2}-\d$")
LOOSE_CODE_RE = re.compile(r"\d[.\d]{6,12}-\d")
PORTE_RE = re.compile(r"^\d{1,2}[ABC]$")
HEADER_RE = re.compile(r"^\s*(\d{1,2}\.\d{1,2})\s*[—–\-]\s*(.+)$", re.DOTALL)
SUPERSCRIPTS = "¹²³⁴⁵⁶⁷⁸⁹⁰*"
TABLE_END_LABELS = ("OPMEs", "Internação", "Anestesia", "Materiais", "Resolub", "Seguimento", "Rastreab")


def clean(text: str | None) -> str:
    if not text:
        return ""
    text = text.replace("\n", " ")
    text = "".join(ch for ch in text if ch not in SUPERSCRIPTS)
    text = re.sub(r"\s+\d\s*$", "", text)        # trailing lone footnote digit
    return re.sub(r"\s{2,}", " ", text).strip(" -–—\t")


def load_aux_map() -> dict[str, int]:
    """code → num_auxiliaries from the existing SBN catalog (best-effort)."""
    aux: dict[str, int] = {}
    try:
        for row in json.loads(EXISTING_CATALOG.read_text(encoding="utf-8")):
            code = row.get("cbhpm_code")
            if code and code not in aux:
                aux[code] = row.get("num_auxiliaries", 0)
    except FileNotFoundError:
        pass
    return aux


def find_columns(header_row: list[str | None]) -> tuple[int, int, int]:
    """Locate (code_col, desc_col, porte_col) from a 'Códigos CBHPM' header row."""
    code_col = desc_col = porte_col = None
    for i, cell in enumerate(header_row):
        c = (cell or "").strip()
        if "Códigos CBHPM" in c:
            code_col = i
        elif c.startswith("Descrição"):
            desc_col = i
        elif c == "Porte":
            porte_col = i
    return (
        code_col if code_col is not None else 0,
        desc_col if desc_col is not None else 1,
        porte_col if porte_col is not None else len(header_row) - 1,
    )


def parse_code_rows(rows: list[list[str | None]], anomalies: list[str]) -> list[dict]:
    """Parse rows between the 'Códigos CBHPM' header and the next section label."""
    # Locate header.
    start = None
    for idx, row in enumerate(rows):
        if any("Códigos CBHPM" in (cell or "") for cell in row):
            start = idx
            break
    if start is None:
        return []

    code_col, desc_col, porte_col = find_columns(rows[start])

    codes: list[dict] = []
    seen: set[str] = set()
    current: dict | None = None

    for row in rows[start + 1:]:
        first = (row[code_col].strip() if row and code_col < len(row) and row[code_col] else "")
        # Stop at the next section.
        if any(first.startswith(lbl) for lbl in TABLE_END_LABELS):
            break
        if first == "l" or first == "":
            # Continuation of a wrapped description (code cell empty).
            desc_cont = clean(row[desc_col] if desc_col < len(row) else "")
            if current is not None and desc_cont and not any(
                lbl in desc_cont for lbl in ("Descrição", "Quantidade")
            ):
                current["description"] = clean(current["description"] + " " + desc_cont)
            continue

        if CODE_RE.match(first):
            if current is not None:
                codes.append(current)
            porte = (row[porte_col].strip() if porte_col < len(row) and row[porte_col] else "")
            if not PORTE_RE.match(porte):
                # Sometimes porte lands in a different trailing cell.
                porte = next((c.strip() for c in reversed(row)
                              if c and PORTE_RE.match(c.strip())), "")
            desc = clean(row[desc_col] if desc_col < len(row) else "")
            if first in seen:
                anomalies.append(f"duplicate code in ficha: {first}")
                current = None
                continue
            seen.add(first)
            current = {"code": first, "description": desc, "porte": porte}
            if not porte:
                anomalies.append(f"{first}: porte missing")
        else:
            # A non-empty, non-code first cell that is not a section label:
            # flag any malformed code token for the audit.
            for tok in LOOSE_CODE_RE.findall(first):
                if not CODE_RE.match(tok):
                    anomalies.append(f"malformed code token: {tok!r}")
            current = None

    if current is not None:
        codes.append(current)

    for order, c in enumerate(codes, start=1):
        c["sort_order"] = order
    return codes


def first_value_cell(row: list[str | None]) -> str:
    """Return the first non-empty cell at column index >= 1 (the value columns)."""
    for cell in row[1:]:
        v = clean(cell)
        if v:
            return v
    return ""


def is_fiche_table(table: list[list[str | None]]) -> bool:
    return any(
        row and (row[0] or "").strip() == "Nome do Procedimento"
        for row in table[:4]
    )


def extract_name(table: list[list[str | None]]) -> tuple[str, str, str, str]:
    """Return (number, title, subtitle, full_name) from a ficha table.

    The "Nome do Procedimento" block spans one or more rows; the procedure number
    + title may appear in the label row, the row above it, or a non-standard value
    column. We collect every value cell from the start of the name block up to the
    "Descrição do procedimento" / "CIDs" row, then parse the leading "N.N — TÍTULO".
    """
    name_row_idx = None
    for idx, row in enumerate(table[:4]):
        if row and (row[0] or "").strip() == "Nome do Procedimento":
            name_row_idx = idx
            break
    if name_row_idx is None:
        return "", "", "", ""

    start = name_row_idx
    # Some fiches place the "N.N — TÍTULO" line in the row *above* the label.
    if name_row_idx > 0:
        prev_val = first_value_cell(table[name_row_idx - 1])
        if HEADER_RE.match(prev_val):
            start = name_row_idx - 1

    parts: list[str] = []
    for row in table[start:]:
        label = (row[0] or "").strip() if row else ""
        if label in ("Descrição do procedimento",) or label.startswith("CIDs"):
            break
        if label not in ("", "l", "Nome do Procedimento"):
            break
        val = first_value_cell(row)
        if val:
            parts.append(val)

    header_text = clean(" ".join(parts))
    m = HEADER_RE.match(header_text)
    if m:
        number = m.group(1)
        full = clean(m.group(2))
    else:
        number, full = "", header_text

    # Split title / subtitle on the first em-dash if present (cosmetic only).
    if " — " in full:
        title, subtitle = full.split(" — ", 1)
    else:
        title, subtitle = full, ""
    return number, clean(title), clean(subtitle), full


def parse_manual(pdf_path: Path, debug: bool = False) -> list[dict]:
    aux_map = load_aux_map()
    results: list[dict] = []

    with pdfplumber.open(pdf_path) as pdf:
        pages_tables = [p.extract_tables() or [] for p in pdf.pages]

    for pno, tables in enumerate(pages_tables):
        for table in tables:
            if not table or not is_fiche_table(table):
                continue

            number, title, subtitle, name = extract_name(table)
            anomalies: list[str] = []
            rows = list(table)

            # Page-spanning fiche: if this table has the 'Códigos CBHPM' header but
            # no terminating section label after it, append the next page's leading
            # rows until a section label appears.
            has_header = any(any("Códigos CBHPM" in (c or "") for c in r) for r in rows)
            has_end = any((r[0] or "").strip().startswith(TABLE_END_LABELS)
                          for r in rows if r)
            if has_header and not has_end and pno + 1 < len(pages_tables):
                for nxt in pages_tables[pno + 1]:
                    if nxt and not is_fiche_table(nxt):
                        rows.extend(nxt)
                    break

            codes = parse_code_rows(rows, anomalies)

            if debug:
                print(f"[{number or '??'}] {name[:70]}")
                print(f"    {len(codes)} codes: {[c['code'] for c in codes]}")
                for a in anomalies:
                    print(f"    ⚠ {a}")

            results.append({
                "procedure_number": number,
                "name": name,
                "title": title,
                "subtitle": subtitle,
                "page": pno,
                "source_document": SOURCE_DOCUMENT,
                "source_version": SOURCE_VERSION,
                "cbhpm_codes": [
                    {**c, "num_auxiliaries": aux_map.get(c["code"], 0)} for c in codes
                ],
                "anomalies": anomalies,
            })

    return results


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default=str(SPINE_PDF))
    ap.add_argument("--out", default=str(OUTPUT_JSON))
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    fiches = parse_manual(Path(args.pdf), debug=args.debug)

    total_codes = sum(len(f["cbhpm_codes"]) for f in fiches)
    zero = [f["procedure_number"] for f in fiches if not f["cbhpm_codes"]]
    anom = sum(len(f["anomalies"]) for f in fiches)

    Path(args.out).write_text(
        json.dumps(fiches, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"✓ Wrote {len(fiches)} fiches · {total_codes} CBHPM mappings → {args.out}")
    print(f"  fiches with zero codes: {len(zero)} {zero if zero else ''}")
    print(f"  parse anomalies flagged: {anom}")


if __name__ == "__main__":
    main()
