# Relatório de Pendências — Motor de Cálculo Synvera

**Data:** 2026-06-29
**Branch:** `feature/no-plans` (origin + upstream sincronizados, HEAD `e0f2d0f`)
**Escopo:** regras clínico-faturáveis **documentadas na norma** mas **ainda não implementadas**
(ou implementadas parcialmente) no motor de cálculo, mais a decisão de negócio que a norma não cobre.
**Fonte normativa:** CBHPM 2022 (`data/raw_pdfs/CBHPM-2022.pdf`) e Manual de Coluna 3ª ed. 2025.
Cada item cita documento, página e trecho. Referências: [anesthesiology-rules-traceability.md](anesthesiology-rules-traceability.md),
[spine-rules-traceability.md](spine-rules-traceability.md), [normative-engine-roadmap.md](../architecture/normative-engine-roadmap.md).

> **Princípio mantido:** nenhuma regra entra no motor sem evidência documental explícita. As pendências
> abaixo não estão "esquecidas" — cada uma depende de **um dado que o catálogo não tem**, de **um input
> clínico do usuário**, ou de **uma decisão** (quando a norma é silente). Este relatório dá o material
> para essas decisões.

---

## 1. Resumo executivo

| # | Pendência | Tipo de bloqueio | Muda valor? | Esforço | Decisão sua? |
|---|---|---|---|---|---|
| P1 | A9 — auxiliar de anestesia nos gatilhos além de AN7/AN8 (CEC, >6h, neonato, gastroplastia) | Input clínico inexistente | Sim (quando aplicável) | Médio | Sim (como capturar) |
| P2 | A8 — bilateralidade anestésica +70% (sem código específico) | Sinal + detecção de "código específico" | Sim (bilaterais) | Médio | Sim (modelagem) |
| P3 | A14/A20 — acréscimo pediátrico/idoso sobre a **anestesia** | Decisão (norma silente no elo geral→anestesia) | Sim (pediatria) | Baixo–Médio | **Sim (crítica)** |
| P4 | R22 — composição de múltiplos acréscimos (aditivo × multiplicativo) | Norma silente | Sim (casos com 2+ ajustes) | Baixo | **Sim (negócio)** |
| — | A12 / A18 — consulta pré-anestésica e SRPA | Fora do escopo do cálculo da cirurgia | Não | — | Opcional |

**Já resolvidas nesta trilha** (contexto): R3 (bilateral coluna não duplica), R7 (costectomia 100%+30%),
R12 (via coluna 50% incl. 360°), R14 (principal = maior porte), R21 (anestesia derivada do porte),
A9 para **AN7/AN8** (auxiliar 60% auto-detectável).

---

## P1 — A9: auxiliar de anestesia nos demais gatilhos (CEC, >6h, neonato, gastroplastia)

### Norma
**CBHPM 2022, p.140, item 8** (verbatim):
> "Para os atos **AN7 e AN8** ou naqueles nos quais seja utilizada **Circulação Extracorpórea (CEC)**, ou
> procedimentos de **neonatologia cirúrgica**, **gastroplastia para obesidade mórbida** e **cirurgias com
> duração acima de 6 horas**, o anestesiologista responsável poderá, quando necessário, solicitar o
> concurso de um auxiliar (também anestesiologista), sendo atribuído a essa intervenção um porte
> correspondente a **60%** dos portes previstos para o(s) ato(s) realizados pelo anestesiologista principal."

### Estado atual
Implementado **somente** para **AN7/AN8** (auto-detectáveis a partir do porte anestésico) — toggle
"Auxiliar de anestesia (60%)" que só aparece nesses casos. `service/anesthesia.go` aplica 60%.

### O que falta
Os demais gatilhos (CEC, >6h, neonatologia, gastroplastia) **não são deriváveis do catálogo** — são
**fatos do ato cirúrgico** que só o cirurgião conhece. Para habilitá-los seria preciso um **input do
usuário** (ex.: checkbox "Cirurgia com CEC / >6h / neonato / gastroplastia → permite auxiliar de anestesia").

### Impacto
- **Quando aplicável:** adiciona 60% do honorário de anestesia. Hoje, um caso AN6 (porte 9B) com CEC
  **não** recebe o auxiliar (o toggle não aparece) → subfaturamento nesses casos específicos.
- **Frequência:** baixa (CEC e gastroplastia são nichos; >6h é menos raro).

