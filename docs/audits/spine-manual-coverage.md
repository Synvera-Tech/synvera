# Auditoria de Cobertura — Manual de Coluna → CBHPM

**Data:** 2026-06-28
**Fonte:** Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed. 2025 (SBC/SBOT & SBN)
**Escopo:** fonte (PDF) → parser → `procedures.json` → seed (003) → banco → API → frontend.
**Motivação:** procedimentos de cirurgia de coluna não apareciam na busca da Procedure Page (apenas dois "chips" de exemplo — que eram procedimentos SBN — funcionavam).

---

## 1. Causa raiz (provada)

As **81 fichas estruturadas** do Manual de Coluna (formato `Nome do Procedimento` + tabela `Códigos CBHPM | Descrição | Porte`, idêntico ao Manual SBN) **nunca foram importadas** para a base operacional.

O único uso anterior do PDF de Coluna era:

1. `document_chunks` (RAG v0, migration 024); e
2. `data/generate_catalog.py :: parse_spine_procedures()`, que casava apenas linhas soltas `código: descrição` da Seção II e tratava **cada código como um procedimento isolado** — sem relação ficha → N códigos.

**Evidência (antes):**

| Verificação | Resultado (antes) |
|---|---|
| Procedimentos com `specialty='SPINE'` no catálogo | **0** |
| Busca por `cirurgia endoscópica para hérnia discal` | **0 resultados** |
| Busca por `hérnia discal` / `artrodese` / `escoliose` / `espondilolistese` | **0 resultados** |
| Códigos da ficha 7.2 presentes | **6 de 10** (4 ausentes: `3.07.15.18-0`, `3.07.15.39-3`, `3.07.15.36-9`, `2.02.02.04-0`) |
| Procedimento "CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL" | **inexistente** |

Os "chips" `Infiltração de coluna` e `Rizotomia de facetas por radiofrequência` funcionavam porque são procedimentos do **Manual SBN** (Cap. 9), já presentes na base — não por cobertura de coluna.

---

## 2. Pipeline implementado

```
PDF Coluna 3ed 2025
  → data/parse_spine_manual.py   (extract_tables → 81 fichas, 1:N)
  → data/spine_procedures.json
  → data/merge_spine_into_catalog.py  (append idempotente, preserva IDs SBN)
  → backend/internal/repository/procedures.json
  → data/generate_seed.py        (emite specialty)
  → backend/db/migrations/003_seed_procedures.sql
  → migration 026 (source_document/source_version)
  → banco → API Search/GetByID → Procedure Page
```

Modelagem: **reuso de `sbn_procedures`** com `specialty='SPINE'` + colunas de proveniência `source_document`/`source_version` (migration 026). Relação 1:N preservada em `sbn_cbhpm_mappings`. Nenhuma arquitetura paralela; busca unificada SBN + Coluna.

---

## 3. Cobertura (depois)

| Métrica | Valor |
|---|---|
| Fichas detectadas no manual | **81 / 81** (Cap. 1–8: 11+17+9+10+9+7+5+13) |
| Fichas com zero códigos | **0** |
| Mappings procedimento → CBHPM extraídos | **672** |
| Códigos CBHPM distintos | **65** |
| Códigos novos adicionados ao catálogo | **35** |
| Códigos sem porte | **0** |
| Códigos duplicados dentro de uma ficha | **0** |
| Anomalias de parsing (código malformado etc.) | **0** |
| Procedimentos de coluna importados (searchable) | **73** (69 novos + 4 desambiguados) |
| Colisões idênticas já no catálogo (puladas) | **8** |

**Cobertura efetiva: 100%** — todos os 81 conjuntos de códigos do manual estão acessíveis pela busca e pelo detalhe.

### Prova — ficha 7.2 (CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL)

Retorna exatamente os 10 códigos do manual, na ordem documentada:

```
3.07.15.05-9 · 3.07.15.18-0 · 3.07.15.39-3 · 3.07.15.36-9 · 3.07.15.09-1
3.07.15.19-9 · 3.16.02.16-9 · 3.14.01.26-0 · 4.08.11.02-6 · 2.02.02.04-0
```

Verificado por `TestSpineProcedure72ReturnsAllCodes` (`internal/repository/spine_coverage_test.go`).

---

## 4. Exceções explícitas

### 4.1 — 8 fichas administrativas idênticas (puladas)

Fichas do Cap. 1/8 (consulta, visita, parecer, rizotomia) cujo nome **e** conjunto de códigos já existem no catálogo SBN (tagueadas "Neurocirurgia, Coluna Vertebral"). Já são pesquisáveis; duplicá-las introduziria ruído. Como `FileRepository.buildIndex` e `generate_seed.py` agrupam por `procedure_name`, pular evita merge incorreto. Conjuntos de códigos são bit-a-bit idênticos — nenhuma perda de cobertura.

### 4.2 — 4 fichas com colisão de nome e códigos divergentes (desambiguadas)

Fichas 1.2, 1.6, 1.10, 1.11: mesmo nome de um procedimento SBN, porém com conjunto de códigos **diferente** (versão Coluna mais completa). Importadas como procedimentos distintos com sufixo `(Cirurgia de Coluna)` para evitar merge e preservar ambas as versões.

### 4.3 — 3 divergências de porte (SBN vs Coluna)

Mesmo código com porte diferente entre os dois manuais (sem sobreposição):

| Código | Porte SBN | Porte Coluna |
|---|---|---|
| `3.07.15.32-6` | 10B | 11B |
| `1.01.02.01-9` | 2A | 2B |
| `1.01.01.03-9` | 2B | 2C |

`sbn_cbhpm_mappings.porte_code` é **por mapeamento**, então cada procedimento preserva o porte do seu manual de origem. Não há sobrescrita. Divergências registradas para revisão clínica futura; não bloqueiam cálculo.

### 4.4 — `billing_mode` padrão

Todas as fichas de coluna foram importadas com `billing_mode='PER_PROCEDURE'`. As regras multi-segmentares do manual (cobrança "× nº de segmentos/vértebras") são descritas em prosa e **não** foram inferidas automaticamente por código. O usuário ainda pode ajustar quantidade na UI. Refinar `billing_mode` por código é trabalho futuro.

---

## 5. Reexecução

```bash
python3 data/parse_spine_manual.py          # PDF → data/spine_procedures.json
python3 data/merge_spine_into_catalog.py     # → procedures.json (idempotente)
python3 data/generate_seed.py                # → migration 003
cd backend/db && sqlc generate
cd backend && go test ./...
```

Ver `docs/spine-manual-import.md` para detalhes do pipeline.
