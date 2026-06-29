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
	got := CalculateWithPortesAndModifiers(codes, 0, true, models.AccessRouteSame, nil, anPortes, nil, nil, false)
	if got.AnesthesiologistFee != anesthesiaFee {
		t.Errorf("legacy anesthesia = %v, want %v (flat)", got.AnesthesiologistFee, anesthesiaFee)
	}
}

// A9: anesthesia assistant = 60% of the anesthesiologist fee, only for AN7/AN8.
func TestAnesthesia_AssistantForAN8(t *testing.T) {
	codes := []models.SelectedCode{code("A")}
	got := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, anPortes, nil, map[string]int{"A": 8}, true)
	// AN8 → 12A = 1200; assistant = 60% = 720; porte = 8.
	if got.AnesthesiologistFee != 1200 {
		t.Errorf("anesthesia = %v, want 1200 (AN8→12A)", got.AnesthesiologistFee)
	}
	if got.AnesthesiaAssistantFee != 720 {
		t.Errorf("assistant = %v, want 720 (60%%)", got.AnesthesiaAssistantFee)
	}
	if got.AnesthesiaPorte != 8 {
		t.Errorf("anesthesia porte = %v, want 8", got.AnesthesiaPorte)
	}
	if got.FinalTotal != 1920 {
		t.Errorf("final = %v, want 1920 (1200+720)", got.FinalTotal)
	}
}

func TestAnesthesia_AssistantNotAppliedBelowAN7(t *testing.T) {
	// AN5 requested but not eligible — no assistant fee.
	got := CalculateWithPortesAndModifiers([]models.SelectedCode{code("A")}, 0, false, models.AccessRouteSame, nil, anPortes, nil, map[string]int{"A": 5}, true)
	if got.AnesthesiaAssistantFee != 0 {
		t.Errorf("assistant for AN5 = %v, want 0 (only AN7/AN8)", got.AnesthesiaAssistantFee)
	}
}

func TestAnesthesia_AssistantFlagOff(t *testing.T) {
	got := CalculateWithPortesAndModifiers([]models.SelectedCode{code("A")}, 0, false, models.AccessRouteSame, nil, anPortes, nil, map[string]int{"A": 8}, false)
	if got.AnesthesiaAssistantFee != 0 {
		t.Errorf("assistant with flag off = %v, want 0", got.AnesthesiaAssistantFee)
	}
}

// Adjustments (urgency +30%) apply to the derived anesthesia fee (CBHPM item 2, A15).
func TestAnesthesia_UrgencyAppliesToDerivedFee(t *testing.T) {
	codes := []models.SelectedCode{{CBHPMCode: "A", Porte: "7C"}}
	got := CalculateWithPortesAndModifiers(codes, 0, true, models.AccessRouteSame,
		[]string{AdjCodeEmergencySpecialHours}, anPortes, nil, map[string]int{"A": 5}, false)
	// base anesthesia = 700 (AN5→7C); +30% → 910.
	if got.AnesthesiologistFee != 910 {
		t.Errorf("urgency on derived anesthesia = %v, want 910 (700×1.30)", got.AnesthesiologistFee)
	}
}
