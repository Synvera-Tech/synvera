# Auditoria Normativa — Matriz de Rastreabilidade de Regras Clínico-Faturáveis

**Data:** 2026-06-28
**Escopo:** Toda regra clínico-faturável proposta ou implementada no motor de cálculo do Synvera
(Cirurgia de Coluna + Neurocirurgia SBN + CBHPM).
**Natureza:** Auditoria normativa. **Nenhuma alteração no motor de cálculo foi feita.**

## Fontes normativas aceitas (e somente estas)

| Sigla | Documento | Arquivo |
|---|---|---|
| **COLUNA** | Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed. 2025 (SBC/SBOT & SBN) | `data/raw_pdfs/Manual_De_Diretrizes_De_Codificacao_Em_Cirurgia_De_Coluna_Vertebral-3ed-2025.pdf` (183 p.) |
| **CBHPM** | CBHPM 2022 — Instruções Gerais | `data/raw_pdfs/CBHPM-2022.pdf` (240 p.) |
| **SBN** | Manual de Diretrizes de Codificação dos Procedimentos em Neurocirurgia — 2018 | `data/raw_pdfs/Manual_De_Diretrizes_De_Codificacao_Dos_Procedimentos_Em_Neurocirurgia-2018.pdf` (165 p.) |

> **Premissa de hierarquia.** O Manual de Coluna (p.6) invoca o item **7.2 das Instruções Gerais da CBHPM**
> (delegação de interpretação às sociedades) e afirma, pelo princípio da Especialidade, que **as regras
> específicas do Manual de Coluna prevalecem sobre as regras gerais da CBHPM** para procedimentos de coluna.
> Logo: para `specialty='SPINE'`, COLUNA é a autoridade; para neurocirurgia, vale SBN+CBHPM.

> **Aviso sobre relatórios anteriores.** As "seções 5/6" do prompt original e qualquer saída de NotebookLM
> foram tratadas **apenas como hipóteses de modelagem**, não como fonte. Cada linha abaixo cita a página e o
> trecho do PDF que a fundamenta.

## Legenda de confiança

| Símbolo | Significado |
|---|---|
| 🟢 **Confirmada** | Texto explícito na norma. |
| 🟡 **Inferida (direta)** | Não há frase única, mas decorre inequivocamente de trechos explícitos. |
| 🟠 **Inferência fraca** | Apoio textual parcial / ambíguo. |
| 🔴 **Não encontrada** | Sem respaldo documental nas fontes aceitas. |

Coluna "Implementada?": ✅ implementada e coincide · ⚠️ implementada mas diverge · ❌ não implementada.

---

## 1. Matriz de rastreabilidade

