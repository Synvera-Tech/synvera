package repository

import (
	"embed"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"synvera/backend/internal/models"
)

//go:embed procedures.json
var catalogFS embed.FS

// flatEntry mirrors one row in the embedded procedures.json.
type flatEntry struct {
	ProcedureName    string `json:"procedure_name"`
	CBHPMCode        string `json:"cbhpm_code"`
	Description      string `json:"description"`
	Porte            string `json:"porte"`
	NumAuxiliaries   int    `json:"num_auxiliaries"`
	BillingMode      string `json:"billing_mode"`
	Specialty        string `json:"specialty"`
	LateralitySupport bool   `json:"laterality_support"`
}

// FileRepository is a Repository backed by the embedded procedures.json
// and in-memory stores for physicians, compositions, and calculations (development/testing).
type FileRepository struct {
	// procedures is the ordered list of unique SBN procedures.
	procedures []models.ProcedureWithCodes
	// byID is a fast O(1) lookup from string ID → index.
	byID map[string]int

	// physicianMu guards the in-memory physician account stores.
	physicianMu       sync.RWMutex
	physiciansByClerk map[string]*models.PhysicianAccount // keyed by clerk_user_id
	physiciansByID    map[string]*models.PhysicianAccount // keyed by internal UUID

	// composeMu guards the in-memory composition store.
	composeMu    sync.RWMutex
	compositions map[string]*models.Composition // keyed by public_id

	// calcMu guards the in-memory calculation store.
	calcMu       sync.RWMutex
	calculations map[string]*models.Calculation // keyed by public_id
}

// NewFileRepository loads and indexes procedures.json. It panics on data corruption
// because a missing catalog is a fatal misconfiguration, not a runtime error.
func NewFileRepository() *FileRepository {
	raw, err := catalogFS.ReadFile("procedures.json")
	if err != nil {
		log.Fatalf("repository: read embedded catalog: %v", err)
	}

	var flat []flatEntry
	if err := json.Unmarshal(raw, &flat); err != nil {
		log.Fatalf("repository: decode catalog: %v", err)
	}

	return buildIndex(flat)
}

// buildIndex groups the flat entries by procedure_name, deduplicates CBHPM codes
// within each group (preserving first-occurrence order), and assigns sequential IDs.
func buildIndex(flat []flatEntry) *FileRepository {
	// nameOrder preserves the first-seen order of procedure names.
	nameOrder := make([]string, 0)
	// codesByName holds deduplicated CBHPM code lists keyed by procedure name.
	codesByName := make(map[string][]models.CBHPMCode)
	// seenCodes deduplicates (name, cbhpm_code) pairs.
	seenCodes := make(map[string]map[string]struct{})

	for _, e := range flat {
		if _, exists := codesByName[e.ProcedureName]; !exists {
			nameOrder = append(nameOrder, e.ProcedureName)
			codesByName[e.ProcedureName] = nil
			seenCodes[e.ProcedureName] = make(map[string]struct{})
		}
		if _, dup := seenCodes[e.ProcedureName][e.CBHPMCode]; dup {
			continue
		}
		seenCodes[e.ProcedureName][e.CBHPMCode] = struct{}{}
		codesByName[e.ProcedureName] = append(codesByName[e.ProcedureName], models.CBHPMCode{
			Code:              e.CBHPMCode,
			Description:       e.Description,
			Porte:             e.Porte,
			NumAuxiliaries:    e.NumAuxiliaries,
			BillingMode:       models.BillingMode(e.BillingMode),
			Specialty:         models.Specialty(e.Specialty),
			LateralitySupport: e.LateralitySupport,
		})
	}

	procedures := make([]models.ProcedureWithCodes, 0, len(nameOrder))
	byID := make(map[string]int, len(nameOrder))

	for i, name := range nameOrder {
		id := idFromIndex(i)
		procedures = append(procedures, models.ProcedureWithCodes{
			SBNProcedure: models.SBNProcedure{ID: id, Name: name},
			Codes:        codesByName[name],
		})
		byID[id] = i
	}

	return &FileRepository{
		procedures:        procedures,
		byID:              byID,
		physiciansByClerk: make(map[string]*models.PhysicianAccount),
		physiciansByID:    make(map[string]*models.PhysicianAccount),
		compositions:      make(map[string]*models.Composition),
		calculations:      make(map[string]*models.Calculation),
	}
}

// Search returns up to 20 SBN procedures matching the query.
// Matching is accent-insensitive and checked against the procedure name,
// all CBHPM codes, and all CBHPM descriptions within the procedure.
func (r *FileRepository) Search(query string) ([]models.SBNProcedure, error) {
	if len(strings.TrimSpace(query)) < 2 {
		return nil, nil
	}
	norm := normalizeQuery(query)
	results := make([]models.SBNProcedure, 0, 20)

	for _, p := range r.procedures {
		if procedureMatches(p, norm) {
			results = append(results, p.SBNProcedure)
			if len(results) == 20 {
				break
			}
		}
	}
	return results, nil
}

