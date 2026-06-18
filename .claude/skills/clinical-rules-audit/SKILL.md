# Clinical Rules Audit

## Purpose

This skill is responsible for auditing, validating, debugging, and tracing medical calculation rules implemented inside Synvera.

Its primary purpose is to prevent situations where:

* UI state changes correctly
* Checkboxes and selectors work correctly
* Payloads are generated correctly
* But the final calculation is wrong

This skill assumes that calculation correctness is more important than implementation correctness.

---

# Domain Authorities

The following sources are considered authoritative:

1. CBHPM
2. SBN Procedure Catalog
3. Spine Surgery Coding Guidelines (SBC/SBOT/SBN)
4. Official Synvera Business Rules
5. Source PDFs provided by the customer

If implementation and source documents disagree:

ASSUME THE IMPLEMENTATION IS WRONG UNTIL PROVEN OTHERWISE.

---

# Core Principle

Never start by changing code.

First determine:

1. What should happen.
2. What is actually happening.
3. Where the divergence begins.

Only then modify code.

---

# Mandatory Investigation Flow

Every investigation must follow this sequence.

## Step 1 — Define Expected Behavior

Document:

* selected procedure
* selected modifiers
* expected multipliers
* expected fees
* expected final amount

Example:

Procedure:
Microdiscectomy

Adjustments:

* Emergency +30%
* Pediatric +30%

Expected:
Base amount × 1.60

---

## Step 2 — Trace User Input

Identify:

* UI component
* React state
* Form payload
* API request

Verify each layer.

Do not assume data is flowing correctly.

---

## Step 3 — Trace Calculation Pipeline

Map:

UI
→ state
→ payload
→ API
→ calculation engine
→ response
→ rendering

Identify where the value disappears.

---

## Step 4 — Produce Evidence

Show:

* console logs
* payloads
* calculation objects
* intermediate values

Never conclude without evidence.

---

## Step 5 — Validate Result

Demonstrate:

Base Value

* Modifier A
* Modifier B
* Modifier C

=

Final Value

The calculation must be reproducible.

---

# Spine Surgery Rules

Whenever the procedure belongs to spinal surgery:

* degenerative disease
* trauma
* tumors
* deformities
* infections
* endoscopy
* pain procedures
* vertebral procedures
* arthrodesis
* laminectomy
* discectomy
* spinal decompression

the implementation MUST be validated against the Spine Surgery Guidelines.

---

# Spine-Specific Validation

Determine whether the procedure is charged:

* per segment
* per vertebra
* per anatomical structure
* once per surgery

Never assume.

Always verify.

---

# Anti-Hallucination Rules

Forbidden conclusions:

"The calculation seems correct."

"It should be working."

"The state appears valid."

Allowed conclusions:

"The payload contains X."

"The API received Y."

"The calculation returned Z."

"The expected value is A."

"The actual value is B."

---

# Final Deliverable

Every audit must finish with:

1. Root Cause
2. Evidence
3. Affected Files
4. Proposed Fix
5. Validation Procedure

No exceptions.
