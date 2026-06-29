package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"synvera/backend/internal/billing"
	"synvera/backend/internal/generated"
	"synvera/backend/internal/models"
	"synvera/backend/internal/repository"

	"github.com/google/uuid"
)

// decodeAndValidateComposition parses and validates the fields shared by
// both save and update requests. Returns the decoded request or writes an
// error to w and returns false.
func decodeAndValidateComposition(w http.ResponseWriter, r *http.Request) (generated.SaveCompositionRequest, bool) {
	var req generated.SaveCompositionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return req, false
	}
	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return req, false
	}
	if strings.TrimSpace(req.SbnProcedureName) == "" {
		http.Error(w, "sbn_procedure_name is required", http.StatusBadRequest)
		return req, false
	}
	if len(req.SelectedCodes) == 0 {
		http.Error(w, "selected_codes must not be empty", http.StatusBadRequest)
		return req, false
	}
	if req.AuxiliariesCount < 0 || req.AuxiliariesCount > 4 {
		http.Error(w, "auxiliaries_count must be between 0 and 4", http.StatusBadRequest)
		return req, false
	}
	if req.AccessRouteType != generated.Same && req.AccessRouteType != generated.Different {
		http.Error(w, "access_route_type must be 'same' or 'different'", http.StatusBadRequest)
		return req, false
	}
	return req, true
}

func reqToComposition(req generated.SaveCompositionRequest) models.Composition {
	codes := make([]models.SelectedCode, 0, len(req.SelectedCodes))
	for _, c := range req.SelectedCodes {
		qty := 1
		if c.QuantitySelected != nil {
			qty = *c.QuantitySelected
		}
		lat := models.LateralityUnilateral
		if c.Laterality != nil {
			lat = models.Laterality(*c.Laterality)
		}
		codes = append(codes, models.SelectedCode{
			CBHPMCode:         c.CbhpmCode,
			Description:       c.Description,
			Porte:             c.Porte,
			BillingMode:       models.BillingMode(c.BillingMode),
			Specialty:         models.Specialty(c.Specialty),
			LateralitySupport: c.LateralitySupport,
			QuantitySelected:  qty,
			Laterality:        lat,
		})
	}
	sbnProcID := ""
	if req.SbnProcedureId != nil {
		sbnProcID = *req.SbnProcedureId
	}
	adjustments := []string{}
	if req.Adjustments != nil {
		adjustments = *req.Adjustments
	}

	var modifiers *models.CompositionModifiers
	if req.Modifiers != nil {
		m := &models.CompositionModifiers{}
		if req.Modifiers.QuantitySelected != nil {
			m.QuantitySelected = *req.Modifiers.QuantitySelected
		}
		if req.Modifiers.Laterality != nil {
			m.Laterality = models.Laterality(*req.Modifiers.Laterality)
		}
		if req.Modifiers.VertebralRegion != nil {
			m.VertebralRegion = string(*req.Modifiers.VertebralRegion)
		}
		if req.Modifiers.SurgicalApproach != nil {
			m.SurgicalApproach = string(*req.Modifiers.SurgicalApproach)
		}
		if req.Modifiers.FusionStatus != nil {
			m.FusionStatus = string(*req.Modifiers.FusionStatus)
		}
		if req.Modifiers.ImplantCategory != nil {
			m.ImplantCategory = string(*req.Modifiers.ImplantCategory)
		}
		if req.Modifiers.OsteoporosisAware != nil {
			m.OsteoporosisAware = *req.Modifiers.OsteoporosisAware
		}
		if req.Modifiers.ClinicalContext != nil {
			m.ClinicalContext = string(*req.Modifiers.ClinicalContext)
		}
		if req.Modifiers.AnesthesiaAssistant != nil {
			m.AnesthesiaAssistant = *req.Modifiers.AnesthesiaAssistant
		}
		modifiers = m
	}

	return models.Composition{
		Name:               req.Name,
		SBNProcedureID:     sbnProcID,
		SBNProcedureName:   req.SbnProcedureName,
		SelectedCodes:      codes,
		AccessRouteType:    models.AccessRouteType(req.AccessRouteType),
		AuxiliariesCount:   req.AuxiliariesCount,
		RequiresAnesthesia: req.RequiresAnesthesia,
		Adjustments:        adjustments,
		Modifiers:          modifiers,
	}
}