// GetByID returns the full procedure package for the given ID, or nil if not found.
func (r *FileRepository) GetByID(id string) (*models.ProcedureWithCodes, error) {
	idx, ok := r.byID[id]
	if !ok {
		return nil, nil
	}
	p := r.procedures[idx]
	return &p, nil
}

// procedureMatches reports whether any text field within p contains the query.
func procedureMatches(p models.ProcedureWithCodes, normQuery string) bool {
	if strings.Contains(normalizeQuery(p.Name), normQuery) {
		return true
	}
	for _, c := range p.Codes {
		if strings.Contains(c.Code, normQuery) {
			return true
		}
		if strings.Contains(normalizeQuery(c.Description), normQuery) {
			return true
		}
	}
	return false
}

// normalizeQuery strips accents and lowercases the value for accent-insensitive search.
func normalizeQuery(value string) string {
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "â", "a", "ã", "a", "ä", "a",
		"Á", "a", "À", "a", "Â", "a", "Ã", "a", "Ä", "a",
		"é", "e", "ê", "e", "ë", "e", "É", "e", "Ê", "e", "Ë", "e",
		"í", "i", "î", "i", "ï", "i", "Í", "i", "Î", "i", "Ï", "i",
		"ó", "o", "ô", "o", "õ", "o", "ö", "o", "Ó", "o", "Ô", "o", "Õ", "o", "Ö", "o",
		"ú", "u", "û", "u", "ü", "u", "Ú", "u", "Û", "u", "Ü", "u",
		"ç", "c", "Ç", "c",
	)
	return strings.TrimSpace(strings.ToLower(replacer.Replace(value)))
}

// idFromIndex converts a zero-based slice index to the stable string ID used in URLs.
func idFromIndex(i int) string {
	// Simple human-readable IDs that remain stable as long as procedures.json
	// does not change its ordering. Use strconv.Itoa to avoid importing fmt.
	const digits = "0123456789"
	if i < 0 {
		return "0"
	}
	n := i + 1
	buf := make([]byte, 0, 6)
	for n > 0 {
		buf = append([]byte{digits[n%10]}, buf...)
		n /= 10
	}
	return string(buf)
}

// ── Physician accounts ────────────────────────────────────────────────────────

