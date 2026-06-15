package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"afere/backend/internal/generated"
	"afere/backend/internal/models"
	"afere/backend/internal/repository"

	"github.com/google/uuid"
)

// makeSaveCalculationHandler returns a POST /api/calculations handler.
// Requires a completed valuation (lead_surgeon_fee > 0) before persisting.
func makeSaveCalculationHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req generated.SaveCalculationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json body", http.StatusBadRequest)
			return
		}

		if strings.TrimSpace(req.ProcedureName) == "" {
			http.Error(w, "procedure_name is required", http.StatusBadRequest)
			return
		}
		if len(req.SelectedCodes) == 0 {
			http.Error(w, "selected_codes must not be empty", http.StatusBadRequest)
			return
		}
		if req.AuxiliariesCount < 0 || req.AuxiliariesCount > 4 {
			http.Error(w, "auxiliaries_count must be between 0 and 4", http.StatusBadRequest)
			return
		}
		if req.AccessRouteType != generated.Same && req.AccessRouteType != generated.Different {
			http.Error(w, "access_route_type must be 'same' or 'different'", http.StatusBadRequest)
			return
		}
		if req.CalculationResult.LeadSurgeonFee <= 0 {
			http.Error(w, "calculation_result must contain a completed valuation (lead_surgeon_fee > 0)", http.StatusBadRequest)
			return
		}

		breakdownJSON, err := json.Marshal(req.CalculationResult)
		if err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		selectedCodes := make([]models.SelectedCode, 0, len(req.SelectedCodes))
		for _, c := range req.SelectedCodes {
			selectedCodes = append(selectedCodes, models.SelectedCode{
				CBHPMCode:   c.CbhpmCode,
				Description: c.Description,
				Porte:       c.Porte,
			})
		}

		sbnCode := ""
		if req.ProcedureSbnCode != nil {
			sbnCode = *req.ProcedureSbnCode
		}

		calc := models.Calculation{
			ProcedureName:         req.ProcedureName,
			ProcedureSBNCode:      sbnCode,
			SelectedCBHPMCodes:    selectedCodes,
			AccessRoute:           models.AccessRouteType(req.AccessRouteType),
			AuxiliariesCount:      req.AuxiliariesCount,
			RequiresAnesthesia:    req.RequiresAnesthesia,
			SurgeonValue:          float64(req.CalculationResult.LeadSurgeonFee),
			AuxiliariesTotalValue: float64(req.CalculationResult.AuxiliariesFee),
			AnesthesiologistValue: float64(req.CalculationResult.AnesthesiologistFee),
			TeamTotalValue:        float64(req.CalculationResult.FinalTotal),
			BreakdownJSON:         json.RawMessage(breakdownJSON),
		}

		saved, err := repo.SaveCalculation(calc)
		if err != nil {
			log.Printf("save calculation: %v", err)
			http.Error(w, "failed to save calculation", http.StatusInternalServerError)
			return
		}

		publicID, err := uuid.Parse(saved.PublicID)
		if err != nil {
			log.Printf("parse uuid: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		respondJSON(w, http.StatusCreated, generated.SaveCalculationResponse{
			PublicId:  publicID,
			CreatedAt: saved.CreatedAt,
		})
	}
}

// makeListCalculationsHandler returns the GET /api/calculations list handler.
func makeListCalculationsHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		calcs, err := repo.ListCalculations()
		if err != nil {
			log.Printf("list calculations: %v", err)
			http.Error(w, "failed to list calculations", http.StatusInternalServerError)
			return
		}
		summaries := make([]map[string]interface{}, 0, len(calcs))
		for _, c := range calcs {
			publicID, err := uuid.Parse(c.PublicID)
			if err != nil {
				log.Printf("parse uuid: %v", err)
				continue
			}
			summaries = append(summaries, map[string]interface{}{
				"public_id":               publicID,
				"procedure_name":          c.ProcedureName,
				"procedure_sbn_code":      c.ProcedureSBNCode,
				"surgeon_value":           c.SurgeonValue,
				"auxiliaries_total_value": c.AuxiliariesTotalValue,
				"anesthesiologist_value":  c.AnesthesiologistValue,
				"team_total_value":        c.TeamTotalValue,
				"auxiliaries_count":       c.AuxiliariesCount,
				"requires_anesthesia":     c.RequiresAnesthesia,
				"access_route_type":       string(c.AccessRoute),
				"created_at":              c.CreatedAt,
			})
		}
		respondJSON(w, http.StatusOK, summaries)
	}
}