// modifiersToGenerated converts a domain CompositionModifiers pointer to the generated API type.
// Returns nil when the domain value is nil (no modifiers recorded).
func modifiersToGenerated(m *models.CompositionModifiers) *generated.BillingModifiers {
	if m == nil {
		return nil
	}
	g := &generated.BillingModifiers{}
	if m.QuantitySelected != 0 {
		g.QuantitySelected = &m.QuantitySelected
	}
	if m.Laterality != "" {
		lat := generated.Laterality(m.Laterality)
		g.Laterality = &lat
	}
	if m.VertebralRegion != "" {
		vr := generated.BillingModifiersVertebralRegion(m.VertebralRegion)
		g.VertebralRegion = &vr
	}
	if m.SurgicalApproach != "" {
		sa := generated.BillingModifiersSurgicalApproach(m.SurgicalApproach)
		g.SurgicalApproach = &sa
	}
	if m.FusionStatus != "" {
		fs := generated.BillingModifiersFusionStatus(m.FusionStatus)
		g.FusionStatus = &fs
	}
	if m.ImplantCategory != "" {
		ic := generated.BillingModifiersImplantCategory(m.ImplantCategory)
		g.ImplantCategory = &ic
	}
	if m.OsteoporosisAware {
		g.OsteoporosisAware = &m.OsteoporosisAware
	}
	if m.ClinicalContext != "" {
		cc := generated.BillingModifiersClinicalContext(m.ClinicalContext)
		g.ClinicalContext = &cc
	}
	if m.AnesthesiaAssistant {
		aa := true
		g.AnesthesiaAssistant = &aa
	}
	return g
}

// requirePhysician extracts the physician ID from the request context.
// If not present (auth middleware was not applied), it writes 401 and returns ("", false).
func requirePhysician(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, ok := physicianIDFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return "", false
	}
	return id, true
}

// makeSaveCompositionHandler handles POST /api/compositions.
func makeSaveCompositionHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		physicianID, ok := requirePhysician(w, r)
		if !ok {
			return
		}

		// Plan limit enforcement: check composition cap before writing.
		if physician, ok := physicianAccountFromContext(r.Context()); ok {
			limits := billing.GetLimits(billing.PlanType(physician.PlanType))
			if !billing.IsUnlimited(limits.MaxCompositions) {
				count, err := repo.CountCompositionsByPhysician(physicianID)
				if err != nil {
					log.Printf("count compositions for plan check: %v", err)
					http.Error(w, "internal server error", http.StatusInternalServerError)
					return
				}
				if count >= limits.MaxCompositions {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusForbidden)
					_, _ = w.Write([]byte(`{"error":"plan_limit_reached","message":"O plano gratuito permite até 4 composições salvas."}`))
					return
				}
			}
		}

		req, ok := decodeAndValidateComposition(w, r)
		if !ok {
			return
		}
		saved, err := repo.SaveComposition(reqToComposition(req), physicianID)
		if err != nil {
			log.Printf("save composition: %v", err)
			http.Error(w, "failed to save composition", http.StatusInternalServerError)
			return
		}
		parsedID, parseErr := uuid.Parse(saved.PublicID)
		if parseErr != nil {
			log.Printf("parse uuid: %v", parseErr)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		respondJSON(w, http.StatusCreated, generated.SaveCompositionResponse{
			PublicId:  parsedID,
			CreatedAt: saved.CreatedAt,
		})
	}
}

