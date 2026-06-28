# Auditoria Normativa — Rastreabilidade das Regras de Anestesiologia

**Data:** 2026-06-28
**Escopo:** Toda regra clínico-faturável de Anestesiologia aplicável ao Synvera.
**Natureza:** Auditoria documental. **Nenhuma regra foi alterada no motor de cálculo.**
**Metodologia:** idêntica a [spine-rules-traceability.md](spine-rules-traceability.md).

## Fontes normativas aceitas (e somente estas)

| Sigla | Documento | Arquivo |
|---|---|---|
| **CBHPM** | CBHPM 2022 — em especial "Instruções Gerais Específicas para a Anestesiologia" e a coluna "Porte Anest." das tabelas | `data/raw_pdfs/CBHPM-2022.pdf` (240 p.) |

> **Mapeamento de páginas.** O prompt indicava "~p.170–178". Nesta edição (CBHPM-2022.pdf, 240 p.)
> a seção equivalente está em **p.139–140** (instruções específicas de anestesiologia), com a coluna
> "Porte Anest." nas tabelas de procedimentos (ex.: p.138–139) e regras correlatas em **p.141** (SRPA)
> e **p.155** (anestesia em endoscopia). As regras gerais de urgência/pediatria estão em **p.22–23**.

> **Aviso.** A implementação atual da engine e a documentação de arquitetura **não** são fonte. Uma
> regra só é "Confirmada" com correspondência textual explícita no PDF.

## Legenda de confiança

🟢 Confirmada explicitamente · 🟡 Inferida diretamente · 🟠 Inferência fraca · 🔴 Não encontrada.

Colunas: **Impl.?** (✅/❌) · **Diverge?** (⚠️ quando a implementação contraria a norma) · **Decisão futura?**

---

## 1. Matriz de rastreabilidade

