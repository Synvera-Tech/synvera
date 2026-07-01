# Matriz de Rastreabilidade — Pendências P1–P4 (Anestesia e Composição de Acréscimos)

**Projeto:** Synvera — motor de cálculo normativo (Neurocirurgia / Cirurgia da Coluna)
**Data da varredura:** 2026-07-01
**Escopo:** resolução normativa das pendências P1–P4 do relatório do motor de cálculo.
**Fonte de verdade (anestesia e acréscimos gerais):** CBHPM 2022. Os Manuais de Coluna (3ª ed. 2025)
e Neurocirurgia (2018) regem apenas a **codificação cirúrgica** e declaram derivar da CBHPM "sem
ultrapassar ou modificar o conteúdo" — logo, não criam regra própria de anestesia.

> **Precedência:** `Manual específico > CBHPM` **apenas no domínio cirúrgico**. No domínio anestésico
> e nos acréscimos gerais, aplica-se a CBHPM diretamente (os manuais são silentes e não a modificam).

---

## Âncora reutilizável — Tabela de Porte Anestésico (CBHPM 2022, p.139, item 2)

O porte anestésico (AN0–AN8) converte-se em porte CBHPM equivalente → valor:

| Porte anestésico | Porte CBHPM | Valor 2025/2026 |
|---|---|---|
| 0 | anestesia local | — (sem participação do anestesiologista, item 3) |
| 1 | 3A | R$ 228,07 |
| 2 | 3C | R$ 333,81 |
| 3 | 4C | R$ 491,33 |
| 4 | 6B | R$ 726,40 |
| 5 | 7C | R$ 1.123,65 |
| 6 | 9B | R$ 1.567,97 |
| 7 (AN7) | 10C | R$ 2.230,89 |
| 8 (AN8) | 12A | R$ 2.943,18 |

---

## P1 — Auxiliar de anestesia nos demais gatilhos ✅ DECIDIDO & IMPLEMENTADO (2026-07-01)

### Norma
**CBHPM 2022, p.140, item 8** (verbatim):
> "Para os atos **AN7 e AN8** ou naqueles nos quais seja utilizada **Circulação Extracorpórea (CEC)**,
> ou procedimentos de **neonatologia cirúrgica**, **gastroplastia para obesidade mórbida** e **cirurgias
> com duração acima de 6 horas**, o anestesiologista responsável poderá, quando necessário, solicitar o
> concurso de um auxiliar (também anestesiologista), sendo atribuído a essa intervenção um porte
> correspondente a **60%** dos portes previstos para o(s) ato(s) realizados pelo anestesiologista
> principal."

### Decisão registrada
- **AN7/AN8:** mantido o comportamento automático já existente (derivado do porte anestésico, habilitado
  pelo toggle "Auxiliar de anestesia (60%)").
- **Demais gatilhos (CEC, >6h, neonatologia cirúrgica, gastroplastia):** **não deriváveis do catálogo** —
  são fatos do ato cirúrgico que só o cirurgião conhece. Tratados por **seletor `USER_SELECTABLE`** na
  Procedure Page.
- **Granularidade escolhida:** **checkboxes por gatilho** (melhor para auditoria — registra *qual*
  gatilho fundamentou o acréscimo), não um override único.
- **Padrão:** todos **desligados** (opt-in). Sem seleção → comportamento atual inalterado.
- **Aplicação no motor:** **+60% sobre o porte anestésico principal**, aplicado **uma única vez**
  independentemente de quantos gatilhos disparem (AN7/AN8 e/ou justificativas combinam por **OU**).
- **Classe:** `USER_SELECTABLE` — nunca `DERIVED` nem `ENGINE_ONLY`. O frontend apenas coleta; o
  **backend é a autoridade numérica**.

### Rastreabilidade (breakdown/snapshot)
Cada cálculo registra, no resultado (JSON verbatim do motor, ADR-001):
- `AnesthesiaAssistantApplied` — se o auxiliar foi aplicado;
- `AnesthesiaAssistantReasons` — motivos (qualquer de `AN7`, `AN8`, `cec`, `duration_over_6h`,
  `surgical_neonatology`, `bariatric_gastroplasty`);
- `AnesthesiaAssistantSource` — `"CBHPM 2022 p.140 item 8"`.

### Implementação
- **Payload canônico** (`openapi.yaml`): novo objeto `anesthesia_auxiliary_justification`
  `{ cec, duration_over_6h, surgical_neonatology, bariatric_gastroplasty }` (opcional; default false).
- **Engine** (`service/engine.go`, entry point `CalculateWithPortesModifiersAndAnesthesia`): regra
  AN7/AN8 (toggle) **OU** qualquer gatilho → 60%, sem duplicação, com motivos.
