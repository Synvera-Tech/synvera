package handlers

import (
	"net/http"

	"synvera/backend/internal/repository"
)

// RegisterRoutes wires all HTTP routes onto mux, injecting the repository and
// authentication middleware. auth is applied to all composition endpoints;
// other endpoints remain public.
func RegisterRoutes(mux *http.ServeMux, repo repository.Repository, auth AuthMiddlewareFunc) {
	mux.HandleFunc("/api/health", withCORS(health))
	mux.HandleFunc("/api/procedures/search", withCORS(makeSearchHandler(repo)))
	mux.HandleFunc("/api/procedures/", withCORS(makeGetProcedureHandler(repo)))
	mux.HandleFunc("/api/calculate", withCORS(makeCalculateHandler(repo)))

	// Compositions — protected by Clerk authentication.
	// CORS is applied outside auth so that OPTIONS preflight requests are handled
	// without requiring an Authorization header.
	mux.Handle("/api/compositions", withCORSHandler(auth(makeCompositionsCollectionHandler(repo))))
	mux.Handle("/api/compositions/", withCORSHandler(auth(makeCompositionItemHandler(repo))))

	// Calculations — legacy snapshot persistence (retained for share-report flow, no auth required).
	mux.HandleFunc("/api/calculations", withCORS(makeCalculationsCollectionHandler(repo)))
	mux.HandleFunc("/api/calculations/", withCORS(makeCalculationItemHandler(repo)))

	// Document Search (RAG v0) — PostgreSQL FTS, no auth required.
	mux.HandleFunc("/api/document-search", withCORS(makeDocumentSearchHandler(repo)))
}