| # | Regra | Status | Doc | Pág. | Trecho (verbatim) | Impl.? | Diverge? | Decisão? |
|---|---|---|---|---|---|---|---|---|
| A1 | Definição do ato anestésico (visita pré → técnica → SRPA/UTI) | 🟢 | CBHPM | 139 | "O ato anestésico se inicia com a visita pré-anestésica, prossegue com a administração da técnica anestésica … encerrando-se com a transferência do paciente para a SRPA ou para UTI" | ❌ | — | não |
| A2 | Controles invasivos valorados à parte, com o porte do cirurgião | 🟢 | CBHPM | 139 | "1.1. Não inclui medidas/controles invasivos que poderão ser valorados separadamente pelo anestesiologista, que deverá utilizar … o porte previsto para o cirurgião." | ❌ | — | não |
| A3 | **Portes anestésicos 0–8 com equivalência a porte cirúrgico** | 🟢 | CBHPM | 139 | "os atos anestésicos estão classificados em portes de 0 a 8 … 0 Anestesia local; 1→3A; 2→3C; 3→4C; 4→6B; 5→7C; 6→9B; 7→10C; 8→12A" | ❌ | ⚠️ | **sim** |
| A4 | **Porte 0 = NÃO participação do anestesiologista** | 🟢 | CBHPM | 139 | "O porte anestésico '0' significa 'NÃO PARTICIPAÇÃO DO ANESTESIOLOGISTA'." | ❌ | ⚠️ | **sim** |
| A5 | Ato sem porte anestésico previsto → equivale ao **PORTE 3** (3.16.02.34-7) | 🟢 | CBHPM | 140 | "4. Quando houver necessidade do concurso de anestesiologista em atos médicos que não tenham seus portes especialmente previstos … será equivalente ao estabelecido para o PORTE 3, código 3.16.02.34-7." | ❌ | — | sim |
| A6 | **Múltiplos atos — mesma via/cavidade**: maior porte + **50%** dos demais | 🟢 | CBHPM | 140 | "5. … a partir da MESMA VIA DE ACESSO ou dentro da MESMA CAVIDADE ANATÔMICA, o porte … será o que corresponder … ao procedimento de maior porte, acrescido de 50% dos demais atos praticados." | ❌ | — | **sim** |
| A7 | **Múltiplos atos — incisões/orifícios diferentes**: maior porte + **70%** dos demais | 🟢 | CBHPM | 140 | "6. … procedimentos cirúrgicos diferentes através de outras incisões … ou outros orifícios naturais, os portes … serão estabelecidos em acréscimo ao ato anestésico de maior porte 70% dos demais." | ❌ | — | **sim** |
| A8 | **Cirurgia bilateral** (sem código específico): + **70%** do porte do 1º ato | 🟢 | CBHPM | 140 | "7. Em caso de cirurgia bilateral no mesmo ato anestésico, INEXISTINDO código específico … serão acrescidos de 70% do porte atribuído ao primeiro ato cirúrgico." | ❌ | — | sim |
| A9 | **Auxiliar de anestesia = 60%** (AN7/AN8, CEC, neonato, gastroplastia, >6h) | 🟢 | CBHPM | 140 | "8. Para os atos AN7 e AN8 ou … Circulação Extracorpórea (CEC), ou … cirurgias com duração acima de 6 horas, o anestesiologista … poderá solicitar … um auxiliar … porte correspondente a 60% dos portes previstos para o(s) ato(s) … principal." | ❌ | — | sim |
| A10 | Portes incluem anestesia geral/condutiva/local + assistência | 🟢 | CBHPM | 140 | "9. Na valoração dos portes … incluem a anestesia geral, condutiva regional ou local, bem como a assistência do anestesiologista" | n/a | — | não |
| A11 | Portes = intervenção pessoal, livres de despesas (drogas/material) | 🟢 | CBHPM | 140 | "10. Os portes … referem-se exclusivamente à intervenção pessoal, livre de quaisquer despesas …" | n/a | — | não |
| A12 | Consulta pré-anestésica → porte de consulta clínica | 🟢 | CBHPM | 140 | "12. Quando for necessária ou solicitada consulta com o anestesiologista … fará jus ao porte equivalente à consulta clínica." | ❌ | — | não |
| A13 | Procedimentos diag./terap. com anestesiologista → item 6.2 das Instruções Gerais | 🟢 | CBHPM | 140 | "13. … quando houver necessidade do concurso do anestesiologista, aplica-se o previsto no item 6.2 das Instruções Gerais." | ❌ | — | sim |
| A14 | **Pediatria (≤12 a) e idosos (≥65 a): +30%** — códigos 3.16.02.23-1/24-0/27-4/28-2 | 🟢 | CBHPM | 140 | "14. … Quando realizados procedimentos anestésicos em crianças (idade até 12 anos) ou idosos (igual ou acima de 65 anos), a respectiva valoração terá acréscimo de 30%." | ❌ | ⚠️ | **sim** |
| A14b | Pediatria/idoso +30% também em anestesia para endoscopia | 🟢 | CBHPM | 155 | "7. … a valoração anestésica corresponderá ao porte 3 … e terão acréscimos de 30% quando a anestesia for realizada em crianças (idade até 12 anos) ou idosos (igual ou acima de 65 anos)." | ❌ | — | sim |
| A15 | **Urgência/emergência: +30%** (via Instruções Gerais item 2) | 🟡 | CBHPM | 22 / 155 | item 2.1 (p.22) "acréscimo de trinta por cento (30%) em seus portes"; p.155 item 8 confirma que anestesia/endoscopia "aplicando-se também … os itens 2, 5 e 6 das Instruções Gerais" | 🟡✅ | — | sim |
| A16 | **Horário especial** é o gatilho da urgência (19h–7h; sáb/dom/feriado), não acréscimo à parte | 🟢 | CBHPM | 22 | "2.1.1 … entre 19h e 7h …; 2.1.2 … sábados, domingos e feriados" | 🟡✅ | — | não |
| A17 | **Idosos (≥65 a): +30%** — existe, mas restrito aos códigos do item 14 / endoscopia | 🟢 | CBHPM | 140/155 | (mesmos trechos de A14/A14b) | ❌ | — | sim |
| A18 | SRPA — plantonista em sala de recuperação pós-anestésica (porte 4A, código próprio) | 🟢 | CBHPM | 141 | "3.16.03.01-7 Atendimento médico do plantonista em sala de recuperação pós-anestésica … 4A" | ❌ | — | não |
| A19 | **Origem do valor monetário**: porte anestésico → porte cirúrgico equivalente → valor do porte | 🟡 | CBHPM | 139 | tabela do item 2 (AN→porte). A CBHPM-2022 não traz valores em R$ (são pontos/UCO); o valor por porte vem da tabela de portes versionada do projeto. | ❌ | ⚠️ | **sim** |
| A20 | Pediatria geral cirúrgica (+100/50/30%, itens 4.6–4.8) aplicada ao **porte anestésico** | 🔴 | — | — | Não há texto estendendo 4.6–4.8 ao ato anestésico. A regra pediátrica explícita para anestesia é o item 14 (+30%, escopo restrito). | ❌ | — | sim |