### Decisão necessária
Como capturar os gatilhos não-porte: (a) um único override "auxiliar de anestesia justificado" liberado
manualmente; (b) checkboxes por gatilho; (c) manter só AN7/AN8 e tratar o resto fora do app.

### Esforço / risco
Médio (frontend: input + persistência; backend: relaxar o gate de AN7/AN8 quando o override estiver
ligado). Risco financeiro baixo (opt-in explícito).

---

## P2 — A8: bilateralidade anestésica +70% (sem código específico)

### Norma
**CBHPM 2022, p.140, item 7** (verbatim):
> "Em caso de **cirurgia bilateral no mesmo ato anestésico**, **INEXISTINDO código específico** na presente
> Classificação, os atos praticados pelo anestesiologista serão acrescidos de **70%** do porte atribuído ao
> **primeiro ato cirúrgico**."

### Estado atual
Não há tratamento específico. A degressividade de múltiplos atos anestésicos (itens 5/6, **50%/70%** por
via) já existe e cobre **aproximadamente** alguns cenários bilaterais, mas **não é a regra do item 7**.

### O que falta
1. Um **sinal de "ato anestésico bilateral"** — temos lateralidade por código no lado cirúrgico, mas não um
   marcador de bilateralidade voltado à anestesia.
2. A condição **"inexistindo código específico"** — exige saber quais códigos já possuem variante bilateral
   própria (para não aplicar o +70% quando houver código específico).
3. Esclarecer "**70% do porte do primeiro ato cirúrgico**" (porte cirúrgico vs. porte anestésico — o texto
   diz "cirúrgico", o que é ambíguo no contexto anestésico). **Requer interpretação.**

### Nuance importante
Cirurgião e anestesiologista têm regras de bilateralidade **diferentes e compatíveis**: em coluna o
**cirurgião não duplica** (R3, já implementado); a **anestesia acresce 70%** (item 7). São atores distintos.

### Impacto
Cirurgias bilaterais sem código específico. **Exemplo ilustrativo** (porte anestésico AN5 → 7C = R$1.123,65):
+70% = +R$786,56 → anestesia ≈ **R$1.910,21**. Hoje cairia (aproximado) na degressividade de via.

### Decisão necessária
Como capturar "bilateral" para a anestesia, como detectar "sem código específico", e a interpretação de
"porte do primeiro ato cirúrgico".

### Esforço / risco
Médio. Risco financeiro **médio** (muda bilaterais) — exige testes por cenário com valores esperados.

---

## P3 — A14 / A20: acréscimo pediátrico/idoso sobre a anestesia ⚠️ (decisão crítica)

### Norma
- **Regra específica de anestesia — CBHPM p.140, item 14** (verbatim):
  > "…Quando realizados procedimentos anestésicos em **crianças (idade até 12 anos)** ou **idosos (igual ou
  > acima de 65 anos)**, a respectiva valoração terá acréscimo de **30%**."
  **Restrita** aos códigos `3.16.02.23-1`, `3.16.02.24-0`, `3.16.02.27-4`, `3.16.02.28-2` (e à anestesia em
  endoscopia, **p.155, item 7**).
- **Regra geral cirúrgica — CBHPM p.23, itens 4.6/4.7/4.8:** +100% (<2.500g/prematuro), +50% (neonato/lactente),
  +30% (24 meses–<12 anos) **sobre o porte do procedimento realizado**.

### Estado atual (divergência A20)
O motor aplica os **acréscimos pediátricos gerais** (4.6–4.8) a **todos** os honorários, **inclusive a
anestesia**. A auditoria **não encontrou** base documental para estender 4.6–4.8 ao **ato anestésico**
(o item específico de anestesia é o 14, restrito e com +30%, não +100/50/30%).

### O que falta / a questão central
Decidir **se o acréscimo pediátrico geral deve incidir sobre o honorário de anestesia**:
- **Leitura conservadora (norma):** não — a anestesia teria apenas o item 14 (+30%, restrito aos códigos
  citados, que **não estão no nosso catálogo cirúrgico** → efeito prático ≈ nulo hoje).
- **Comportamento atual:** sim — a anestesia é escalada junto (ex.: neonato +50% → anestesia ×1,5).

### Impacto (exemplo numérico)
Anestesia base R$1.000, caso **neonato (+50%)**:
- **Hoje:** anestesia = 1.000 × 1,5 = **R$1.500**.
- **Leitura conservadora:** anestesia = **R$1.000** (pediátrico geral não incide na anestesia).
- **Δ = R$500** por caso pediátrico. Caso <2.500g (+100%): Δ = R$1.000.

