// Package service contains the deterministic CBHPM valuation engine for Synvera.
package service

import "synvera/backend/internal/models"

// CalculateWithPortes is the versioned entry point for the CBHPM valuation engine.
// porteValues is the porte→value_brl lookup resolved from the active CBHPM version
// in the repository, allowing historical calculations to replay with the exact porte
// table that was active at creation time.
//
// See Calculate for the full billing rules documentation.
func CalculateWithPortes(
	codes []models.SelectedCode,
	auxiliariesCount int,
	requiresAnesthesia bool,
	accessRoute models.AccessRouteType,
	adjustments []string,
	porteValues map[string]float64,
) models.CalculationResult {
	return calculate(codes, auxiliariesCount, requiresAnesthesia, accessRoute, adjustments, porteValues, nil, nil)
}

// CalculateWithPortesAndModifiers is the data-driven entry point (ADR-005, roadmap N5).
// It resolves each code's normative billing rule from the modifiers map before valuing:
//   - per-code billing_mode (×N segment/vertebra/structure, or PER_STRUCTURE_DECREMENT);
//   - spine via rule (additional codes at 50%, R12) by code specialty;
//   - spine laterality rule (bilateral same segment not duplicated, R3).
//
// Passing a nil modifiers map disables all normative enrichment, reproducing the legacy
// behaviour exactly (used by Calculate / CalculateWithPortes and all existing tests).
// Codes that are not SPINE and have no modifier row are valued identically to before, so
// neurosurgery calculations never change.
// anestheticPortes (code → AN0–AN8) activates the porte-derived anesthesiologist fee
// (CBHPM p.139–140). When nil, the legacy flat anesthesiaFee gated by requiresAnesthesia is
// used instead, preserving all existing tests.
func CalculateWithPortesAndModifiers(
	codes []models.SelectedCode,
	auxiliariesCount int,
	requiresAnesthesia bool,
	accessRoute models.AccessRouteType,
	adjustments []string,
	porteValues map[string]float64,
	modifiers map[string]models.CodeModifier,
	anestheticPortes map[string]int,
) models.CalculationResult {
	return calculate(codes, auxiliariesCount, requiresAnesthesia, accessRoute, adjustments, porteValues, modifiers, anestheticPortes)
}

// Calculate applies validated CBHPM billing rules to a physician-assembled composition.
// It uses the hardcoded PorteValues map (CBHPM 2025/2026 with INPC 5.10%).
// Preserved for backward compatibility with existing tests and internal callers.
// New production code should use CalculateWithPortes to support CBHPM versioning.
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
	return calculate(codes, auxiliariesCount, requiresAnesthesia, accessRoute, adjustments, PorteValues, nil, nil)
}

// resolveCodeRules determines the effective billing rule for a single code.
//
// When modifiers is nil, no enrichment occurs and the code's own fields are used verbatim
// (legacy path). Otherwise:
//   - SPINE codes get the domain-wide rules SPINE_50 (R12) and NO_DUPLICATE (R3);
//   - a matching modifier row overrides the billing mode (×N / decrement) and, if present,
//     the via/laterality rules.
func resolveCodeRules(
	c models.SelectedCode,
	modifiers map[string]models.CodeModifier,
) (billingMode models.BillingMode, viaRule, lateralityRule string, decrementPct *float64) {
	billingMode = c.BillingMode
	if modifiers == nil {
		return billingMode, "", "", nil
	}
	if c.Specialty == models.SpecialtySpine {
		viaRule = viaRuleSpine50
		lateralityRule = lateralityRuleNoDuplicate
	}
	if m, ok := modifiers[c.CBHPMCode]; ok && m.Specialty == c.Specialty {
		billingMode = m.BillingMode
		decrementPct = m.DecrementPct
		if m.ViaRule != "" {
			viaRule = m.ViaRule
		}
		if m.LateralityRule != "" {
			lateralityRule = m.LateralityRule
		}
	}
	return billingMode, viaRule, lateralityRule, decrementPct
}

// calculate is the shared implementation behind Calculate, CalculateWithPortes, and
// CalculateWithPortesAndModifiers. A nil modifiers map disables normative enrichment.
func calculate(
	codes []models.SelectedCode,
	auxiliariesCount int,
	requiresAnesthesia bool,
	accessRoute models.AccessRouteType,
	adjustments []string,
	porteValues map[string]float64,
	modifiers map[string]models.CodeModifier,
	anestheticPortes map[string]int,
) models.CalculationResult {
	// ── Step 1: resolve porte values, apply spine multipliers, find principal ───

	type entry struct {
		code                 models.SelectedCode
		baseValue            float64
		billingMode          models.BillingMode // effective (post-enrichment) mode
		viaRule              string             // effective via rule for access-route discounting
		quantityMultiplier   float64
		lateralityMultiplier float64
		adjustedValue        float64 // baseValue × quantity × laterality
	}

	entries := make([]entry, len(codes))
	totalBase := 0.0
	// Principal = highest CBHPM porte (R14, CBHPM 4.1/4.2: "procedimento de maior porte"),
	// NOT the highest adjusted value after quantity/laterality. Tie-break is stable: the first
	// code in payload order with the top porte wins (strict >), so a re-ordered payload never
	// silently changes the principal.
	principalIdx := 0
	bestPorteRank := -1

	for i, c := range codes {
		billingMode, viaRule, lateralityRule, decrementPct := resolveCodeRules(c, modifiers)
		baseVal := porteValues[c.Porte]
		qtyMult := calculateQuantityMultiplier(billingMode, c.QuantitySelected, decrementPct)
		latMult := calculateLateralityMultiplier(c.Laterality, c.LateralitySupport, lateralityRule)
		adjVal := baseVal * qtyMult * latMult

		entries[i] = entry{
			code:                 c,
			baseValue:            baseVal,
			billingMode:          billingMode,
			viaRule:              viaRule,
			quantityMultiplier:   qtyMult,
			lateralityMultiplier: latMult,
			adjustedValue:        adjVal,
		}

		if r := porteRank(c.Porte); r > bestPorteRank {
			principalIdx = i
			bestPorteRank = r
		}

		totalBase += baseVal
	}

	// ── Step 2: surgeon fee per CBHPM 4.1 / 4.2 (and spine R12) ─────────────────
	// Principal = highest porte (Step 1). It is paid at 100% of its adjusted value; each
	// additional code is discounted by its own via rule (spine → 50%; otherwise CBHPM 4.1/4.2),
	// so mixed compositions are correct.

	principalAdjValue := entries[principalIdx].adjustedValue

	additionalGross := 0.0
	additionalDiscounted := 0.0
	for i, e := range entries {
		if i == principalIdx {
			continue
		}
		additionalGross += e.adjustedValue
		additionalDiscounted += e.adjustedValue * discountRateForCode(e.viaRule, accessRoute, len(codes))
	}
	surgeonTotal := principalAdjValue + additionalDiscounted

	// Effective (blended) discount rate for transparency. Equals the nominal CBHPM rate
	// when all additional codes share one rate (e.g. neurosurgery-only compositions).
	discountRate := discountRateFor(accessRoute, len(codes))
	if additionalGross > 0 {
		discountRate = additionalDiscounted / additionalGross
	}

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
			BillingMode:          e.billingMode,
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
	// Porte-derived when anestheticPortes is provided (CBHPM p.139–140); otherwise the
	// legacy flat fee gated by requiresAnesthesia (preserves existing tests/callers).

	anesth := 0.0
	if anestheticPortes != nil {
		anesth = computeAnesthesia(codes, anestheticPortes, porteValues, accessRoute)
	} else if requiresAnesthesia {
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