---

## 2. Tópicos auditados

### 1. Portes anestésicos (AN0–AN8)
🟢 **Confirmado** (item 2, p.139). Estrutura completa **0 a 8** com **tabela oficial de equivalência** a porte cirúrgico: 0=local, 1=3A, 2=3C, 3=4C, 4=6B, 5=7C, 6=9B, 7=10C, 8=12A. Porte 0 = não participação (item 3).

### 2. Relação Porte Anestésico × Porte Cirúrgico
🟢 **Confirmado.** A equivalência **é oficial** e está na tabela do item 2 (p.139). Cada AN mapeia para um porte cirúrgico (3A…12A). Aplicação: o valor do ato anestésico é o valor do porte cirúrgico equivalente. **Não assumir o comportamento da engine** (que usa valor fixo).

### 3. Origem do valor monetário
🟡 A CBHPM-2022 expressa portes como **pontos** (não R$). O valor monetário do ato anestésico decorre do **porte cirúrgico equivalente** (item 2) aplicado à tabela de valores por porte. No Synvera, essa tabela é `porte_values` versionada (`cbhpm_versions`, ADR-004). **Não há comunicado de valores monetários específicos de anestesia** no repositório além da própria tabela de portes.

### 4. Urgência e emergência
🟡 **+30%** sobre os portes (Instruções Gerais item 2.1, p.22), aplicável ao ato anestésico por extensão (p.155 item 8 cita itens 2/5/6). Incidência: 19h–7h, fins de semana/feriados, ou >½ do ato no período. Sem exceção específica de anestesia encontrada.

### 5. Horário especial
🟢 Não é acréscimo autônomo — é o **gatilho** da urgência/emergência (item 2.1.1/2.1.2, p.22). Mesmos horários da regra geral.

### 6. Pediatria
🟢 Regra **específica de anestesia**: **+30%** para crianças ≤12 anos, **restrita** aos códigos 3.16.02.23-1, 24-0, 27-4, 28-2 (item 14, p.140) e à anestesia em endoscopia (p.155 item 7). 🔴 A pediatria geral cirúrgica (+100/50/30%, itens 4.6–4.8) **não** foi encontrada estendida ao porte anestésico.

### 7. Idosos
🟢 **Existe** regra específica: **+30%** para idosos ≥65 anos, **nos mesmos códigos/contexto** do item 14 e da endoscopia (p.140, p.155). Fora desse escopo, não há regra geral de idoso.

### 8. Múltiplos procedimentos anestésicos (crítico)
🟢 **Mesma via/cavidade** (item 5, p.140): maior porte + **50%** dos demais. 🟢 **Incisões/orifícios diferentes** (item 6, p.140): maior porte + **70%** dos demais. 🟢 **Bilateral sem código específico** (item 7): +**70%** do porte do 1º ato. ⚠️ **Não assumir** que as regras de via da neuro/coluna se apliquem — a anestesia tem **regra própria** (50% mesma via / 70% diferentes), expressa em portes anestésicos.

### 9. Auxiliar de anestesia
🟢 **Existe** (item 8, p.140): **60%** dos portes do principal, **somente** em AN7/AN8, CEC, neonatologia cirúrgica, gastroplastia para obesidade mórbida, ou cirurgias >6h. Não é um contador livre de auxiliares.

### 10. Porte zero
🟢 **AN0 = "NÃO PARTICIPAÇÃO DO ANESTESIOLOGISTA"** (item 3, p.139) e corresponde a "Anestesia local" (item 2). Implicação: **sem honorário de anestesiologista** quando AN0.

---

## 3. Comparação com a implementação atual

> Implementação atual: `service` usa `anesthesiaFee = 1200.00` fixo (portes.go), somado quando
> `requiresAnesthesia=true` e escalado pelo multiplicador de ajustes (engine.go Step 5/6). O **porte
> anestésico AN0–8 não é capturado** em nenhum lugar (`procedures.json`/`schema.sql` não têm a coluna
> "Porte Anest.").

### ✅ Confirmadas (implementação coincide com a norma)
- **A15/A16** — urgência/emergência +30% e o conceito de horário especial **incidem** sobre o valor de anestesia (o multiplicador de ajustes escala `anesth`). Coincide *no percentual e na incidência*, embora aplicado sobre uma base incorreta (ver divergências).