// makeListCompositionsHandler handles GET /api/compositions.
func makeListCompositionsHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		physicianID, ok := requirePhysician(w, r)
		if !ok {
			return
		}
		comps, err := repo.ListCompositions(physicianID)
		if err != nil {
			log.Printf("list compositions: %v", err)
			http.Error(w, "failed to list compositions", http.StatusInternalServerError)
			return
		}
		items := make([]generated.CompositionItem, 0, len(comps))
		for _, c := range comps {
			parsedID, parseErr := uuid.Parse(c.PublicID)
			if parseErr != nil {
				log.Printf("parse uuid: %v", parseErr)
				continue
			}
			items = append(items, generated.CompositionItem{
				PublicId:           parsedID,
				Name:               c.Name,
				SbnProcedureId:     &c.SBNProcedureID,
				SbnProcedureName:   c.SBNProcedureName,
				AccessRouteType:    generated.AccessRouteType(c.AccessRouteType),
				AuxiliariesCount:   c.AuxiliariesCount,
				RequiresAnesthesia: c.RequiresAnesthesia,
				CreatedAt:          c.CreatedAt,
			})
		}
		respondJSON(w, http.StatusOK, items)
	}
}

// makeGetCompositionHandler handles GET /api/compositions/{id}.
func makeGetCompositionHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicID := strings.TrimPrefix(r.URL.Path, "/api/compositions/")
		if strings.TrimSpace(publicID) == "" {
			http.Error(w, "missing composition id", http.StatusBadRequest)
			return
		}
		physicianID, ok := requirePhysician(w, r)
		if !ok {
			return
		}
		comp, err := repo.GetCompositionByPublicID(publicID, physicianID)
		if err != nil {
			log.Printf("get composition %q: %v", publicID, err)
			http.Error(w, "failed to retrieve composition", http.StatusInternalServerError)
			return
		}
		if comp == nil {
			http.Error(w, "composition not found", http.StatusNotFound)
			return
		}
		codes := make([]generated.SelectedCode, 0, len(comp.SelectedCodes))
		for _, c := range comp.SelectedCodes {
			lat := generated.Laterality(c.Laterality)
			qty := c.QuantitySelected
			codes = append(codes, generated.SelectedCode{
				CbhpmCode:         c.CBHPMCode,
				Description:       c.Description,
				Porte:             c.Porte,
				BillingMode:       generated.BillingMode(c.BillingMode),
				Specialty:         generated.Specialty(c.Specialty),
				LateralitySupport: c.LateralitySupport,
				QuantitySelected:  &qty,
				Laterality:        &lat,
			})
		}
		parsedID, parseErr := uuid.Parse(comp.PublicID)
		if parseErr != nil {
			log.Printf("parse uuid: %v", parseErr)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		var sbnProcID *string
		if comp.SBNProcedureID != "" {
			sbnProcID = &comp.SBNProcedureID
		}
		adjustments := comp.Adjustments
		if adjustments == nil {
			adjustments = []string{}
		}
		respondJSON(w, http.StatusOK, generated.CompositionDetail{
			PublicId:           parsedID,
			Name:               comp.Name,
			SbnProcedureId:     sbnProcID,
			SbnProcedureName:   comp.SBNProcedureName,
			SelectedCodes:      codes,
			AccessRouteType:    generated.AccessRouteType(comp.AccessRouteType),
			AuxiliariesCount:   comp.AuxiliariesCount,
			RequiresAnesthesia: comp.RequiresAnesthesia,
			Adjustments:        adjustments,
			Modifiers:          modifiersToGenerated(comp.Modifiers),
			CreatedAt:          comp.CreatedAt,
			UpdatedAt:          comp.UpdatedAt,
		})
	}
}

