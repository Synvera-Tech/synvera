package handlers

import (
	"net/http"
	"strings"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/models"
	"synvera/backend/internal/repository"
)

// toModifierInfo maps a normative CodeModifier (ADR-005) to its API representation.
// Read-only metadata: this never influences fee calculations.
func toModifierInfo(m models.CodeModifier) *generated.CodeModifierInfo {
	supported := m.SupportedModifiers
	if supported == nil {
		supported = []string{}
	}
	info := &generated.CodeModifierInfo{
		BillingMode:        generated.NormativeBillingMode(m.BillingMode),
		LateralityRule:     generated.CodeModifierInfoLateralityRule(m.LateralityRule),
		ViaRule:            generated.CodeModifierInfoViaRule(m.ViaRule),
		Confidence:         generated.CodeModifierInfoConfidence(m.Confidence),
		SupportedModifiers: supported,
		MaxQuantity:        m.MaxQuantity,
		SourcePage:         m.SourcePage,
	}
	if m.DecrementPct != nil {
		v := float32(*m.DecrementPct)
		info.DecrementPct = &v
	}
	if m.SourceDocument != "" {
		info.SourceDocument = &m.SourceDocument
	}
	if m.SourceVersion != "" {
		info.SourceVersion = &m.SourceVersion
	}
	if m.SourceExcerpt != "" {
		info.SourceExcerpt = &m.SourceExcerpt
	}
	return info
}

// makeGetProcedureHandler handles GET /api/procedures/{id}.
func makeGetProcedureHandler(repo repository.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Path: /api/procedures/{id} — extract last segment.
		id := strings.TrimPrefix(r.URL.Path, "/api/procedures/")
		if id == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}

		p, err := repo.GetByID(id)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		if p == nil {
			http.Error(w, "procedure not found", http.StatusNotFound)
			return
		}

		// Normative modifiers (ADR-005) are read-only metadata attached per code.
		// They are informational here and do NOT affect fee calculations. A failure to
		// load them must not break the procedure response, so degrade gracefully.
		modifiers, err := repo.GetCodeModifiers()
		if err != nil {
			modifiers = nil
		}

		// Domain is the procedure's operational specialty, derived from provenance
		// (spine coding manual ⇒ SPINE, otherwise NEUROSURGERY). A normative modifier
		// is only attached when its specialty matches the procedure domain — the same
		// CBHPM code can appear in both a neuro and a spine procedure, but a spine
		// billing rule must not leak into a neurosurgery procedure.
		domain := generated.NEUROSURGERY
		if strings.Contains(p.SourceDocument, "Coluna") {
			domain = generated.SPINE
		}

		codes := make([]generated.CBHPMCodeEntry, 0, len(p.Codes))
		for _, c := range p.Codes {
			entry := generated.CBHPMCodeEntry{
				Code:              c.Code,
				Description:       c.Description,
				Porte:             c.Porte,
				NumAuxiliaries:    c.NumAuxiliaries,
				BillingMode:       generated.BillingMode(c.BillingMode),
				Specialty:         generated.Specialty(c.Specialty),
				LateralitySupport: c.LateralitySupport,
			}
			if m, ok := modifiers[c.Code]; ok && string(m.Specialty) == string(domain) {
				entry.Modifier = toModifierInfo(m)
			}
			codes = append(codes, entry)
		}

		detail := generated.ProcedureDetail{
			Id:         p.ID,
			Name:       p.Name,
			CbhpmCodes: codes,
		}
		detail.Domain = &domain
		if p.SourceDocument != "" || p.SourceVersion != "" {
			detail.Source = &generated.ProcedureSource{
				Document: p.SourceDocument,
				Version:  p.SourceVersion,
			}
		}
		respondJSON(w, http.StatusOK, detail)
	}
}
