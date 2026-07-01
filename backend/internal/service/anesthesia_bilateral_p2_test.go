package service

import (
	"testing"

	"synvera/backend/internal/models"
)

// P2 (CBHPM 2022 p.140 item 7): a bilateral anesthetic act with no specific bilateral code adds
// 70% of the principal anesthetic porte to the anesthesiologist fee. USER_SELECTABLE.
// Portes (anPortesP1, shared): AN6→9B=900, AN7→10C=1000.

func p2Calc(codes []models.SelectedCode, anPortes map[string]int, bilateral bool, adjustments []string, toggle bool) models.CalculationResult {
	return CalculateWithPortesModifiersAndAnesthesia(
		codes, 0, false, models.AccessRouteSame, adjustments,
		anPortesP1, nil, anPortes, toggle, models.AnesthesiaAssistantJustification{}, bilateral,
	)
}

// 1. Bilateral OFF → base anesthesia only, nothing added.
func TestP2_BilateralOff(t *testing.T) {
	got := p2Calc([]models.SelectedCode{code("A")}, map[string]int{"A": 6}, false, nil, false)
	if got.AnesthesiaBilateralApplied || got.AnesthesiologistFee != 900 {
		t.Fatalf("bilateral off: applied=%v anesth=%v, want false/900", got.AnesthesiaBilateralApplied, got.AnesthesiologistFee)
	}
}

// 2. Bilateral ON → +70% of the principal anesthetic porte (900 → +630 = 1530).
func TestP2_BilateralAppliesSeventyPercent(t *testing.T) {
	got := p2Calc([]models.SelectedCode{code("A")}, map[string]int{"A": 6}, true, nil, false)
	if !got.AnesthesiaBilateralApplied {
		t.Fatalf("bilateral not applied, want applied")
	}
	if got.BaseAnesthesiaBilateralValue != 630 {
		t.Errorf("bilateral increment = %v, want 630 (70%% of 900)", got.BaseAnesthesiaBilateralValue)
	}
	if got.AnesthesiologistFee != 1530 {
		t.Errorf("anesthesiologist fee = %v, want 1530 (900 + 630)", got.AnesthesiologistFee)
	}
	if got.AnesthesiaBilateralSource != "CBHPM 2022 p.140 item 7" {
		t.Errorf("source = %q, want CBHPM 2022 p.140 item 7", got.AnesthesiaBilateralSource)
	}
}

// 3. A code whose description already encodes bilaterality → specific code exists → NOT applied.
func TestP2_NotAppliedWhenSpecificBilateralCode(t *testing.T) {
	codes := []models.SelectedCode{{CBHPMCode: "A", Description: "Craniotomia BILATERAL para tumor"}}
	got := p2Calc(codes, map[string]int{"A": 6}, true, nil, false)
	if got.AnesthesiaBilateralApplied || got.AnesthesiologistFee != 900 {
		t.Fatalf("specific bilateral code: applied=%v anesth=%v, want false/900 (no +70%%)",
			got.AnesthesiaBilateralApplied, got.AnesthesiologistFee)
	}
}

// 4. The item-8 assistant (60%) is taken over the full anesthesiologist fee, bilateral included.
// AN7 → 1000; bilateral +700 = 1700; assistant = 60% = 1020.
func TestP2_AssistantIncludesBilateral(t *testing.T) {
	got := p2Calc([]models.SelectedCode{code("A")}, map[string]int{"A": 7}, true, nil, true)
	if got.AnesthesiologistFee != 1700 {
		t.Fatalf("anesthesiologist fee = %v, want 1700 (1000 + 700)", got.AnesthesiologistFee)
	}
	if got.AnesthesiaAssistantFee != 1020 {
		t.Errorf("assistant fee = %v, want 1020 (60%% of 1700)", got.AnesthesiaAssistantFee)
	}
}

// 5. Urgency (item 2) scales the bilateral-inclusive anesthesia: (900 + 630) × 1.30 = 1989.
func TestP2_UrgencyScalesBilateralInclusiveAnesthesia(t *testing.T) {
	got := p2Calc([]models.SelectedCode{code("A")}, map[string]int{"A": 6}, true,
		[]string{AdjCodeEmergencySpecialHours}, false)
	if fee := got.AnesthesiologistFee; fee < 1988.99 || fee > 1989.01 {
		t.Errorf("anesthesiologist fee = %v, want ≈1989 (1530 × 1.30)", fee)
	}
}

// 6. No anesthesia (AN0/local) → bilateral has nothing to scale → not applied.
func TestP2_NotAppliedWithoutAnesthesia(t *testing.T) {
	got := p2Calc([]models.SelectedCode{code("A")}, map[string]int{"A": 0}, true, nil, false)
	if got.AnesthesiaBilateralApplied || got.AnesthesiologistFee != 0 {
		t.Fatalf("AN0 bilateral: applied=%v anesth=%v, want false/0", got.AnesthesiaBilateralApplied, got.AnesthesiologistFee)
	}
}