// makeUpdateCompositionHandler handles PUT /api/compositions/{id}.
func makeUpdateCompositionHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicID := strings.TrimPrefix(r.URL.Path, "/api/compositions/")
		if strings.TrimSpace(publicID) == "" {
			http.Error(w, "missing composition id", http.StatusBadRequest)
			return
		}
		physicianID, ok := requirePhysician(w, r)
		if !ok {
			return
		}
		req, ok := decodeAndValidateComposition(w, r)
		if !ok {
			return
		}
		updated, err := repo.UpdateComposition(publicID, reqToComposition(req), physicianID)
		if err != nil {
			log.Printf("update composition %q: %v", publicID, err)
			http.Error(w, "failed to update composition", http.StatusInternalServerError)
			return
		}
		if updated == nil {
			http.Error(w, "composition not found", http.StatusNotFound)
			return
		}
		codes := make([]generated.SelectedCode, 0, len(updated.SelectedCodes))
		for _, c := range updated.SelectedCodes {
			lat := generated.Laterality(c.Laterality)
			qty := c.QuantitySelected
			codes = append(codes, generated.SelectedCode{
				CbhpmCode:         c.CBHPMCode,
				Description:       c.Description,
				Porte:             c.Porte,
				BillingMode:       generated.BillingMode(c.BillingMode),
				Specialty:         generated.Specialty(c.Specialty),
				LateralitySupport: c.LateralitySupport,
				QuantitySelected:  &qty,
				Laterality:        &lat,
			})
		}
		updatedID, parseErr := uuid.Parse(updated.PublicID)
		if parseErr != nil {
			log.Printf("parse uuid: %v", parseErr)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		var updSbnProcID *string
		if updated.SBNProcedureID != "" {
			updSbnProcID = &updated.SBNProcedureID
		}
		updAdjustments := updated.Adjustments
		if updAdjustments == nil {
			updAdjustments = []string{}
		}
		respondJSON(w, http.StatusOK, generated.CompositionDetail{
			PublicId:           updatedID,
			Name:               updated.Name,
			SbnProcedureId:     updSbnProcID,
			SbnProcedureName:   updated.SBNProcedureName,
			SelectedCodes:      codes,
			AccessRouteType:    generated.AccessRouteType(updated.AccessRouteType),
			AuxiliariesCount:   updated.AuxiliariesCount,
			RequiresAnesthesia: updated.RequiresAnesthesia,
			Adjustments:        updAdjustments,
			Modifiers:          modifiersToGenerated(updated.Modifiers),
			CreatedAt:          updated.CreatedAt,
			UpdatedAt:          updated.UpdatedAt,
		})
	}
}

// makeDeleteCompositionHandler handles DELETE /api/compositions/{id}.
func makeDeleteCompositionHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicID := strings.TrimPrefix(r.URL.Path, "/api/compositions/")
		if strings.TrimSpace(publicID) == "" {
			http.Error(w, "missing composition id", http.StatusBadRequest)
			return
		}
		physicianID, ok := requirePhysician(w, r)
		if !ok {
			return
		}
		deleted, err := repo.DeleteCompositionByPublicID(publicID, physicianID)
		if err != nil {
			log.Printf("delete composition %q: %v", publicID, err)
			http.Error(w, "failed to delete composition", http.StatusInternalServerError)
			return
		}
		if !deleted {
			http.Error(w, "composition not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

// makeCompositionsCollectionHandler dispatches GET → list, POST → save on /api/compositions.
func makeCompositionsCollectionHandler(repo repository.Repository) http.Handler {
	save := makeSaveCompositionHandler(repo)
	list := makeListCompositionsHandler(repo)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			save(w, r)
		case http.MethodGet:
			list(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})
}

// makeCompositionItemHandler dispatches GET/PUT/DELETE on /api/compositions/{id}.
func makeCompositionItemHandler(repo repository.Repository) http.Handler {
	get := makeGetCompositionHandler(repo)
	put := makeUpdateCompositionHandler(repo)
	del := makeDeleteCompositionHandler(repo)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(w, r)
		case http.MethodPut:
			put(w, r)
		case http.MethodDelete:
			del(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})
}
