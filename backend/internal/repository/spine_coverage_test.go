package repository

import (
	"strings"
	"testing"

	"synvera/backend/internal/models"
	"synvera/backend/internal/service"
)

// spineSourceDocument is the provenance string backfilled for Manual de Coluna
// procedures (see migration 026 / provenanceForSpecialty).
const spineSourceDocument = "Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral"

// TestSpineProcedure72ReturnsAllCodes proves the headline acceptance case: the
// spine manual ficha "7.2 — CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL" is searchable
// and its detail returns every one of the 10 CBHPM codes the manual lists, in no
// fewer and no greater number. This is the procedure the briefing used as proof.
func TestSpineProcedure72ReturnsAllCodes(t *testing.T) {
	r := NewFileRepository()

	const name = "CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL"
	want := []string{
		"3.07.15.05-9", "3.07.15.18-0", "3.07.15.39-3", "3.07.15.36-9",
		"3.07.15.09-1", "3.07.15.19-9", "3.16.02.16-9", "3.14.01.26-0",
		"4.08.11.02-6", "2.02.02.04-0",
	}

	p := getByName(t, r, name)
	got := codeSet(p)
	if len(p.Codes) != len(want) {
		t.Fatalf("7.2: got %d codes %v, want %d %v", len(p.Codes), keys(got), len(want), want)
	}
	for _, code := range want {
		if !got[code] {
			t.Errorf("7.2: missing CBHPM code %s (have %v)", code, keys(got))
		}
	}
}

// TestSpineProceduresAreSearchable proves the user-reported bug is fixed: spine
// surgeries that returned nothing in the search dropdown now resolve to results.
func TestSpineProceduresAreSearchable(t *testing.T) {
	r := NewFileRepository()

	queries := []string{
		"cirurgia endoscópica para hérnia discal",
		"hérnia discal",
		"artrodese",
		"laminectomia",
		"descompressão",
		"escoliose",
		"espondilolistese",
		"infiltração",
	}
	for _, q := range queries {
		t.Run(q, func(t *testing.T) {
			results, err := r.Search(q)
			if err != nil {
				t.Fatalf("Search(%q): %v", q, err)
			}
			if len(results) == 0 {
				t.Errorf("Search(%q) returned 0 results; expected at least one", q)
			}
		})
	}
}

// TestSpineProcedureProvenance proves the source manual is preserved and exposed
// through the same path the detail handler uses.
func TestSpineProcedureProvenance(t *testing.T) {
	r := NewFileRepository()

	p := getByName(t, r, "CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL")
	if !strings.Contains(p.SourceDocument, "Coluna Vertebral") {
		t.Errorf("spine procedure source_document = %q, want spine manual", p.SourceDocument)
	}
	if p.SourceVersion == "" {
		t.Errorf("spine procedure source_version is empty, want a manual edition")
	}

	// An SBN procedure must keep neurosurgery provenance (no regression).
	sbn := getByName(t, r, "INFILTRAÇÃO DE COLUNA (DOR AXIAL E/OU RADICULAR)")
	if !strings.Contains(sbn.SourceDocument, "Neurocirurgia") {
		t.Errorf("SBN procedure source_document = %q, want neurosurgery manual", sbn.SourceDocument)
	}
}

// TestSpineManualCoverage is the systemic invariant: a meaningful number of spine
// manual procedures were imported, and every imported spine procedure exposes at
// least one CBHPM code with a valid porte. Guards against a future regression that
// silently drops the spine import.
func TestSpineManualCoverage(t *testing.T) {
	r := NewFileRepository()

	spineCount := 0
	for _, p := range r.procedures {
		if !strings.Contains(p.SourceDocument, "Coluna Vertebral") {
			continue
		}
		spineCount++
		if len(p.Codes) == 0 {
			t.Errorf("spine procedure %q exposes zero CBHPM codes", p.Name)
		}
		for _, c := range p.Codes {
			if c.Porte == "" {
				t.Errorf("spine procedure %q code %s has empty porte", p.Name, c.Code)
			}
		}
	}

	// 69 non-colliding fiches + 4 disambiguated collisions were imported.
	const minSpine = 69
	if spineCount < minSpine {
		t.Errorf("only %d spine procedures imported, want at least %d", spineCount, minSpine)
	}
}

// TestSpineProcedureCalculates proves a spine procedure flows end-to-end into the
// valuation engine: every code the manual lists for 7.2 contributes to the total
// (no code is dropped or zero-valued) and the final total is non-zero.
func TestSpineProcedureCalculates(t *testing.T) {
	r := NewFileRepository()
	p := getByName(t, r, "CIRURGIA ENDOSCÓPICA PARA HÉRNIA DISCAL")

	codes := make([]models.SelectedCode, 0, len(p.Codes))
	for _, c := range p.Codes {
		codes = append(codes, models.SelectedCode{
			CBHPMCode:         c.Code,
			Description:       c.Description,
			Porte:             c.Porte,
			BillingMode:       c.BillingMode,
			Specialty:         c.Specialty,
			LateralitySupport: c.LateralitySupport,
			QuantitySelected:  1,
			Laterality:        models.LateralityUnilateral,
		})
	}

	result := service.Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	if result.FinalTotal <= 0 {
		t.Fatalf("spine calculation produced non-positive total %v", result.FinalTotal)
	}
	if len(result.CodeBreakdown) != len(p.Codes) {
		t.Fatalf("breakdown has %d codes, want %d (a code was dropped)", len(result.CodeBreakdown), len(p.Codes))
	}
	for _, b := range result.CodeBreakdown {
		if b.BaseValue <= 0 {
			t.Errorf("code %s contributed base value %v (porte unmapped?)", b.CBHPMCode, b.BaseValue)
		}
	}
}

// TestSBNProceduresNoRegression confirms an existing SBN surgical procedure still
// returns its full code set after the spine import (catalog ordering preserved).
func TestSBNProceduresNoRegression(t *testing.T) {
	r := NewFileRepository()
	p := getByName(t, r, "CIRURGIA TRANSESFENOIDAL TRADICIONAL (ACESSO SUBLABIAL)")
	got := codeSet(p)
	for _, code := range []string{"3.14.01.15-5", "3.14.01.16-3", "4.08.11.02-6"} {
		if !got[code] {
			t.Errorf("SBN regression: %q missing %s (have %v)", p.Name, code, keys(got))
		}
	}
}
