// Package billing defines plan types and usage limits for Synvera.
// No payment gateway is integrated. Plan enforcement is local.
package billing

// PlanType identifies a physician's subscription tier.
type PlanType string

const (
	PlanFree         PlanType = "free"
	PlanProfessional PlanType = "professional"
	PlanTeam         PlanType = "team"
)

// SubscriptionStatus reflects the billing state of the account.
type SubscriptionStatus string

const (
	StatusInactive SubscriptionStatus = "inactive"
	StatusActive   SubscriptionStatus = "active"
	StatusPastDue  SubscriptionStatus = "past_due"
	StatusCanceled SubscriptionStatus = "canceled"
)

// Limits defines the enforcement boundaries for a given plan.
// A zero value for a limit means the resource is uncapped.
type Limits struct {
	// MaxCompositions is the maximum number of saved compositions.
	// 0 = unlimited.
	MaxCompositions int
}

// GetLimits returns the Limits for the given plan.
// Unknown plan values fall back to free-tier limits.
func GetLimits(plan PlanType) Limits {
	switch plan {
	case PlanProfessional, PlanTeam:
		return Limits{MaxCompositions: 0}
	default:
		return Limits{MaxCompositions: 4}
	}
}

// IsUnlimited returns true when the limit value means "no cap".
func IsUnlimited(limit int) bool {
	return limit == 0
}
