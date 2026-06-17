# Examples

## Example 1 — Emergency Modifier Not Applied

Problem:

User selects:

Emergency +30%

Expected:

Base value:
10,000

Final:
13,000

Observed:

10,000

Investigation:

Step 1:
UI state changes correctly.

Step 2:
Payload contains:

["emergency_special_hours"]

Step 3:
API receives:

[]

Root Cause:

Adjustment lost during payload construction.

Fix:

Correct adjustment mapping.

---

## Example 2 — Pediatric Modifier Not Applied

Problem:

User selects:

Pediatric 24 months–12 years

Expected:

+30%

Observed:

No increase.

Investigation:

State updated.

Payload generated.

API receives adjustment.

Calculation engine ignores adjustment code.

Root Cause:

Missing pediatric rule in calculation engine.

Fix:

Add pediatric adjustment mapping.

---

## Example 3 — Wrong Spine Surgery Multiplier

Procedure:

Lumbar arthrodesis

Expected:

Charged per segment.

Observed:

Charged once.

Investigation:

Spine guideline specifies per-segment billing.

Implementation treated procedure as single-instance.

Root Cause:

Incorrect billing model.

Fix:

Apply segment multiplier.

---

## Example 4 — UI Appears Correct But Calculation Is Wrong

Observed:

Checkbox active.

Payload valid.

Calculation unchanged.

Lesson:

Never trust UI.

Always trace:

UI
→ State
→ Payload
→ API
→ Calculation Engine
→ Response

until evidence identifies the failure point.

This is the preferred debugging methodology for Afere.
