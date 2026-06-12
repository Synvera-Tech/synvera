package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"afere/backend/internal/generated"
	"afere/backend/internal/handlers"
	"afere/backend/internal/repository"
)

// compositionPayload builds a minimal valid save/update request body.
func compositionPayload(name string) []byte {
	req := generated.SaveCompositionRequest{
		Name:             name,
		SBNProcedureName: "CRANIOTOMIA DESCOMPRESSIVA",
		SBNProcedureID:   "test-sbn-id",
		SelectedCodes: []generated.SelectedCode{
			{CBHPMCode: "3.02.15.02-1", Description: "Craniotomia descompressiva", Porte: "9C"},
		},
		AccessRouteType:    generated.AccessRouteSame,
		AuxiliariesCount:   2,
		RequiresAnesthesia: true,
	}
	b, _ := json.Marshal(req)
	return b
}

func saveComposition(t *testing.T, mux *http.ServeMux, payload []byte) string {
	t.Helper()
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/compositions", bytes.NewReader(payload)))
	if w.Code != http.StatusCreated {
		t.Fatalf("save composition: expected 201, got %d: %s", w.Code, w.Body)
	}
	var resp generated.SaveCompositionResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode save response: %v", err)
	}
	return resp.PublicID
}

func TestSaveComposition(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository())

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/compositions", bytes.NewReader(compositionPayload("Composição teste"))))

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body)
	}
	var resp generated.SaveCompositionResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.PublicID == "" {
		t.Error("expected non-empty public_id")
	}
}

func TestListCompositions(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository())

	saveComposition(t, mux, compositionPayload("Alpha"))
	saveComposition(t, mux, compositionPayload("Beta"))

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/compositions", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body)
	}
	var items []generated.CompositionItem
	if err := json.NewDecoder(w.Body).Decode(&items); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}
}

func TestGetComposition(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository())

	id := saveComposition(t, mux, compositionPayload("Minha composição"))

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/compositions/"+id, nil))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body)
	}
	var detail generated.CompositionDetail
	if err := json.NewDecoder(w.Body).Decode(&detail); err != nil {
		t.Fatalf("decode detail: %v", err)
	}
	if detail.Name != "Minha composição" {
		t.Errorf("expected name %q, got %q", "Minha composição", detail.Name)
	}
	if len(detail.SelectedCodes) != 1 {
		t.Errorf("expected 1 selected code, got %d", len(detail.SelectedCodes))
	}
	if detail.AuxiliariesCount != 2 {
		t.Errorf("expected auxiliaries_count 2, got %d", detail.AuxiliariesCount)
	}
}

func TestUpdateComposition(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository())

	id := saveComposition(t, mux, compositionPayload("Original"))

	updated := generated.SaveCompositionRequest{
		Name:             "Atualizada",
		SBNProcedureName: "CRANIOTOMIA DESCOMPRESSIVA",
		SBNProcedureID:   "test-sbn-id",
		SelectedCodes: []generated.SelectedCode{
			{CBHPMCode: "3.02.15.02-1", Description: "Craniotomia descompressiva", Porte: "9C"},
		},
		AccessRouteType:    generated.AccessRouteDifferent,
		AuxiliariesCount:   1,
		RequiresAnesthesia: false,
	}
	body, _ := json.Marshal(updated)

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/api/compositions/"+id, bytes.NewReader(body)))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body)
	}
	var detail generated.CompositionDetail
	if err := json.NewDecoder(w.Body).Decode(&detail); err != nil {
		t.Fatalf("decode updated detail: %v", err)
	}
	if detail.Name != "Atualizada" {
		t.Errorf("expected name %q, got %q", "Atualizada", detail.Name)
	}
	if detail.AccessRouteType != generated.AccessRouteDifferent {
		t.Errorf("expected access_route_type %q, got %q", generated.AccessRouteDifferent, detail.AccessRouteType)
	}
}

func TestDeleteComposition(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository())

	id := saveComposition(t, mux, compositionPayload("Para apagar"))

	// Delete it.
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/api/compositions/"+id, nil))
	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", w.Code, w.Body)
	}

	// Second delete must be 404.
	w2 := httptest.NewRecorder()
	mux.ServeHTTP(w2, httptest.NewRequest(http.MethodDelete, "/api/compositions/"+id, nil))
	if w2.Code != http.StatusNotFound {
		t.Errorf("expected 404 on second delete, got %d", w2.Code)
	}
}
