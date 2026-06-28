# Roadmap — Motor de Cálculo Dirigido por Dados Normativos

**Data:** 2026-06-28
**Natureza:** Arquitetural e preparatório. **Nenhum cálculo, schema ou regra alterado.**
**Insumos:** [spine-rules-traceability.md](../audits/spine-rules-traceability.md) (regras R1–R22) e
[cbhpm-code-modifiers-matrix.md](../audits/cbhpm-code-modifiers-matrix.md) (modificadores por código).

## Objetivo

Migrar o motor de cálculo de uma lógica **hardcoded** (`billing_mode` espalhado, regras de via/lateralidade
fixas em Go) para uma arquitetura **data-driven**, onde cada regra clínico-faturável é uma linha de dado
**rastreável, versionável e auditável**, sem alterar nenhum resultado de cálculo nesta etapa.

---

## 1. Situação atual

| Camada | Estado | Evidência |
|---|---|---|
| Schema | `cbhpm_codes` tem `billing_mode`, `specialty`, `laterality_support` (3 colunas booleanas/enum) | schema.sql:78-89 |
| Engine | Multiplica por código (`PER_SEGMENT/VERTEBRA/STRUCTURE`) e via (`same/different`) — **lógica em Go** | engine.go:84-104; access_routes.go; spine.go |
| Dados | **2 códigos** classificados (`3.14.03.33-6`, `4.08.13.36-3`); 0 vértebra; 0 estrutura | `procedures.json` |
| Domínio | `specialty` inconsistente: `"Neurocirurgia, Coluna Vertebral"` (catálogo) ≠ enum `NEUROSURGERY` | merge_spine_into_catalog.py |
| Proveniência | **Inexistente** para regras de cálculo | — |
| Replay | Coberto por *snapshot* `calculation_breakdown` (ADR-001), não por re-derivação de regras | ADR-001 |

---

## 2. Lacunas encontradas

1. **Sem proveniência das regras** — não há onde guardar documento/página/trecho/confiança de cada regra.
2. **Dados normativos incompletos** — ~20 códigos SPINE sem classificação (matriz §8).
3. **Regras de domínio hardcoded** — via 50%/70% e lateralidade ×2 não distinguem SPINE×NEURO (R3, R12, R13).
4. **`billing_mode` insuficiente** — não expressa parâmetros (ex.: costectomia 100%+30%, R7) nem múltiplos modificadores por código.
5. **Domínio não confiável** — discriminador `specialty` precisa normalização para `NEUROSURGERY`/`SPINE`.
6. **Sem versionamento de regras** — impossível reproduzir "qual regra valia em data X" por re-derivação.

---

## 3. Tarefa 2 — Modelo de dados (projeto, sem migrar)

### Opção A — Reutilizar colunas atuais de `cbhpm_codes`
- **Prós:** zero migração; engine já lê.
- **Contras:** sem proveniência/confiança/página; um único `billing_mode` por código (não cabe `PER_STRUCTURE_DECREMENT` com parâmetro 30%); não distingue regra de via/lateralidade por domínio; não versionável. ❌ Inviável para o objetivo data-driven.

### Opção B — Nova tabela `cbhpm_code_modifiers` (recomendada)
Tabela normativa dedicada, **opt-in por código** (ausência ⇒ `PER_PROCEDURE` default; nenhum código neuro precisa de linha). Alinha com a decisão prévia (ADR-005) e com CLAUDE.md (sem dead schema: nasce com read/write/test paths na etapa de implementação).

```sql
-- PROPOSTA (não migrar nesta tarefa)
CREATE TABLE cbhpm_code_modifiers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cbhpm_code          VARCHAR(20) NOT NULL,
    specialty           VARCHAR(20) NOT NULL
                          CHECK (specialty IN ('NEUROSURGERY','SPINE')),
    billing_mode        VARCHAR(30) NOT NULL
                          CHECK (billing_mode IN ('PER_PROCEDURE','PER_SEGMENT',
                                 'PER_VERTEBRA','PER_STRUCTURE','PER_STRUCTURE_DECREMENT')),
    laterality_rule     VARCHAR(20) NOT NULL DEFAULT 'NONE'
                          CHECK (laterality_rule IN ('NONE','NO_DUPLICATE','BILATERAL_DOUBLE','CBHPM_4_3')),
    via_rule            VARCHAR(20) NOT NULL DEFAULT 'CBHPM_DEFAULT'
                          CHECK (via_rule IN ('CBHPM_DEFAULT','SPINE_50')),
    decrement_pct       NUMERIC(5,2),            -- p/ PER_STRUCTURE_DECREMENT (ex.: 30.00)
    max_quantity        INT,                     -- cap de UI; NULL = ilimitado
    supported_modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,  -- dicas de UI

    -- proveniência / replay (Tarefa 4)
    source_document     TEXT        NOT NULL,
    source_version      VARCHAR(40) NOT NULL,
    source_page         INT,
    source_excerpt      TEXT,
    confidence          VARCHAR(20) NOT NULL
                          CHECK (confidence IN ('CONFIRMED','INFERRED','WEAK')),
    implemented_at      TIMESTAMPTZ,
    verified_by         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cbhpm_code, specialty)
);
```

