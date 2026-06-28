package service

import "synvera/backend/internal/models"

// Normative rule identifiers (ADR-005) resolved per code by the valuation engine.
const (
	viaRuleSpine50          = "SPINE_50"      // spine additional codes at 50% incl. 360° (R12)
	lateralityRuleNoDuplicate = "NO_DUPLICATE" // spine bilateral same segment not duplicated (R3)
)

// calculateQuantityMultiplier returns the billing multiplier for a code based on its billing mode.
//
// PER_PROCEDURE codes always use ×1.0 — the CBHPM value already covers the full procedure
// regardless of how many segments or vertebrae are involved.
// PER_SEGMENT, PER_VERTEBRA, and PER_STRUCTURE codes scale linearly with quantity.
// PER_STRUCTURE_DECREMENT bills the first structure at 100% and each additional one at
// decrementPct% (Manual de Coluna p.13 — costectomy: "100% + 30% por arco adicional", R7).
func calculateQuantityMultiplier(billingMode models.BillingMode, quantity int, decrementPct *float64) float64 {
	if quantity < 1 {
		quantity = 1
	}
	switch billingMode {
	case models.BillingModeSegment, models.BillingModeVertebra, models.BillingModeStructure:
		return float64(quantity)
	case models.BillingModeStructureDecrement:
		d := 0.0
		if decrementPct != nil {
			d = *decrementPct / 100.0
		}
		return 1.0 + float64(quantity-1)*d
	case models.BillingModeProcedure:
		fallthrough
	default:
		return 1.0
	}
}

// calculateLateralityMultiplier returns the multiplier based on laterality and whether the code
// supports bilateral billing.
//
// When lateralityRule is NO_DUPLICATE (spine, Manual de Coluna p.9, R3) the multiplier is always
// 1.0 — a procedure is not remunerated twice for the same patology bilaterally within one segment.
// Otherwise, when laterality_support is true:
//   - UNILATERAL → ×1.0
//   - BILATERAL  → ×2.0
//
// When laterality_support is false the multiplier is always 1.0.
func calculateLateralityMultiplier(lateral models.Laterality, supported bool, lateralityRule string) float64 {
	if lateralityRule == lateralityRuleNoDuplicate {
		return 1.0
	}
	if !supported {
		return 1.0
	}
	if lateral == models.LateralityBilateral {
		return 2.0
	}
	return 1.0
}
