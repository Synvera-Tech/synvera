# Auditoria de Cobertura SBN → CBHPM

**Data:** 2026-06-26
**Motivação:** Bug relatado — nem todos os códigos CBHPM de um procedimento SBN apareciam na aplicação (caso observado: *Infiltração de Coluna*).
**Escopo:** Auditoria completa SBN → CBHPM (fonte → parser → JSON → seed → banco → API → frontend), não apenas o procedimento isolado.

---

## 1. Causa raiz (provada)

Três códigos CBHPM são renderizados com **pontuação malformada** nas tabelas estruturadas ("Códigos CBHPM") do *Manual de Diretrizes de Codificação dos Procedimentos em Neurocirurgia — 2018*:

| Página | Procedimento | Token no PDF | Código canônico | Porte | Descrição |
|---|---|---|---|---|---|
| 87 | 6.7 — Cirurgia Transesfenoidal Tradicional (Acesso Sublabial) | `3.14.011.5-5` | `3.14.01.15-5` | 14A | Microcirurgia para tumores intracranianos |
| 89 | 6.9 — Cirurgia Transesfenoidal Endoscópica I | `3.1.40.116-3` | `3.14.01.16-3` | 11A | Microcirurgia por via Transesfenoidal |
| 139 | 9.27 — Infiltração de Coluna (Dor Axial e/ou Radicular) | `3.16.0216-9` | `3.16.02.16-9` | 3C | Bloqueio peridural ou subaracnóideo com corticóide |

O parser `data/generate_catalog.py` (`split_code_line`) exigia o formato **estrito** `\d\.\d{2}\.\d{2}\.\d{2}-\d`. Tokens com um ponto faltando/deslocado **não casavam** com a regex e eram **descartados silenciosamente** — nunca chegando a `procedures.json`, ao seed, ao banco, à API ou à UI. Não havia etapa de reconciliação ou alerta.

**Evidência:**

- `procedures.json` continha apenas 2 dos 3 códigos de *Infiltração de Coluna* (faltava `3.16.02.16-9`) — confirma que a perda é anterior ao banco.
- O glossário do mesmo manual (pp. 12, 18) e a tabela oficial **CBHPM 2022** (pp. 134, 139) listam os três códigos na forma canônica — confirmando que os tokens malformados são erros de impressão da tabela-fonte, e os códigos corretos são inequívocos.
- `generate_seed.py` apenas copia o JSON fielmente (dedup, sem descarte); o capítulo `3.16` possui 23 códigos no catálogo, descartando qualquer hipótese de filtro de capítulo.

**Classificação:** bug **sistêmico por natureza** (qualquer código malformado na fonte é descartado sem aviso), mas com **escopo concreto pequeno** — exatamente **3 ocorrências** em todo o manual.

---

## 2. O fluxo é fiel abaixo do parser

Mapeamento completo verificado; nenhuma perda adicional encontrada:

| Etapa | Verificação | Resultado |
|---|---|---|
| `query.sql :: GetProcedureCodes` | sem `LIMIT`, `DISTINCT` ou filtro; `ORDER BY sort_order, code` | retorna **todos** os mappings ✔ |
| `handlers/procedure.go` | `for _, c := range p.Codes` | sem truncamento ✔ |
| `useProcedureSelection.ts` | `allCbhpmCodes` mapeia todos os códigos do detalhe | sem `[0]`/slice/limit ✔ |
| `SelectedCodesPanel.tsx` | `allCbhpmCodes.map(...)` | renderiza todos os cards ✔ |

A UI exibia fielmente o que existia: o dado nunca existiu.

---

## 3. Procedimentos de Coluna verificados (Spine / Coluna coverage)

Auditados explicitamente os procedimentos com termos *coluna, infiltração, artrodese, descompressão, laminectomia, discectomia, rizotomia, segmento*. Único caso com perda na seção de coluna:

- **9.27 — Infiltração de Coluna (Dor Axial e/ou Radicular)** — corrigido (3/3 códigos).

Demais procedimentos de coluna não apresentaram divergência entre tabela-fonte e catálogo.

---

