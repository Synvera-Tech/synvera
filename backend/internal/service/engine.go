// Package service contains the deterministic CBHPM valuation engine for Synvera.
package service

import "synvera/backend/internal/models"

// Calculate applies validated CBHPM billing rules to a physician-assembled composition.
//
// Surgeon valuation (CBHPM 2022):
//   - Single procedure: 100% of its porte value.
//   - Same access route (item 4.1):   principal porte + 50% × Σ(additional portes).
//   - Different access routes (item 4.2): principal porte + 70% × Σ(additional portes).
//
// Spine billing variables (per code, applied before CBHPM discounting):
//   - Quantity multiplier:  ×1 for PER_PROCEDURE; ×quantity otherwise.
//   - Laterality multiplier: ×1.0 UNILATERAL, ×2.0 BILATERAL (when laterality_support=true).
//   - Applied in order: base → quantity → laterality → access route discount.
//
// Auxiliary valuation (CBHPM 2022, item 5.1 rates applied to surgeon total per item 5.2):
//   - 1st auxiliary: 60% of surgeon total.
//   - 2nd auxiliary: 40% of surgeon total.
//   - 3rd auxiliary: 30% of surgeon total.
//   - 4th auxiliary: 30% of surgeon total.
//
// CBHPM adjustments (Instruções Gerais — additive percentage model):
//   - Percentages are summed first, then applied as a single multiplier.
//   - Example: emergency(+30%) + pediatric child(+30%) = multiplier ×1.60.
//   - Applies to surgeon, auxiliary, and anesthesiologist fees.
//   - surgeon_breakdown.surgeon_total always reflects the pre-adjustment base for auditability.
//   - Unknown codes are silently skipped (guards against stale share URLs).
func Calculate(
	codes []models.SelectedCode,
	auxiliariesCount int,
	requiresAnesthesia bool,
	accessRoute models.AccessRouteType,
	adjustments []string,
) models.CalculationResult {
	// ── Step 1: resolve porte values, apply spine multipliers, find principal ───

	type entry struct {
		code                 models.SelectedCode
		baseValue            float64
		quantityMultiplier   float64
		lateralityMultiplier float64
		adjustedValue        float64 // baseValue × quantity × laterality
	}

	entries := make([]entry, len(codes))
	totalBase := 0.0
	principalIdx := 0
	principalAdjustedValue := 0.0

	for i, c := range codes {
		baseVal := PorteValues[c.Porte]
		qtyMult := calculateQuantityMultiplier(c.BillingMode, c.QuantitySelected)
		latMult := calculateLateralityMultiplier(c.Laterality, c.LateralitySupport)
		adjVal := baseVal * qtyMult * latMult

		entries[i] = entry{
			code:                 c,
			baseValue:            baseVal,
			quantityMultiplier:   qtyMult,
			lateralityMultiplier: latMult,
			adjustedValue:        adjVal,
		}

		if adjVal > principalAdjustedValue {
			principalIdx = i
			principalAdjustedValue = adjVal
		}

		totalBase += baseVal
	}

	// ── Step 2: surgeon fee per CBHPM 4.1 / 4.2 ─────────────────────────────
	// Principal = highest adjusted value. Discount applies to adjusted values.

	principalAdjValue := entries[principalIdx].adjustedValue

	additionalGross := 0.0
	for i, e := range entries {
		if i != principalIdx {
			additionalGross += e.adjustedValue
		}
	}

	discountRate := discountRateFor(accessRoute, len(codes))
	additionalDiscounted := additionalGross * discountRate
	surgeonTotal := principalAdjValue + additionalDiscounted

	surgeonBreakdown := models.SurgeonBreakdown{
		PrincipalValue:       principalAdjValue,
		AdditionalGross:      additionalGross,
		DiscountRate:         discountRate,
		AdditionalDiscounted: additionalDiscounted,
		SurgeonTotal:         surgeonTotal,
	}

	// ── Step 3: per-code breakdown (includes spine variable detail) ───────────

	breakdown := make([]models.CodeBreakdown, len(entries))
	for i, e := range entries {
		breakdown[i] = models.CodeBreakdown{
			CBHPMCode:            e.code.CBHPMCode,
			Description:          e.code.Description,
			Porte:                e.code.Porte,
			BaseValue:            e.baseValue,
			IsPrincipal:          i == principalIdx,
			BillingMode:          e.code.BillingMode,
			QuantitySelected:     e.code.QuantitySelected,
			QuantityMultiplier:   e.quantityMultiplier,
			Laterality:           e.code.Laterality,
			LateralityMultiplier: e.lateralityMultiplier,
			AdjustedValue:        e.adjustedValue,
		}
	}

	// ── Step 4: auxiliary fees per CBHPM 5.1 (applied to pre-adjustment surgeon total, item 5.2)

	individualAuxFees := make([]models.AuxiliaryFee, 0, auxiliariesCount)
	auxTotal := 0.0

	for pos := 1; pos <= auxiliariesCount; pos++ {
		pct := auxPercentages[pos]
		fee := surgeonTotal * pct
		individualAuxFees = append(individualAuxFees, models.AuxiliaryFee{
			Position:   pos,
			Percentage: pct * 100,
			Fee:        fee,
		})
		auxTotal += fee
	}

	// ── Step 5: anesthesiologist ──────────────────────────────────────────────

	anesth := 0.0
	if requiresAnesthesia {
		anesth = anesthesiaFee
	}

	// ── Step 6: CBHPM adjustments (additive percentage model) ────────────────
	// Sum percentages first, then apply as one multiplier so that
	// emergency(30%) + pediatric(30%) = ×1.60 and not ×1.30×1.30.

	applied := make([]models.AppliedAdjustment, 0, len(adjustments))
	totalAdjPct := 0.0
	for _, code := range adjustments {
		meta, ok := AdjustmentCatalog[code]
		if !ok {
			continue
		}
		applied = append(applied, models.AppliedAdjustment{
			Code:       code,
			Label:      meta.label,
			Percentage: meta.percentage,
			Source:     meta.source,
		})
		totalAdjPct += meta.percentage
	}

	multiplier := 1.0 + totalAdjPct/100.0

	baseSurgeon := surgeonTotal
	baseAux := auxTotal
	baseAnesth := anesth
	baseTeam := baseSurgeon + baseAux + baseAnesth
	adjValue := baseTeam * (totalAdjPct / 100.0)

	finalAuxFees := individualAuxFees
	if totalAdjPct > 0 {
		scaled := make([]models.AuxiliaryFee, len(individualAuxFees))
		for i, af := range individualAuxFees {
			scaled[i] = models.AuxiliaryFee{
				Position:   af.Position,
				Percentage: af.Percentage,
				Fee:        af.Fee * multiplier,
			}
		}
		finalAuxFees = scaled
	}

	finalSurgeon := baseSurgeon * multiplier
	finalAux := baseAux * multiplier
	finalAnesth := baseAnesth * multiplier

	return models.CalculationResult{
		CodeBreakdown:             breakdown,
		AccessRouteType:           accessRoute,
		SurgeonBreakdown:          surgeonBreakdown,
		TotalBase:                 totalBase,
		BaseSurgeonValue:          baseSurgeon,
		BaseAuxiliaresTotalValue:  baseAux,
		BaseAnesthesiologistValue: baseAnesth,
		BaseTeamTotalValue:        baseTeam,
		SelectedAdjustments:       applied,
		TotalAdjustmentPercentage: totalAdjPct,
		AdjustmentValue:           adjValue,
		LeadSurgeonFee:            finalSurgeon,
		IndividualAuxFees:         finalAuxFees,
		AuxiliariesFee:            finalAux,
		AnesthesiologistFee:       finalAnesth,
		FinalTotal:                finalSurgeon + finalAux + finalAnesth,
	}
}
