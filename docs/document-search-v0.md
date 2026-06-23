# Document Search — RAG v0

## Overview

RAG v0 is Synvera's first version of document-backed clinical reference search.  
It uses PostgreSQL Full Text Search (FTS) exclusively — no AI, no embeddings, no vector database.

**What it is:** A deterministic, ranked retrieval system over indexed chunks of authoritative medical billing documents.  
**What it is not:** A chatbot, an AI assistant, a recommendation engine, or a calculation modifier.

The document search system is strictly read-only. It has zero influence on fee calculations, compositions, or clinical rules applied by the valuation engine.

---

## Architecture

```
User query
    ↓
POST /api/document-search
    ↓
PostgreSQL FTS
  plainto_tsquery('portuguese', query)
  → document_chunks.search_vector @@ tsquery
  → ts_rank() ORDER BY score DESC
  → ts_headline() excerpt generation
    ↓
JSON response: [{document, version, page, section, excerpt, score}]
    ↓
DocumentSearchPanel (frontend)
```

---

## Source Documents

| Document | Version | Type | Status |
|---|---|---|---|
| CBHPM | 2022 | cbhpm | Seed chunks in migration 024 |
| CBHPM | 2025-2026 | cbhpm | Seed chunks in migration 024 |
| Manual SBN Neurocirurgia | 2018 | sbn_manual | Seed chunks in migration 024 |
| Manual Cirurgia de Coluna | 3ª ed. 2025 | spine_manual | Seed chunks in migration 024 |

Full corpus extraction requires running `data/ingest_documents.py` with source PDFs.

---

## Database Schema

### `documents`

Registry of indexed source documents.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| name | TEXT | e.g. "CBHPM" |
| version_label | TEXT | e.g. "2025-2026" |
| document_type | TEXT | CHECK: cbhpm / sbn_manual / spine_manual |
| created_at | TIMESTAMPTZ | |

### `document_chunks`

One row per indexed text segment.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_id | UUID FK | → documents(id) ON DELETE CASCADE |
| page_number | INT | Source page in the original PDF |
| section_title | TEXT (nullable) | Nearest heading above the chunk |
| chunk_text | TEXT | Raw text (~700 chars) |
| search_vector | TSVECTOR GENERATED | to_tsvector('portuguese', section_title \|\| chunk_text) STORED |
| created_at | TIMESTAMPTZ | |

GIN index on `search_vector` enables fast `@@` matches.

---

## API

### `POST /api/document-search`

No authentication required.

**Request:**
```json
{
  "query": "urgência emergência adicional 30%",
  "limit": 10
}
```

- `query`: required, min 3 chars, max 200 chars
- `limit`: optional, default 10, max 30

**Response:**
```json
{
  "results": [
    {
      "document": "CBHPM",
      "version": "2022",
      "page": 47,
      "section": "Urgência e Emergência",
      "excerpt": "Os procedimentos realizados em caráter de «urgência» ou «emergência»...",
      "score": 0.0759
    }
  ]
}
```

Excerpts use `«` and `»` as highlight delimiters (ts_headline custom config).  
The frontend `DocumentSearchPanel` renders these as `<mark>` elements.

**Error responses:**
- `400` — query too short, empty, or invalid JSON
- `405` — method not POST
- `500` — FTS execution failure

---

## Frontend

`DocumentSearchPanel` (`frontend/components/procedure/DocumentSearchPanel.tsx`) is rendered in the Procedure Page between the main workspace grid and the page footer.

Features:
- Collapsible panel (closed by default, no layout impact)
- 6 quick-access chips for common queries
- Free-text search input (min 3 chars)
- Highlight rendering of `«match»` delimiters from ts_headline
- Empty state and error state messages in PT-BR
- Full dark/light mode support via Tailwind design tokens

---

## Ingestion

Full PDF ingestion is handled by `data/ingest_documents.py`.

### Setup

```bash
pip install pdfplumber "psycopg[binary]"
mkdir -p data/pdfs
# Place PDFs in data/pdfs/:
#   cbhpm_2022.pdf
#   cbhpm_2025_2026.pdf
#   sbn_neurocirurgia_2018.pdf
#   coluna_3ed_2025.pdf
```

### Run

```bash
DATABASE_URL="postgres://..." python data/ingest_documents.py
```

The script is idempotent — it replaces existing chunks per document on each run.

### Chunking strategy

- Page-by-page extraction via pdfplumber
- ~700 char chunks with ~120 char word-boundary overlap
- Section heading detection via regex heuristics (numbered headings, ALL-CAPS)
- Fragments under 60 chars (page numbers, headers) are discarded

---

## Future: RAG v1

The `DocumentRetriever` interface in `backend/internal/docsearch/types.go` is the extension point for a future LLM integration.

```go
type DocumentRetriever interface {
    SearchDocuments(query string, limit int) ([]SearchResult, error)
}
```

RAG v1 would extend the pipeline without changing handler or repository code:

```
Query
  → FTS Retrieval (same SearchDocuments call)
  → ContextBuilder (format ranked chunks as LLM prompt context)
  → LLMProvider (OpenAI / Anthropic / local)
  → GeneratedAnswer
```

No handler, route, or repository changes required. The interface is already satisfied by `PostgresRepository` and stubbed by `FileRepository`.

**What must NOT change in RAG v1:**
- The calculation engine remains the sole source of numerical truth
- Document search must never modify compositions, codes, or fee values
- LLM responses are labelled as AI-generated and reference the source chunk

---

## Non-goals (permanent)

- No Elasticsearch, OpenSearch, or additional infrastructure
- No embeddings, pgvector, or vector database
- No automatic answer generation in RAG v0
- No modification of compositions or calculations by the document layer
- No streaming, chat, or agent behavior