// FindOrCreatePhysician looks up or creates an in-memory physician account.
func (r *FileRepository) FindOrCreatePhysician(clerkUserID, email, name string) (*models.PhysicianAccount, error) {
	r.physicianMu.RLock()
	if p, ok := r.physiciansByClerk[clerkUserID]; ok {
		r.physicianMu.RUnlock()
		cp := *p
		return &cp, nil
	}
	r.physicianMu.RUnlock()

	id, err := models.GeneratePublicID()
	if err != nil {
		return nil, fmt.Errorf("generate physician id: %w", err)
	}
	now := time.Now().UTC()
	p := &models.PhysicianAccount{
		ID:          id,
		ClerkUserID: clerkUserID,
		Email:       email,
		Name:        name,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	r.physicianMu.Lock()
	// Double-check after acquiring write lock.
	if existing, ok := r.physiciansByClerk[clerkUserID]; ok {
		r.physicianMu.Unlock()
		cp := *existing
		return &cp, nil
	}
	r.physiciansByClerk[clerkUserID] = p
	r.physiciansByID[id] = p
	r.physicianMu.Unlock()

	cp := *p
	return &cp, nil
}

// ── Composition CRUD ──────────────────────────────────────────────────────────

// SaveComposition stores a new composition in-memory and returns the populated record.
func (r *FileRepository) SaveComposition(comp models.Composition, physicianID string) (*models.Composition, error) {
	publicID, err := models.GeneratePublicID()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	comp.ID = "file-" + publicID
	comp.PublicID = publicID
	comp.PhysicianID = physicianID
	comp.CreatedAt = now
	comp.UpdatedAt = now

	r.composeMu.Lock()
	r.compositions[publicID] = &comp
	r.composeMu.Unlock()

	result := comp
	return &result, nil
}

// ListCompositions returns all in-memory compositions owned by physicianID, newest-first.
func (r *FileRepository) ListCompositions(physicianID string) ([]models.CompositionSummary, error) {
	r.composeMu.RLock()
	defer r.composeMu.RUnlock()

	summaries := make([]models.CompositionSummary, 0, len(r.compositions))
	for _, c := range r.compositions {
		if c.PhysicianID != physicianID {
			continue
		}
		summaries = append(summaries, models.CompositionSummary{
			PublicID:           c.PublicID,
			Name:               c.Name,
			SBNProcedureID:     c.SBNProcedureID,
			SBNProcedureName:   c.SBNProcedureName,
			AccessRouteType:    c.AccessRouteType,
			AuxiliariesCount:   c.AuxiliariesCount,
			RequiresAnesthesia: c.RequiresAnesthesia,
			CreatedAt:          c.CreatedAt,
		})
	}
	sort.Slice(summaries, func(i, j int) bool {
		return summaries[i].CreatedAt.After(summaries[j].CreatedAt)
	})
	return summaries, nil
}

// GetCompositionByPublicID returns the composition only when it exists and belongs to physicianID.
func (r *FileRepository) GetCompositionByPublicID(publicID, physicianID string) (*models.Composition, error) {
	r.composeMu.RLock()
	c, ok := r.compositions[publicID]
	r.composeMu.RUnlock()
	if !ok || c.PhysicianID != physicianID {
		return nil, nil
	}
	result := *c
	return &result, nil
}

// UpdateComposition replaces a composition's editable fields only when it belongs to physicianID.
func (r *FileRepository) UpdateComposition(publicID string, comp models.Composition, physicianID string) (*models.Composition, error) {
	r.composeMu.Lock()
	defer r.composeMu.Unlock()
	existing, ok := r.compositions[publicID]
	if !ok || existing.PhysicianID != physicianID {
		return nil, nil
	}
	comp.ID = existing.ID
	comp.PublicID = publicID
	comp.PhysicianID = physicianID
	comp.CreatedAt = existing.CreatedAt
	comp.UpdatedAt = time.Now().UTC()
	r.compositions[publicID] = &comp
	result := comp
	return &result, nil
}

// DeleteCompositionByPublicID removes the composition only when it belongs to physicianID.
func (r *FileRepository) DeleteCompositionByPublicID(publicID, physicianID string) (bool, error) {
	r.composeMu.Lock()
	defer r.composeMu.Unlock()
	c, ok := r.compositions[publicID]
	if !ok || c.PhysicianID != physicianID {
		return false, nil
	}
	delete(r.compositions, publicID)
	return true, nil
}

// ── Calculation snapshot persistence (legacy) ─────────────────────────────────

// SaveCalculation stores the calculation in the in-memory map and returns the
// populated record. This satisfies the Repository interface for development
// and testing; data does not survive process restarts.
func (r *FileRepository) SaveCalculation(calc models.Calculation) (*models.Calculation, error) {
	publicID, err := models.GeneratePublicID()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	calc.ID = "file-" + publicID
	calc.PublicID = publicID
	calc.CreatedAt = now
	calc.UpdatedAt = now

	r.calcMu.Lock()
	r.calculations[publicID] = &calc
	r.calcMu.Unlock()

	result := calc
	return &result, nil
}

// ListCalculations returns all in-memory calculations ordered newest-first.
func (r *FileRepository) ListCalculations() ([]models.CalculationSummary, error) {
	r.calcMu.RLock()
	defer r.calcMu.RUnlock()

	summaries := make([]models.CalculationSummary, 0, len(r.calculations))
	for _, c := range r.calculations {
		summaries = append(summaries, models.CalculationSummary{
			PublicID:              c.PublicID,
			ProcedureName:         c.ProcedureName,
			ProcedureSBNCode:      c.ProcedureSBNCode,
			SurgeonValue:          c.SurgeonValue,
			AuxiliariesTotalValue: c.AuxiliariesTotalValue,
			AnesthesiologistValue: c.AnesthesiologistValue,
			TeamTotalValue:        c.TeamTotalValue,
			AuxiliariesCount:      c.AuxiliariesCount,
			RequiresAnesthesia:    c.RequiresAnesthesia,
			AccessRoute:           c.AccessRoute,
			CreatedAt:             c.CreatedAt,
		})
	}
	sort.Slice(summaries, func(i, j int) bool {
		return summaries[i].CreatedAt.After(summaries[j].CreatedAt)
	})
	return summaries, nil
}

// GetCalculationByPublicID returns the in-memory calculation or nil if not found.
func (r *FileRepository) GetCalculationByPublicID(publicID string) (*models.Calculation, error) {
	r.calcMu.RLock()
	c, ok := r.calculations[publicID]
	r.calcMu.RUnlock()
	if !ok {
		return nil, nil
	}
	result := *c
	return &result, nil
}

// DeleteCalculationByPublicID removes the calculation from the in-memory store.
// Returns (true, nil) when deleted, (false, nil) when not found.
func (r *FileRepository) DeleteCalculationByPublicID(publicID string) (bool, error) {
	r.calcMu.Lock()
	defer r.calcMu.Unlock()
	if _, ok := r.calculations[publicID]; !ok {
		return false, nil
	}
	delete(r.calculations, publicID)
	return true, nil
}
