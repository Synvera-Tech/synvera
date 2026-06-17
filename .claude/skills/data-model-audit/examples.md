# Examples

## Example 1 — SBN → CBHPM Relationship

Original Assumption:

# 1 SBN

1 CBHPM

Observed:

Many SBN procedures reference multiple CBHPM codes.

Investigation:

Business Rule:

One composition contains multiple CBHPM procedures.

Current Schema:

sbn_procedure
→ cbhpm_code_id

Cardinality:

Incorrect.

Root Cause:

Schema implemented as 1:1.

Fix:

Introduce composition table.

Relationship:

SBN 1:N Composition Items.

---

## Example 2 — Missing Foreign Key

Observed:

Calculations reference non-existent procedures.

Investigation:

No foreign key constraint exists.

Root Cause:

Database allows orphan records.

Fix:

Create FK constraint.

Validate existing data.

---

## Example 3 — Incorrect SQLC Model

Observed:

Generated struct exposes single CBHPM code.

Business Rule:

Procedure contains many CBHPM codes.

Root Cause:

Query written for singular relationship.

Fix:

Rewrite query and regenerate SQLC code.

---

## Example 4 — Migration Risk

Proposed Change:

Add NOT NULL constraint.

Investigation:

Production contains 4,000 NULL records.

Root Cause:

Migration would fail.

Fix:

Backfill data before applying constraint.

Then migrate.

---

## Example 5 — Synvera Calculation Composition

Business Rule:

Procedure:
Tumor surgery

Composition:

* Main procedure
* Reconstruction
* Temporal bone resection
* Fistula treatment

Observed:

Only main procedure loaded.

Investigation:

Join missing composition table.

Root Cause:

Query retrieves only primary code.

Fix:

Load composition items through relationship table.

Validate totals against CBHPM documentation.
