package repository

import (
	"testing"

	"synvera/backend/internal/models"
)

// getByName resolves a procedure by its exact SBN name via the public Search/GetByID
// path, exactly as the procedure-details handler does.
func getByName(t *testing.T, r *FileRepository, name string) *models.ProcedureWithCodes {
	t.Helper()
	results, err := r.Search(name)
	if err != nil {
		t.Fatalf("Search(%q): %v", name, err)
	}
	for _, res := range results {
		if res.Name == name {
			p, err := r.GetByID(res.ID)
			if err != nil {
				t.Fatalf("GetByID(%q): %v", res.ID, err)
			}
			if p == nil {
				t.Fatalf("GetByID(%q) returned nil for %q", res.ID, name)
			}
			return p
		}
	}
	t.Fatalf("procedure %q not found via Search", name)
	return nil
}

func codeSet(p *models.ProcedureWithCodes) map[string]bool {
	set := make(map[string]bool, len(p.Codes))
	for _, c := range p.Codes {
		set[c.Code] = true
	}
	return set
}

// TestSBNProceduresExposeAllCodes guards against the parser regression where CBHPM
// codes with malformed punctuation in the SBN manual were silently dropped, so a
// multi-code procedure surfaced fewer codes than the source documents.
// See docs/audits/sbn-cbhpm-coverage.md.
func TestSBNProceduresExposeAllCodes(t *testing.T) {
	r := NewFileRepository()

	cases := []struct {
		name  string
		codes []string // every code the SBN manual lists for this procedure
	}{
		{
			// The originally reported case (manual p139). 3.16.02.16-9 was the
			// dropped "Bloqueio peridural ou subaracnóideo com corticóide".
			name:  "INFILTRAÇÃO DE COLUNA (DOR AXIAL E/OU RADICULAR)",
			codes: []string{"4.08.13.36-3", "3.16.02.16-9", "4.08.11.02-6"},
		},
		{
			// Manual p87: 3.14.01.15-5 ("Microcirurgia para tumores
			// intracranianos") was dropped via the token "3.14.011.5-5".
			name:  "CIRURGIA TRANSESFENOIDAL TRADICIONAL (ACESSO SUBLABIAL)",
			codes: []string{"3.14.01.15-5", "3.14.01.16-3", "3.03.02.02-1", "3.05.01.20-2", "3.05.02.14-4", "4.08.11.02-6"},
		},
		{
			// Manual p89: 3.14.01.16-3 ("Microcirurgia por via Transesfenoidal")
			// was dropped via the token "3.1.40.116-3".
			name:  "CIRURGIA TRANSESFENOIDAL ENDOSCÓPICA I",
			codes: []string{"3.14.01.15-5", "3.14.01.16-3", "3.14.01.03-1", "3.03.02.02-1", "3.05.01.20-2"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := getByName(t, r, tc.name)
			got := codeSet(p)
			if len(p.Codes) != len(tc.codes) {
				t.Errorf("%s: got %d codes %v, want %d %v", tc.name, len(p.Codes), keys(got), len(tc.codes), tc.codes)
			}
			for _, want := range tc.codes {
				if !got[want] {
					t.Errorf("%s: missing CBHPM code %s (have %v)", tc.name, want, keys(got))
				}
			}
		})
	}
}

// TestNoProcedureHasZeroCodes is a systemic invariant: every SBN procedure must
// map to at least one CBHPM code. A procedure with no codes indicates a parser or
// seed failure.
func TestNoProcedureHasZeroCodes(t *testing.T) {
	r := NewFileRepository()
	for _, p := range r.procedures {
		if len(p.Codes) == 0 {
			t.Errorf("procedure %q (id=%s) exposes zero CBHPM codes", p.Name, p.ID)
		}
	}
}

// TestNoDegenerateProcedureName guards against the Phase-3 spine-parser failure
// where a broken name regex collapsed 44 unrelated CBHPM codes under the fragment
// name "Trata" (from "Trata-se da…"). Real procedure titles are never this short
// (the shortest legitimate name, "DREZOTOMIA", has 10 characters), so a sub-6-char
// name signals a parsing defect. See docs/audits/sbn-cbhpm-coverage.md §6.
func TestNoDegenerateProcedureName(t *testing.T) {
	r := NewFileRepository()
	const minLen = 6
	for _, p := range r.procedures {
		if len([]rune(p.Name)) < minLen {
			t.Errorf("procedure name %q (%d codes) is too short — likely a parser fragment", p.Name, len(p.Codes))
		}
	}
}

func keys(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
