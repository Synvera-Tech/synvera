# Glossário de Engenharia do Claude Code — Vocabulário de Desenvolvimento do Synvera

> **Este é um documento vivo.**
> Sempre que o Claude Code utilizar um termo técnico novo durante o desenvolvimento do
> Synvera, esse termo deverá ser incorporado automaticamente a este glossário (em ordem
> alfabética, preservando a estrutura).

Este glossário **não** documenta a codebase (funções, tabelas, schemas). Ele documenta o
**vocabulário de raciocínio** que o Claude Code usa durante thinking, planejamento,
investigações, auditorias, gateways de decisão, relatórios e explicações arquiteturais —
para que esse vocabulário possa ser estudado e aprendido ao longo do tempo.

---

## Índice

- [Audit Trail](#audit-trail)
- [Authoritative Source](#authoritative-source)
- [Backward Compatibility](#backward-compatibility)
- [Blast Radius](#blast-radius)
- [Blended Rate](#blended-rate)
- [Breaking Change](#breaking-change)
- [Canonical Payload](#canonical-payload)
- [Cardinality](#cardinality)
- [Confidence Level](#confidence-level)
- [Contract](#contract)
- [Decision Gateway](#decision-gateway)
- [Deterministic](#deterministic)
- [Domain Gating](#domain-gating)
- [Drift](#drift)
- [DTO](#dto)
- [Feature Gate](#feature-gate)
- [Forward Compatibility](#forward-compatibility)
- [Golden Test](#golden-test)
- [Handler](#handler)
- [Hardcoded](#hardcoded)
- [Idempotent](#idempotent)
- [Immutable Snapshot](#immutable-snapshot)
- [Inference](#inference)
- [Invariant](#invariant)
- [JSONB](#jsonb)
- [Migration](#migration)
- [Normalization](#normalization)
- [OpenAPI](#openapi)
- [Opt-in](#opt-in)
- [Parity](#parity)
- [Pipeline](#pipeline)
- [Provenance](#provenance)
- [Pure Function](#pure-function)
- [Regression](#regression)
- [Replay](#replay)
- [Ripple Effect](#ripple-effect)
- [Rollback](#rollback)
- [Scaffold](#scaffold)
- [Seed](#seed)
- [Snapshot](#snapshot)
- [Source of Truth](#source-of-truth)
- [Source-derived](#source-derived)
- [Staged Rollout](#staged-rollout)
- [Stub](#stub)
- [Surface Area](#surface-area)
- [Traceability](#traceability)
- [Verbatim](#verbatim)

---

# Audit Trail

## Tradução
Trilha de auditoria.

## Definição
Registro encadeado de **o que aconteceu, quando e com base em quê**, suficiente para
reconstruir uma decisão ou um cálculo depois. Não é só "log": é evidência preservada de
inputs, regras aplicadas e fontes.

## Quando o Claude Code costuma usar este termo
- auditorias clínicas e de cálculo;
- modelagem de persistência;
- discussões sobre conformidade e reprodutibilidade.

## Exemplo real de uso
- Original: "Every seeded row carries verbatim provenance so the audit trail proves which manual page justified the rule."
- Tradução: "Cada linha semeada carrega proveniência verbatim para que a trilha de auditoria prove qual página do manual justificou a regra."

## Aplicação no Synvera
Os cálculos preservam `calculation_breakdown` (JSON do motor) e os inputs; a tabela
`cbhpm_code_modifiers` guarda `source_document/page/excerpt`. Juntos formam a trilha de
auditoria que permite explicar qualquer honorário gerado.

## Leituras relacionadas
Ver também: [Provenance](#provenance) · [Traceability](#traceability) · [Replay](#replay) · [Snapshot](#snapshot)

---

# Authoritative Source

## Tradução
Fonte autoritativa.

## Definição
A fonte que **tem autoridade final** sobre um fato. Quando há conflito, ela vence. Difere de
uma fonte meramente conveniente ou de uma hipótese.

## Quando o Claude Code costuma usar este termo
- auditorias normativas;
- resolução de conflitos entre documentos;
- definição de o que pode ou não virar regra.

## Exemplo real de uso
- Original: "The prompt's section 5 is a hypothesis, not an authoritative source; only the Manual de Coluna is."
- Tradução: "A seção 5 do prompt é uma hipótese, não uma fonte autoritativa; apenas o Manual de Coluna é."

## Aplicação no Synvera
Na auditoria de regras de coluna, definimos que **só** os manuais (Coluna 3ª ed., SBN, CBHPM)
são autoritativos; o NotebookLM e o prompt foram tratados como hipótese de modelagem.

## Leituras relacionadas
Ver também: [Source of Truth](#source-of-truth) · [Confidence Level](#confidence-level) · [Inference](#inference)

---

# Backward Compatibility

## Tradução
Retrocompatibilidade.

## Definição
Propriedade de uma mudança que **não quebra** consumidores/chamadas/testes existentes. O
comportamento antigo continua válido após a mudança.

## Quando o Claude Code costuma usar este termo
- mudanças de contrato (API, assinaturas de função);
- refatorações;
- evolução de schema.

## Exemplo real de uso
- Original: "Passing a nil modifiers map keeps the legacy path byte-identical, so backward compatibility holds."
- Tradução: "Passar um mapa de modificadores nil mantém o caminho legado byte-a-byte idêntico, então a retrocompatibilidade se mantém."

## Aplicação no Synvera
No N5, o engine ganhou `CalculateWithPortesAndModifiers`, mas `Calculate`/`CalculateWithPortes`
passam `nil` e produzem resultado idêntico — todos os testes antigos continuam verdes.

## Leituras relacionadas
Ver também: [Forward Compatibility](#forward-compatibility) · [Breaking Change](#breaking-change) · [Regression](#regression)

---

# Blast Radius

## Tradução
Raio de impacto (literalmente "raio da explosão").

## Definição
O conjunto de tudo que **pode ser afetado** se uma mudança der errado. Quanto maior o raio,
maior o cuidado, mais testes e mais faseamento.

## Quando o Claude Code costuma usar este termo
- análise de risco antes de refatorar;
- decisões de faseamento;
- revisões de arquitetura.

## Exemplo real de uso
- Original: "Touching SelectedCode has a large blast radius because it is also the persisted JSONB shape."
- Tradução: "Mexer em SelectedCode tem um raio de impacto grande porque ele também é o formato persistido em JSONB."

## Aplicação no Synvera
Para evitar raio de impacto na persistência, o N5 passou os modificadores **para dentro do
motor** em vez de adicionar campos a `SelectedCode`.

## Leituras relacionadas
Ver também: [Surface Area](#surface-area) · [Ripple Effect](#ripple-effect) · [Rollback](#rollback)

---

# Blended Rate

## Tradução
Taxa combinada / mesclada.

## Definição
Uma taxa única que **resume várias taxas diferentes** aplicadas a itens distintos, geralmente
calculada como total descontado ÷ total bruto.

## Quando o Claude Code costuma usar este termo
- motores de cálculo;
- relatórios financeiros onde itens têm regras distintas.

## Exemplo real de uso
- Original: "With per-code via rules, the reported discount rate becomes a blended rate (discounted ÷ gross)."
- Tradução: "Com regras de via por código, a taxa de desconto reportada vira uma taxa combinada (descontado ÷ bruto)."

## Aplicação no Synvera
Quando uma composição mistura códigos de coluna (50%) e neuro (70%), `SurgeonBreakdown.DiscountRate`
passa a refletir a taxa combinada efetiva, mantendo o número auditável.

## Leituras relacionadas
Ver também: [Domain Gating](#domain-gating) · [Deterministic](#deterministic)

---

# Breaking Change

## Tradução
Mudança incompatível / quebra de contrato.

## Definição
Mudança que **quebra** consumidores existentes — uma assinatura, um campo, um nome ou um
formato que código de terceiros (ou testes) dependia.

## Quando o Claude Code costuma usar este termo
- evolução de API/contrato;
- regeneração de código;
- versionamento.

## Exemplo real de uso
- Original: "Adding the second enum renamed the shared constants — a breaking change for the test files."
- Tradução: "Adicionar o segundo enum renomeou as constantes compartilhadas — uma mudança incompatível para os arquivos de teste."

## Aplicação no Synvera
Ao incluir `NormativeBillingMode` no OpenAPI, o `oapi-codegen` prefixou os consts
(`PERSEGMENT` → `BillingModePERSEGMENT`); ajustamos os testes, sem afetar código de produção.

## Leituras relacionadas
Ver também: [Backward Compatibility](#backward-compatibility) · [OpenAPI](#openapi) · [Contract](#contract)

---

# Canonical Payload

## Tradução
Payload canônico.

## Definição
A **única** construção oficial de um payload, usada por todos os call sites, para que uma
mudança de formato se propague automaticamente e não haja versões divergentes.

## Quando o Claude Code costuma usar este termo
- frontends que montam requisições;
- pontos de save/calculate/share que precisam concordar.

## Exemplo real de uso
- Original: "buildCodeEntry is the canonical payload builder — calculate, save and share must all use it."
- Tradução: "buildCodeEntry é o construtor de payload canônico — calculate, save e share devem todos usá-lo."

## Aplicação no Synvera
`frontend/lib/procedure/payload-builders.ts` centraliza o `SelectedCodePayload`, evitando que
calculate e composição enviem formatos diferentes.

## Leituras relacionadas
Ver também: [Payload](#dto) · [Source of Truth](#source-of-truth) · [Contract](#contract)

---

# Cardinality

## Tradução
Cardinalidade.

## Definição
Quantos registros de um lado se relacionam com o outro: **1:1**, **1:N**, **N:1**, **N:M**.
"1:N" = um para muitos; "N:M" = muitos para muitos.

## Quando o Claude Code costuma usar este termo
- auditoria de modelo de dados;
- design de tabelas e chaves;
- validação de relações.

## Exemplo real de uso
- Original: "Procedure → CBHPM is 1:N; never assume 1:1 and dedupe codes."
- Tradução: "Procedimento → CBHPM é 1:N; nunca assuma 1:1 e deduplique códigos."

## Aplicação no Synvera
`sbn_cbhpm_mappings` prova a cardinalidade 1:N (um procedimento → vários códigos). O
modificador é 1:1 por especialidade (`UNIQUE(cbhpm_code, specialty)`).

## Leituras relacionadas
Ver também: [Invariant](#invariant) · [Migration](#migration)

---

# Confidence Level

## Tradução
Nível de confiança.

## Definição
Um rótulo explícito de **quão sólida** é a base de uma afirmação: confirmada, inferida
diretamente, inferência fraca, ou não encontrada.

## Quando o Claude Code costuma usar este termo
- auditorias normativas;
- matrizes de rastreabilidade;
- relatórios onde nem tudo tem a mesma certeza.

## Exemplo real de uso
- Original: "Cost ectomy's rule is CONFIRMED (p.13); the neurolytic block is WEAK ('geralmente')."
- Tradução: "A regra da costectomia é CONFIRMADA (p.13); o bloqueio neurolítico é FRACO ('geralmente')."

## Aplicação no Synvera
A coluna `confidence` (`CONFIRMED|INFERRED|WEAK`) em `cbhpm_code_modifiers` e na matriz de
rastreabilidade — só regras CONFIRMED foram semeadas.

## Leituras relacionadas
Ver também: [Inference](#inference) · [Authoritative Source](#authoritative-source) · [Traceability](#traceability)

---

# Contract

## Tradução
Contrato.

## Definição
O acordo formal de **forma e comportamento** entre duas partes (ex.: API ↔ cliente, função ↔
chamador). Mudar o contrato sem coordenação quebra quem depende dele.

## Quando o Claude Code costuma usar este termo
- APIs (OpenAPI);
- interfaces e assinaturas;
- limites entre módulos.

## Exemplo real de uso
- Original: "Never alter the OpenAPI contract without explicit consent."
- Tradução: "Nunca altere o contrato OpenAPI sem consentimento explícito."

## Aplicação no Synvera
`openapi.yaml` é o contrato; campos novos (`modifier`, `domain`) entraram como **opcionais**
para não quebrar clientes.

## Leituras relacionadas
Ver também: [OpenAPI](#openapi) · [Breaking Change](#breaking-change) · [DTO](#dto)

---

# Decision Gateway

## Tradução
Gateway de decisão / portão de decisão.

## Definição
Um ponto em que o Claude Code **pausa e devolve a escolha** ao usuário, porque a decisão é
dele (clínica, financeira, de produto) e não pode ser resolvida por default.

## Quando o Claude Code costuma usar este termo
- antes de mudanças que alteram valores;
- antes de alterar contratos (OpenAPI);
- quando fontes conflitam.

## Exemplo real de uso
- Original: "This is a decision gateway: 360° at 50% (manual) vs 70% (current engine) — your call."
- Tradução: "Este é um gateway de decisão: 360° a 50% (manual) vs 70% (engine atual) — decisão sua."

## Aplicação no Synvera
Os portões de R3 (bilateralidade), R7 (costectomia), R12 (via 360°) e a autorização de
alterar o OpenAPI foram todos gateways de decisão.

## Leituras relacionadas
Ver também: [Feature Gate](#feature-gate) · [Confidence Level](#confidence-level)

---

# Deterministic

## Tradução
Determinístico.

## Definição
Dada a mesma entrada, produz **sempre** a mesma saída — sem aleatoriedade, sem dependência de
estado externo oculto.

## Quando o Claude Code costuma usar este termo
- motores de cálculo;
- geração de código/seed;
- reprodutibilidade e replay.

## Exemplo real de uso
- Original: "oapi-codegen reproduces the file byte-for-byte — generation is deterministic."
- Tradução: "O oapi-codegen reproduz o arquivo byte-a-byte — a geração é determinística."

## Aplicação no Synvera
O motor de valoração é determinístico; por isso cálculos históricos podem ser reproduzidos a
partir dos inputs e da tabela de portes da versão ativa.

## Leituras relacionadas
Ver também: [Replay](#replay) · [Pure Function](#pure-function) · [Idempotent](#idempotent)

---

# Domain Gating

## Tradução
Gating por domínio / condicionamento por domínio.

## Definição
Aplicar uma regra **apenas dentro de um domínio** (ex.: SPINE) e não em outro (ex.:
NEUROSURGERY), mesmo que compartilhem o mesmo código.

## Quando o Claude Code costuma usar este termo
- regras clínicas específicas de especialidade;
- renderização contextual de UI;
- enriquecimento de payload no backend.

## Exemplo real de uso
- Original: "The same CBHPM code appears in neuro and spine procedures; domain gating stops the spine rule from leaking into neuro."
- Tradução: "O mesmo código CBHPM aparece em procedimentos neuro e de coluna; o gating por domínio impede a regra de coluna de vazar para neuro."

## Aplicação no Synvera
O handler só anexa/aplica o modificador quando `specialty == SPINE`; laminectomia em
procedimento neuro não recebe a regra "por vértebra".

## Leituras relacionadas
Ver também: [Feature Gate](#feature-gate) · [Blended Rate](#blended-rate) · [Invariant](#invariant)

---

# Drift

## Tradução
Deriva / descompasso.

## Definição
Quando duas coisas que **deveriam estar sincronizadas** se afastam silenciosamente (ex.:
schema vs migrations, dois seeds da mesma verdade).

## Quando o Claude Code costuma usar este termo
- banco (schema vs migration);
- duplicação de fontes de dados;
- geração de código.

## Exemplo real de uso
- Original: "A stale schema.sql silently breaks sqlc — that is schema drift."
- Tradução: "Um schema.sql desatualizado quebra o sqlc silenciosamente — isso é drift de schema."

## Aplicação no Synvera
Para evitar drift entre o seed do Postgres e o `FileRepository`, ambos derivam do **mesmo**
`code_modifiers.json` (um gerador produz a migração).

## Leituras relacionadas
Ver também: [Source of Truth](#source-of-truth) · [Migration](#migration) · [Parity](#parity)

---

# DTO

## Tradução
Sem tradução natural consagrada — "objeto de transferência de dados" (Data Transfer Object).

## Definição
Uma estrutura cujo único papel é **carregar dados entre camadas** (ex.: API ↔ frontend), sem
lógica de negócio. "Payload" é o DTO concreto enviado numa requisição.

## Quando o Claude Code costuma usar este termo
- contratos de API;
- limites entre backend e frontend.

## Exemplo real de uso
- Original: "The wire SelectedCode is a DTO; the normative fields stay internal to the engine."
- Tradução: "O SelectedCode de transporte é um DTO; os campos normativos ficam internos ao motor."

## Aplicação no Synvera
Os tipos em `generated/openapi.gen.go` e `frontend/lib/procedure/types.ts` são DTOs do
contrato OpenAPI.

## Leituras relacionadas
Ver também: [Canonical Payload](#canonical-payload) · [Contract](#contract) · [OpenAPI](#openapi)

---

# Feature Gate

## Tradução
Trava de funcionalidade / portão de funcionalidade.

## Definição
Um mecanismo que **mantém uma funcionalidade desligada** até uma condição (aprovação, flag,
etapa) ser satisfeita — separando "código pronto" de "comportamento ativo".

## Quando o Claude Code costuma usar este termo
- rollouts faseados;
- mudanças sensíveis (financeiras/clínicas);
- separar entrega técnica de ativação.

## Exemplo real de uso
- Original: "The modifier table is loaded but gated off the engine until N5 sign-off."
- Tradução: "A tabela de modificadores é carregada mas mantida fora do motor (gated) até o aval do N5."

## Aplicação no Synvera
Nos estágios N1–N4, os dados normativos existiam mas não afetavam o cálculo — a "trava" só foi
liberada no N5, com decisão clínica.

## Leituras relacionadas
Ver também: [Decision Gateway](#decision-gateway) · [Staged Rollout](#staged-rollout) · [Domain Gating](#domain-gating)

---

# Forward Compatibility

## Tradução
Compatibilidade futura / para frente.

## Definição
Projetar algo hoje para que **mudanças futuras encaixem** sem reescrever — ex.: deixar colunas
nuláveis prontas para um versionamento posterior.

## Quando o Claude Code costuma usar este termo
- design de schema;
- planejamento de versionamento;
- pontos de extensão.

## Exemplo real de uso
- Original: "The modifier table is forward-compatible: adding valid_from/valid_to later enables rule versioning."
- Tradução: "A tabela de modificadores é compatível com o futuro: adicionar valid_from/valid_to depois habilita o versionamento de regras."

## Aplicação no Synvera
`cbhpm_code_modifiers` nasce com campos de proveniência/replay para que o versionamento V2
(análogo a `cbhpm_versions`) seja aditivo.

## Leituras relacionadas
Ver também: [Backward Compatibility](#backward-compatibility) · [Replay](#replay) · [Migration](#migration)

---

# Golden Test

## Tradução
Teste "golden" / teste de referência.

## Definição
Um teste que fixa uma saída conhecida-correta ("golden") e falha se o comportamento mudar.
Forma forte de [Regression](#regression) test, usada para provar **paridade**.

## Quando o Claude Code costuma usar este termo
- refatorações que devem preservar comportamento;
- motores de cálculo;
- ativação faseada.

## Exemplo real de uso
- Original: "A golden parity test proves the modifier table does not change the engine output yet."
- Tradução: "Um teste golden de paridade prova que a tabela de modificadores ainda não altera a saída do motor."

## Aplicação no Synvera
No N3, `TestEngineIgnoresModifierTable_N3` garante saída idêntica; no N5, testes com valores
esperados do Manual fixam o novo comportamento.

## Leituras relacionadas
Ver também: [Regression](#regression) · [Parity](#parity) · [Deterministic](#deterministic)

---

# Handler

## Tradução
Manipulador / tratador (de requisição). Geralmente mantido como "handler".

## Definição
A função que **recebe uma requisição HTTP**, valida, orquestra a lógica e devolve a resposta.
É a borda entre o transporte (HTTP) e o domínio.

## Quando o Claude Code costuma usar este termo
- design de rotas/API;
- onde aplicar validação e enriquecimento.

## Exemplo real de uso
- Original: "The calculate handler enriches each code from the modifier table before calling the engine."
- Tradução: "O handler de calculate enriquece cada código com a tabela de modificadores antes de chamar o motor."

## Aplicação no Synvera
`internal/handlers/calculate.go` e `procedure.go` — pontos onde o backend é a autoridade e
aplica as regras normativas.

## Leituras relacionadas
Ver também: [Contract](#contract) · [Source of Truth](#source-of-truth)

---

# Hardcoded

## Tradução
Embutido no código / "chumbado" (sem tradução única consagrada).

## Definição
Valor ou regra **escrito diretamente no código** em vez de vir de dados/configuração. Mudar
exige editar e reimplantar o código.

## Quando o Claude Code costuma usar este termo
- migração de lógica para dados (data-driven);
- auditorias de manutenibilidade.

## Exemplo real de uso
- Original: "Today via/laterality rules are hardcoded in Go; the goal is a data-driven engine."
- Tradução: "Hoje as regras de via/lateralidade estão chumbadas em Go; o objetivo é um motor dirigido por dados."

## Aplicação no Synvera
O roadmap normativo move regras hardcoded para `cbhpm_code_modifiers`, deixando só primitivas
no motor.

## Leituras relacionadas
Ver também: [Source-derived](#source-derived) · [Source of Truth](#source-of-truth) · [Seed](#seed)

---

# Idempotent

## Tradução
Idempotente.

## Definição
Operação que pode ser **executada várias vezes com o mesmo efeito** de uma única execução —
re-rodar não duplica nem corrompe.

## Quando o Claude Code costuma usar este termo
- migrations e seeds;
- scripts de ETL;
- operações de rede com retry.

## Exemplo real de uso
- Original: "The seed uses ON CONFLICT DO NOTHING, so the migration is idempotent."
- Tradução: "O seed usa ON CONFLICT DO NOTHING, então a migração é idempotente."

## Aplicação no Synvera
As migrações 026/027/028 e os scripts de import são idempotentes (re-aplicáveis sem dano).

## Leituras relacionadas
Ver também: [Migration](#migration) · [Seed](#seed) · [Deterministic](#deterministic)

---

# Immutable Snapshot

## Tradução
Snapshot imutável.

## Definição
Uma cópia **congelada e não editável** do estado num instante, preservada para auditoria ou
replay. Ver também [Snapshot](#snapshot).

## Quando o Claude Code costuma usar este termo
- persistência de cálculos;
- auditabilidade;
- reprodutibilidade histórica.

## Exemplo real de uso
- Original: "Replay relies on the immutable snapshot stored in calculation_breakdown."
- Tradução: "O replay depende do snapshot imutável guardado em calculation_breakdown."

## Aplicação no Synvera
`calculations.calculation_breakdown` guarda o JSON verbatim do motor — um snapshot imutável que
sobrevive a revisões futuras de tarifa.

## Leituras relacionadas
Ver também: [Snapshot](#snapshot) · [Replay](#replay) · [Audit Trail](#audit-trail)

---

# Inference

## Tradução
Inferência.

## Definição
Conclusão **derivada** de evidências, não lida literalmente. Pode ser forte (inferência direta)
ou fraca, e nunca deve ser confundida com uma afirmação confirmada.

## Quando o Claude Code costuma usar este termo
- auditorias;
- leitura de fontes ambíguas;
- atribuição de [Confidence Level](#confidence-level).

## Exemplo real de uso
- Original: "'Geralmente uma vez por segmento' supports only a weak inference, not a billing rule."
- Tradução: "'Geralmente uma vez por segmento' sustenta apenas uma inferência fraca, não uma regra de cobrança."

## Aplicação no Synvera
Na matriz de rastreabilidade, regras marcadas como inferência (não CONFIRMED) **não** foram
ativadas no motor.

## Leituras relacionadas
Ver também: [Confidence Level](#confidence-level) · [Evidence](#audit-trail) · [Authoritative Source](#authoritative-source)

---

# Invariant

## Tradução
Invariante.

## Definição
Uma condição que deve ser **sempre verdadeira** no sistema. Violá-la é, por definição, um bug
ou um estado inválido.

## Quando o Claude Code costuma usar este termo
- regras de banco (constraints);
- modelagem de domínio;
- auditorias.

## Exemplo real de uso
- Original: "Invariant: at most one active CBHPM version at any time."
- Tradução: "Invariante: no máximo uma versão CBHPM ativa a qualquer momento."

## Aplicação no Synvera
Índice parcial único garante a invariante de versão ativa; `UNIQUE(cbhpm_code, specialty)`
garante um modificador por código/especialidade.

## Leituras relacionadas
Ver também: [Cardinality](#cardinality) · [Migration](#migration)

---

# JSONB

## Tradução
Sem tradução — formato JSON binário do PostgreSQL.

## Definição
Tipo de coluna do PostgreSQL que armazena JSON de forma **binária e indexável**. Bom para
estruturas semiestruturadas que não merecem colunas próprias.

## Quando o Claude Code costuma usar este termo
- persistência de composições/cálculos;
- decisões de schema.

## Exemplo real de uso
- Original: "selected_codes is stored as JSONB; adding struct fields would change the stored shape."
- Tradução: "selected_codes é armazenado como JSONB; adicionar campos à struct mudaria o formato gravado."

## Aplicação no Synvera
`compositions.selected_codes`, `adjustments`, `modifiers` e `cbhpm_code_modifiers.supported_modifiers`
são JSONB.

## Leituras relacionadas
Ver também: [Migration](#migration) · [DTO](#dto) · [Blast Radius](#blast-radius)

---

# Migration

## Tradução
Migração (de banco de dados).

## Definição
Um script versionado que **evolui o schema/dados** de forma controlada e ordenada. As
migrações são a fonte de verdade da estrutura do banco.

## Quando o Claude Code costuma usar este termo
- qualquer mudança de schema;
- seeds;
- reconciliação de produção.

## Exemplo real de uso
- Original: "Migration 027 creates the table; 028 seeds it — both reversible and idempotent."
- Tradução: "A migração 027 cria a tabela; a 028 a semeia — ambas reversíveis e idempotentes."

## Aplicação no Synvera
`backend/db/migrations/` é a fonte de verdade; após cada migração, reconstrói-se `schema.sql` e
roda-se `sqlc generate`.

## Leituras relacionadas
Ver também: [Seed](#seed) · [Idempotent](#idempotent) · [Rollback](#rollback) · [Drift](#drift)

---

# Normalization

## Tradução
Normalização.

## Definição
Tornar valores **consistentes e canônicos** (ex.: padronizar `specialty` para
`NEUROSURGERY|SPINE`) ou estruturar dados sem redundância.

## Quando o Claude Code costuma usar este termo
- limpeza de dados;
- auditoria de modelo;
- busca (normalizar acentos).

## Exemplo real de uso
- Original: "specialty stores 'Neurocirurgia, Coluna Vertebral' — it needs normalization to the enum."
- Tradução: "specialty guarda 'Neurocirurgia, Coluna Vertebral' — precisa de normalização para o enum."

## Aplicação no Synvera
A busca normaliza acentos; o roadmap N2 prevê normalizar `specialty` do catálogo para os
valores do enum.

## Leituras relacionadas
Ver também: [Invariant](#invariant) · [Source of Truth](#source-of-truth)

---

# OpenAPI

## Tradução
Sem tradução — especificação OpenAPI.

## Definição
Padrão para **descrever contratos de API HTTP** em YAML/JSON, a partir do qual se geram tipos e
clientes. É o contrato "spec-driven".

## Quando o Claude Code costuma usar este termo
- mudanças de API;
- geração de tipos (oapi-codegen);
- compatibilidade.

## Exemplo real de uso
- Original: "Add the field to openapi.yaml, then regenerate; never hand-edit generated types."
- Tradução: "Adicione o campo ao openapi.yaml e regenere; nunca edite os tipos gerados à mão."

## Aplicação no Synvera
`openapi.yaml` é spec-driven; `oapi-codegen` gera `openapi.gen.go`. Alterá-lo exige
consentimento explícito (CLAUDE.md).

## Leituras relacionadas
Ver também: [Contract](#contract) · [Breaking Change](#breaking-change) · [DTO](#dto)

---

# Opt-in

## Tradução
Adesão explícita (sem tradução de uma palavra) — "ativar por escolha".

## Definição
Um comportamento que **só vale quando explicitamente declarado**; a ausência significa o padrão
seguro. O oposto de "opt-out".

## Quando o Claude Code costuma usar este termo
- design de dados/flags;
- regras que não devem aplicar por omissão.

## Exemplo real de uso
- Original: "The modifier table is opt-in: no row means PER_PROCEDURE default."
- Tradução: "A tabela de modificadores é opt-in: sem linha, vale o default PER_PROCEDURE."

## Aplicação no Synvera
Códigos sem linha em `cbhpm_code_modifiers` herdam o comportamento padrão; nenhum código neuro
precisa de linha.

## Leituras relacionadas
Ver também: [Feature Gate](#feature-gate) · [Domain Gating](#domain-gating)

---

# Parity

## Tradução
Paridade.

## Definição
Dois caminhos/implementações produzirem **resultados idênticos** (ex.: `FileRepository` vs
`PostgresRepository`, ou comportamento antes/depois de uma mudança).

## Quando o Claude Code costuma usar este termo
- refatorações;
- dev vs produção;
- testes de regressão.

## Exemplo real de uso
- Original: "Both repositories read the same JSON, so dev/prod parity is structural."
- Tradução: "Ambos os repositórios leem o mesmo JSON, então a paridade dev/produção é estrutural."

## Aplicação no Synvera
`FileRepository` e `PostgresRepository` devem reportar os mesmos modificadores e portes — daí a
fonte única e os testes de paridade.

## Leituras relacionadas
Ver também: [Golden Test](#golden-test) · [Drift](#drift) · [Source of Truth](#source-of-truth)

---

# Pipeline

## Tradução
Pipeline / esteira de processamento.

## Definição
Uma sequência de passos onde a saída de um alimenta o próximo (ex.: parse → JSON → merge →
seed → migração).

## Quando o Claude Code costuma usar este termo
- ETL e ingestão de dados;
- geração de artefatos;
- CI.

## Exemplo real de uso
- Original: "The spine import pipeline: parse → spine_procedures.json → merge → procedures.json → seed."
- Tradução: "O pipeline de import da coluna: parse → spine_procedures.json → merge → procedures.json → seed."

## Aplicação no Synvera
`data/parse_spine_manual.py → merge_spine_into_catalog.py → generate_seed.py → migração 003`;
e o novo `generate_code_modifiers_seed.py` para os modificadores.

## Leituras relacionadas
Ver também: [Seed](#seed) · [Idempotent](#idempotent) · [Source of Truth](#source-of-truth)

---

# Provenance

## Tradução
Proveniência / origem.

## Definição
O registro de **de onde um fato veio** — documento, página, trecho, edição. Permite distinguir
o que é norma do que é suposição.

## Quando o Claude Code costuma usar este termo
- auditorias normativas;
- seeds clínicos;
- dados que precisam ser defensáveis.

## Exemplo real de uso
- Original: "Each modifier row records source_document, page and verbatim excerpt for provenance."
- Tradução: "Cada linha de modificador registra documento, página e trecho verbatim para a proveniência."

## Aplicação no Synvera
`cbhpm_code_modifiers` e `sbn_procedures.source_document/version` carregam proveniência; regras
sem fonte não são semeadas como norma.

## Leituras relacionadas
Ver também: [Audit Trail](#audit-trail) · [Traceability](#traceability) · [Verbatim](#verbatim) · [Source-derived](#source-derived)

---

# Pure Function

## Tradução
Função pura.

## Definição
Função cujo resultado depende **só dos argumentos**, sem efeitos colaterais nem estado externo.
Fácil de testar e raciocinar.

## Quando o Claude Code costuma usar este termo
- design do motor de cálculo;
- testabilidade;
- programação funcional em Go.

## Exemplo real de uso
- Original: "resolveCodeRules is a pure function — same code + modifiers always yield the same rule."
- Tradução: "resolveCodeRules é uma função pura — mesmo código + modificadores sempre geram a mesma regra."

## Aplicação no Synvera
O motor (`service.calculate`) é essencialmente puro: recebe inputs + portes + modificadores e
retorna o resultado, sem I/O.

## Leituras relacionadas
Ver também: [Deterministic](#deterministic) · [Idempotent](#idempotent) · [Golden Test](#golden-test)

---

# Regression

## Tradução
Regressão.

## Definição
Quando algo que **funcionava passa a falhar** após uma mudança. Um "regression test" existe
para detectar isso cedo.

## Quando o Claude Code costuma usar este termo
- após refatorações;
- ao ativar funcionalidades;
- ao validar não-mudança de comportamento.

## Exemplo real de uso
- Original: "Removing the laterality selector would be a regression — it still feeds the payload."
- Tradução: "Remover o seletor de lateralidade seria uma regressão — ele ainda alimenta o payload."

## Aplicação no Synvera
A cada estágio (N0–N5), `go test ./...` precisa ficar verde para garantir ausência de
regressão; o caminho legado do motor é preservado.

## Leituras relacionadas
Ver também: [Golden Test](#golden-test) · [Parity](#parity) · [Backward Compatibility](#backward-compatibility)

---

# Replay

## Tradução
Reexecução / "replay".

## Definição
Recalcular um resultado a partir dos **inputs preservados**, obtendo o mesmo valor — por
snapshot (rejogar o resultado guardado) ou por re-derivação (rodar de novo as regras da época).

## Quando o Claude Code costuma usar este termo
- auditabilidade;
- versionamento de regras/tarifas;
- conformidade.

## Exemplo real de uso
- Original: "Replay relies on the stored breakdown now; rule versioning enables re-derivation later."
- Tradução: "O replay depende hoje do breakdown guardado; o versionamento de regras habilitará a re-derivação depois."

## Aplicação no Synvera
Cálculos guardam inputs + `cbhpm_version_id` + breakdown, permitindo replay determinístico
(ADR-001/ADR-004).

## Leituras relacionadas
Ver também: [Deterministic](#deterministic) · [Immutable Snapshot](#immutable-snapshot) · [Audit Trail](#audit-trail)

---

# Ripple Effect

## Tradução
Efeito cascata / efeito dominó ("ripple" = ondulação).

## Definição
Quando uma mudança pequena **dispara mudanças em outros lugares** que dependiam do estado
anterior.

## Quando o Claude Code costuma usar este termo
- regeneração de código;
- mudanças de tipo/contrato;
- refatorações.

## Exemplo real de uso
- Original: "The enum addition caused a ripple: every test using the old const name broke."
- Tradução: "A adição do enum causou um efeito cascata: todo teste que usava o nome antigo do const quebrou."

## Aplicação no Synvera
Adicionar `NormativeBillingMode` ao OpenAPI gerou ripple nos nomes de consts; contido aos
arquivos de teste, sem afetar produção.

## Leituras relacionadas
Ver também: [Blast Radius](#blast-radius) · [Breaking Change](#breaking-change) · [Surface Area](#surface-area)

---

# Rollback

## Tradução
Reversão / desfazer.

## Definição
Voltar uma mudança ao estado anterior de forma **segura**, sem perda de dados. Uma migração
boa tem rollback claro.

## Quando o Claude Code costuma usar este termo
- migrations;
- deploys;
- análise de risco.

## Exemplo real de uso
- Original: "The table is additive; rollback is a DROP TABLE with no loss of calculation data."
- Tradução: "A tabela é aditiva; o rollback é um DROP TABLE sem perda de dados de cálculo."

## Aplicação no Synvera
As migrações de modificadores são aditivas e reversíveis; nenhuma FK aponta para a nova tabela.

## Leituras relacionadas
Ver também: [Migration](#migration) · [Blast Radius](#blast-radius) · [Staged Rollout](#staged-rollout)

---

# Scaffold

## Tradução
Andaime / estrutura inicial.

## Definição
A estrutura mínima posta no lugar **antes** de a funcionalidade ficar completa — pronta para
ser preenchida depois. Verbo: "scaffold" (montar o andaime).

## Quando o Claude Code costuma usar este termo
- rollouts faseados;
- preparação de UI/infra;
- pontos de extensão.

## Exemplo real de uso
- Original: "N4-UI is contextual scaffolding: the controls render correctly but stay inert until N5."
- Tradução: "O N4-UI é um andaime contextual: os controles renderizam certo, mas ficam inertes até o N5."

## Aplicação no Synvera
A UI contextual de coluna foi montada como andaime informativo antes da ativação do cálculo.

## Leituras relacionadas
Ver também: [Stub](#stub) · [Staged Rollout](#staged-rollout) · [Feature Gate](#feature-gate)

---

# Seed

## Tradução
Semente / carga inicial de dados.

## Definição
Dados iniciais inseridos no banco por migração/script — "semear" (seed) a tabela com seu
conteúdo de referência.

## Quando o Claude Code costuma usar este termo
- popular catálogos/regras;
- dados de referência;
- ambientes de dev/produção.

## Exemplo real de uso
- Original: "Only CONFIRMED rules are seeded, each with verbatim provenance."
- Tradução: "Apenas regras CONFIRMED são semeadas, cada uma com proveniência verbatim."

## Aplicação no Synvera
A migração 028 semeia `cbhpm_code_modifiers` a partir de `code_modifiers.json`.

## Leituras relacionadas
Ver também: [Migration](#migration) · [Idempotent](#idempotent) · [Source of Truth](#source-of-truth) · [Pipeline](#pipeline)

---

# Snapshot

## Tradução
Snapshot / instantâneo.

## Definição
Uma cópia do estado **num momento específico**. Quando guardada para não mudar, é um
[Immutable Snapshot](#immutable-snapshot).

## Quando o Claude Code costuma usar este termo
- persistência de resultados;
- versionamento;
- auditoria.

## Exemplo real de uso
- Original: "The porte snapshot is resolved from the active version at calculation time."
- Tradução: "O snapshot de portes é resolvido a partir da versão ativa no momento do cálculo."

## Aplicação no Synvera
`GetPorteValues` devolve um snapshot porte→valor; o breakdown salvo é o snapshot do resultado.

## Leituras relacionadas
Ver também: [Immutable Snapshot](#immutable-snapshot) · [Replay](#replay)

---

# Source of Truth

## Tradução
Fonte de verdade (frequentemente "fonte única de verdade").

## Definição
O **único** lugar canônico onde um fato vive; todos os outros derivam dele. Evita divergência
([Drift](#drift)).

## Quando o Claude Code costuma usar este termo
- modelagem de dados;
- geração de artefatos;
- decisões de billing/estado.

## Exemplo real de uso
- Original: "plan_type/subscription_status are the source of truth for billing tier."
- Tradução: "plan_type/subscription_status são a fonte de verdade do nível de cobrança."

## Aplicação no Synvera
`code_modifiers.json` é a fonte única dos modificadores (alimenta seed + `FileRepository`);
migrations são a fonte do schema.

## Leituras relacionadas
Ver também: [Source-derived](#source-derived) · [Drift](#drift) · [Authoritative Source](#authoritative-source) · [Canonical Payload](#canonical-payload)

---

# Source-derived

## Tradução
Derivado da fonte.

## Definição
Um dado/regra que pode ser **rastreado e justificado por uma fonte autoritativa** — o oposto de
suposição ou de algo "chumbado" sem origem.

## Quando o Claude Code costuma usar este termo
- auditorias normativas;
- distinção entre norma e hipótese.

## Exemplo real de uso
- Original: "Without a manual citation, the rule is not source-derived — label it a clinical assertion."
- Tradução: "Sem citação do manual, a regra não é derivada da fonte — rotule como asserção clínica."

## Aplicação no Synvera
Antes de semear, exigimos que cada regra fosse source-derived (página + trecho do Manual);
seções do prompt sem base foram rejeitadas como norma.

## Leituras relacionadas
Ver também: [Provenance](#provenance) · [Authoritative Source](#authoritative-source) · [Hardcoded](#hardcoded)

---

# Staged Rollout

## Tradução
Implantação faseada / lançamento em estágios.

## Definição
Entregar uma mudança em **etapas pequenas e verificáveis**, cada uma segura por si, em vez de
um "big bang". Permite parar/ajustar entre etapas.

## Quando o Claude Code costuma usar este termo
- mudanças grandes e sensíveis;
- planejamento;
- redução de risco.

## Exemplo real de uso
- Original: "We split the work into a staged rollout N0–N5, each ending green."
- Tradução: "Dividimos o trabalho num rollout faseado N0–N5, cada um terminando verde."

## Aplicação no Synvera
A infraestrutura normativa entrou em estágios: correções → tabela → seed → read path → API →
UI → ativação (N0–N5), só mudando valores no N5.

## Leituras relacionadas
Ver também: [Feature Gate](#feature-gate) · [Scaffold](#scaffold) · [Rollback](#rollback) · [Blast Radius](#blast-radius)

---

# Stub

## Tradução
Stub / implementação mínima de marcação.

## Definição
Uma implementação **vazia ou mínima** que satisfaz um contrato/interface sem fazer o trabalho
real ainda.

## Quando o Claude Code costuma usar este termo
- satisfazer interfaces em dev/test;
- pontos de extensão futuros.

## Exemplo real de uso
- Original: "FileRepository.SearchDocuments is a stub returning an empty slice for test contexts."
- Tradução: "FileRepository.SearchDocuments é um stub que retorna uma lista vazia para contextos de teste."

## Aplicação no Synvera
Vários métodos do `FileRepository` são stubs para satisfazer a interface `Repository` sem um
Postgres real.

## Leituras relacionadas
Ver também: [Scaffold](#scaffold) · [Contract](#contract)

---

# Surface Area

## Tradução
Superfície (de exposição / de mudança).

## Definição
Quanto de um sistema **fica exposto a mudança ou a erro** numa alteração — quanto mais
arquivos/contratos/comportamentos tocados, maior a superfície.

## Quando o Claude Code costuma usar este termo
- escopo de refatoração;
- análise de risco;
- decisões de design.

## Exemplo real de uso
- Original: "Passing modifiers into the engine keeps the change surface small — SelectedCode is untouched."
- Tradução: "Passar os modificadores para dentro do motor mantém pequena a superfície de mudança — SelectedCode fica intocado."

## Aplicação no Synvera
Decisões de N5 priorizaram mínima superfície: um novo entry point no motor em vez de mexer no
modelo persistido.

## Leituras relacionadas
Ver também: [Blast Radius](#blast-radius) · [Ripple Effect](#ripple-effect)

---

# Traceability

## Tradução
Rastreabilidade.

## Definição
Capacidade de **ligar cada regra/decisão à sua fonte e à sua implementação** — de ponta a
ponta (norma → dado → código → teste).

## Quando o Claude Code costuma usar este termo
- auditorias normativas;
- matrizes de rastreabilidade;
- conformidade.

## Exemplo real de uso
- Original: "The traceability matrix maps each rule to document, page, excerpt and implementation status."
- Tradução: "A matriz de rastreabilidade liga cada regra a documento, página, trecho e status de implementação."

## Aplicação no Synvera
`docs/audits/spine-rules-traceability.md` e `cbhpm-code-modifiers-matrix.md` dão rastreabilidade
das regras de coluna.

## Leituras relacionadas
Ver também: [Provenance](#provenance) · [Audit Trail](#audit-trail) · [Confidence Level](#confidence-level)

---

# Verbatim

## Tradução
Literal / ao pé da letra ("verbatim").

## Definição
Reproduzido **palavra por palavra**, sem paráfrase — essencial quando o texto exato da fonte é
a evidência.

## Quando o Claude Code costuma usar este termo
- citações de manuais;
- evidência de auditoria;
- proveniência.

## Exemplo real de uso
- Original: "Store the verbatim excerpt so the rule can be defended later."
- Tradução: "Guarde o trecho verbatim para que a regra possa ser defendida depois."

## Aplicação no Synvera
`source_excerpt` em `cbhpm_code_modifiers` guarda o trecho verbatim do Manual de Coluna.

## Leituras relacionadas
Ver também: [Provenance](#provenance) · [Audit Trail](#audit-trail) · [Source-derived](#source-derived)
