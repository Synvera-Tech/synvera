package handlers_test

// Persistence tests: verify that the calculation handler stores ALL input fields
// correctly in the repository so that a saved calculation can be fully replayed.
//
// These tests operate at the HTTP handler level (using FileRepository) to confirm
// the handler → model → repository pipeline is correct end-to-end.

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/handlers"
	"synvera/backend/internal/models"
	"synvera/backend/internal/repository"
)

// buildSpineCode builds a SelectedCode with all 8 fields populated for a spine procedure.
func buildSpineCode(qty int, lat generated.Laterality) generated.SelectedCode {
	q := qty
	l := lat
	return generated.SelectedCode{
		CbhpmCode:         "3.06.01.01-0",
		Description:       "Artrodese lombar por segmento",
		Porte:             "12A",
		BillingMode:       generated.PERSEGMENT,
		Specialty:         generated.Specialty("SPINE"),
		LateralitySupport: true,
		Laterality:        &l,
		QuantitySelected:  &q,
	}
}

// saveAndFetch saves a calculation and returns the model from the FileRepository directly.
// This bypasses the GET handler (which projects only 3 code fields) to verify full persistence.
func saveAndFetch(t *testing.T, repo *repository.FileRepository, req generated.SaveCalculationRequest) *models.Calculation {
	t.Helper()
	w := postCalculation(t, repo, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("save failed %d: %s", w.Code, w.Body.String())
	}
	var resp generated.SaveCalculationResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode save response: %v", err)
	}
	calc, err := repo.GetCalculationByPublicID(resp.PublicId.String())
	if err != nil || calc == nil {
		t.Fatalf("retrieve calculation from repo: err=%v, calc=%v", err, calc)
	}
	return calc
}

// TestCalculationPersistsAllSelectedCodeFields — all 8 SelectedCode fields must survive
// the handler → model mapping, including BillingMode, Specialty, LateralitySupport,
// QuantitySelected, and Laterality.
func TestCalculationPersistsAllSelectedCodeFields(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.SelectedCodes = []generated.SelectedCode{buildSpineCode(3, generated.BILATERAL)}
	req.CalculationResult.LeadSurgeonFee = 4500.00
	req.CalculationResult.FinalTotal = 4500.00

	calc := saveAndFetch(t, repo, req)

	if len(calc.SelectedCBHPMCodes) != 1 {
		t.Fatalf("expected 1 selected code, got %d", len(calc.SelectedCBHPMCodes))
	}
	sc := calc.SelectedCBHPMCodes[0]

	if sc.CBHPMCode != "3.06.01.01-0" {
		t.Errorf("cbhpm_code: got %q", sc.CBHPMCode)
	}
	if sc.BillingMode != models.BillingModeSegment {
		t.Errorf("billing_mode: got %q, want PER_SEGMENT", sc.BillingMode)
	}
	if sc.Specialty != models.SpecialtySpine {
		t.Errorf("specialty: got %q, want SPINE", sc.Specialty)
	}
	if !sc.LateralitySupport {
		t.Error("laterality_support should be true")
	}
	if sc.QuantitySelected != 3 {
		t.Errorf("quantity_selected: got %d, want 3", sc.QuantitySelected)
	}
	if sc.Laterality != models.LateralityBilateral {
		t.Errorf("laterality: got %q, want BILATERAL", sc.Laterality)
	}
}

// TestCalculationPersistsAdjustments — adjustment codes extracted from
// CalculationResult.SelectedAdjustments must be stored in the model's Adjustments field.
func TestCalculationPersistsAdjustments(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.CalculationResult.SelectedAdjustments = []generated.AppliedAdjustment{
		{Code: "emergency_special_hours", Label: "Urgência/emergência", Percentage: 30},
		{Code: "pediatric_neonate_or_infant", Label: "Neonato/lactente", Percentage: 50},
	}
	req.CalculationResult.LeadSurgeonFee = 1500.00
	req.CalculationResult.FinalTotal = 1500.00

	calc := saveAndFetch(t, repo, req)

	if len(calc.Adjustments) != 2 {
		t.Fatalf("expected 2 adjustments, got %d: %v", len(calc.Adjustments), calc.Adjustments)
	}
	if calc.Adjustments[0] != "emergency_special_hours" {
		t.Errorf("adjustment[0]: got %q, want emergency_special_hours", calc.Adjustments[0])
	}
	if calc.Adjustments[1] != "pediatric_neonate_or_infant" {
		t.Errorf("adjustment[1]: got %q, want pediatric_neonate_or_infant", calc.Adjustments[1])
	}
}

