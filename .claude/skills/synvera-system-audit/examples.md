# Examples

## Example 1 — Pediatric fee not applied

User says:

"Pediatric fee is selected but total does not change."

Classification:

Calculation issue + Clinical/domain rule issue.

Primary skill:

calculation-audit

Secondary skills:

clinical-rules-audit
investigative-debug

Investigation order:

1. Verify pediatric rule.
2. Inspect UI state.
3. Inspect payload.
4. Inspect Network request.
5. Inspect backend request struct.
6. Inspect calculation engine.
7. Inspect response.
8. Inspect UI rendering.

Do not change code before proving where the fee disappears.

---

## Example 2 — Horizontal scroll on Home

Classification:

UI issue.

Primary skill:

ui-investigation

Secondary skill:

investigative-debug

Investigation order:

1. Inspect DOM.
2. Identify overflowing element.
3. Inspect width, transform, absolute elements, pseudo-elements.
4. Prove culprit.
5. Fix real cause.

Do not apply overflow-x:hidden as first solution.

---

## Example 3 — SBN procedure missing CBHPM items

Classification:

Data model issue + Calculation issue.

Primary skill:

data-model-audit

Secondary skills:

calculation-audit
clinical-rules-audit

Investigation order:

1. Confirm domain relationship.
2. Verify SBN → CBHPM cardinality.
3. Inspect schema.
4. Inspect queries.
5. Inspect SQLC structs.
6. Validate calculation result.

Do not assume 1:1 cardinality.

---

## Example 4 — Deploy looks different from local

Classification:

Release/deployment issue.

Primary skill:

release-readiness

Secondary skill:

investigative-debug

Investigation order:

1. Confirm branch.
2. Confirm deployment promoted to production.
3. Confirm env vars.
4. Confirm build output.
5. Inspect logs.
6. Compare local vs production commit SHA.