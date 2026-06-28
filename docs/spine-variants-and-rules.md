# Variantes e Regras de Cirurgia de Coluna

Regras clínico-faturáveis de coluna implementadas no motor, com a classificação por código e a
fonte normativa. **Fonte única:** Manual de Diretrizes de Codificação em Cirurgia de Coluna
Vertebral — 3ª ed. 2025 (doravante "Manual de Coluna"). Toda regra abaixo é **CONFIRMED** na
auditoria; ver [audits/spine-rules-traceability.md](audits/spine-rules-traceability.md) (R#) e
[audits/cbhpm-code-modifiers-matrix.md](audits/cbhpm-code-modifiers-matrix.md).

Os dados vivem em `cbhpm_code_modifiers` (semeada de
`backend/internal/repository/code_modifiers.json`, [ADR-005](architecture/ADR-005-normative-modifier-table.md)).

## Modelo de regra por código

Cada código de coluna pode declarar:

| Campo | Valores | Efeito no motor |
|---|---|---|
| `billing_mode` | `PER_SEGMENT` · `PER_VERTEBRA` · `PER_STRUCTURE` · `PER_STRUCTURE_DECREMENT` · `PER_PROCEDURE` | multiplicador de quantidade |
| `via_rule` | `SPINE_50` · `CBHPM_DEFAULT` | desconto do código adicional |
| `laterality_rule` | `NO_DUPLICATE` · `NONE` | multiplicador de lateralidade |
| `decrement_pct` | ex.: `30.0` | só para `PER_STRUCTURE_DECREMENT` |

## Multiplicadores de quantidade

- **PER_SEGMENT / PER_VERTEBRA / PER_STRUCTURE** → valor × quantidade (×N).
- **PER_STRUCTURE_DECREMENT** → 1ª estrutura a 100% + `decrement_pct`% por estrutura adicional
  (multiplicador = `1 + (qtd − 1) × decrement_pct/100`).
- **PER_PROCEDURE** → ×1 (não multiplica), mesmo que uma quantidade seja enviada.

### Cobrados POR SEGMENTO (R4 — Manual p.9)
`3.07.15.01-6`, `3.07.15.02-4`, `3.07.15.11-3`, `3.07.15.09-1`, `3.07.15.36-9`, `3.07.15.39-3`,
`3.07.15.18-0`, `3.07.15.59-8`, `3.14.03.33-6`, `3.14.03.03-4` (+ `4.08.14.10-6` discografia, p.11).

### Cobrados POR VÉRTEBRA (R5 — Manual p.9)
`3.07.15.03-2`, `3.07.15.19-9`, `3.07.15.22-9`, `3.07.15.28-8`, `3.07.15.38-5`, `3.07.15.17-2`,
`4.08.14.09-2`.

### Cobrados POR ESTRUTURA (R6 — Manual p.9/11)
`4.08.13.36-3` (facetas/neuroforames — conta os lados como estruturas), `2.01.03.30-1` (por músculo).

### Decremento — costectomia (R7 — Manual p.13)
`3.06.01.02-9` — 100% + **30%** por arco costal adicional (`PER_STRUCTURE_DECREMENT`,
`decrement_pct = 30`).

### Uma vez por cirurgia (R8/R9 — Manual p.9/10/13)
`3.07.15.05-9` (acesso endoscópico, independe do nº de portais), `3.07.32.02-6` (enxerto ósseo),
`3.14.01.26-0` (fístula liquórica). `PER_PROCEDURE`.

## Regras fixas de coluna

- **R3 — Bilateralidade não duplica (`NO_DUPLICATE`).** Manual p.9: procedimentos de coluna não são
  remunerados duas vezes para a mesma patologia bilateral no mesmo segmento/nível. Para códigos
  SPINE, BILATERAL → ×1 (não dobra).
- **R12 — Via de coluna 50% (`SPINE_50`).** Manual pp.42/62: em cirurgia com vias combinadas
  anterior/posterior (360°), o código principal a 100% e os demais a **50%** — sobrepõe a regra
  geral CBHPM 4.2 (70%). Para SPINE, códigos adicionais sempre a 50%, inclusive 360°.
- **Auxiliares e principal.** Auxiliares pelo código de maior porte (CBHPM 5.2). O código principal
  é o de **maior porte** (CBHPM 4.1), selecionado por `service.porteRank` — **não** pelo maior valor
  ajustado após ×N (R14, decidido em 2026-06-28; desempate estável pela 1ª ocorrência no payload).

## Aplicação no motor

`POST /api/calculate` enriquece cada código com a regra de `cbhpm_code_modifiers`
(`service.CalculateWithPortesAndModifiers`); o frontend envia apenas `quantity_selected` por código.
Ordem por código: `base → quantidade → lateralidade → desconto de via`. Domínios NEUROSURGERY não
são enriquecidos (resultado idêntico ao CBHPM 4.x).

## Pendências (não implementadas)

- ~~**R14** — principal = maior porte vs maior valor ajustado~~ → **decidido**: maior porte (implementado).
- **R21** — modelo de anestesia (valor fixo sem base normativa).
- **R22** — composição de múltiplos ajustes (aditivo vs multiplicativo).

Ver [normative-engine-roadmap.md](architecture/normative-engine-roadmap.md) §6.
