package handlers_test

// Modifiers persistence tests: verify that composition.modifiers (migration 018) is
// correctly written on create/update and correctly read back on GET, including the
// nil-modifiers fallback for compositions that predate migration 018.

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/repository"
)

// compositionPayloadWithModifiers builds a valid SaveCompositionRequest that includes
// spine-specific billing modifiers (quantity_selected + laterality).
func compositionPayloadWithModifiers(name string, qty int, lat generated.Laterality) []byte {
	q := qty
	l := lat
	sbnID := "spine-sbn-id"
	req := generated.SaveCompositionRequest{
		Name:             name,
		SbnProcedureName: "ARTRODESE LOMBAR POR SEGMENTO",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{
				CbhpmCode:         "3.06.01.01-0",
				Description:       "Artrodese lombar",
				Porte:             "12A",
				BillingMode:       generated.PERSEGMENT,
				Specialty:         generated.Specialty("SPINE"),
				LateralitySupport: true,
				Laterality:        &l,
				QuantitySelected:  &q,
			},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   2,
		RequiresAnesthesia: true,
		Modifiers: &generated.BillingModifiers{
			QuantitySelected: &q,
			Laterality:       &l,
		},
	}
	b, _ := json.Marshal(req)
	return b
}

// getCompositionDetail performs a GET /api/compositions/{id} and returns the decoded detail.
func getCompositionDetail(t *testing.T, mux *http.ServeMux, id string) generated.CompositionDetail {
	t.Helper()
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/compositions/"+id, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("GET composition %s: expected 200, got %d: %s", id, w.Code, w.Body)
	}
	var detail generated.CompositionDetail
	if err := json.NewDecoder(w.Body).Decode(&detail); err != nil {
		t.Fatalf("decode composition detail: %v", err)
	}
	return detail
}

// updateComposition performs a PUT /api/compositions/{id} and returns the decoded detail.
func updateComposition(t *testing.T, mux *http.ServeMux, id string, payload []byte) generated.CompositionDetail {
	t.Helper()
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/compositions/"+id, bytes.NewReader(payload)))
	if w.Code != http.StatusOK {
		t.Fatalf("PUT composition %s: expected 200, got %d: %s", id, w.Code, w.Body)
	}
	var detail generated.CompositionDetail
	if err := json.NewDecoder(w.Body).Decode(&detail); err != nil {
		t.Fatalf("decode update response: %v", err)
	}
	return detail
}

// TestCompositionCreateSavesModifiers — modifiers sent on create must be stored and
// returned in the GET response.
func TestCompositionCreateSavesModifiers(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-modifiers-create")

	id := saveComposition(t, mux, compositionPayloadWithModifiers("Artrodese L4-L5", 2, generated.BILATERAL))
	detail := getCompositionDetail(t, mux, id)

	if detail.Modifiers == nil {
		t.Fatal("expected Modifiers to be non-nil after create with modifiers")
	}
	if detail.Modifiers.QuantitySelected == nil || *detail.Modifiers.QuantitySelected != 2 {
		t.Errorf("quantity_selected: got %v, want 2", detail.Modifiers.QuantitySelected)
	}
	if detail.Modifiers.Laterality == nil || *detail.Modifiers.Laterality != generated.BILATERAL {
		t.Errorf("laterality: got %v, want BILATERAL", detail.Modifiers.Laterality)
	}
}

// TestCompositionUpdateSavesModifiers — modifiers sent on PUT must overwrite the stored
// modifiers and be returned in the subsequent GET response.
func TestCompositionUpdateSavesModifiers(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-modifiers-update")

	// Create without modifiers.
	id := saveComposition(t, mux, compositionPayload("Composição inicial"))

	// Update with modifiers (3 segments, bilateral).
	updated := updateComposition(t, mux, id, compositionPayloadWithModifiers("Atualizada", 3, generated.BILATERAL))

	if updated.Modifiers == nil {
		t.Fatal("expected Modifiers non-nil after update with modifiers")
	}
	if updated.Modifiers.QuantitySelected == nil || *updated.Modifiers.QuantitySelected != 3 {
		t.Errorf("quantity_selected after update: got %v, want 3", updated.Modifiers.QuantitySelected)
	}
}

// TestCompositionReloadRestoresModifiers — modifiers saved on create must survive a reload
// (GET after save) with all field values intact.
func TestCompositionReloadRestoresModifiers(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-modifiers-reload")

	id := saveComposition(t, mux, compositionPayloadWithModifiers("Reload test", 4, generated.UNILATERAL))

	detail := getCompositionDetail(t, mux, id)

	if detail.Modifiers == nil {
		t.Fatal("expected Modifiers non-nil on reload")
	}
	if detail.Modifiers.QuantitySelected == nil || *detail.Modifiers.QuantitySelected != 4 {
		t.Errorf("quantity_selected on reload: got %v, want 4", detail.Modifiers.QuantitySelected)
	}
	if detail.Modifiers.Laterality == nil || *detail.Modifiers.Laterality != generated.UNILATERAL {
		t.Errorf("laterality on reload: got %v, want UNILATERAL", detail.Modifiers.Laterality)
	}
}