### Decisão necessária ⚠️
O acréscimo pediátrico geral (4.6–4.8) **deve continuar incidindo sobre a anestesia** (atual) ou **só** o
item-14 restrito? A norma é **silente** no elo geral→anestesia; é uma decisão clínica/financeira sua.

### Esforço / risco
Baixo–Médio (mudar a base de incidência do multiplicador para a anestesia). Risco financeiro **médio**
(pediatria) — muda valores; exige validação.

---

## P4 — R22: composição de múltiplos acréscimos (aditivo × multiplicativo)

### Norma
**Não há.** A CBHPM define cada acréscimo "sobre o porte", mas é **silente** sobre **como compor dois ou
mais acréscimos simultâneos**. Não é "achável" — é decisão de negócio.

### Estado atual
Modelo **aditivo**: as porcentagens são somadas e aplicadas como um multiplicador único
(`service/engine.go`). Ex.: urgência 30% + pediátrico 100% ⇒ ×2,30.

### Impacto (exemplo numérico)
Base R$1.000 com **urgência (30%) + pediátrico (100%)**:
- **Aditivo (atual):** 1.000 × (1 + 0,30 + 1,00) = **R$2.300**.
- **Multiplicativo:** 1.000 × 1,30 × 2,00 = **R$2.600**.
- **Δ = R$300**. Só ocorre quando **dois ou mais** acréscimos coincidem (relativamente raro).

### Decisão necessária
Confirmar o **modelo aditivo** como regra de negócio oficial (ou adotar multiplicativo). Recomenda-se
**manter aditivo** (mais conservador) salvo orientação contrária.

### Esforço / risco
Baixo (já implementado como aditivo). Risco: apenas registrar a decisão; mudar para multiplicativo
elevaria valores em casos combinados.

---

## Fora do escopo do cálculo da cirurgia (registradas)

- **A12 — Consulta pré-anestésica** (CBHPM p.140, item 12): "…fará jus ao porte equivalente à consulta
  clínica." É **honorário próprio**, faturado à parte; não compõe o cálculo da composição cirúrgica.
- **A18 — Plantonista de SRPA** (CBHPM p.141, código `3.16.03.01-7`, porte 4A): **código/serviço próprio**,
  não entra no cálculo da cirurgia.

Mantidas como referência; só entram se houver decisão de modelar honorários avulsos.

---

## Ordem de implementação recomendada

Sequência por **menor risco / maior clareza normativa** primeiro:

1. **P4 (R22)** — apenas registrar a decisão (aditivo). Risco ~nulo; fecha uma pendência "de papel".
2. **P3 (A14/A20)** — decisão de incidência pediátrica na anestesia; impacto claro e isolável; testes
   diretos. **É a de maior impacto financeiro real hoje** (a pediatria geral já está incidindo).
3. **P1 (A9 demais gatilhos)** — opt-in explícito; baixo risco; cobre nichos (CEC, >6h…).
4. **P2 (A8 bilateral anestésico)** — exige modelagem de sinal + interpretação; deixar por último.

Cada etapa: implementação **gated** (sem mudar valor até aprovação regra-a-regra), testes com **valores
esperados derivados da norma**, e `go test ./...` + `npm run build` verdes — mesmo protocolo das regras já
entregues.

---

## Como cada pendência será validada (quando implementada)

| Pendência | Teste-chave (valor esperado) |
|---|---|
| P1 | Caso AN6 + gatilho ligado → auxiliar 60%; gatilho desligado → 0. |
| P2 | Procedimento bilateral sem código específico → +70% do porte do 1º ato; com código específico → sem +70%. |
| P3 | Caso neonato: anestesia **não** escalada pelo pediátrico geral (ou escalada, conforme decisão) — valor esperado fixo. |
| P4 | urgência+pediátrico → ×2,30 (aditivo) — golden test já existente cobre o modelo atual. |

---

## Apêndice — rastreabilidade

- Regras de coluna (R1–R22): [spine-rules-traceability.md](spine-rules-traceability.md).
- Regras de anestesia (A1–A20): [anesthesiology-rules-traceability.md](anesthesiology-rules-traceability.md).
- Matriz de modificadores de anestesia: [anesthesiology-modifiers-matrix.md](anesthesiology-modifiers-matrix.md).
- Roadmap do motor data-driven: [normative-engine-roadmap.md](../architecture/normative-engine-roadmap.md).
