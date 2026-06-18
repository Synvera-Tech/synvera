# Spine Surgery Billing Variables - Implementation Summary

**Version:** v2.4.0  
**Date:** 2026-06-15  
**Scope:** Deterministic billing calculation for spine-specific procedures

---

## Overview

This document details the implementation of spine surgery billing variables in Synvera. The system now supports:

1. **Billing modes** — How procedure values scale with quantity
2. **Specialty classification** — NEUROSURGERY (default) or SPINE
3. **Quantity multipliers** — For procedures billed per segment/vertebra/structure
4. **Laterality multipliers** — For procedures billed unilaterally or bilaterally
5. **Metadata fields** — For audit trails and future use (no billing effect)

---

## Key Principle

**Only documented, explicit billing rules are implemented.** Undocumented percentages, inferred multipliers, and hypothetical cases are explicitly excluded.

---

## Database Schema

### Migration 013: Core Spine Billing Infrastructure

**New columns in `sbn_procedures`:**
```sql
billing_mode VARCHAR(20) DEFAULT 'PER_PROCEDURE'
specialty VARCHAR(20) DEFAULT 'NEUROSURGERY'
laterality_support BOOLEAN DEFAULT FALSE
```

**New tables:**
- `spine_procedure_metadata` — Optional metadata (vertebral region, approach, fusion status, etc.)
- `calculation_modifiers` — Persists modifiers for each saved calculation
- `composition_modifiers` — Persists modifiers in saved compositions

### Migration 014: Seed Spine Billing Modes

Populates billing modes and specialty for all procedures:
- **227 spine procedures** are classified as `SPECIALTY='SPINE'`
- **4 procedures** use `BILLING_MODE='PER_SEGMENT'`:
  - `4.08.13.36-3` — Infiltração foraminal/facetária
  - `3.14.03.33-6` — Denervação
  - `3.07.15.59-8` — Artroplastia discal
  - `2.01.03.14-0` — Bloqueio de nervo periférico
- **3 procedures** have `LATERALITY_SUPPORT=true`:
  - `4.08.13.36-3`
  - `3.14.03.33-6`
  - `2.01.03.14-0`

---

## Domain Model Changes

### New Enums

```go
type BillingMode string
const (
    BillingModeProcedure   = "PER_PROCEDURE"   // No quantity effect
    BillingModeSegment     = "PER_SEGMENT"     // Multiplied by segments
    BillingModeVertebra    = "PER_VERTEBRA"    // Multiplied by vertebrae
    BillingModeStructure   = "PER_STRUCTURE"   // Multiplied by structures
)

type Laterality string
const (
    LateralityUnilateral = "UNILATERAL"   // Multiplier: 1.0
    LateralityBilateral  = "BILATERAL"    // Multiplier: 2.0
)

type Specialty string
const (
    SpecialtyNeurosurgery = "NEUROSURGERY"
    SpecialtySpine        = "SPINE"
)
```

### Updated Models

**CBHPMCode** — Extended with:
```go
BillingMode       BillingMode
Specialty         Specialty
LateralitySupport bool
```

**SelectedCode** — Extended with:
```go
BillingMode        BillingMode   // Inherited from catalog
Specialty          Specialty     // Inherited from catalog
LateralitySupport  bool          // Inherited from catalog
QuantitySelected   int           // 1 (default) or specified value
Laterality         Laterality    // UNILATERAL (default) or BILATERAL
```

**CodeBreakdown** — Extended with:
```go
BillingMode          BillingMode
QuantitySelected     int
QuantityMultiplier   float64     // The multiplier applied
Laterality           Laterality
LateralityMultiplier float64     // 1.0 or 2.0
AdjustedValue        float64     // base × qty × laterality
```

**Composition** and **Calculation** — Extended with:
```go
Modifiers *CompositionModifiers // or *CalculationModifiers
```

---

## API Changes

### OpenAPI Spec Updates

New schemas:
- `BillingMode` — Enum for billing calculation mode
- `Laterality` — Enum for unilateral/bilateral
- `Specialty` — Enum for procedure domain
- `BillingModifiers` — Request/response object for modifiers

Updated schemas:
- `CBHPMCodeEntry` — Now includes billing_mode, specialty, laterality_support
- `SelectedCode` — Now includes modifiers fields
- `CodeBreakdown` — Now includes quantity and laterality details
- `CalculateRequest` — Now accepts optional `modifiers`
- `SaveCompositionRequest` — Now accepts optional `modifiers`
- `SaveCalculationRequest` — Now accepts optional `modifiers`
- `CompositionDetail` — Now includes `modifiers`
- `SavedCalculation` — Now includes `modifiers`

### Backward Compatibility

- All new fields have sensible defaults
- Existing code without modifiers continues to work unchanged
- `QuantitySelected` defaults to 1
- `Laterality` defaults to UNILATERAL
- Non-spine procedures show no quantity/laterality fields

---

## Calculation Logic