- **Handler** (`handlers/calculate.go`): decodifica o objeto e delega ao engine.
- **Frontend** (`components/procedure/TeamFeesPanel.tsx` + `app/procedure/page.tsx`): 4 checkboxes no
  bloco de anestesia; coleta apenas, envia no payload.
- **Testes:** 10 casos de engine + 1 de handler (contrato payload→backend).

**Confiança normativa do +60%: ALTA.** A decisão pendente era apenas de UX de captura (resolvida:
checkboxes por gatilho).

---

## P2 — Bilateralidade anestésica +70% (RESOLVÍVEL — pendente de implementação)

**CBHPM 2022, p.140, item 7** (verbatim): *"Em caso de cirurgia bilateral no mesmo ato anestésico,
INEXISTINDO código específico na presente Classificação, os atos praticados pelo anestesiologista serão
acrescidos de 70% do porte atribuído ao primeiro ato cirúrgico."*

- **Interpretação do porte:** lendo os itens 5/6/7 em conjunto, o +70% incide sobre o **porte
  anestésico** do ato principal (não o cirúrgico). Confiança: MÉDIA-ALTA.
- **Detecção de "código específico":** existe quando a descrição contém "bilateral" — **nenhum**
  procedimento de coluna/neuro tem; logo, em regra o +70% se aplica quando o ato é bilateral.
- **Decisão pendente:** sinal de bilateralidade anestésica + validação da interpretação. **Implementar
  por último.** Não alterado neste change.

---

## P3 — Acréscimo pediátrico/idoso sobre a anestesia (RESOLVÍVEL — pendente de decisão)

- **Base cirúrgica** (CBHPM p.23, §4.6–4.8): +100%/+50%/+30% "sobre o porte do procedimento realizado".
- **Regra anestésica própria e restrita** (CBHPM p.140, item 14): +30% apenas para 4 códigos de
  anestesia (endoscopia/TC/RM) **ausentes do catálogo** de coluna/neuro.
- **Raciocínio:** a existência do item 14 (restrito) é evidência de que os acréscimos gerais 4.6–4.8
  **não alcançam** o porte anestésico. Leitura conservadora: pediátrico geral incide **só na cirurgia**.
- **Decisão pendente do cirurgião.** Confiança: ALTA. **Não alterado neste change.**

---

## P4 — Composição de múltiplos acréscimos (norma SILENTE — decisão de negócio)

- CBHPM define cada acréscimo isoladamente "sobre o porte" e é **silente** sobre compor dois ou mais.
- Comportamento atual: **aditivo** (percentuais somados sobre a mesma base). O texto ("sobre o porte")
  é mais coerente com o aditivo do que com o multiplicativo.
- **Decisão pendente:** confirmar aditivo como regra oficial. **Não alterado neste change.**

---

## Matriz consolidada

| Pend. | Regra | Documento · Item | Muda valor? | Confiança | Status |
|---|---|---|---|---|---|
| **P1** | Auxiliar de anestesia +60% (AN7/AN8 **ou** gatilhos USER_SELECTABLE) | CBHPM p.140 item 8 | Sim (quando aplicável) | ALTA | ✅ **Implementado** |
| **P2** | +70% anestésico em bilateral sem código específico | CBHPM p.140 itens 5/6/7 | Sim (bilaterais) | MÉDIA-ALTA | Pendente |
| **P3** | Pediátrico geral **não** incide na anestesia | CBHPM p.23 §4.6–4.8 + p.140 item 14 | Sim (pediatria) | ALTA | Pendente (decisão) |
| **P4** | Composição de acréscimos = aditivo | CBHPM p.23 §2.1 e §4.6–4.8 | Sim (2+ acréscimos) | Silente | Pendente (registro) |

---

## Fora do escopo do cálculo da cirurgia

- **A12 — Consulta pré-anestésica** (CBHPM p.140 item 12): honorário próprio, faturado à parte.
- **A18 — Plantonista de SRPA** (CBHPM p.141, código 3.16.03.01-7, porte 4A): serviço com código próprio.

---

## Notas de ADR

- **ADR-001 (Persistir inputs de cálculo):** P1 **reforça** — os gatilhos são novos inputs do usuário,
  persistidos no breakdown/snapshot (applied + reasons + source).
- **ADR-005 (Tabela normativa data-driven):** **não se aplica** — os gatilhos são `USER_SELECTABLE`
  (fatos clínicos não deriváveis do catálogo), logo **não** entram em `cbhpm_code_modifiers`. Sem
  migration (breakdown = JSON do motor).