| # | Regra | Status | Documento | Página | Trecho (verbatim) | Implementada? | Observações |
|---|---|---|---|---|---|---|---|
| R1 | Cirurgias multi-segmentares recebem remuneração adicional proporcional | 🟢 | COLUNA | 9 | "As cirurgias multi-segmentares da coluna vertebral … agregam maior complexidade, riscos e tempo cirúrgico … merecendo assim remuneração adicional proporcional." | ⚠️ | Engine multiplica por código (`PER_SEGMENT`), mas dados não classificam os códigos (ver §3). |
| R2 | Conceito de **segmento** (não nível) p/ evitar cobrança duplicada em vértebras adjacentes | 🟢 | COLUNA | 9 | "utiliza-se o conceito de segmento vertebral ao invés de nível, para evitar cobrança duplicada. Por exemplo, a artrodese entre L4-L5, embora envolva duas vértebras, é cobrada como um procedimento apenas." | ❌ | Não há modelagem de "segmento vs nível"; quantidade é numérica livre. |
| R3 | **Bilateralidade não duplica** quando a mesma patologia está no mesmo segmento/nível | 🟢 | COLUNA | 9 | "Os procedimentos da coluna vertebral não são remunerados duas vezes, quando a mesma patologia está presente bilateralmente, dentro de um mesmo segmento ou nível vertebral/discal. Exemplo: … estenose foraminal L4-L5 bilateral, não poderá ser realizada cobrança adicional, pelos dois lados." | ⚠️ | **Diverge.** `calculateLateralityMultiplier` aplica ×2 em BILATERAL quando `laterality_support=true` (spine.go:32-40). Para SPINE isso contraria a norma. |
| R4 | Cobrado **POR SEGMENTO** (×N): 3.07.15.01-6, .02-4, .11-3, .09-1, .36-9, .39-3, .18-0, .59-8, 3.14.03.33-6, 3.14.03.03-4 | 🟢 | COLUNA | 9 | Lista "PROCEDIMENTOS COBRADOS POR SEGMENTO:" (10 códigos) | ❌ | Engine suporta `PER_SEGMENT`; **catálogo não classifica** estes códigos (ver §2). |
| R4a | Detalhe ×N artrodese: "(x 3)" | 🟢 | COLUNA | 10 | "esse procedimento é multiplicado pelo número de segmentos artrodesados, por exemplo: … 3.07.15.01-6 (x 3)." | ❌ | — |
| R4b | Descompressão (.09-1) multiplica por nível operado | 🟢 | COLUNA | 10 | "O procedimento é multiplicado para cada nível operado…" | ❌ | — |
| R4c | Hérnia tóraco-lombar (.18-0) multiplica por disco | 🟢 | COLUNA | 10 | "O procedimento é multiplicado por cada disco operado…" | ❌ | — |
| R4d | Artroplastia discal (.59-8) multiplica por segmento | 🟢 | COLUNA | 13 | "Este procedimento é multiplicado pelo número de segmentos operados para fins de cobrança." | ❌ | — |
| R4e | Rizotomia (3.14.03.33-6) / Denervação (3.14.03.03-4) por segmento | 🟢 | COLUNA | 11, 157-160 | "Este código será multiplicado pelo número de segmentos vertebrais abordados/denervados" | ❌ | — |
| R5 | Cobrado **POR CADA VÉRTEBRA**: 3.07.15.03-2, .19-9, .22-9, .28-8, .38-5, .17-2, 4.08.14.09-2 | 🟢 | COLUNA | 9 | Lista "PROCEDIMENTOS COBRADOS POR CADA VÉRTEBRA OPERADA:" (7 códigos) | ❌ | Engine suporta `PER_VERTEBRA`; **0 códigos classificados** no catálogo. |
| R5a | Exemplo: substituição corpo L2 + L3 = dois níveis | 🟢 | COLUNA | 9 | "quando realizamos a substituição do corpo de L2, bem como … L3, no mesmo ato cirúrgico, a cirurgia deverá ser remunerada pelos dois níveis vertebrais." | ❌ | — |
| R6 | Cobrado **POR ESTRUTURA** (faceta/neuroforame/músculo): 4.08.13.36-3, 2.01.03.30-1 | 🟢 | COLUNA | 9, 11, 157 | "PROCEDIMENTOS COBRADOS POR CADA ESTRUTURA ABORDADA (FORAME, FACETA, COSTELA)"; "multiplicado pelo número de segmentos facetários e neuroforames infiltrados (existem facetas e neuroforames à direita e à esquerda)"; "(Duas articulações facetárias e dois forames por nível)" | ❌ | Engine suporta `PER_STRUCTURE`; **0 códigos classificados**. |
| R6a | Ponto-gatilho (2.01.03.30-1) cobrado por músculo | 🟢 | COLUNA | 11 | "sendo cobrado por músculo tratado…" | ❌ | — |
| R7 | **Costectomia (3.06.01.02-9): 100% + 30% por arco adicional** — NÃO é ×N | 🟢 | COLUNA | 13 | "Costectomia – 3.06.01.02-9: … com porte para 1 arco costal e 30% deste porte para cada arco adicional…" | ❌ | **Regra própria.** A hipótese inicial (estrutura ×N) está **errada**. Exige novo modo de cálculo (decremento percentual). |
| R8 | Cobrado **APENAS UMA VEZ por cirurgia** (não multiplica): 3.07.15.05-9 (endoscópica), 3.07.32.02-6 (enxerto), entre outros | 🟢 | COLUNA | 9 | Lista "PROCEDIMENTOS COBRADOS APENAS UMA VEZ CADA CIRURGIA:" | 🟡✅ | Equivale a `PER_PROCEDURE` (×1, default). Correto por omissão, mas não há *guarda explícita* impedindo multiplicação. |
| R8a | Endoscópica (3.07.15.05-9) independe do nº de portais | 🟢 | COLUNA | 10 | "…independentemente do número de portais realizados." | 🟡✅ | É via de acesso; cobrada uma vez. |
| R9 | Enxerto ósseo (3.07.32.02-6) e fístula liquórica (3.14.01.26-0) como **etapas complementares** | 🟠 | COLUNA | 9, 13, 40/42/62 | "OBS: O acréscimo das demais etapas cirúrgicas complementares deverão estar devidamente [justificadas]"; enxerto listado em "uma vez por cirurgia" (p.9) | ❌ | Conceito de "etapa complementar" existe, mas são códigos comuns cobrados 1×. Não há modelagem específica de "etapa". |
| R10 | **Via mesma**: maior porte + **50%** dos demais | 🟢 | CBHPM | 23 | "4.1. … a quantificação do porte … ao procedimento de maior porte, acrescido de 50% do previsto para cada um dos demais atos médicos…" | ✅ | `discountRateFor` → 0.50 (access_routes.go:16-17). |
| R11 | **Vias diferentes (geral CBHPM)**: principal + **70%** dos demais | 🟢 | CBHPM | 23 | "4.2. Quando ocorrer mais de uma intervenção por diferentes vias de acesso … o equivalente a 70% do porte de cada um dos demais atos praticados." | ✅ | `discountRateFor` → 0.70. **Válido para SBN/neuro.** |
| R12 | **Coluna 360° (vias combinadas ant/post)**: 100% principal + **50%** dos demais | 🟢 | COLUNA | 42, 62 | "Em caso de uma cirurgia com vias de acesso combinadas anterior/posterior (360°), a codificação do primeiro tempo cirúrgico remunera 100% código principal e 50% dos demais códigos (Diretrizes CBHPM)." | ⚠️ | **Diverge p/ SPINE.** Engine aplica 70% em `different`; COLUNA manda **50%** mesmo em 360°. |
| R13 | Cirurgias bilaterais (CBHPM geral): incisões diferentes 70%, mesma incisão 50% | 🟢 | CBHPM | 23 | "4.3. Obedecem às normas acima as cirurgias bilaterais, realizadas por diferentes incisões (70%), ou pela mesma incisão (50%)." | ⚠️ | Engine modela bilateral como ×2 (não 50/70%). Relevante p/ neuro; p/ coluna vale R3. |
| R14 | Principal = **procedimento de maior porte** | 🟢 | CBHPM | 23 | "4.1. … ao procedimento de maior porte, acrescido de 50%…" | ✅ | **Decidido e implementado** (2026-06-28): `service.porteRank` seleciona o principal pelo maior porte (não pelo valor ajustado); desempate estável (1ª ocorrência no payload). |
| R15 | **Urgência/emergência: +30%** sobre os portes | 🟢 | CBHPM | 22 | "2.1. Os atos médicos praticados em caráter de urgência ou emergência terão um acréscimo de trinta por cento (30%) em seus portes…" | ✅ | `AdjustmentCatalog["emergency_special_hours"]` = 30% (adjustments.go:22-26). |
| R15a | **Horário especial** é o *gatilho* da urgência (19h–7h; sáb/dom/feriado), não um acréscimo separado | 🟢 | CBHPM | 22 | "2.1.1. No período compreendido entre 19h e 7h…; 2.1.2. … sábados, domingos e feriados; 2.1.3. … mais da metade do procedimento … no horário de urgência/emergência." | 🟡✅ | Implementação une "urgência+horário especial" em um único +30%. Coerente com a norma. **Não existe** surcharge de horário sem urgência. |
| R15b | COLUNA confirma +30% urgência/emergência | 🟢 | COLUNA | 182 | "…praticados em caráter de urgência ou emergência terão acréscimo de 30% no valor final (Item 2…)." | ✅ | — |
| R16 | **Pediatria <2.500g ou <37 sem: +100%** | 🟢 | CBHPM | 23 | "4.6. Nas cirurgias em crianças com peso inferior a 2.500 g ou nascidos anteriormente a 37 semanas … acréscimo de 100% sobre o porte…" | ⚠️ | Valor ✅; **citação errada** no código: adjustments.go diz "item 3" — é **item 4.6**. |
| R17 | **Neonatos (0–28d) e lactentes (29d–24m): +50%** | 🟢 | CBHPM | 23 | "4.7. Nas cirurgias em neonatos … (0 a 28 dias) e lactentes … (29 dias … a 24 meses) … acréscimo de 50%…" | ⚠️ | Valor ✅; citação "item 3" → correto é **item 4.7**. |
| R18 | **Pré-escolar/pediátrico (24m–<12a): +30%** | 🟢 | CBHPM | 23 | "4.8. Nas cirurgias em pré-escolares … (dos 24 meses completos até doze anos … incompletos) … acréscimo de 30%…" | ⚠️ | Valor ✅; citação "item 3" → correto é **item 4.8**. |
| R19 | **Auxiliares: 60% / 40% / 30% / 30%** | 🟢 | CBHPM | 23 | "5.1. … 60% … para o primeiro auxiliar, 40% para o segundo … 30% para o terceiro e … também para o quarto…" | ✅ | `auxPercentages = {0,.60,.40,.30,.30}` (auxiliaries.go:10). |
| R20 | Nº de auxiliares = o do **procedimento de maior porte**; valoração sobre a **totalidade** dos serviços do cirurgião | 🟢 | CBHPM | 23 | "5.2. … o número de auxiliares será igual ao previsto para o procedimento de maior porte, e a valoração … será calculada sobre a totalidade dos serviços realizados pelo cirurgião." | 🟡✅ | Aux aplicado sobre `surgeonTotal` (engine.go:154-162) ✅. Nº mandado = `max(num_auxiliaries)` entre códigos marcados (useProcedureSelection.ts:138-142) — usa o **máximo**, não estritamente o do maior porte (nuance). |
| R21 | Honorário de **anestesia = R$ 1.200 fixo** | 🔴 | — | — | Sem respaldo. CBHPM usa **porte anestésico (AN1–AN8)** vinculado ao procedimento (CBHPM p.22, item 1.3), não valor fixo. | ⚠️ | `anesthesiaFee = 1200.00` (portes.go:4) é simplificação **sem base normativa**. |
| R22 | Adjustments **aditivos** (urg 30% + ped 30% = ×1,60, não ×1,69) | 🟠 | CBHPM | 22-23 | Norma define cada acréscimo "sobre o porte"; **não especifica composição entre acréscimos**. | ✅ | Modelo aditivo (engine.go:176-192) é decisão de negócio plausível; norma é silente. |

