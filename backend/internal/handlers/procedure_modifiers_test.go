package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/repository"
)

// N4 (API slice): GET /api/procedures/{id} must enrich each CBHPM code that has a
// normative modifier (ADR-005) and expose the procedure domain. This is read-only
// metadata and does NOT affect any calculation.
func TestGetProcedure_ExposesCodeModifiersAndDomain(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-proc-modifiers")

	// The PER_VERTEBRA code (laminectomia) appears in BOTH spine and neuro procedures.
	const modifierCode = "3.07.15.19-9"
	results, err := repo.Search(modifierCode)
	if err != nil || len(results) == 0 {
		t.Fatalf("search for %s: err=%v results=%d", modifierCode, err, len(results))
	}

	getDetail := func(id string) generated.ProcedureDetail {
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/procedures/"+id, nil))
		if w.Code != http.StatusOK {
			t.Fatalf("GET procedure %s: status %d, body %s", id, w.Code, w.Body.String())
		}
		var d generated.ProcedureDetail
		if err := json.Unmarshal(w.Body.Bytes(), &d); err != nil {
			t.Fatalf("decode ProcedureDetail: %v", err)
		}
		return d
	}
	findCode := func(d generated.ProcedureDetail) *generated.CBHPMCodeEntry {
		for i := range d.CbhpmCodes {
			if d.CbhpmCodes[i].Code == modifierCode {
				return &d.CbhpmCodes[i]
			}
		}
		return nil
	}

	var spineChecked, neuroChecked bool
	for _, r := range results {
		d := getDetail(r.ID)
		if d.Domain == nil {
			t.Fatalf("procedure %s: domain is nil", r.ID)
		}
		entry := findCode(d)
		if entry == nil {
			continue
		}

		switch *d.Domain {
		case generated.SPINE:
			// SPINE procedure: the modifier is attached with full provenance.
			if entry.Modifier == nil {
				t.Fatalf("SPINE procedure %s: code %s has no modifier", r.ID, modifierCode)
			}
			m := entry.Modifier
			if m.BillingMode != generated.NormativeBillingModePERVERTEBRA {
				t.Errorf("modifier.billing_mode = %q, want PER_VERTEBRA", m.BillingMode)
			}
			if m.ViaRule != generated.SPINE50 {
				t.Errorf("modifier.via_rule = %q, want SPINE_50", m.ViaRule)
			}
			if string(m.Confidence) != "CONFIRMED" {
				t.Errorf("modifier.confidence = %q, want CONFIRMED", m.Confidence)
			}
			if m.SourcePage == nil || m.SourceExcerpt == nil || *m.SourceExcerpt == "" {
				t.Error("modifier provenance (source_page/source_excerpt) missing")
			}
			hasVertebra := false
			for _, s := range m.SupportedModifiers {
				if s == "vertebra_count" {
					hasVertebra = true
				}
			}
			if !hasVertebra {
				t.Errorf("supported_modifiers = %v, want vertebra_count", m.SupportedModifiers)
			}
			spineChecked = true
		case generated.NEUROSURGERY:
			// Domain gating: a SPINE rule must NOT leak into a neuro procedure.
			if entry.Modifier != nil {
				t.Errorf("NEUROSURGERY procedure %s: code %s wrongly got a SPINE modifier", r.ID, modifierCode)
			}
			neuroChecked = true
		}
	}

	if !spineChecked {
		t.Error("no SPINE procedure containing the modifier code was found to assert against")
	}
	if !neuroChecked {
		t.Error("no NEUROSURGERY procedure containing the modifier code was found to assert gating")
	}
}
