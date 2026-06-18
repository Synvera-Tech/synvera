package service

import "synvera/backend/internal/models"

// calculateQuantityMultiplier returns the billing multiplier for a code based on its billing mode.
//
// PER_PROCEDURE codes always use ×1.0 — the CBHPM value already covers the full procedure
// regardless of how many segments or vertebrae are involved.
// PER_SEGMENT, PER_VERTEBRA, and PER_STRUCTURE codes scale linearly with quantity.
func calculateQuantityMultiplier(billingMode models.BillingMode, quantity int) float64 {
	if quantity < 1 {
		quantity = 1
	}
	switch billingMode {
	case models.BillingModeSegment, models.BillingModeVertebra, models.BillingModeStructure:
		return float64(quantity)
	case models.BillingModeProcedure:
		fallthrough
	default:
		return 1.0
	}
}

// calculateLateralityMultiplier returns the multiplier based on laterality and whether the code
// supports bilateral billing.
//
// When laterality_support is true:
//   - UNILATERAL → ×1.0
//   - BILATERAL  → ×2.0
//
// When laterality_support is false the multiplier is always 1.0.
func calculateLateralityMultiplier(lateral models.Laterality, supported bool) float64 {
	if !supported {
		return 1.0
	}
	if lateral == models.LateralityBilateral {
		return 2.0
	}
	return 1.0
}
