package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"synvera/backend/internal/handlers"
	"synvera/backend/internal/repository"
)

func postDocumentSearch(t *testing.T, repo *repository.FileRepository, body any) *httptest.ResponseRecorder {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	req := httptest.NewRequest(http.MethodPost, "/api/document-search", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func TestDocumentSearch_RejectsGet(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository(), noopAuth)
	req := httptest.NewRequest(http.MethodGet, "/api/document-search", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w.Code)
	}
}

func TestDocumentSearch_RejectsEmptyQuery(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": ""})
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty query, got %d", w.Code)
	}
}

func TestDocumentSearch_RejectsShortQuery(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "ab"})
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for 2-char query, got %d", w.Code)
	}
}

func TestDocumentSearch_RejectsInvalidJSON(t *testing.T) {
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repository.NewFileRepository(), noopAuth)
	req := httptest.NewRequest(http.MethodPost, "/api/document-search", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestDocumentSearch_FileRepositoryReturnsEmptyResults(t *testing.T) {
	// FileRepository.SearchDocuments always returns [] (no in-memory FTS index).
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "craniotomia descompressiva"})
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Results []any `json:"results"`
	}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Results == nil {
		t.Error("results field must not be null")
	}
}

func TestDocumentSearch_LimitClamped(t *testing.T) {
	// Providing a limit above maxSearchLimit (30) must not crash or error.
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "urgencia emergencia", "limit": 999})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 with clamped limit, got %d", w.Code)
	}
}

func TestDocumentSearch_DefaultLimitApplied(t *testing.T) {
	// Omitting limit should not produce an error.
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "porte cirurgico auxiliar"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 with default limit, got %d", w.Code)
	}
}

// Natural-language queries must be accepted (200) and normalised to meaningful
// terms before reaching the repository. FileRepository always returns [] but
// must not error or produce 400/500.
func TestDocumentSearch_NaturalLanguageAuxiliares(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "Qual é a regra para auxiliares?"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for natural-language query, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDocumentSearch_NaturalLanguageUrgencia(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "Como funciona urgência?"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestDocumentSearch_NaturalLanguageViaDeAcesso(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "Qual regra para via de acesso?"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestDocumentSearch_NaturalLanguageMultiplosSegmentos(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "múltiplos segmentos"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestDocumentSearch_NaturalLanguageArtrode(t *testing.T) {
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "artrodese cervical"})
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestDocumentSearch_ResultsFieldNeverNull(t *testing.T) {
	// Even with zero results the response must have results: [] not results: null.
	repo := repository.NewFileRepository()
	w := postDocumentSearch(t, repo, map[string]any{"query": "Qual é a regra para auxiliares?"})
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp struct {
		Results []any `json:"results"`
	}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Results == nil {
		t.Error("results field must not be null for natural-language query")
	}
}
