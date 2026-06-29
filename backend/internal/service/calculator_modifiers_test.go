package service

import (
	"testing"

	"synvera/backend/internal/models"
)

// N5a: normative-modifier-driven valuation (ADR-005). These tests pin the exact monetary
// effect of each activated rule with manual-derived expected values, using round porte
// values so the arithmetic is unambiguous. The modifiers-enabled entry point is
// CalculateWithPortesAndModifiers; the nil-modifier path must remain byte-identical to legacy.

var modTestPortes = map[string]float64{"X": 1000, "Y": 600, "Z": 100}

func spineMod(code, billingMode string, decrement *float64) models.CodeModifier {
	return models.CodeModifier{
		CBHPMCode:      code,
		Specialty:      models.SpecialtySpine,
		BillingMode:    models.BillingMode(billingMode),
		ViaRule:        "SPINE_50",
		LateralityRule: "NO_DUPLICATE",
		DecrementPct:   decrement,
	}
}

// R4/R5/R6: PER_VERTEBRA multiplies the code value by the quantity (×3).
func TestModifiers_PerVertebraMultiplies(t *testing.T) {
	qty := 3
	codes := []models.SelectedCode{{
		CBHPMCode: "VERT", Porte: "X", Specialty: models.SpecialtySpine, QuantitySelected: qty,
	}}
	mods := map[string]models.CodeModifier{"VERT": spineMod("VERT", "PER_VERTEBRA", nil)}

	got := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, modTestPortes, mods, nil, false)

	if got.CodeBreakdown[0].QuantityMultiplier != 3 {
		t.Errorf("quantity multiplier = %v, want 3", got.CodeBreakdown[0].QuantityMultiplier)
	}
	if got.CodeBreakdown[0].AdjustedValue != 3000 {
		t.Errorf("adjusted value = %v, want 3000", got.CodeBreakdown[0].AdjustedValue)
	}
	if got.FinalTotal != 3000 {
		t.Errorf("final total = %v, want 3000", got.FinalTotal)
	}
}

// R7: PER_STRUCTURE_DECREMENT bills the first structure at 100% and each additional at 30%.
// Costectomy qty=3 → 1 + 2×0.30 = 1.6 → 1600.
func TestModifiers_StructureDecrement(t *testing.T) {
	dec := 30.0
	qty := 3
	codes := []models.SelectedCode{{
		CBHPMCode: "RIB", Porte: "X", Specialty: models.SpecialtySpine, QuantitySelected: qty,
	}}
	mods := map[string]models.CodeModifier{"RIB": spineMod("RIB", "PER_STRUCTURE_DECREMENT", &dec)}

	got := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, modTestPortes, mods, nil, false)

	if got.CodeBreakdown[0].QuantityMultiplier != 1.6 {
		t.Errorf("decrement multiplier = %v, want 1.6", got.CodeBreakdown[0].QuantityMultiplier)
	}
	if got.FinalTotal != 1600 {
		t.Errorf("final total = %v, want 1600", got.FinalTotal)
	}
}

// R3: spine BILATERAL within the same segment does NOT duplicate (×1), unlike the legacy
// primitive which doubles for laterality_support codes.
func TestModifiers_BilateralNoDuplicate(t *testing.T) {
	codes := []models.SelectedCode{{
		CBHPMCode: "LAT", Porte: "X", Specialty: models.SpecialtySpine,
		LateralitySupport: true, Laterality: models.LateralityBilateral, QuantitySelected: 1,
	}}
	mods := map[string]models.CodeModifier{"LAT": spineMod("LAT", "PER_PROCEDURE", nil)}

	withMods := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, modTestPortes, mods, nil, false)
	if withMods.FinalTotal != 1000 {
		t.Errorf("spine bilateral with R3: final = %v, want 1000 (no duplication)", withMods.FinalTotal)
	}

	// Legacy path (nil modifiers) still doubles — proves the primitive is unchanged.
	legacy := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, modTestPortes, nil, nil, false)
	if legacy.FinalTotal != 2000 {
		t.Errorf("legacy bilateral: final = %v, want 2000", legacy.FinalTotal)
	}
}

// R12: spine additional codes are valued at 50% even on a "different" access route,
// overriding CBHPM 4.2 (70%). Principal 1000 + 600×0.5 = 1300.
func TestModifiers_SpineVia50EvenWhenDifferent(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "P", Porte: "X", Specialty: models.SpecialtySpine, QuantitySelected: 1},
		{CBHPMCode: "A", Porte: "Y", Specialty: models.SpecialtySpine, QuantitySelected: 1},
	}
	mods := map[string]models.CodeModifier{
		"P": spineMod("P", "PER_PROCEDURE", nil),
		"A": spineMod("A", "PER_PROCEDURE", nil),
	}

	got := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteDifferent, nil, modTestPortes, mods, nil, false)
	if got.SurgeonBreakdown.SurgeonTotal != 1300 {
		t.Errorf("spine R12 different route: surgeon = %v, want 1300", got.SurgeonBreakdown.SurgeonTotal)
	}

	// Legacy "different" route would be 1000 + 600×0.7 = 1420.
	legacy := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteDifferent, nil, modTestPortes, nil, nil, false)
	if legacy.SurgeonBreakdown.SurgeonTotal != 1420 {
		t.Errorf("legacy different route: surgeon = %v, want 1420", legacy.SurgeonBreakdown.SurgeonTotal)
	}
}

// Regression: NEUROSURGERY codes are never enriched even when a modifiers map is present —
// CBHPM 4.2 (70%) still applies, so neuro results are identical with or without modifiers.
func TestModifiers_NeurosurgeryUnchanged(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "P", Porte: "X", Specialty: models.SpecialtyNeurosurgery, QuantitySelected: 1},
		{CBHPMCode: "A", Porte: "Y", Specialty: models.SpecialtyNeurosurgery, QuantitySelected: 1},
	}
	mods := map[string]models.CodeModifier{} // present but empty

	withMods := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteDifferent, nil, modTestPortes, mods, nil, false)
	legacy := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteDifferent, nil, modTestPortes, nil, nil, false)
	if withMods.SurgeonBreakdown.SurgeonTotal != legacy.SurgeonBreakdown.SurgeonTotal {
		t.Errorf("neuro changed: with=%v legacy=%v", withMods.SurgeonBreakdown.SurgeonTotal, legacy.SurgeonBreakdown.SurgeonTotal)
	}
	if withMods.SurgeonBreakdown.SurgeonTotal != 1420 {
		t.Errorf("neuro different route: surgeon = %v, want 1420", withMods.SurgeonBreakdown.SurgeonTotal)
	}
}

// R8: an endoscopic / once-per-surgery code stays ×1 even if a quantity is submitted.
func TestModifiers_PerProcedureIgnoresQuantity(t *testing.T) {
	codes := []models.SelectedCode{{
		CBHPMCode: "ENDO", Porte: "X", Specialty: models.SpecialtySpine, QuantitySelected: 5,
	}}
	mods := map[string]models.CodeModifier{"ENDO": spineMod("ENDO", "PER_PROCEDURE", nil)}

	got := CalculateWithPortesAndModifiers(codes, 0, false, models.AccessRouteSame, nil, modTestPortes, mods, nil, false)
	if got.CodeBreakdown[0].QuantityMultiplier != 1 || got.FinalTotal != 1000 {
		t.Errorf("endoscopic ×1: multiplier=%v final=%v, want 1 and 1000",
			got.CodeBreakdown[0].QuantityMultiplier, got.FinalTotal)
	}
}
