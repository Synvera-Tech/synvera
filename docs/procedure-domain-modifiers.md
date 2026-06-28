# Procedure Domain Modifiers

Como a Procedure Page e o motor de cálculo adaptam **seletores e regras ao domínio** do
procedimento (Neurocirurgia/SBN vs Cirurgia de Coluna) e ao código CBHPM específico.

Referências: [ADR-005](architecture/ADR-005-normative-modifier-table.md) ·
[normative-engine-roadmap.md](architecture/normative-engine-roadmap.md) ·
[audits/spine-rules-traceability.md](audits/spine-rules-traceability.md) ·
[audits/cbhpm-code-modifiers-matrix.md](audits/cbhpm-code-modifiers-matrix.md) ·
[spine-variants-and-rules.md](spine-variants-and-rules.md).

## Domínios

Há dois domínios operacionais, discriminados por `specialty`:

- **NEUROSURGERY** — Manual SBN.
- **SPINE** — Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral (3ª ed. 2025).

`ProcedureDetail.domain` é derivado da proveniência do procedimento (manual de origem) e exposto
na API. Ambos os domínios alimentam o **mesmo** motor de cálculo.

## Categorias de seletores

### A. Universais (os dois domínios)
- urgência/emergência (+30%, CBHPM item 2.1);
- pediatria (+100/50/30%, CBHPM 4.6–4.8);
- auxiliares (60/40/30/30%, CBHPM 5.1; nº pelo maior porte, 5.2);
- anestesiologista (contexto geral).

Esses controles **não** desaparecem em procedimentos de coluna nem são exclusivos de coluna.

### B. Específicos da Neurocirurgia (SBN)
Aparecem apenas para procedimentos `NEUROSURGERY`. Não há, no Manual SBN, modificadores
por-código equivalentes às listas da coluna; o default é `PER_PROCEDURE` com via CBHPM 4.1/4.2.

### C. Específicos da Cirurgia de Coluna (SPINE)
Aparecem apenas para procedimentos `SPINE` e **apenas quando o código os suporta**:
- quantidade por **segmento** / **vértebra** / **estrutura** (×N);
- costectomia: 1ª estrutura 100% + 30%/adicional;
- código endoscópico cobrado uma única vez;
- etapas complementares (enxerto, fístula) cobradas uma vez;
- regra de lateralidade própria (bilateral não duplica no mesmo segmento);
- via de acesso de coluna (adicionais a 50%, inclusive 360°).

Ver a tabela código→regra em [spine-variants-and-rules.md](spine-variants-and-rules.md).

## Renderização contextual

```
seleciona procedimento
→ GET /api/procedures/{id} retorna domain + cbhpm_codes[].modifier
→ renderiza seletores universais (sempre)
→ se domain = SPINE: para cada código com modifier, renderiza o controle aplicável
  (seletor de quantidade para PER_SEGMENT/VERTEBRA/STRUCTURE/STRUCTURE_DECREMENT;
   linha informativa para PER_PROCEDURE)
→ NÃO renderiza controles de coluna em procedimentos SBN
→ NÃO renderiza um controle quando o código não o suporta
```

O componente que faz isso é `frontend/components/procedure/SpineVariablesPanel.tsx`. A presença
de `modifier` no código (anexado pelo backend só para domínio SPINE) é o próprio sinal de domínio —
não há campos mortos genéricos.

## Backend como fonte de verdade

O motor de cálculo **não confia no frontend** para a regra. O handler de `POST /api/calculate`
resolve cada código contra `cbhpm_code_modifiers` (via `repository.GetCodeModifiers`) e
**sobrescreve** o `billing_mode`/via/lateralidade antes de valorizar
(`service.CalculateWithPortesAndModifiers`). O frontend envia apenas a **quantidade por código**
(`quantity_selected`); qual regra aplicar é decidido pelo backend.

Gating de domínio: um modificador SPINE só é aplicado quando `specialty == SPINE`. O mesmo código
CBHPM (ex.: laminectomia 3.07.15.19-9) em um procedimento neuro **não** recebe a regra de coluna.

## Persistência e auditoria

`selected_codes` (composições e cálculos) preserva `quantity_selected` **por código**; a
quantidade é restaurada por código ao recarregar uma composição e codificada por código na URL de
compartilhamento. O `calculation_breakdown` guarda o multiplicador efetivo por código.

## LLM / RAG não calcula

A camada de Busca Documental (RAG v0) é **somente leitura** e **nunca** influencia honorários. O
motor de valoração determinístico é a **única autoridade numérica**. Modificadores normativos vêm
de `cbhpm_code_modifiers` (semeada a partir dos manuais, com proveniência), não de IA.
