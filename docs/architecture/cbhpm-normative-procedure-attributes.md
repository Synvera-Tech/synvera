# Atributos normativos do procedimento CBHPM

## Princípio

`porte`, `anesthetic_port` (porte anestésico), `num_auxiliaries` e
`operational_cost` (quando aplicável) pertencem à definição oficial do
procedimento. O frontend pode exibi-los, mas não pode criá-los, recalculá-los ou
editá-los. O backend é a autoridade de cálculo e deve resolver esses atributos
do catálogo normativo.

Uma ausência real de dado obrigatório interrompe o cálculo. O valor
`num_auxiliaries = 0` é uma regra presente, não um dado ausente.

## Mapa atual

| Atributo | Extração e fonte | Persistência | API | Consumo pela engine | Situação |
| --- | --- | --- | --- | --- | --- |
| `porte` | Catálogo gerado dos manuais SBN/CBHPM | `sbn_cbhpm_mappings.porte_code`; JSON embarcado | Exposto em `CBHPMCodeEntry`; o valor legado em `SelectedCode` é ignorado para a resolução normativa | `GetProcedureDefinitions()` resolve pelo contexto ordenado dos procedimentos; seleção do principal e valoração usam esse valor | Autoridade no backend implementada; portes contextuais são desambiguados por `selected_procedure_ids` |
| `anesthetic_port` | `data/parse_cbhpm_anesthetic_portes.py`, CBHPM 2022 p.139–140 | `cbhpm_codes.anesthetic_porte`; `anesthetic_portes.json` | Não é entrada confiável | `GetAnestheticPortes()` e engine | Autoridade no backend e versionamento documental presente no pipeline; a tabela ainda não referencia diretamente `cbhpm_versions` |
| `num_auxiliaries` | Extraído/importado da coluna N_AUX da CBHPM | `cbhpm_codes.num_auxiliaries`; `procedures.json` | Exposto como leitura no catálogo; `CalculateRequest.auxiliaries_count` é legado, deprecated e ignorado | `GetProcedureDefinitions()` → procedimento de maior porte → percentuais 60/40/30/30 | Autoridade no backend implementada nesta mudança |
| `operational_cost` | Sem estrutura canônica completa identificada | Não há campo uniforme consumido pela engine | Não há contrato canônico | Não consumido de forma uniforme | Lacuna documentada; não foi inventado fallback nesta tarefa |

Os modificadores de quantidade/lateralidade vivem em
`cbhpm_code_modifiers`/`code_modifiers.json`, com proveniência própria, e não
substituem os quatro atributos acima.

## Regra de auxiliares

O fluxo canônico é:

1. receber os códigos selecionados e modificadores clínicos/operacionais;
2. buscar `num_auxiliaries` de cada código no repositório CBHPM;
3. validar presença e faixa de 0 a 4;
4. ordenar conceitualmente pela hierarquia de porte CBHPM (`1A` … `14C`);
5. escolher o primeiro código de maior porte, preservando a ordem de seleção em empate;
6. usar somente o `num_auxiliaries` desse procedimento;
7. calcular 60%, 40%, 30% e 30% sobre o total do cirurgião;
8. gravar procedimento principal, contagem, fonte e valores individuais no snapshot.

Nunca se aplica `max(num_auxiliaries)` entre códigos. O campo legado
`CalculateRequest.auxiliaries_count` não altera o resultado.

## Versionamento e auditabilidade

Os valores de porte monetário são resolvidos por `cbhpm_versions` e
`porte_values`. O snapshot de cálculo registra a resposta integral, incluindo:

- código, descrição e porte do procedimento principal;
- `num_auxiliaries`;
- documento e versão da regra (`CBHPM 2022`);
- regra de seleção do principal;
- percentuais e valores individuais dos auxiliares;
- total dos auxiliares.

Novas edições normativas devem ser importadas como nova versão e validadas antes
de ativação. Dados históricos não devem ser sobrescritos silenciosamente; o
snapshot preserva a decisão usada no momento do cálculo.

## Uso pelo frontend

O frontend envia IDs ordenados dos procedimentos, códigos e modificadores necessários, não envia
`auxiliaries_count` no payload canônico de cálculo e lê
`principal_procedure.num_auxiliaries` da resposta. A interface mostra um card
somente informativo, inclusive para zero, com estados explícitos de carregamento
e erro. Não existe seletor ou fallback manual.

Composições e cálculos antigos ainda podem conter `auxiliaries_count` como dado
legado de persistência. Na recomposição, esse valor não é autoridade: uma nova
valoração volta a consultar o catálogo.

## Incorporação de novas versões

1. guardar o documento-fonte e sua versão sem alterar artefatos históricos;
2. executar os parsers e geradores reproduzíveis do diretório `data/`;
3. validar cobertura, faixa e proveniência de todos os atributos obrigatórios;
4. criar/ativar a versão normativa correspondente;
5. regenerar artefatos e contratos derivados;
6. executar testes de engine, endpoint, persistência e UI;
7. auditar amostras contra página/trecho da fonte.

## Lacunas restantes

- A definição canônica ainda está distribuída entre `cbhpm_codes`,
  `sbn_cbhpm_mappings`, tabelas versionadas e arquivos JSON; ainda não existe um
  único `CBHPMProcedureDefinition` com todos os atributos e proveniência.
- O wire format legado ainda transporta `porte` e descrição dentro de
  `SelectedCode` para compatibilidade com composições antigas, mas o handler
  substitui ambos pela definição do catálogo antes da engine. Uma evolução
  futura pode removê-los do request após a janela de compatibilidade.
- `num_auxiliaries` foi criado historicamente como `NOT NULL DEFAULT 0`; assim,
  bancos antigos não distinguem um zero comprovado de um zero preenchido pelo
  default. A ingestão deve ganhar proveniência por linha antes de remover essa
  ambiguidade, sem migration especulativa nesta tarefa.
- Porte anestésico e número de auxiliares têm fonte conhecida, mas ainda não
  possuem vínculo uniforme por linha com `cbhpm_versions`.
- Custo operacional não possui modelagem canônica completa. Nenhum valor foi
  inferido ou preenchido arbitrariamente.
