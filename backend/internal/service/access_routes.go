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
