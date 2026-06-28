# Relatório Final — Importação Estruturada do Manual de Coluna

**Data:** 2026-06-28
**Branch:** `feature/no-plans`
**Objetivo:** transformar as fichas do *Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed. 2025* em dados estruturados, pesquisáveis e calculáveis dentro do Synvera (mesma base canônica do Manual SBN).
**Skills obrigatórios usados:** investigative-debug · data-model-audit · clinical-rules-audit · safe-refactoring · deployment-readiness. Todos os gates verdes.

---

## 1–2. Diagnóstico e como o Manual SBN era importado

O Manual SBN vira dados via `synvera_parser.py` / `generate_catalog.py` → `procedures.json`
(flat, 1 linha por código, agrupada por `procedure_name`) → `generate_seed.py` →
migration 003 → tabelas `sbn_procedures` / `cbhpm_codes` / `sbn_cbhpm_mappings` (relação 1:N).

**Causa raiz provada:** as 81 fichas estruturadas do Manual de Coluna **nunca foram
importadas** para a base operacional — o PDF era usado apenas em `document_chunks` (RAG v0)
e num tagueamento flat. Os "chips" *Infiltração de coluna* e *Rizotomia de facetas*
funcionavam porque são procedimentos do **Manual SBN** (Cap. 9), já presentes na base — não
por cobertura de coluna.

## 3. Como o Manual de Coluna foi importado

Novo pipeline reusando o padrão SBN:

```
parse_spine_manual.py (pdfplumber extract_tables, robusto a 2 layouts)
  → spine_procedures.json
  → merge_spine_into_catalog.py (idempotente, append-only)
  → procedures.json
  → generate_seed.py (estendido com specialty)
  → migration 003 + migration 026 (provenance)
  → banco → API → Procedure Page
```

## 4. Decisão de modelagem

Reuso de `sbn_procedures` com `specialty='SPINE'` + colunas `source_document` /
`source_version` (migration 026), expostas via `ProcedureDetail.source` (openapi). Busca
unificada SBN + Coluna; sem arquitetura paralela. Nenhum ADR contrariado (reforça o ADR-003:
nenhum campo de schema morto — proveniência tem read path completo até a UI).

## 5–8. Cobertura — antes → depois

| Métrica | Antes | Depois |
|---|---|---|
| Fichas detectadas no manual | — | **81 / 81** (Cap. 1–8) |
| Fichas com zero códigos | — | **0** |
| Procedimentos de coluna pesquisáveis | **0** | **73** (69 novos + 4 desambiguados) |
| Colisões idênticas já no catálogo (puladas) | — | **8** |
| Mappings procedimento → CBHPM | — | **672** |
| Códigos CBHPM distintos / novos | — | **65 / 35** |
| Códigos sem porte / duplicados / anomalias | — | **0 / 0 / 0** |
| Busca "hérnia discal" / "artrodese" / "escoliose" | **0** | **> 0** |
| Ficha 7.2 (códigos retornados) | **6 / 10** | **10 / 10** |

**Cobertura efetiva: 100%.**

## 9. Exceções explícitas (ver `docs/audits/spine-manual-coverage.md`)

- **8 fichas administrativas idênticas** (consulta/visita/parecer) já no catálogo — puladas
  para não duplicar; conjuntos de códigos bit-a-bit idênticos, sem perda.
- **4 fichas com colisão de nome e códigos divergentes** (1.2, 1.6, 1.10, 1.11) — importadas
  com sufixo `(Cirurgia de Coluna)` para não fazer merge incorreto.
- **3 divergências de porte** SBN × Coluna (`3.07.15.32-6`, `1.01.02.01-9`, `1.01.01.03-9`)
  — preservadas por mapeamento, sem sobrescrita.
- **`billing_mode` padrão `PER_PROCEDURE`** — regras multi-segmentares (em prosa) não
  auto-inferidas. Limitação documentada.

## 10. Testes adicionados (todos verdes)

`backend/internal/repository/spine_coverage_test.go`:
`TestSpineProcedure72ReturnsAllCodes`, `TestSpineProceduresAreSearchable`,
`TestSpineProcedureProvenance`, `TestSpineManualCoverage`, `TestSpineProcedureCalculates`,
`TestSBNProceduresNoRegression`.

## 11–12. Arquivos alterados

**Novos:** `data/parse_spine_manual.py`, `data/merge_spine_into_catalog.py`,
`data/spine_procedures.json`, `backend/db/migrations/026_spine_procedure_source.sql`,
`backend/internal/repository/spine_coverage_test.go`, `docs/spine-manual-import.md`,
`docs/audits/spine-manual-coverage.md`, `docs/spine-import-final-report.md`.

**Alterados:** `backend/internal/repository/procedures.json`,
`backend/db/migrations/003_seed_procedures.sql`, `data/generate_seed.py`,
`backend/db/schema.sql`, `backend/db/query.sql`, `backend/internal/db/models.go`,
`backend/internal/db/query.sql.go`, `backend/internal/models/domain.go`,
`backend/internal/repository/postgres_repository.go`,
`backend/internal/repository/file_repository.go`,
`backend/internal/handlers/procedure.go`, `openapi.yaml`,
`backend/internal/generated/openapi.gen.go`, `frontend/lib/procedure/types.ts`,
`frontend/app/procedure/page.tsx`, `CLAUDE.md`.

## 13. Comandos executados (todos verdes)

`parse_spine_manual.py` · `merge_spine_into_catalog.py` · `generate_seed.py` ·
`sqlc generate` · `oapi-codegen` · `go build/vet/test ./...` · `tsc --noEmit` · `npm run build`.

## 14. Prova — ficha 7.2 retorna todos os códigos

`CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL` → 10/10 códigos, na ordem do manual:

```
3.07.15.05-9 · 3.07.15.18-0 · 3.07.15.39-3 · 3.07.15.36-9 · 3.07.15.09-1
3.07.15.19-9 · 3.16.02.16-9 · 3.14.01.26-0 · 4.08.11.02-6 · 2.02.02.04-0
```

Cálculo reproduzido: 10/10 códigos com base > 0, **total R$ 11.363,63**, sem truncamento.

## 15. Prova — Procedure Page pesquisa e calcula coluna

8 queries clínicas retornam resultados; o engine valoriza todos os códigos; badge de fonte
("Manual de Coluna · 3ª ed. 2025") na UI de detalhe.

---

## ⚠️ Passo operacional pendente (deploy)

A parte de **código** está 100% pronta e testada. Falta **um passo manual de banco**:
aplicar as migrations na base de **produção** (Neon). Neste projeto as migrations **não são
aplicadas automaticamente** — são rodadas à mão via `psql` (ver README). Enquanto isso não
acontecer, os procedimentos de coluna aparecem em **dev/testes** (FileRepository, lê do
`procedures.json`) mas **não em produção** (que lê do banco).

Aplicar, em ordem (são idempotentes — seguros para re-rodar):

```bash
psql "$DATABASE_URL" -f backend/db/migrations/003_seed_procedures.sql
psql "$DATABASE_URL" -f backend/db/migrations/026_spine_procedure_source.sql
```

- **003** insere os 73 procedimentos de coluna + 35 códigos novos + 672 mapeamentos
  (`ON CONFLICT` — não duplica nem altera dados SBN existentes).
- **026** adiciona as colunas `source_document`/`source_version` e preenche a proveniência.

Depois, validar contra produção:

```bash
curl "$API_URL/api/procedures/search?q=hérnia%20discal"     # deve retornar resultados
# abrir o detalhe do 7.2 → 10 códigos + campo source
```