- **Prós:** rastreável, versionável, replay-ready, parametrizável (decrement_pct), múltiplos hints via JSONB; não toca o catálogo existente.
- **Contras:** migração; novos read/write/test paths; engine passa a resolver regra por lookup.

### Opção C — Ampliar `cbhpm_codes` com colunas de proveniência
- **Prós:** sem nova tabela.
- **Contras:** infla a tabela de catálogo; mistura "o que é o código" com "como se cobra"; não suporta parâmetros nem versionamento. ❌

**Recomendação:** **Opção B**. A `spine_procedure_metadata` (hoje informativa, schema.sql:255) **não** deve ser reaproveitada — ela é por-procedimento e informativa; modificadores são por-código e afetam cálculo.

### Cardinalidade (provada)
- `cbhpm_code` → modificador: **1:1 por especialidade** (UNIQUE `(cbhpm_code, specialty)`), pois um código pode ter porte/uso distinto em SPINE vs NEURO.
- procedimento → código: **1:N** (já em `sbn_cbhpm_mappings`). Os modificadores ficam no código, não no mapping — exceto o **porte**, que permanece por mapping (preserva divergências SBN×Coluna, ex. `3.07.15.39-3`).

---

## 4. Tarefa 3 — Etapas recomendadas

Cada etapa é behavior-preserving e termina com `go test ./...` + `npm run build` verdes.

| Etapa | Entrega | Altera cálculo? |
|---|---|---|
| **N0** | Correções de citação (R16-18 → item 4.6-4.8) + documentar R21 | **Não** |
| **N1** | ADR-005 + migração `cbhpm_code_modifiers` + `schema.sql` + `sqlc generate` (tabela **vazia**, sem leitura no engine) | **Não** |
| **N2** | Seed normativo a partir da matriz §1-6 (com proveniência real) + normalizar `specialty` | **Não** (engine ainda não lê) |
| **N3** | Read path: repositório carrega modificadores; engine **lê mas mantém defaults** (paridade comprovada por testes de regressão) | **Não** |
| **N4** | Plumbing de modificadores por código no frontend + UI contextual por domínio | **Não** (só habilita seleção) |
| **N5** | Ativar regras de domínio: R3 (no-dup), R12 (SPINE-50%), R7 (costectomia) — **muda valor**; exige aprovação clínica | **Sim** |
| **N6** | Pendências R14/R21/R22 conforme decisão | **Sim** |

> **Corte de segurança:** N0-N4 são preparatórios e **não mudam nenhum resultado**. A primeira etapa que altera valor é N5, e só entra com aprovação explícita por regra.

### Riscos

**Técnicos**
- Drift de `schema.sql` quebra `sqlc generate` (CLAUDE.md). Mitigação: rebuild + `go test` por etapa.
- Alteração do contrato OpenAPI exige consentimento + `oapi-codegen` (já autorizado previamente).
- Read path (N3) pode introduzir divergência silenciosa. Mitigação: testes de regressão "golden" comparando saída pré/pós com tabela vazia.

**Financeiros**
- N5 muda honorários (R3/R7/R12). Risco de sub/superfaturamento se a regra de domínio for mal aplicada. Mitigação: testes por cenário (mesma via, 360°, bilateral, costectomia) com valores esperados derivados do Manual.
- R14 (principal) pode reordenar o código principal em multi-código com ×N → muda total. Manter congelado até decisão.

**Impacto frontend**
- `useSpineVariables` (estado global) → estado **por código**; `SpineVariablesPanel` → render contextual por domínio; `payload-builders` passa a montar modificadores por código. Sem mudança de cálculo até N5.

