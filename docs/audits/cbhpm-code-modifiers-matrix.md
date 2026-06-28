# Matriz de Modificadores por Código CBHPM

**Data:** 2026-06-28
**Natureza:** Artefato de engenharia. Base normativa para o **futuro seed** de modificadores.
**Restrição:** Documental. Nenhum cálculo, schema ou regra foi alterado.
**Fonte primária:** Manual de Coluna 3ª ed. 2025 (COLUNA), p.9 "Conceitos Preliminares" + páginas de detalhe; CBHPM 2022 para regras gerais. Ver [spine-rules-traceability.md](spine-rules-traceability.md) para o trecho verbatim de cada regra (R#).

## Convenções de coluna

- **Billing Mode:** `PER_PROCEDURE` | `PER_SEGMENT` | `PER_VERTEBRA` | `PER_STRUCTURE` | `PER_STRUCTURE_DECREMENT` (*proposto p/ costectomia*).
- **Lateralidade:** regra a aplicar (não confundir com `laterality_support` atual).
- **Via:** regra de código adicional em composição multi-código.
- **Modificadores suportados:** controles que a UI deveria oferecer para o código.
- **Status impl.:** ✅ coincide · ⚠️ diverge · ❌ ausente (catálogo = `PER_PROCEDURE` default).

> **Legenda de via.** `SPINE-50%` = código adicional sempre a 50%, inclusive 360° (R12, COLUNA pp.42/62).
> `CBHPM-4.1/4.2` = 50% mesma via / 70% vias diferentes (R10/R11, CBHPM p.23). A regra de via é da
> **composição**, não do código isolado; a coluna indica qual regime se aplica quando o código é adicional.

---

## 1. SPINE — Cobrados POR SEGMENTO (×N segmentos)  · COLUNA p.9 (R4)

| Código | Esp. | Billing Mode | Lateralidade | Via | Modificadores | Doc | Pág. | Trecho | Status |
|---|---|---|---|---|---|---|---|---|---|
| 3.07.15.01-6 | SPINE | PER_SEGMENT | não-duplica (R3) | SPINE-50% | `segment_count` | COLUNA | 9, 10 | "multiplicado pelo número de segmentos artrodesados … 3.07.15.01-6 (x 3)" | ❌ |
| 3.07.15.02-4 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 10 | "multiplicado pelo número de segmentos artrodesados" | ❌ |
| 3.07.15.11-3 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9 | lista "POR SEGMENTO" | ❌ |
| 3.07.15.09-1 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 10 | "multiplicado para cada nível operado" | ❌ |
| 3.07.15.36-9 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 10 | "multiplicado pelo número de segmentos operados" | ❌ |
| 3.07.15.39-3 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9 | lista "POR SEGMENTO" (porte 12B) | ❌ ⚠️porte |
| 3.07.15.18-0 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 10 | "multiplicado por cada disco operado" | ❌ |
| 3.07.15.59-8 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 13 | "multiplicado pelo número de segmentos operados" | ❌ |
| 3.14.03.33-6 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 160 | "multiplicado pelo número de segmentos vertebrais abordados" | ✅ ⚠️lat |
| 3.14.03.03-4 | SPINE | PER_SEGMENT | não-duplica | SPINE-50% | `segment_count` | COLUNA | 9, 157-159 | "multiplicado pelo número de segmentos vertebrais denervados" | ❌ |

**Observações:**
- `3.07.15.39-3`: porte da p.9 (COLUNA) = **12B**; catálogo = **12C**. Divergência SBN×Coluna preservada por mapping (CLAUDE.md). Registrar e decidir na E1.
- `3.14.03.33-6`: já `PER_SEGMENT` ✅, mas hoje com `laterality_support=true` — incoerente com R3 (não-duplica). Rever na E1.

---

## 2. SPINE — Cobrados POR VÉRTEBRA (×N vértebras)  · COLUNA p.9 (R5)

| Código | Esp. | Billing Mode | Lateralidade | Via | Modificadores | Doc | Pág. | Trecho | Status |
|---|---|---|---|---|---|---|---|---|---|
| 3.07.15.03-2 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | lista "POR CADA VÉRTEBRA OPERADA" | ❌ |
| 3.07.15.19-9 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | idem | ❌ |
| 3.07.15.22-9 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | idem | ❌ |
| 3.07.15.28-8 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | "substituição do corpo de L2 … L3 … remunerada pelos dois níveis vertebrais" | ❌ |
| 3.07.15.38-5 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | lista "POR CADA VÉRTEBRA OPERADA" | ❌ |
| 3.07.15.17-2 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | idem | ❌ |
| 4.08.14.09-2 | SPINE | PER_VERTEBRA | não-duplica | SPINE-50% | `vertebra_count` | COLUNA | 9 | idem | ❌ |

---

## 3. SPINE — Cobrados POR ESTRUTURA (×N estruturas)  · COLUNA p.9 (R6)

| Código | Esp. | Billing Mode | Lateralidade | Via | Modificadores | Doc | Pág. | Trecho | Status |
|---|---|---|---|---|---|---|---|---|---|
| 4.08.13.36-3 | SPINE | PER_STRUCTURE | **conta L/R como estruturas** | SPINE-50% | `structure_count` | COLUNA | 9, 11, 157 | "multiplicado pelo número de segmentos facetários e neuroforames infiltrados (existem facetas e neuroforames à direita e à esquerda)"; "(Duas articulações facetárias e dois forames por nível)" | ⚠️ (catálogo=PER_SEGMENT) |
| 2.01.03.30-1 | SPINE | PER_STRUCTURE | não-duplica | SPINE-50% | `structure_count` | COLUNA | 9, 11 | "cobrado por músculo tratado" | ❌ |

**Observação:** `4.08.13.36-3` está hoje como `PER_SEGMENT` no catálogo; a norma classifica como **estrutura** (faceta/forame). Efeito numérico (×N) é o mesmo, mas o **rótulo/semântica do seletor** diverge — corrigir na E1.

---

## 4. SPINE — Regra própria (decremento percentual)  · COLUNA p.13 (R7)

| Código | Esp. | Billing Mode | Lateralidade | Via | Modificadores | Doc | Pág. | Trecho | Status |
|---|---|---|---|---|---|---|---|---|---|
| 3.06.01.02-9 | SPINE | **PER_STRUCTURE_DECREMENT** (proposto) | não-duplica | SPINE-50% | `structure_count` (100% + 30%/adicional) | COLUNA | 13 | "Costectomia … porte para 1 arco costal e 30% deste porte para cada arco adicional" | ❌ (modo inexistente) |

**Observação:** listado sob "POR ESTRUTURA" na p.9, mas a p.13 define **100% + 30%/arco adicional** — NÃO é ×N. Exige modo de cálculo novo. Não implementar nesta etapa.

---

## 5. SPINE — Cobrados UMA VEZ por cirurgia (×1)  · COLUNA p.9 (R8/R9)

| Código | Esp. | Billing Mode | Lateralidade | Via | Modificadores | Doc | Pág. | Trecho | Status |
|---|---|---|---|---|---|---|---|---|---|
| 3.07.15.05-9 | SPINE | PER_PROCEDURE (1×) | n/a | SPINE-50% | `endoscopic_access` (informativo) | COLUNA | 9, 10 | "Cirurgia de coluna por via endoscópica … independentemente do número de portais realizados" | 🟡✅ (default) |
| 3.07.32.02-6 | SPINE | PER_PROCEDURE (1×) | n/a | SPINE-50% | `complementary_step` (informativo) | COLUNA | 9, 13 | "Enxerto ósseo" (lista "uma vez por cirurgia") | 🟡✅ |
| 3.14.01.26-0 | SPINE | PER_PROCEDURE (1×) | n/a | SPINE-50% | `complementary_step` (informativo) | COLUNA | 13 | "Tratamento cirúrgico da fístula liquórica" | 🟡✅ |

**Observação:** comportam-se como `PER_PROCEDURE` (×1, já correto por default). Os "modificadores" aqui são **informativos/UI** (técnica endoscópica; etapa complementar), não multiplicadores. A "guarda explícita" contra multiplicação é opcional.

---

## 6. Códigos com regra encontrada FORA da seção 5 (achados de auditoria)

| Código | Esp. | Billing Mode | Doc | Pág. | Trecho | Confiança |
|---|---|---|---|---|---|---|
| 4.08.14.10-6 (Discografia) | SPINE | PER_SEGMENT (por disco) | COLUNA | 11 | "Este procedimento é multiplicado pelo número de discos operados." | 🟢 |
| 3.16.02.15-0 (Bloqueio neurolítico) | SPINE | PER_SEGMENT? | COLUNA | 11 | "geralmente realizado uma vez por segmento da coluna vertebral" | 🟠 ( "geralmente") |

**Observação:** não constavam das hipóteses originais. Discografia tem base 🟢 e deve entrar no seed; o bloqueio neurolítico é 🟠 ("geralmente") — manter como `PER_PROCEDURE` até confirmação.

---

## 7. NEUROSURGERY (SBN) — regra geral

Não foi encontrado, no Manual SBN 2018, **nenhum modificador por-código** equivalente às listas da p.9 do Manual de Coluna. O SBN define pacotes de procedimento e `num_auxiliaries`; as regras financeiras remetem à CBHPM.

| Aspecto | Regra | Doc | Pág. |
|---|---|---|---|
| Billing Mode default | `PER_PROCEDURE` (×1) | — | — |
| Via | CBHPM 4.1 (50% mesma) / 4.2 (70% diferentes) | CBHPM | 23 |
| Lateralidade | CBHPM 4.3 (50% mesma incisão / 70% incisões diferentes) | CBHPM | 23 |
| Auxiliares | CBHPM 5.1 (60/40/30/30); nº = maior porte (5.2) | CBHPM | 23 |
| Modificadores por-código | **nenhum encontrado** | SBN | — |

> Implicação de modelagem: o sistema de modificadores deve ser **opt-in por código** (a ausência = `PER_PROCEDURE`). Nenhum código neuro precisa de linha de modificador — eles simplesmente não terão registro na tabela de modificadores, herdando o default.

---

## 8. Resumo quantitativo (base para o seed)

| Classe | Esp. | Nº códigos | Já no catálogo | A semear |
|---|---|---|---|---|
| PER_SEGMENT | SPINE | 10 (+1 discografia 🟢) | 1 (3.14.03.33-6) | 9–10 |
| PER_VERTEBRA | SPINE | 7 | 0 | 7 |
| PER_STRUCTURE | SPINE | 2 | 1 (rótulo errado: 4.08.13.36-3) | 1 (+1 reclassificar) |
| PER_STRUCTURE_DECREMENT | SPINE | 1 (costectomia) | 0 | 1 (depende de modo novo) |
| PER_PROCEDURE (1×, informativo) | SPINE | 3 | n/a (default) | flags informativas |
| Modificadores | NEUROSURGERY | 0 | 0 | 0 |

**Total de linhas normativas a semear (SPINE):** ~20 códigos com modo + ~3 flags informativas.
