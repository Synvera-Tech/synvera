package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"synvera/backend/internal/repository"
)

const (
	defaultSearchLimit = 10
	maxSearchLimit     = 30
	minQueryLength     = 3
)

type documentSearchRequest struct {
	Query    string `json:"query"`
	Limit    int    `json:"limit,omitempty"`
	Offset   int    `json:"offset,omitempty"`
	DocType  string `json:"document_type,omitempty"`
}

type documentSearchResponse struct {
	Results []documentSearchResult `json:"results"`
}

type documentSearchResult struct {
	Document string  `json:"document"`
	Version  string  `json:"version"`
	Page     int     `json:"page"`
	Section  string  `json:"section"`
	Excerpt  string  `json:"excerpt"`
	Score    float64 `json:"score"`
}

func makeDocumentSearchHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method_not_allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var req documentSearchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"invalid_json"}`, http.StatusBadRequest)
			return
		}

		req.Query = strings.TrimSpace(req.Query)
		if len(req.Query) < minQueryLength {
			http.Error(w, `{"error":"query_too_short","message":"A consulta deve ter pelo menos 3 caracteres."}`, http.StatusBadRequest)
			return
		}

		limit := req.Limit
		if limit <= 0 {
			limit = defaultSearchLimit
		}
		if limit > maxSearchLimit {
			limit = maxSearchLimit
		}

		offset := req.Offset
		if offset < 0 {
			offset = 0
		}

		// Validate docType: only known values are forwarded; unknown values are silently treated as "all".
		docType := ""
		switch req.DocType {
		case "cbhpm", "sbn_manual", "spine_manual":
			docType = req.DocType
		}

		raw, err := repo.SearchDocuments(req.Query, limit, offset, docType)
		if err != nil {
			http.Error(w, `{"error":"search_failed"}`, http.StatusInternalServerError)
			return
		}

		results := make([]documentSearchResult, 0, len(raw))
		for _, r := range raw {
			results = append(results, documentSearchResult{
				Document: r.Document,
				Version:  r.Version,
				Page:     r.Page,
				Section:  r.Section,
				Excerpt:  r.Excerpt,
				Score:    r.Score,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(documentSearchResponse{Results: results})
	}
}