// makeCalculationsCollectionHandler dispatches GET → list, POST → save on /api/calculations.
func makeCalculationsCollectionHandler(repo repository.Repository) http.HandlerFunc {
	save := makeSaveCalculationHandler(repo)
	list := makeListCalculationsHandler(repo)
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			save(w, r)
		case http.MethodGet:
			list(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// makeDeleteCalculationHandler returns a DELETE /api/calculations/{id} handler.
func makeDeleteCalculationHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicID := strings.TrimPrefix(r.URL.Path, "/api/calculations/")
		if strings.TrimSpace(publicID) == "" {
			http.Error(w, "missing calculation id", http.StatusBadRequest)
			return
		}

		deleted, err := repo.DeleteCalculationByPublicID(publicID)
		if err != nil {
			log.Printf("delete calculation %q: %v", publicID, err)
			http.Error(w, "failed to delete calculation", http.StatusInternalServerError)
			return
		}
		if !deleted {
			http.Error(w, "calculation not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// makeGetCalculationHandler returns a GET /api/calculations/{id} handler.
func makeGetCalculationHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicID := strings.TrimPrefix(r.URL.Path, "/api/calculations/")
		if strings.TrimSpace(publicID) == "" {
			http.Error(w, "missing calculation id", http.StatusBadRequest)
			return
		}

		calc, err := repo.GetCalculationByPublicID(publicID)
		if err != nil {
			log.Printf("get calculation %q: %v", publicID, err)
			http.Error(w, "failed to retrieve calculation", http.StatusInternalServerError)
			return
		}
		if calc == nil {
			http.Error(w, "calculation not found", http.StatusNotFound)
			return
		}

		selectedCodes := make([]generated.SelectedCode, 0, len(calc.SelectedCBHPMCodes))
		for _, c := range calc.SelectedCBHPMCodes {
			selectedCodes = append(selectedCodes, generated.SelectedCode{
				CbhpmCode:   c.CBHPMCode,
				Description: c.Description,
				Porte:       c.Porte,
			})
		}

		parsedID, parseErr := uuid.Parse(calc.PublicID)
		if parseErr != nil {
			log.Printf("parse uuid: %v", parseErr)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		var sbnCode *string
		if calc.ProcedureSBNCode != "" {
			sbnCode = &calc.ProcedureSBNCode
		}

		respondJSON(w, http.StatusOK, generated.SavedCalculation{
			PublicId:              parsedID,
			ProcedureName:         calc.ProcedureName,
			ProcedureSbnCode:      sbnCode,
			SelectedCbhpmCodes:    selectedCodes,
			AccessRouteType:       generated.AccessRouteType(calc.AccessRoute),
			AuxiliariesCount:      calc.AuxiliariesCount,
			RequiresAnesthesia:    calc.RequiresAnesthesia,
			SurgeonValue:          float32(calc.SurgeonValue),
			AuxiliariesTotalValue: float32(calc.AuxiliariesTotalValue),
			AnesthesiologistValue: float32(calc.AnesthesiologistValue),
			TeamTotalValue:        float32(calc.TeamTotalValue),
			CalculationBreakdown:  calc.BreakdownJSON,
			CreatedAt:             calc.CreatedAt,
		})
	}
}

// makeCalculationItemHandler dispatches GET → get and DELETE → delete on /api/calculations/{id}.
func makeCalculationItemHandler(repo repository.Repository) http.HandlerFunc {
	get := makeGetCalculationHandler(repo)
	del := makeDeleteCalculationHandler(repo)
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(w, r)
		case http.MethodDelete:
			del(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}