// TestCompositionNilModifiersFallback — compositions created WITHOUT modifiers (pre-018 row
// behaviour) must load correctly with Modifiers == nil, not crashing the handler.
func TestCompositionNilModifiersFallback(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-modifiers-nil")

	// compositionPayload does not set Modifiers.
	id := saveComposition(t, mux, compositionPayload("Sem modificadores"))
	detail := getCompositionDetail(t, mux, id)

	// Modifiers must be nil (omitted from JSON) — not an empty struct.
	if detail.Modifiers != nil {
		t.Errorf("expected nil Modifiers for composition without modifiers, got %+v", detail.Modifiers)
	}
}

// TestCompositionRoundTrip — full lifecycle: create with modifiers, update with different
// modifiers, reload and verify all other fields are unchanged.
func TestCompositionRoundTrip(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-round-trip")

	// Create: 2 segments, bilateral.
	id := saveComposition(t, mux, compositionPayloadWithModifiers("L3-L4", 2, generated.BILATERAL))
	created := getCompositionDetail(t, mux, id)

	if created.Name != "L3-L4" {
		t.Errorf("created name: got %q", created.Name)
	}
	if created.Modifiers == nil || *created.Modifiers.QuantitySelected != 2 {
		t.Errorf("created modifiers quantity: %v", created.Modifiers)
	}

	// Update: 3 segments, unilateral.
	updated := updateComposition(t, mux, id, compositionPayloadWithModifiers("L3-L5", 3, generated.UNILATERAL))
	if updated.Name != "L3-L5" {
		t.Errorf("updated name: got %q", updated.Name)
	}
	if updated.Modifiers == nil || *updated.Modifiers.QuantitySelected != 3 {
		t.Errorf("updated modifiers quantity: %v", updated.Modifiers)
	}
	if updated.Modifiers.Laterality == nil || *updated.Modifiers.Laterality != generated.UNILATERAL {
		t.Errorf("updated modifiers laterality: %v", updated.Modifiers.Laterality)
	}

	// Final reload to confirm update is durable.
	reloaded := getCompositionDetail(t, mux, id)
	if reloaded.Name != "L3-L5" {
		t.Errorf("reloaded name: got %q", reloaded.Name)
	}
	if reloaded.Modifiers == nil || *reloaded.Modifiers.QuantitySelected != 3 {
		t.Errorf("reloaded modifiers quantity: %v", reloaded.Modifiers)
	}
	if reloaded.AccessRouteType != generated.Same {
		t.Errorf("reloaded access_route_type: got %q", reloaded.AccessRouteType)
	}
	if reloaded.AuxiliariesCount != 2 {
		t.Errorf("reloaded auxiliaries_count: got %d", reloaded.AuxiliariesCount)
	}
}

// TestCompositionAdjustmentsPersistedWithModifiers — adjustments and modifiers are
// independent; both must survive save and reload.
func TestCompositionAdjustmentsPersistedWithModifiers(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-adj-modifiers")

	qty := 2
	lat := generated.BILATERAL
	sbnID := "spine-sbn-adj"
	adj := []string{"emergency_special_hours"}
	req := generated.SaveCompositionRequest{
		Name:             "Artrodese urgência",
		SbnProcedureName: "ARTRODESE LOMBAR",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.06.01.01-0", Description: "Artrodese", Porte: "12A",
				BillingMode: generated.PERSEGMENT, Specialty: generated.Specialty("SPINE"),
				LateralitySupport: true, Laterality: &lat, QuantitySelected: &qty},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   1,
		RequiresAnesthesia: true,
		Adjustments:        &adj,
		Modifiers: &generated.BillingModifiers{
			QuantitySelected: &qty,
			Laterality:       &lat,
		},
	}
	b, _ := json.Marshal(req)

	id := saveComposition(t, mux, b)
	detail := getCompositionDetail(t, mux, id)

	if len(detail.Adjustments) != 1 || detail.Adjustments[0] != "emergency_special_hours" {
		t.Errorf("adjustments: got %v", detail.Adjustments)
	}
	if detail.Modifiers == nil || detail.Modifiers.QuantitySelected == nil {
		t.Error("expected non-nil modifiers after save with both adjustments and modifiers")
	}
}
