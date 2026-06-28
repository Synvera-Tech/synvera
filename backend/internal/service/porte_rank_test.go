package service

import (
	"testing"

	"synvera/backend/internal/models"
)

// R14: porte hierarchy and principal selection by porte (not adjusted value).

func TestPorteRank_Hierarchy(t *testing.T) {
	// Within and across tiers: 12C > 12B > 12A > 11C; 14C is the maximum.
	pairs := [][2]string{
		{"12C", "12B"}, {"12B", "12A"}, {"12A", "11C"}, {"14C", "12C"}, {"10C", "10A"}, {"2A", "1C"},
	}
	for _, p := range pairs {
		if porteRank(p[0]) <= porteRank(p[1]) {
			t.Errorf("expected porteRank(%s) > porteRank(%s)", p[0], p[1])
		}
	}
	// Invalid portes rank below everything.
	for _, bad := range []string{"", "X", "0A", "12D", "12"} {
		if porteRank(bad) != -1 {
			t.Errorf("porteRank(%q) = %d, want -1", bad, porteRank(bad))
		}
	}
}

var r14Portes = map[string]float64{"12C": 1200, "10A": 100, "9C": 90, "8A": 80}

// Scenarios 1: highest porte is also highest value → principal is the high-porte code.
func TestR14_HighestPorteIsAlsoHighestValue(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "A", Porte: "8A"},
		{CBHPMCode: "B", Porte: "12C"},
	}
	got := CalculateWithPortes(codes, 0, false, models.AccessRouteSame, nil, r14Portes)
	if !got.CodeBreakdown[1].IsPrincipal || got.CodeBreakdown[0].IsPrincipal {
		t.Error("principal must be the 12C code")
	}
}

// Scenarios 2 & 3: a PER_SEGMENT code with high quantity does NOT become principal when its
// porte is lower. 10A×5 = 500 adjusted > 12C×1 = 1200? No — 500 < 1200 here, so make the
// segment value clearly exceed the principal to prove porte (not value) decides.
func TestR14_SegmentHighQuantityDoesNotBecomePrincipal(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "SEG", Porte: "10A", BillingMode: models.BillingModeSegment, QuantitySelected: 20}, // 100×20 = 2000 adjusted
		{CBHPMCode: "PRINC", Porte: "12C", QuantitySelected: 1},                                        // 1200 adjusted
	}
	got := CalculateWithPortes(codes, 0, false, models.AccessRouteSame, nil, r14Portes)
	if got.CodeBreakdown[0].IsPrincipal {
		t.Error("R14: 10A×20 (adjusted 2000) must NOT be principal")
	}
	if !got.CodeBreakdown[1].IsPrincipal {
		t.Error("R14: 12C must be principal despite lower adjusted value")
	}
	// Surgeon = principal(1200) + additional(2000)×50% = 2200.
	if got.SurgeonBreakdown.SurgeonTotal != 2200 {
		t.Errorf("surgeon total = %v, want 2200", got.SurgeonBreakdown.SurgeonTotal)
	}
}

// Scenario 4: PER_VERTEBRA with high quantity, lower porte → not principal.
func TestR14_VertebraHighQuantityDoesNotBecomePrincipal(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "PRINC", Porte: "12C", QuantitySelected: 1},
		{CBHPMCode: "VERT", Porte: "9C", BillingMode: models.BillingModeVertebra, QuantitySelected: 10}, // 90×10 = 900
	}
	got := CalculateWithPortes(codes, 0, false, models.AccessRouteSame, nil, r14Portes)
	if !got.CodeBreakdown[0].IsPrincipal {
		t.Error("R14: 12C must be principal over 9C×10")
	}
}

// Scenario 7: auxiliaries are computed from the surgeon total of the CORRECT principal.
func TestR14_AuxiliariesFollowCorrectPrincipal(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "SEG", Porte: "10A", BillingMode: models.BillingModeSegment, QuantitySelected: 20},
		{CBHPMCode: "PRINC", Porte: "12C", QuantitySelected: 1},
	}
	got := CalculateWithPortes(codes, 1, false, models.AccessRouteSame, nil, r14Portes)
	// surgeonTotal = 2200 (see above); 1st auxiliary = 60% → 1320.
	if got.AuxiliariesFee != 2200*0.60 {
		t.Errorf("aux fee = %v, want %v", got.AuxiliariesFee, 2200*0.60)
	}
}

// Tie-break: equal portes → first code in payload order is principal (stable).
func TestR14_TieBreakIsStable(t *testing.T) {
	codes := []models.SelectedCode{
		{CBHPMCode: "FIRST", Porte: "12C"},
		{CBHPMCode: "SECOND", Porte: "12C"},
	}
	got := CalculateWithPortes(codes, 0, false, models.AccessRouteSame, nil, r14Portes)
	if !got.CodeBreakdown[0].IsPrincipal || got.CodeBreakdown[1].IsPrincipal {
		t.Error("tie on porte must keep the first code as principal")
	}
}
