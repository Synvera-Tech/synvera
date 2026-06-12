// Package repository defines the data-access contract for Afere.
package repository

import "afere/backend/internal/models"

// Repository is the unified data-access contract for Afere.
// Both FileRepository (development/fallback) and PostgresRepository (production)
// must satisfy this interface.
type Repository interface {
	// ── Procedure catalog ─────────────────────────────────────────────────────

	// Search returns SBN procedures whose name, CBHPM codes, or descriptions
	// match the query. Results are deduplicated at the SBN procedure level.
	Search(query string) ([]models.SBNProcedure, error)

	// GetByID returns the full procedure package (SBN metadata + suggested CBHPM codes).
	GetByID(id string) (*models.ProcedureWithCodes, error)

	// ── Compositions (primary persistence model) ──────────────────────────────

	// SaveComposition persists a new composition and returns it with ID and timestamps populated.
	SaveComposition(comp models.Composition) (*models.Composition, error)

	// ListCompositions returns all compositions ordered newest-first (up to 100).
	ListCompositions() ([]models.CompositionSummary, error)

	// GetCompositionByPublicID retrieves a composition by its public UUID.
	// Returns nil, nil when not found.
	GetCompositionByPublicID(publicID string) (*models.Composition, error)

	// UpdateComposition replaces a composition's editable fields by public ID.
	// Returns nil, nil when not found.
	UpdateComposition(publicID string, comp models.Composition) (*models.Composition, error)

	// DeleteCompositionByPublicID removes a composition. Returns (true, nil) when
	// deleted, (false, nil) when not found.
	DeleteCompositionByPublicID(publicID string) (bool, error)

	// ── Calculations (legacy snapshot persistence) ────────────────────────────

	// SaveCalculation persists a completed valuation snapshot. Retained for the
	// share-report flow; not the primary save action in the UI.
	SaveCalculation(calc models.Calculation) (*models.Calculation, error)

	// ListCalculations returns saved calculation snapshots ordered newest-first.
	ListCalculations() ([]models.CalculationSummary, error)

	// GetCalculationByPublicID retrieves a calculation snapshot by public UUID.
	GetCalculationByPublicID(publicID string) (*models.Calculation, error)

	// DeleteCalculationByPublicID removes a calculation snapshot.
	// Returns (true, nil) when deleted, (false, nil) when not found.
	DeleteCalculationByPublicID(publicID string) (bool, error)
}
