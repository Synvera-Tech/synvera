package service

import (
	"testing"

	"synvera/backend/internal/models"
)

// AN-4/5: porte-derived anesthesiologist fee (CBHPM p.139–140). Round porte values make the
// arithmetic unambiguous. AN porte → equivalent surgical porte → value:
// AN5→7C, AN8→12A, AN2→3C, AN0→none, PORTE3(fallback)→4C.
var anPortes = map[string]float64{"7C": 700, "12A": 1200, "3C": 300, "4C": 400}

func code(c string) models.SelectedCode { return models.SelectedCode{CBHPMCode: c} }

func TestAnesthesia_SingleAct(t *testing.T) {
	got := computeAnesthesia([]models.SelectedCode{code("A")}, map[string]int{"A": 5}, anPortes, models.AccessRouteSame)
	if got != 700 { // AN5 → 7C
		t.Errorf("single AN5 = %v, want 700", got)
	}
}

func TestAnesthesia_AN0NoParticipation(t *testing.T) {
	got := computeAnesthesia([]models.SelectedCode{code("A")}, map[string]int{"A": 0}, anPortes, models.AccessRouteSame)
	if got != 0 {
		t.Errorf("AN0 = %v, want 0 (no anesthesiologist)", got)
	}
}

func TestAnesthesia_MultipleSameVia50(t *testing.T) {
	// AN5(700) principal + AN2(300)×50% = 850.
	got := computeAnesthesia([]models.SelectedCode{code("A"), code("B")},
		map[string]int{"A": 5, "B": 2}, anPortes, models.AccessRouteSame)
	if got != 850 {
		t.Errorf("multi same-via = %v, want 850", got)
	}
}

func TestAnesthesia_MultipleDifferentVia70(t *testing.T) {
	// AN5(700) principal + AN2(300)×70% = 910.
	got := computeAnesthesia([]models.SelectedCode{code("A"), code("B")},
		map[string]int{"A": 5, "B": 2}, anPortes, models.AccessRouteDifferent)
	if got != 910 {
		t.Errorf("multi diff-via = %v, want 910", got)
	}
}

func TestAnesthesia_FallbackPorte3(t *testing.T) {
	// No selected code has a known anesthetic porte → CBHPM item 4 → PORTE 3 (4C = 400).
	got := computeAnesthesia([]models.SelectedCode{code("Z")}, map[string]int{"A": 5}, anPortes, models.AccessRouteSame)
	if got != 400 {
		t.Errorf("fallback = %v, want 400 (PORTE 3 → 4C)", got)
	}
}

func TestAnesthesia_UnknownCodeExcludedWhenKnownExists(t *testing.T) {
	// A known anesthetic act (AN5=700) + a code without anesthetic porte → the latter is not
	// counted (e.g. a consultation), so the fee stays 700 (no spurious fallback).
	got := computeAnesthesia([]models.SelectedCode{code("A"), code("Z")},
		map[string]int{"A": 5}, anPortes, models.AccessRouteSame)
	if got != 700 {
		t.Errorf("known+unknown = %v, want 700", got)
	}
}

// Legacy path: nil anestheticPortes preserves the flat reference fee gated by requiresAnesthesia.
func TestAnesthesia_LegacyFlatFeePreserved(t *testing.T) {
	codes := []models.SelectedCode{{CBHPMCode: "A", Porte: "7C"}}
	got := CalculateWithPortesAndModifiers(codes, 0, true, models.AccessRouteSame, nil, anPortes, nil, nil)
	if got.AnesthesiologistFee != anesthesiaFee {
		t.Errorf("legacy anesthesia = %v, want %v (flat)", got.AnesthesiologistFee, anesthesiaFee)
	}
}

// Adjustments (urgency +30%) apply to the derived anesthesia fee (CBHPM item 2, A15).
func TestAnesthesia_UrgencyAppliesToDerivedFee(t *testing.T) {
	codes := []models.SelectedCode{{CBHPMCode: "A", Porte: "7C"}}
	got := CalculateWithPortesAndModifiers(codes, 0, true, models.AccessRouteSame,
		[]string{AdjCodeEmergencySpecialHours}, anPortes, nil, map[string]int{"A": 5})
	// base anesthesia = 700 (AN5→7C); +30% → 910.
	if got.AnesthesiologistFee != 910 {
		t.Errorf("urgency on derived anesthesia = %v, want 910 (700×1.30)", got.AnesthesiologistFee)
	}
}
