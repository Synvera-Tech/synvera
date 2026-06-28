# Matriz de Modificadores — Anestesiologia

**Data:** 2026-06-28
**Natureza:** Artefato de engenharia. Classificação dos elementos de cálculo da Anestesiologia.
**Fonte:** CBHPM 2022 (Instruções Gerais Específicas para a Anestesiologia, p.139–140; correlatas
p.141, p.155; gerais p.22–23). Ver [anesthesiology-rules-traceability.md](anesthesiology-rules-traceability.md) (A#).

## Convenção de Tipo

- **USER_SELECTABLE** — escolhido pelo usuário na UI.
- **DERIVED** — derivado automaticamente do procedimento/catálogo/tabelas.
- **ENGINE_ONLY** — lógica interna do motor (ordem, degressividade, arredondamento, validação).

`Implementado`: ✅ sim · ⚠️ parcial/divergente · ❌ não.

---

## Matriz

| Modificador | Tipo | Origem | Página | Implementado | Observações |
|---|---|---|---|---|---|
| Participação do anestesiologista (presença × porte 0) | USER_SELECTABLE | CBHPM A4 | 139 | ⚠️ | Hoje é o toggle `requires_anesthesia`; norma: AN0 = não participação ⇒ sem honorário. |
| Urgência/emergência (+30%) | USER_SELECTABLE | CBHPM A15/A16 | 22, 155 | ⚠️ | Percentual e incidência corretos; aplicado sobre base fixa (incorreta). |
| Pediatria ≤12 a (+30%) | USER_SELECTABLE | CBHPM A14 | 140, 155 | ⚠️ | Restrito aos códigos 3.16.02.23-1/24-0/27-4/28-2 e endoscopia; engine aplica pediatria geral. |
| Idoso ≥65 a (+30%) | USER_SELECTABLE | CBHPM A14/A17 | 140, 155 | ❌ | Mesmo escopo restrito do item 14; sem regra geral de idoso. |
| Auxiliar de anestesia (60%) | USER_SELECTABLE | CBHPM A9 | 140 | ❌ | Só AN7/AN8, CEC, neonato, gastroplastia, >6h. Não é contador livre. |
| Porte anestésico AN0–AN8 | DERIVED | CBHPM A3 | 139 | ❌ | Coluna "Porte Anest." por código — **não capturada** no catálogo. Pré-requisito de tudo. |
| Equivalência AN → porte cirúrgico (0=local;1=3A;…;8=12A) | DERIVED | CBHPM A3 | 139 | ❌ | Tabela oficial; base do valor monetário. |
| Valor monetário do ato anestésico | DERIVED | CBHPM A19 + tabela de portes | 139 | ⚠️ | Norma: valor do porte equivalente (tabela versionada). Engine: R$ 1.200 fixo. |
| Fallback PORTE 3 (ato sem porte previsto) | DERIVED | CBHPM A5 | 140 | ❌ | Código 3.16.02.34-7. |
| Seleção principal/adicional (múltiplos atos) | DERIVED | CBHPM A6/A7 | 140 | ❌ | Maior porte anestésico = principal. |
| Degressividade — mesma via/cavidade (50%) | ENGINE_ONLY | CBHPM A6 | 140 | ❌ | Adicionais a 50% do porte anestésico. |
| Degressividade — incisões/orifícios diferentes (70%) | ENGINE_ONLY | CBHPM A7 | 140 | ❌ | Adicionais a 70%. |
| Bilateral sem código específico (+70% do 1º ato) | ENGINE_ONLY | CBHPM A8 | 140 | ❌ | Acréscimo de 70% do porte do primeiro ato. |
| Ordem de aplicação / arredondamento / validações | ENGINE_ONLY | — (motor) | — | ⚠️ | Existe para o modelo atual (fixo); precisará refletir o modelo por porte. |
| AN0 ⇒ honorário de anestesia = 0 | ENGINE_ONLY | CBHPM A4 | 139 | ❌ | Guarda derivada do porte 0. |

---

## Notas de classificação

- **Não foram inventadas categorias** além de USER_SELECTABLE / DERIVED / ENGINE_ONLY.
- O **porte anestésico** é **DERIVED**, não selecionável: vem do procedimento (coluna "Porte Anest."),
  não é escolha do usuário. Hoje esse dado **não existe** no Synvera (bloqueio principal).
- As **degressividades** (50%/70%) são **ENGINE_ONLY** porque dependem da seleção principal/adicional e
  da via — derivadas e aplicadas pelo motor, não expostas como controle.
- **Urgência/pediatria/idoso/auxiliar** são **USER_SELECTABLE** (contexto do ato), mas a anestesia tem
  **escopo próprio** (idade nos códigos do item 14; auxiliar só em AN7/AN8/CEC/…), diferente dos
  ajustes gerais já existentes.

## Próximo passo

Implementação **não** faz parte desta etapa. O sequenciamento seguro está na §6 de
[anesthesiology-rules-traceability.md](anesthesiology-rules-traceability.md). Pré-requisito absoluto:
**capturar o porte anestésico (AN0–8) por código** — sem esse dado, nenhum valor de anestesia é derivável.