// TestCalculationPersistsAccessRoute — the access_route_type selected by the physician must be
// stored verbatim so the calculation can be replayed with the same CBHPM 4.1/4.2 rule.
func TestCalculationPersistsAccessRoute(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.AccessRouteType = generated.Different
	req.CalculationResult.LeadSurgeonFee = 2000.00
	req.CalculationResult.FinalTotal = 2000.00

	calc := saveAndFetch(t, repo, req)

	if calc.AccessRoute != models.AccessRouteDifferent {
		t.Errorf("access_route: got %q, want different", calc.AccessRoute)
	}
}

// TestCalculationAnonymousSavesWithoutPhysicianID — when no Clerk token is present (the
// calculation endpoints are public), PhysicianID must be empty (anonymous calculation).
func TestCalculationAnonymousSavesWithoutPhysicianID(t *testing.T) {
	repo := repository.NewFileRepository()
	calc := saveAndFetch(t, repo, minimalValidRequest())

	if calc.PhysicianID != "" {
		t.Errorf("expected empty PhysicianID for anonymous calculation, got %q", calc.PhysicianID)
	}
}

// TestCalculationWithUrgencyAdjustmentPreserved — a real urgency adjustment code must survive
// the full handler pipeline so the result is auditable and replayable.
func TestCalculationWithUrgencyAdjustmentPreserved(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.CalculationResult.SelectedAdjustments = []generated.AppliedAdjustment{
		{Code: "emergency_special_hours", Percentage: 30},
	}
	req.CalculationResult.LeadSurgeonFee = 1625.00
	req.CalculationResult.FinalTotal = 1625.00

	calc := saveAndFetch(t, repo, req)

	if len(calc.Adjustments) != 1 || calc.Adjustments[0] != "emergency_special_hours" {
		t.Errorf("urgency adjustment not persisted: %v", calc.Adjustments)
	}
}

// TestCalculationWithSpineQuantityAndLateralityPreserved — spine billing variables
// (quantity_selected and laterality) carried inside the SelectedCode must be stored
// on the model intact, enabling replay through the spine billing multiplier engine.
func TestCalculationWithSpineQuantityAndLateralityPreserved(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.SelectedCodes = []generated.SelectedCode{buildSpineCode(4, generated.BILATERAL)}
	req.CalculationResult.LeadSurgeonFee = 6000.00
	req.CalculationResult.FinalTotal = 6000.00

	calc := saveAndFetch(t, repo, req)

	sc := calc.SelectedCBHPMCodes[0]
	if sc.QuantitySelected != 4 {
		t.Errorf("quantity_selected: got %d, want 4", sc.QuantitySelected)
	}
	if sc.Laterality != models.LateralityBilateral {
		t.Errorf("laterality: got %q, want BILATERAL", sc.Laterality)
	}
}

// TestCalculationBreakdownPreserved — the full CalculateResponse JSON must be stored
// verbatim in calculation_breakdown to support the share page and audit history.
func TestCalculationBreakdownPreserved(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	req.CalculationResult.LeadSurgeonFee = 1250.00
	req.CalculationResult.AuxiliariesFee = 750.00
	req.CalculationResult.AnesthesiologistFee = 500.00
	req.CalculationResult.FinalTotal = 2500.00

	calc := saveAndFetch(t, repo, req)

	if len(calc.BreakdownJSON) == 0 {
		t.Error("expected non-empty calculation_breakdown JSON")
	}

	var breakdown map[string]interface{}
	if err := json.Unmarshal(calc.BreakdownJSON, &breakdown); err != nil {
		t.Fatalf("breakdown is not valid JSON: %v", err)
	}

	// Use HTTP GET to confirm breakdown is returned to callers.
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/calculations/"+calc.PublicID, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("GET failed: %d", w.Code)
	}
	var saved generated.SavedCalculation
	if err := json.NewDecoder(w.Body).Decode(&saved); err != nil {
		t.Fatalf("decode GET response: %v", err)
	}
	if saved.CalculationBreakdown == nil {
		t.Error("calculation_breakdown was nil in GET response")
	}
}

// TestCalculationNoAdjustmentsStoresEmptySlice — when no adjustments are active,
// the Adjustments field must be an empty slice (not nil) so JSON serialization is [].
func TestCalculationNoAdjustmentsStoresEmptySlice(t *testing.T) {
	repo := repository.NewFileRepository()
	req := minimalValidRequest()
	// SelectedAdjustments is zero-value (nil slice) — no adjustments active.

	calc := saveAndFetch(t, repo, req)

	if calc.Adjustments == nil {
		t.Error("Adjustments should be an empty slice, not nil")
	}
	if len(calc.Adjustments) != 0 {
		t.Errorf("expected 0 adjustments, got %v", calc.Adjustments)
	}
}