---

## 2. Auditoria de dados (data-model-audit)

**Regra de negócio:** cada código CBHPM possui um *modo de cobrança* (por segmento / vértebra / estrutura /
uma vez) e regras de lateralidade — definidos pelas listas da **p.9 do Manual de Coluna**.

**Modelo atual (provado):**
- `cbhpm_codes` (schema.sql:78-89) **já possui** `billing_mode CHECK IN (PER_PROCEDURE, PER_SEGMENT, PER_VERTEBRA, PER_STRUCTURE)`, `specialty CHECK IN (NEUROSURGERY, SPINE)`, `laterality_support BOOLEAN`. **O schema suporta a regra.**
- O motor (`engine.go:84-104`, `spine.go`) **já multiplica por código** (`PER_SEGMENT/VERTEBRA/STRUCTURE` → ×qtd).
- **Lacuna de dados (provada):** no catálogo `backend/internal/repository/procedures.json` há **1413 `PER_PROCEDURE` e apenas 4 `PER_SEGMENT`; 0 `PER_VERTEBRA`; 0 `PER_STRUCTURE`; 4 `laterality_support=true`**. As fiches `data/spine_procedures.json` têm `extrafields={}` — **nenhum** modificador.
- **Discriminador de domínio inconsistente (provado):** `procedures.json` grava `specialty="Neurocirurgia, Coluna Vertebral"` (184) e `"SPINE"` (652), mas o enum Go é `NEUROSURGERY`/`SPINE`. **Nenhum código neuro casa com o enum.** O pipeline `merge_spine_into_catalog.py:72-74` faz hardcode `billing_mode=PER_PROCEDURE`, `laterality_support=False`.

