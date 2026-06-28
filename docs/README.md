# Documentação do Synvera

Índice da documentação técnica do Synvera — calculadora de honorários médicos para
neurocirurgia e cirurgia de coluna. Convenção: código/infra em inglês, domínio/UI em PT-BR.

## Arquitetura

- [architecture.md](architecture.md) — visão geral do monorepo (backend Go · frontend Next.js · data/ETL).
- [domain-model.md](domain-model.md) — modelo de domínio, IDs públicos vs internos, cardinalidades.
- [architecture/normative-engine-roadmap.md](architecture/normative-engine-roadmap.md) — roadmap do motor dirigido por dados normativos (estágios N0–N6).

### Architecture Decision Records (ADR)

- [ADR-001 — Persist Calculation Inputs](architecture/ADR-001-persist-calculation-inputs.md)
- [ADR-002 — JSONB Composition Model](architecture/ADR-002-jsonb-composition-model.md)
- [ADR-003 — Remove Dead Modifier Tables](architecture/ADR-003-remove-dead-modifier-tables.md)
- [ADR-004 — CBHPM Versioning](architecture/ADR-004-cbhpm-versioning.md)
- [ADR-005 — Normative Modifier Table (Data-Driven Billing Rules)](architecture/ADR-005-normative-modifier-table.md)

## Cálculo e Domínio

- [calculation-flow.md](calculation-flow.md) — fluxo de valoração.
- [valuation-validation.md](valuation-validation.md) — validação dos valores.
- [billing-and-plans.md](billing-and-plans.md) — planos e regras de cobrança.
- [search-flow.md](search-flow.md) — fluxo de busca de procedimentos.

## Cirurgia de Coluna (Spine)

- [spine-manual-import.md](spine-manual-import.md) — pipeline de import do Manual de Coluna.
- [spine-import-final-report.md](spine-import-final-report.md) — relatório final do import.
- [spine-billing-variables.md](spine-billing-variables.md) · [spine-billing-implementation.md](spine-billing-implementation.md) — variáveis/implementação de cobrança.
- [procedure-domain-modifiers.md](procedure-domain-modifiers.md) — seletores por domínio (universal/SBN/coluna) e renderização contextual.
- [spine-variants-and-rules.md](spine-variants-and-rules.md) — regras clínico-faturáveis de coluna por código (×N, costectomia, R3/R12).
- [procedure-page-modifiers.md](procedure-page-modifiers.md) — modificadores na Procedure Page.

## Auditorias

- [audits/spine-rules-traceability.md](audits/spine-rules-traceability.md) — matriz normativa de regras (R1–R22).
- [audits/cbhpm-code-modifiers-matrix.md](audits/cbhpm-code-modifiers-matrix.md) — modificadores por código CBHPM.
- [audits/anesthesiology-rules-traceability.md](audits/anesthesiology-rules-traceability.md) — matriz normativa da Anestesiologia (A1–A20).
- [audits/anesthesiology-modifiers-matrix.md](audits/anesthesiology-modifiers-matrix.md) — modificadores de anestesia (USER_SELECTABLE/DERIVED/ENGINE_ONLY).
- [audits/spine-manual-coverage.md](audits/spine-manual-coverage.md) · [audits/sbn-cbhpm-coverage.md](audits/sbn-cbhpm-coverage.md) — cobertura de import.

## Busca Documental (RAG v0)

- [document-search-v0.md](document-search-v0.md) — camada de referência por Full Text Search.

## Operações

- [deployment.md](deployment.md) — deploy (Render · Vercel · Neon).
- [roadmap.md](roadmap.md) · [technical-roadmap.md](technical-roadmap.md) — roadmaps de produto e técnico.

## Reference

- [reference/claude-code-engineering-glossary.md](reference/claude-code-engineering-glossary.md) — **glossário vivo** do vocabulário de engenharia usado pelo Claude Code durante o desenvolvimento do Synvera (documento de estudo, cresce continuamente).