### Step 1: Resolve Porte Values & Apply Modifiers

For each selected code:
```
quantity_multiplier = calculateQuantityMultiplier(billing_mode, quantity)
laterality_multiplier = calculateLateralityMultiplier(laterality, support)
adjusted_value = base_value × quantity_multiplier × laterality_multiplier
```

### Step 2: Select Principal by Adjusted Value

The principal procedure is selected based on the **highest adjusted value** (after quantity and laterality), not the raw porte value. This is critical for multi-procedure discounting (CBHPM 4.1/4.2).

### Step 3: Apply CBHPM 4.1/4.2 Discounting

Additional procedures are discounted based on the adjusted values:
```
surgeon_total = principal_adjusted + (0.50 or 0.70) × Σ(additional_adjusted)
```

### Step 4: Apply Existing CBHPM Adjustments

Emergency, pediatric, and other percentage-based adjustments are applied **after** quantity and laterality:
```
final_value = (base + qty + laterality) × (1 + adjustments%)
```

### Multiplication Order

```
Base Value
    ↓
Quantity Multiplier (if applicable)
    ↓
Laterality Multiplier (if applicable)
    ↓
CBHPM 4.1/4.2 Access Route Discount
    ↓
CBHPM 2 Percentage Adjustments (emergency, pediatric, etc.)
    ↓
Final Value
```

---

## Example Calculations

### Example 1: PER_SEGMENT with 2 Segments

**Procedure:** Infiltração foraminal (4.08.13.36-3)
- Porte: 7A (858.03 BRL)
- Billing Mode: PER_SEGMENT
- Quantity: 2 segments
- Laterality: UNILATERAL

**Calculation:**
```
Adjusted Value = 858.03 × 2 × 1 = 1,716.06 BRL
Final Value (single code) = 1,716.06 BRL
```

### Example 2: BILATERAL Infiltration

**Procedure:** Infiltração foraminal (4.08.13.36-3)
- Porte: 7A (858.03 BRL)
- Billing Mode: PER_PROCEDURE
- Quantity: 1 (N/A)
- Laterality: BILATERAL (both sides)

**Calculation:**
```
Adjusted Value = 858.03 × 1 × 2 = 1,716.06 BRL
Final Value (single code) = 1,716.06 BRL
```

### Example 3: PER_SEGMENT + BILATERAL + Emergency Adjustment

**Procedure:** Infiltração foraminal (4.08.13.36-3)
- Porte: 7A (858.03 BRL)
- Billing Mode: PER_SEGMENT
- Quantity: 2 segments
- Laterality: BILATERAL
- Emergency adjustment: +30%

**Calculation:**
```
Adjusted Value = 858.03 × 2 × 2 = 3,432.12 BRL
With Emergency (+30%): 3,432.12 × 1.30 = 4,461.76 BRL
Final Value (single code) = 4,461.76 BRL
```

### Example 4: Multi-Procedure (CBHPM 4.1)

**Procedure 1:** Infiltração (4.08.13.36-3), Porte 7A, Quantity 2, Unilateral
- Adjusted Value: 858.03 × 2 × 1 = 1,716.06 BRL (principal)

**Procedure 2:** Denervação (3.14.03.33-6), Porte 6A, Quantity 1, Unilateral
- Adjusted Value: 660.57 × 1 × 1 = 660.57 BRL (additional)

**Calculation (Same Access Route):**
```
Surgeon Total = 1,716.06 + (0.50 × 660.57)
              = 1,716.06 + 330.29
              = 2,046.35 BRL
```

---

## Frontend Requirements

### Progressive Disclosure

Show quantity/laterality fields **only when applicable**:

```
IF procedure.laterality_support = true:
    Show laterality selector (UNILATERAL / BILATERAL)
ELSE:
    Hide laterality field

IF procedure.billing_mode IN (PER_SEGMENT, PER_VERTEBRA, PER_STRUCTURE):
    Show quantity selector (1, 2, 3, 4+)
    ELSE:
    Hide quantity field
```

### UI Layout

```
[Procedure Selection Dropdown]
Description: [Procedure Name]
Base Value: R$ 858,03

[OPTIONAL: Laterality Selector]
○ Unilateral (one side)
○ Bilateral (both sides)

[OPTIONAL: Quantity Selector]
Quantidade de segmentos:
○ 1 segmento
○ 2 segmentos
○ 3 segmentos
○ 4+ segmentos

Valor Final: R$ 1.716,06
```

### Real-Time Calculation

Update the final value as the user selects modifiers:
```javascript
onQuantityChange(qty) → recalculate()
onLateralityChange(lateral) → recalculate()
```

---

## Test Coverage

Tests in `calculator_spine_test.go` verify:

