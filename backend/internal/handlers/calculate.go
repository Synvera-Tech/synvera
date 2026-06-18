package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/models"
	"synvera/backend/internal/service"
)

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req generated.CalculateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
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

	selected := make([]models.SelectedCode, 0, len(req.SelectedCodes))
	for _, c := range req.SelectedCodes {
		if _, ok := service.PorteValues[c.Porte]; !ok {
			http.Error(w, "unknown porte: "+c.Porte, http.StatusBadRequest)
			return
		}

		qty := 1
		if c.QuantitySelected != nil {
			qty = *c.QuantitySelected
		}

		lat := models.LateralityUnilateral
		if c.Laterality != nil {
			lat = models.Laterality(*c.Laterality)
		}

		selected = append(selected, models.SelectedCode{
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

	accessRoute := models.AccessRouteType(req.AccessRouteType)
	adjustments := []string{}
	if req.Adjustments != nil {
		adjustments = *req.Adjustments
	}
	result := service.Calculate(selected, req.AuxiliariesCount, req.RequiresAnesthesia, accessRoute, adjustments)
	fmt.Printf("DEBUG: service.Calculate returned - SelectedAdjustments=%d items, TotalAdjPct=%v, AdjValue=%v\n", len(result.SelectedAdjustments), result.TotalAdjustmentPercentage, result.AdjustmentValue)

	breakdown := make([]generated.CodeBreakdown, 0, len(result.CodeBreakdown))
	for _, b := range result.CodeBreakdown {
		breakdown = append(breakdown, generated.CodeBreakdown{
			CbhpmCode:            b.CBHPMCode,
			Description:          b.Description,
			Porte:                b.Porte,
			BaseValue:            float32(b.BaseValue),
			AdjustedValue:        float32(b.AdjustedValue),
			QuantitySelected:     b.QuantitySelected,
			QuantityMultiplier:   float32(b.QuantityMultiplier),
			Laterality:           generated.Laterality(b.Laterality),
			LateralityMultiplier: float32(b.LateralityMultiplier),
			BillingMode:          generated.BillingMode(b.BillingMode),
			IsPrincipal:          b.IsPrincipal,
		})
	}

	auxFees := make([]generated.AuxiliaryFee, 0, len(result.IndividualAuxFees))
	for _, a := range result.IndividualAuxFees {
		auxFees = append(auxFees, generated.AuxiliaryFee{
			Position:   a.Position,
			Percentage: float32(a.Percentage),
			Fee:        float32(a.Fee),
		})
	}

	appliedAdj := make([]generated.AppliedAdjustment, 0, len(result.SelectedAdjustments))
	for _, a := range result.SelectedAdjustments {
		appliedAdj = append(appliedAdj, generated.AppliedAdjustment{
			Code:       a.Code,
			Label:      a.Label,
			Percentage: float32(a.Percentage),
			Source:     a.Source,
		})
	}

	respondJSON(w, http.StatusOK, generated.CalculateResponse{
		CodeBreakdown:             breakdown,
		AccessRouteType:           generated.AccessRouteType(result.AccessRouteType),
		SurgeonBreakdown: generated.SurgeonBreakdown{
			PrincipalValue:       float32(result.SurgeonBreakdown.PrincipalValue),
			AdditionalGross:      float32(result.SurgeonBreakdown.AdditionalGross),
			DiscountRate:         float32(result.SurgeonBreakdown.DiscountRate),
			AdditionalDiscounted: float32(result.SurgeonBreakdown.AdditionalDiscounted),
			SurgeonTotal:         float32(result.SurgeonBreakdown.SurgeonTotal),
		},
		TotalBase:                 float32(result.TotalBase),
		LeadSurgeonFee:            float32(result.LeadSurgeonFee),
		IndividualAuxiliaryFees:   auxFees,
		AuxiliariesFee:            float32(result.AuxiliariesFee),
		AnesthesiologistFee:       float32(result.AnesthesiologistFee),
		FinalTotal:                float32(result.FinalTotal),
		SelectedAdjustments:       appliedAdj,
		TotalAdjustmentPercentage: float32(result.TotalAdjustmentPercentage),
		AdjustmentValue:           float32(result.AdjustmentValue),
	})
}
