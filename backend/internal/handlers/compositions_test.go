package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/handlers"
	"synvera/backend/internal/repository"
)

// testMux builds a mux with the test auth middleware injecting testClerkUserID.
func testMux(repo *repository.FileRepository, testClerkUserID string) *http.ServeMux {
	mux := http.NewServeMux()
	auth := handlers.MakeTestAuthMiddleware(repo, testClerkUserID)
	handlers.RegisterRoutes(mux, repo, auth)
	return mux
}

// compositionPayload builds a minimal valid save/update request body.
func compositionPayload(name string) []byte {
	sbnID := "test-sbn-id"
	req := generated.SaveCompositionRequest{
		Name:             name,
		SbnProcedureName: "CRANIOTOMIA DESCOMPRESSIVA",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.02.15.02-1", Description: "Craniotomia descompressiva", Porte: "9C"},
		},
		AccessRouteType:    generated.Same,
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
	return resp.PublicId.String()
}

func TestSaveComposition(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-save-test")

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/compositions", bytes.NewReader(compositionPayload("Composição teste"))))

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body)
	}
	var resp generated.SaveCompositionResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.PublicId.String() == "" {
		t.Error("expected non-empty public_id")
	}
}

func TestListCompositions(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-list-test")

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
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-get-test")

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
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-update-test")

	id := saveComposition(t, mux, compositionPayload("Original"))

	sbnID := "test-sbn-id"
	updated := generated.SaveCompositionRequest{
		Name:             "Atualizada",
		SbnProcedureName: "CRANIOTOMIA DESCOMPRESSIVA",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.02.15.02-1", Description: "Craniotomia descompressiva", Porte: "9C"},
		},
		AccessRouteType:    generated.Different,
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
	if detail.AccessRouteType != generated.Different {
		t.Errorf("expected access_route_type %q, got %q", generated.Different, detail.AccessRouteType)
	}
}

func TestDeleteComposition(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-delete-test")

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

func TestUnauthenticatedCompositionRequest(t *testing.T) {
	repo := repository.NewFileRepository()
	// Real Clerk middleware with empty config: no token → immediate 401 without any JWKS fetch.
	auth := handlers.MakeClerkAuthMiddleware(handlers.ClerkConfig{}, repo)
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, auth)

	cases := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/compositions"},
		{http.MethodGet, "/api/compositions"},
		{http.MethodGet, "/api/compositions/some-id"},
		{http.MethodPut, "/api/compositions/some-id"},
		{http.MethodDelete, "/api/compositions/some-id"},
	}
	for _, tc := range cases {
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, bytes.NewReader(compositionPayload("Test"))))
		if w.Code != http.StatusUnauthorized {
			t.Errorf("%s %s: expected 401, got %d", tc.method, tc.path, w.Code)
		}
	}
}

func TestUserCannotAccessOtherUserComposition(t *testing.T) {
	repo := repository.NewFileRepository()
	muxAlice := testMux(repo, "clerk-alice")
	muxBob := testMux(repo, "clerk-bob")

	// Alice creates a composition.
	id := saveComposition(t, muxAlice, compositionPayload("Composição da Alice"))

	// Bob tries GET — must receive 404 (no ownership leak).
	w := httptest.NewRecorder()
	muxBob.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/compositions/"+id, nil))
	if w.Code != http.StatusNotFound {
		t.Errorf("GET: expected 404 (Bob cannot see Alice's composition), got %d", w.Code)
	}

	// Bob tries PUT — must receive 404.
	w2 := httptest.NewRecorder()
	muxBob.ServeHTTP(w2, httptest.NewRequest(http.MethodPut, "/api/compositions/"+id, bytes.NewReader(compositionPayload("Tentativa de sobrescrever"))))
	if w2.Code != http.StatusNotFound {
		t.Errorf("PUT: expected 404 (Bob cannot update Alice's composition), got %d", w2.Code)
	}

	// Bob tries DELETE — must receive 404.
	w3 := httptest.NewRecorder()
	muxBob.ServeHTTP(w3, httptest.NewRequest(http.MethodDelete, "/api/compositions/"+id, nil))
	if w3.Code != http.StatusNotFound {
		t.Errorf("DELETE: expected 404 (Bob cannot delete Alice's composition), got %d", w3.Code)
	}

	// Alice can still GET her own composition.
	w4 := httptest.NewRecorder()
	muxAlice.ServeHTTP(w4, httptest.NewRequest(http.MethodGet, "/api/compositions/"+id, nil))
	if w4.Code != http.StatusOK {
		t.Errorf("GET: expected 200 (Alice can see her own composition), got %d", w4.Code)
	}
}

func TestPublicCalculationsDoNotRequireAuth(t *testing.T) {
	repo := repository.NewFileRepository()
	// Real Clerk middleware with no JWKS: unauthenticated requests to calculation
	// endpoints should still succeed (they are not protected).
	auth := handlers.MakeClerkAuthMiddleware(handlers.ClerkConfig{}, repo)
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, auth)

	// GET /api/calculations returns 200 without an Authorization header.
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/calculations", nil))
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for unauthenticated GET /api/calculations, got %d", w.Code)
	}
}

// TestFreePlanCompositionLimit verifies that a free-plan physician cannot save
// more than 4 compositions (billing.GetLimits("free").MaxCompositions == 4).
func TestFreePlanCompositionLimit(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-free-limit")

	// Save exactly 4 compositions — all must succeed.
	for i := range 4 {
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, httptest.NewRequest(
			http.MethodPost, "/api/compositions",
			bytes.NewReader(compositionPayload("Composição "+string(rune('A'+i))),
			)))
		if w.Code != http.StatusCreated {
			t.Fatalf("composition %d: expected 201, got %d: %s", i+1, w.Code, w.Body)
		}
	}

	// 5th composition must be rejected.
	w5 := httptest.NewRecorder()
	mux.ServeHTTP(w5, httptest.NewRequest(
		http.MethodPost, "/api/compositions",
		bytes.NewReader(compositionPayload("Composição E")),
	))
	if w5.Code != http.StatusForbidden {
		t.Fatalf("5th composition: expected 403, got %d: %s", w5.Code, w5.Body)
	}
	body := w5.Body.String()
	if !strings.Contains(body, "plan_limit_reached") {
		t.Errorf("expected plan_limit_reached in body, got: %s", body)
	}
}

// TestFreePlanIsolation verifies that the composition limit is per-physician:
// a second free-plan user is not affected by the first user's count.
func TestFreePlanIsolation(t *testing.T) {
	repo := repository.NewFileRepository()
	muxA := testMux(repo, "user-isolation-a")
	muxB := testMux(repo, "user-isolation-b")

	// Fill user A's limit.
	for range 4 {
		saveComposition(t, muxA, compositionPayload("A"))
	}

	// User B should still be able to save — their count is zero.
	w := httptest.NewRecorder()
	muxB.ServeHTTP(w, httptest.NewRequest(
		http.MethodPost, "/api/compositions",
		bytes.NewReader(compositionPayload("B first")),
	))
	if w.Code != http.StatusCreated {
		t.Fatalf("user B: expected 201, got %d: %s", w.Code, w.Body)
	}
}