**Impacto backend**
- Novo repositório/queries (`cbhpm_code_modifiers`); engine resolve `billing_mode`/`via_rule`/`laterality_rule` por lookup em vez de constante. `models` ganha tipos de regra.

**Impacto banco**
- Nova tabela + seed; nenhuma coluna removida; `spine_procedure_metadata` intacta. Migração aditiva e reversível (DROP TABLE no rollback; sem perda de dados de cálculo).

---

## 5. Tarefa 4 — Replay readiness (versionamento de regras)

**Princípio (ADR-001):** calculações salvas já guardam `calculation_breakdown` verbatim ⇒ replay por *snapshot* já funciona. O versionamento de **regras** habilita o replay por **re-derivação** ("recalcular dos inputs com as regras vigentes na data X").

**Campos de proveniência/replay** (embutidos na tabela proposta §3):

| Campo | Propósito |
|---|---|
| `source_document` | Manual de origem (ex. "Manual de Coluna 3ª ed. 2025") |
| `source_version` | Edição (ex. "3ª ed. 2025") |
| `source_page` | Página exata (ex. 9) |
| `source_excerpt` | Trecho verbatim que fundamenta a regra |
| `confidence` | CONFIRMED / INFERRED / WEAK |
| `implemented_at` | Quando a regra passou a afetar o cálculo |
| `verified_by` | Quem validou clinicamente |

**Estratégia de versionamento (proposta, escolher na implementação):**
- **V1 (leve, recomendada agora):** sem tabela de versões; confiar no *snapshot* (ADR-001) para replay. A tabela carrega proveniência mas não histórico.
- **V2 (futuro):** adicionar `valid_from`/`valid_to` ou `modifier_version_id` (análogo a `cbhpm_versions`, ADR-004) para re-derivação histórica. A tabela já nasce compatível (basta colunas nulas adicionais).

---

## 6. Tarefa 5 — Pendências (documentar, não implementar)

### R14 — Principal: maior porte ✅ DECIDIDO E IMPLEMENTADO (2026-06-28)
- **Norma:** CBHPM 4.1 (p.23) — principal = "procedimento de **maior porte**".
- **Implementado:** `service.porteRank` ordena por porte (tier × 3 + subletra A/B/C); o engine escolhe o
  principal pelo maior porte, não pelo valor ajustado. Desempate estável: 1ª ocorrência no payload.
- **Cenário concreto** (valores ilustrativos):
  - Código A: porte 9C, base 1.000, `PER_PROCEDURE` (×1) → ajustado 1.000.
  - Código B: porte 7C, base 600, `PER_VERTEBRA` ×3 → ajustado 1.800.
  - **Agora:** principal = A (maior porte). Cirurgião = 1.000 + 50%×1.800 = **1.900** (correto).
  - Antes (valor ajustado): principal = B → 1.800 + 50%×1.000 = 2.300.

### R21 — Modelo de anestesia
- **Atual:** `anesthesiaFee = 1200.00` fixo (portes.go:4). **Sem base normativa** — CBHPM usa porte anestésico AN1-AN8 vinculado ao procedimento (p.22, item 1.3).
- **Cenários:** (a) manter fixo como "referência"; (b) tabela `anesthesia_porte_values` AN1-AN8 + mapeamento procedimento→AN; (c) remover anestesia do total e exibir "sob consulta".
- **Impacto:** muda `AnesthesiologistFee` e `FinalTotal`. Requer fonte (mapa procedimento→AN) hoje inexistente no repo.

### R22 — Composição de múltiplos ajustes
- **Atual:** aditivo — urg(30%) + ped(100%) ⇒ ×2,30 (engine.go:176-192).
- **Norma:** silente sobre composição entre acréscimos.
- **Cenário concreto:** base 1.000.
  - **Aditivo (atual):** 1.000 × (1 + 0,30 + 1,00) = **2.300**.
  - **Multiplicativo:** 1.000 × 1,30 × 2,00 = **2.600**.
  - **Δ = R$ 300**. Manter aditivo (decisão de negócio) salvo orientação contrária.

---

## 7. Restrições honradas

- ✅ Nenhum resultado de cálculo alterado.
- ✅ Nenhuma regra auditada modificada.
- ✅ Nenhuma funcionalidade removida.
- ✅ Nenhuma lógica clínica nova introduzida.
- ✅ Apenas artefatos documentais criados.