1. ✅ Non-spine procedures show no spine fields
2. ✅ PER_SEGMENT shows segment selector
3. ✅ PER_VERTEBRA shows vertebra selector
4. ✅ PER_STRUCTURE shows structure selector
5. ✅ PER_PROCEDURE shows no quantity selector
6. ✅ Quantity multiplier works correctly (1–4)
7. ✅ Laterality multiplier works (1.0 or 2.0)
8. ✅ Laterality is ignored if not supported
9. ✅ Existing CBHPM adjustments still work
10. ✅ Principal is selected by adjusted value
11. ✅ Composition/calculation persistence works
12. ✅ Default quantity is 1
13. ✅ Metadata fields can be persisted

---

## Migration Path

### For Existing Users

- All existing compositions and calculations continue to work
- Non-spine procedures behave identically
- Spine procedures default to quantity=1, laterality=UNILATERAL (no change in value)

### For New Users

- When creating calculations with spine procedures, they can select:
  - Quantity (if PER_SEGMENT/PER_VERTEBRA/PER_STRUCTURE)
  - Laterality (if laterality_support=true)
- Modifiers are persisted in compositions for reuse
- Shared calculation URLs include modifiers in the JSON

---

## Excluded Features (This Release)

**Explicitly NOT implemented** (reserved for future releases):

- ❌ Osteoporosis multipliers (cement augmentation cost)
- ❌ Implant type multipliers (bone graft surcharge)
- ❌ Revision procedure multipliers
- ❌ Approach-specific multipliers
- ❌ Fusion vs. non-fusion multipliers
- ❌ Clinical context multipliers
- ❌ Any undocumented percentage

These are stored as **metadata only** (no billing effect) for:
- Audit trails
- Future implementation with explicit documentation
- RAG/ML feature engineering (if needed)

---

## Files Modified

### Database
- `backend/db/migrations/013_spine_billing_variables.sql` (NEW)
- `backend/db/migrations/014_seed_spine_billing_modes.sql` (NEW)

### Domain
- `backend/internal/models/domain.go` (UPDATED)

### API
- `openapi.yaml` (UPDATED)

### Service
- `backend/internal/service/calculator.go` (UPDATED)
- `backend/internal/service/calculator_spine_test.go` (NEW)

### Documentation
- `docs/spine-billing-implementation.md` (NEW — this file)
- `docs/spine-billing-variables.md` (REFERENCE — earlier analysis)

---

## Deployment Checklist

- [ ] Run migrations 013 and 014 on production database
- [ ] Verify `sbn_procedures` has new columns populated
- [ ] Generate Go code from updated OpenAPI spec (`oapi-codegen`)
- [ ] Update frontend to handle new `billing_modifiers` in requests/responses
- [ ] Test with existing neurosurgery procedures (no changes expected)
- [ ] Test with spine procedures (quantity/laterality selectors appear)
- [ ] Verify shared calculation URLs include modifiers
- [ ] Test composition save/load with modifiers
- [ ] Run all tests, including `calculator_spine_test.go`
- [ ] Load-test multi-procedure calculations

---

## Verification Steps

### Database

```sql
-- Verify billing modes populated
SELECT COUNT(*) FROM sbn_procedures WHERE billing_mode = 'PER_SEGMENT';
-- Expected: 4

SELECT COUNT(*) FROM sbn_procedures WHERE specialty = 'SPINE';
-- Expected: 227

SELECT COUNT(*) FROM sbn_procedures WHERE laterality_support = true;
-- Expected: 3
```

### API

**POST /api/calculate with modifiers:**
```json
{
  "selected_codes": [
    {
      "cbhpm_code": "4.08.13.36-3",
      "description": "Infiltração foraminal",
      "porte": "7A",
      "billing_mode": "PER_SEGMENT",
      "specialty": "SPINE",
      "laterality_support": true,
      "quantity_selected": 2,
      "laterality": "BILATERAL"
    }
  ],
  "auxiliaries_count": 0,
  "requires_anesthesia": false,
  "access_route_type": "same",
  "modifiers": {
    "quantity_selected": 2,
    "laterality": "BILATERAL"
  }
}
```

**Expected response:**
```json
{
  "code_breakdown": [
    {
      "cbhpm_code": "4.08.13.36-3",
      "base_value": 858.03,
      "billing_mode": "PER_SEGMENT",
      "quantity_selected": 2,
      "quantity_multiplier": 2.0,
      "laterality": "BILATERAL",
      "laterality_multiplier": 2.0,
      "adjusted_value": 3432.12
    }
  ],
  "final_total": 3432.12
}
```

---

## Future Work

Once explicit documentation is available in the manual:
- Implement cement augmentation costs (if documented with specific amounts)
- Implement implant type multipliers (if documented)
- Implement revision procedure multipliers (if documented)
- Add more granular billing modes if identified in manual

---

## References

- Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral (3ª ed., 2025)
- CBHPM 2022 — Instruções Gerais
- `docs/spine-billing-variables.md` — Detailed manual analysis

---

**Implementation Status:** ✅ COMPLETE (v2.4.0)  
**Testing Status:** ✅ UNIT TESTS WRITTEN  
**Deployment Status:** 🔲 PENDING (awaiting approval)