**Cardinalidade:** procedimento → CBHPM é **1:N** (provado: `sbn_cbhpm_mappings` UNIQUE(sbn_procedure_id, cbhpm_code_id), schema.sql:111). Um mesmo código aparece em vários procedimentos com portes possivelmente distintos (porte por mapping) → o modo de cobrança deve ser **por código**, não por procedimento.

**Conclusão de dados:** a norma R4–R8 existe, o schema suporta, **mas os dados nunca foram classificados**. Não há schema novo necessário para R4/R5/R6/R8 (o `billing_mode` basta); R3/R7/R12 exigem regras de motor novas.

---

## 3. Comparação implementação × norma

### ✅ Confirmadas (implementação coincide com a norma)
- **R10** via mesma 50% (CBHPM 4.1).
- **R11** vias diferentes 70% — **somente para neuro/SBN**.
- **R15 / R15b** urgência/emergência +30% (CBHPM 2.1; COLUNA p.182).
- **R19** auxiliares 60/40/30/30 (CBHPM 5.1).
- **R20** aux sobre total do cirurgião (CBHPM 5.2) — com nuance no "nº = maior porte".
- **R16/R17/R18** percentuais pediátricos (valores corretos; **citação de item incorreta** no código).
- **R8/R8a** "uma vez por cirurgia" ≡ `PER_PROCEDURE` (correto por default).

