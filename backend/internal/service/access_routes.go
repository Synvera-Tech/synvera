package service

import "synvera/backend/internal/models"

// discountRateFor returns the multiplier applied to additional procedures in a multi-code composition.
//
// With only one selected code there are no additional procedures, so rate is 1.0.
// CBHPM 4.1: same access route    → additional codes valued at 50% (rate = 0.50).
// CBHPM 4.2: different routes     → additional codes valued at 70% (rate = 0.70).
func discountRateFor(route models.AccessRouteType, codeCount int) float64 {
	if codeCount <= 1 {
		return 1.0
	}
	if route == models.AccessRouteDifferent {
		return 0.70
	}
	return 0.50
}

// discountRateForCode returns the additional-procedure rate for a single code, honouring the
// code's normative via rule. Spine codes (viaRule = SPINE_50) are always valued at 50% when
// additional, even across combined anterior/posterior (360°) approaches — Manual de Coluna
// p.42/62 (R12), which overrides the general CBHPM 4.2 (70%). Codes without a spine via rule
// fall back to the standard CBHPM 4.1/4.2 behaviour, so neurosurgery results are unchanged.
func discountRateForCode(viaRule string, route models.AccessRouteType, codeCount int) float64 {
	if codeCount <= 1 {
		return 1.0
	}
	if viaRule == viaRuleSpine50 {
		return 0.50
	}
	return discountRateFor(route, codeCount)
}