## 4. Resultado da auditoria — antes / depois

| Métrica | Antes | Depois |
|---|---|---|
| Linhas em `procedures.json` | 806 | 809 |
| Rows código-malformado na fonte (tabelas SBN) | 3 | 3 |
| → presentes no catálogo após canonicalização | **0** | **3** |
| Infiltração de Coluna — códigos | 2 | 3 |
| Transesfenoidal Sublabial — códigos | 5 | 6 |
| Transesfenoidal Endoscópica I — códigos | 4 | 5 |
| Procedimentos com 0 códigos | 0 | 0 |

A varredura completa do manual confirma que **não há perda sistêmica residual**: as 3 ocorrências malformadas são exatamente as três corrigidas.

---

## 5. Correções aplicadas

1. **Fonte de verdade** — `backend/internal/repository/procedures.json`: inseridas as 3 linhas faltantes na ordem documentada do manual e com porte verificado. Corrige `FileRepository` (dev/testes) imediatamente.
2. **Banco (produção)** — `backend/db/migrations/025_fix_dropped_cbhpm_mappings.sql`: upsert idempotente do conjunto completo de mappings dos 3 procedimentos (insere o código faltante e normaliza `sort_order`). Os 3 códigos CBHPM e os portes (14A/11A/3C) já existiam; apenas os mappings estavam ausentes.
3. **Causa raiz (parser)** — `data/generate_catalog.py`: `split_code_line` agora casa o token de código de forma frouxa e **canonicaliza** via normalização de dígitos (`canonicalize_code`); códigos recuperados são **registrados em voz alta** (`RECOVERED_CODES`) em `main()`, de modo que um descarte silencioso nunca mais possa ocorrer despercebido.
4. **Regressão** — `backend/internal/repository/coverage_test.go`: testes que afirmam a cobertura completa dos 3 procedimentos e o invariante "nenhum procedimento com 0 códigos".

---

## 6. Saneamento da Fase 3 (parser de coluna) — executado

A investigação revelou um **segundo parser quebrado**, independente da causa raiz: a Fase 3 (`parse_spine_procedures`) gerava 44 linhas *spine-only* com **três defeitos simultâneos**:

1. `procedure_name` = `"Trata"` nas 44 linhas (a regex de nome capturava só a 1ª palavra de "Trata-se da…") → no `FileRepository` elas **colapsavam em um único procedimento "Trata" com 44 códigos**.
2. `porte` ausente → `generate_seed.py` lançava `KeyError: 'porte'`, mantendo `003` desatualizado.
3. descrições truncadas (fragmentos como *"Trata-se da fusão de um segmento"*).

**Fase 1 (quarentena) — aplicada:** as 44 linhas foram removidas de `procedures.json` (estavam contíguas no fim, todas com nome "Trata", nenhuma referenciada em produção — `003` predatava a Fase 3). O catálogo passou a **765 linhas / 139 procedimentos**, todas validadas (com nome e porte corretos). `generate_seed.py` voltou a rodar e `003_seed_procedures.sql` foi **regenerado limpo** (139 procedimentos · 184 códigos · 765 mappings — já inclui os 3 códigos restaurados). Adicionado `TestNoDegenerateProcedureName` (piso de 6 caracteres; menor nome legítimo = "DREZOTOMIA", 10 chars) para impedir recorrência do colapso "Trata".

**Fase 2 (reingestão de coluna) — pendente, tarefa própria:** reescrever `parse_spine_procedures` para extrair nome real do procedimento, anexar porte da tabela autoritativa CBHPM (join por código — disponível para todos exceto `4.08.14.09-2`, cap. 4) e preservar a descrição completa; então reintroduzir os códigos de coluna validados.

> Nota: a migração **025** permanece necessária para bancos **já existentes** (o `003` regenerado só afeta instalações novas; `025` é idempotente e corrige produção).

---

## 7. Validação executada

- `go test ./...` → **verde** (inclui novos testes de cobertura).
- `npm run build` (frontend) → **sucesso** (nenhuma alteração de UI; build de sanidade).
- Re-execução da auditoria de cobertura → **0 lacunas residuais**.