### ⚠️ Divergentes (implementação difere da norma)
1. **R12 — Coluna 360°/vias diferentes.** Engine usa **70%**; COLUNA (pp.42,62) manda **50%** para coluna. **Decisão registrada: seguir o Manual (50% p/ SPINE).**
2. **R3 / R13 — Lateralidade.** Engine faz BILATERAL = **×2**. COLUNA (p.9) diz **não duplica** no mesmo segmento; CBHPM (4.3) diz **50%/70%**, nunca ×2.
3. **R14 — Principal.** ✅ Resolvido: principal = maior **porte** (CBHPM 4.1), via `service.porteRank`; desempate estável.
4. **R7 — Costectomia.** Hipótese ×N é errada; norma = **100% + 30%/arco adicional** (não há modo p/ isso).
5. **R16/17/18 — Citação.** `source` diz "item 3"; correto é **item 4.6/4.7/4.8**.
6. **R21 — Anestesia.** Valor fixo R$1.200 **sem base normativa**.

### ❌ Pendentes (norma existe, não implementada)
- **R4 (POR SEGMENTO):** 10 códigos a classificar; só 4 marcados.
- **R5 (POR VÉRTEBRA):** 7 códigos — 0 classificados.
- **R6 (POR ESTRUTURA):** 2 códigos (faceta/forame/músculo) — 0 classificados.
- **R7 (Costectomia 100%+30%):** modo de cálculo inexistente.
- **R2 (segmento vs nível):** sem modelagem.
- **R12 (override 50% coluna):** sem gate de domínio no engine.
- **R3 (no-dup bilateral coluna):** sem gate de domínio.
- **R9 (etapas complementares):** sem modelagem específica.
- **Identificação de domínio** consistente (`NEUROSURGERY`/`SPINE`) no catálogo/seed.

---

## 4. Proposta de ordem de implementação (safe-refactoring)

Somente regras **🟢 Confirmadas**. Cada estágio é behavior-preserving e termina com `go test ./...` + `npm run build` verdes. **Risco financeiro/clínico tem precedência.**

| Estágio | Conteúdo | Risco | Pré-condição |
|---|---|---|---|
| **E0 — Correções de citação (zero comportamento)** | Corrigir `source` de R16/17/18 para "item 4.6–4.8" em `adjustments.go`; documentar R21 (anestesia) como simplificação. | Baixo | — |
| **E1 — Classificação de dados (sem tocar engine)** | Semear `billing_mode`/`laterality_support` por código a partir das listas p.9 (R4/R5/R6); normalizar `specialty` para `NEUROSURGERY`/`SPINE`. ADR-005 + tabela `cbhpm_code_modifiers` + migração. | Médio (dados) | E0 |
| **E2 — Plumbing de modificadores por código (frontend)** | Substituir `spineModifiers` global por estado por código; UI contextual por domínio. Engine já suporta ×N. | Médio | E1 |
| **E3 — Gates de domínio no engine (SPINE)** | R3 (no-dup bilateral coluna) + R12 (50% em 360°/vias coluna). Neuro mantém CBHPM 4.x. | **Financeiro** | E1, testes R3/R12 |
| **E4 — Costectomia (R7)** | Novo modo "porte com decremento" (100%+30%/adicional). | **Financeiro** | E1 |
| **E5 — Revisão de R14 (principal = maior porte)** | Decidir se principal segue porte ou valor ajustado; afeta multi-código com ×N. | **Financeiro** | testes |

> **R14 decidido (2026-06-28):** principal = maior porte (não maior valor ajustado). R21 e o modelo
> aditivo (R22) permanecem congelados — a norma é silente (R22) ou aguarda decisão (R21).

---

## 5. Apêndice — convenção de proveniência para o seed

Ao implementar E1, cada linha de `cbhpm_code_modifiers` deve registrar proveniência **real**:
`source_document = "Manual de Coluna 3ª ed. 2025"`, `source_page = 9` (ou a página de detalhe), e o trecho.
Regras sem base (R21) **não** devem ser semeadas como norma.
