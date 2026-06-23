package docsearch

// SearchResult represents a single ranked chunk returned by document search.
type SearchResult struct {
	Document string  `json:"document"`
	Version  string  `json:"version"`
	Page     int     `json:"page"`
	Section  string  `json:"section"`
	Excerpt  string  `json:"excerpt"`
	Score    float64 `json:"score"`
}

// DocumentRetriever is the abstraction used by all search handlers.
// RAG v0: implemented by PostgreSQL FTS.
// RAG v1: wrap retrieval + LLM context building behind this interface without
// changing any handler or repository code.
type DocumentRetriever interface {
	SearchDocuments(query string, limit int) ([]SearchResult, error)
}