### ⚠️ Divergentes (implementação difere da norma)
1. **A3/A19 — Valor do anestesiologista.** Norma: porte AN0–8 → porte cirúrgico equivalente → valor do porte (por procedimento). Engine: **R$ 1.200 fixo**, independente do procedimento/porte. Sem base normativa (R21 da auditoria de coluna).
2. **A4/A10 — Porte 0.** Norma: AN0 = sem anestesiologista. Engine: adiciona 1.200 sempre que `requiresAnesthesia=true`, sem considerar porte 0.
3. **A14 — Pediatria/idoso anestésico (+30%, escopo restrito).** Engine: aplica os ajustes pediátricos **gerais** (+100/50/30%) também à anestesia; não há o +30% específico restrito aos códigos do item 14.

### ❌ Pendentes (norma existe, não implementada)
- **A3** captura do porte anestésico (coluna "Porte Anest.") por código — **dado inexistente** no catálogo.
- **A6/A7** múltiplos atos anestésicos (50% mesma via / 70% diferentes) — lógica inexistente.
- **A8** bilateral +70% (sem código específico) — inexistente.
- **A9** auxiliar de anestesia 60% (escopo do item 8) — inexistente.
- **A5** fallback PORTE 3 para atos sem porte previsto — inexistente.
- **A12/A18** consulta pré-anestésica e SRPA (códigos próprios) — fora de escopo do cálculo atual.

---

## 4. Classificação dos modificadores

Ver detalhe em [anesthesiology-modifiers-matrix.md](anesthesiology-modifiers-matrix.md).

- **USER_SELECTABLE:** urgência/emergência (A15); pediatria/idoso (A14, com idade); participação do anestesiologista (A4 — porte 0 vs presença); auxiliar de anestesia *quando aplicável* (A9).
- **DERIVED:** porte anestésico AN0–8 do procedimento (A3); equivalência AN→porte cirúrgico (A3); valor monetário do porte (A19); seleção principal/adicional em múltiplos atos (A6/A7).
- **ENGINE_ONLY:** ordem de aplicação; degressividade 50%/70% (A6/A7); arredondamentos; validações; mapeamento AN→porte→valor.

---

## 5. Resumo

- **Regras confirmadas (🟢):** A1–A14b, A16–A18 (estrutura AN0–8, equivalência, porte 0, fallback porte 3, múltiplos atos 50/70%, bilateral 70%, auxiliar 60%, pediatria/idoso +30% restrito, SRPA).
- **Divergências:** valor fixo (A3/A19), porte 0 ignorado (A4), pediatria anestésica genérica vs restrita (A14).
- **Decisões futuras:** capturar porte anestésico no dado; modelar valor por porte equivalente; degressividade própria de anestesia (50/70%); auxiliar 60%; +30% restrito; tratamento de AN0.
- **🔴 Não encontrado:** pediatria geral cirúrgica (4.6–4.8) aplicada ao ato anestésico (A20).

## 6. Recomendações para a futura implementação (sequenciamento seguro)

> Nenhuma regra entra no motor sem evidência documental explícita. Sequência análoga ao roadmap
> normativo da coluna (estágios sem mudança de valor antes da ativação aprovada).

| Estágio | Conteúdo | Muda valor? |
|---|---|---|
| **AN-0** | Documentar que `anesthesiaFee=1200` é simplificação sem base (já feito, R21). | Não |
| **AN-1** | **Dado**: capturar a coluna "Porte Anest." (AN0–8) por código (ingestão + schema/seed). Tabela vazia/seed sem leitura. | Não |
| **AN-2** | Tabela de equivalência AN→porte (item 2) como dado normativo com proveniência. | Não |
| **AN-3** | Read path + testes "golden" provando paridade (engine ainda usa o fixo). | Não |
| **AN-4** | **Ativar** valor por porte equivalente + AN0=sem honorário (A3/A4/A19). | **Sim** (aval) |
| **AN-5** | Degressividade de múltiplos atos (50%/70%, A6/A7) + bilateral (A8). | **Sim** (aval) |
| **AN-6** | Auxiliar 60% (A9) + pediatria/idoso +30% restrito (A14). | **Sim** (aval) |

**Riscos** (precedência clínica/financeira): trocar o valor fixo pelo porte-derivado **muda todos os
honorários de anestesia** — exige testes por cenário com valores esperados do Manual e decisão explícita.
A captura do porte anestésico é pré-requisito de tudo (sem o dado, nada é derivável).
