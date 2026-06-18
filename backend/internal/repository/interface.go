// Package repository defines the data-access contract for Synvera.
package repository

import "synvera/backend/internal/models"

// Repository is the unified data-access contract for Synvera.
// Both FileRepository (development/fallback) and PostgresRepository (production)
// must satisfy this interface.
type Repository interface {
	// ── Procedure catalog ─────────────────────────────────────────────────────

	// Search returns SBN procedures whose name, CBHPM codes, or descriptions
	// match the query. Results are deduplicated at the SBN procedure level.
	Search(query string) ([]models.SBNProcedure, error)

	// GetByID returns the full procedure package (SBN metadata + suggested CBHPM codes).
	GetByID(id string) (*models.ProcedureWithCodes, error)

	// ── Physician accounts ─────────────────────────────────────────────────────

	// FindOrCreatePhysician looks up the physician with the given Clerk user ID,
	// creating a new record if one does not exist. email and name are only applied
	// on creation; subsequent calls with the same clerkUserID return the existing record.
	FindOrCreatePhysician(clerkUserID, email, name string) (*models.PhysicianAccount, error)

	// ── Compositions (primary persistence model) ──────────────────────────────

	// SaveComposition persists a new composition owned by physicianID
	// and returns it with ID and timestamps populated.
	SaveComposition(comp models.Composition, physicianID string) (*models.Composition, error)

	// ListCompositions returns compositions owned by physicianID, newest-first (up to 100).
	ListCompositions(physicianID string) ([]models.CompositionSummary, error)

	// GetCompositionByPublicID retrieves a composition by its public UUID,
	// returning nil, nil when not found or when it does not belong to physicianID.
	GetCompositionByPublicID(publicID, physicianID string) (*models.Composition, error)

	// UpdateComposition replaces a composition's editable fields by public ID,
	// only when the composition belongs to physicianID.
	// Returns nil, nil when not found or when ownership does not match.
	UpdateComposition(publicID string, comp models.Composition, physicianID string) (*models.Composition, error)

	// DeleteCompositionByPublicID removes a composition owned by physicianID.
	// Returns (true, nil) when deleted, (false, nil) when not found or wrong owner.
	DeleteCompositionByPublicID(publicID, physicianID string) (bool, error)

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
