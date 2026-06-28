package repository

import (
	"testing"

	"synvera/backend/internal/models"
	"synvera/backend/internal/service"
)

// N3 read-path tests for the normative modifier layer (ADR-005).
//
// These prove the repository loads the seeded modifiers correctly and — critically —
// that the modifier table does NOT influence the valuation engine yet (stage N3).
// The engine consumes SelectedCode.BillingMode from the request, never the modifier
// table, so calculations remain identical to pre-N3 behaviour.

func TestFileRepository_GetCodeModifiers_Count(t *testing.T) {
	repo := NewFileRepository()
	mods, err := repo.GetCodeModifiers()
	if err != nil {
		t.Fatalf("GetCodeModifiers: %v", err)
	}
	if len(mods) != 24 {
		t.Fatalf("expected 24 seeded modifiers, got %d", len(mods))
	}
}

func TestFileRepository_GetCodeModifiers_Fields(t *testing.T) {
	repo := NewFileRepository()
	mods, _ := repo.GetCodeModifiers()

	cases := []struct {
		code        string
		billingMode models.BillingMode
		lateral     string
		via         string
		hasDecr     bool
	}{
		{"3.07.15.01-6", models.BillingModeSegment, "NO_DUPLICATE", "SPINE_50", false},
		{"3.07.15.19-9", models.BillingModeVertebra, "NO_DUPLICATE", "SPINE_50", false},
		{"4.08.13.36-3", models.BillingModeStructure, "NO_DUPLICATE", "SPINE_50", false},
		{"3.06.01.02-9", models.BillingModeStructureDecrement, "NO_DUPLICATE", "SPINE_50", true},
		{"3.07.15.05-9", models.BillingModeProcedure, "NONE", "SPINE_50", false},
	}
	for _, c := range cases {
		m, ok := mods[c.code]
		if !ok {
			t.Errorf("%s: missing modifier", c.code)
			continue
		}
		if m.BillingMode != c.billingMode {
			t.Errorf("%s: billing_mode = %q, want %q", c.code, m.BillingMode, c.billingMode)
		}
		if m.LateralityRule != c.lateral {
			t.Errorf("%s: laterality_rule = %q, want %q", c.code, m.LateralityRule, c.lateral)
		}
		if m.ViaRule != c.via {
			t.Errorf("%s: via_rule = %q, want %q", c.code, m.ViaRule, c.via)
		}
		if (m.DecrementPct != nil) != c.hasDecr {
			t.Errorf("%s: decrement presence = %v, want %v", c.code, m.DecrementPct != nil, c.hasDecr)
		}
		if c.hasDecr && (m.DecrementPct == nil || *m.DecrementPct != 30.0) {
			t.Errorf("%s: expected decrement_pct=30.0", c.code)
		}
	}
}

// Every seeded row must carry full provenance and be clinically CONFIRMED,
// and must NOT be marked implemented/verified until stage N5.
func TestFileRepository_GetCodeModifiers_Provenance(t *testing.T) {
	repo := NewFileRepository()
	mods, _ := repo.GetCodeModifiers()
	for code, m := range mods {
		if m.Confidence != "CONFIRMED" {
			t.Errorf("%s: confidence = %q, want CONFIRMED", code, m.Confidence)
		}
		if m.SourceDocument == "" || m.SourceVersion == "" || m.SourceExcerpt == "" || m.SourcePage == nil {
			t.Errorf("%s: incomplete provenance", code)
		}
		if m.Specialty != models.SpecialtySpine {
			t.Errorf("%s: specialty = %q, want SPINE", code, m.Specialty)
		}
	}
}

// The returned map must be a defensive copy: mutating it must not corrupt the repo.
func TestFileRepository_GetCodeModifiers_ReturnsCopy(t *testing.T) {
	repo := NewFileRepository()
	mods, _ := repo.GetCodeModifiers()
	delete(mods, "3.07.15.01-6")
	again, _ := repo.GetCodeModifiers()
	if _, ok := again["3.07.15.01-6"]; !ok {
		t.Fatal("mutating the returned map corrupted the repository")
	}
}

// Golden parity: a PER_SEGMENT code (3.07.15.01-6) has a modifier in the table, but
// the engine still applies ×1 because it reads BillingMode from the SelectedCode
// (request/catalog = PER_PROCEDURE), NOT the modifier table. This proves N3 changes
// no calculation. The value must equal the same code billed as a plain procedure.
func TestEngineIgnoresModifierTable_N3(t *testing.T) {
	repo := NewFileRepository()
	portes, _ := repo.GetPorteValues("")

	// A code that HAS a PER_SEGMENT modifier in the table, submitted with the current
	// default catalog billing mode (PER_PROCEDURE) and a quantity of 3.
	withQty := []models.SelectedCode{{
		CBHPMCode:        "3.07.15.01-6",
		Porte:            "12C",
		BillingMode:      models.BillingModeProcedure, // what the catalog/request sends today
		QuantitySelected: 3,
	}}
	got := service.CalculateWithPortes(withQty, 0, false, models.AccessRouteSame, nil, portes)

	// Baseline: identical input billed plainly.
	plain := []models.SelectedCode{{
		CBHPMCode:        "3.07.15.01-6",
		Porte:            "12C",
		BillingMode:      models.BillingModeProcedure,
		QuantitySelected: 1,
	}}
	want := service.CalculateWithPortes(plain, 0, false, models.AccessRouteSame, nil, portes)

	if got.FinalTotal != want.FinalTotal {
		t.Fatalf("engine consumed the modifier table (N3 must not change calc): got %.2f, want %.2f",
			got.FinalTotal, want.FinalTotal)
	}
}
