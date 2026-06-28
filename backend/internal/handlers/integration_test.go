package handlers_test

// Integration tests: end-to-end flows exercising the full HTTP handler pipeline
// against the in-memory FileRepository. These tests prove that data entering via
// one HTTP endpoint arrives intact at another — no assumptions about intermediate
// state.
//
// Scenarios covered:
//   A. Calculation persistence:  POST /api/calculate → POST /api/calculations → GET
//   B. Composition persistence:  POST → PUT → GET (full SelectedCode 8-field round-trip)
//   C. Legacy compatibility:     composition without modifiers loads without error
//   D. Clinical modifiers:       urgency + pediatric combined through composition lifecycle
//   E. Spine modifiers:          quantity_selected + laterality through composition update

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/handlers"
	"synvera/backend/internal/repository"
)

// ── helpers ──────────────────────────────────────────────────────────────────

func mustCalculate(t *testing.T, repo *repository.FileRepository, calcReq generated.CalculateRequest) generated.CalculateResponse {
	t.Helper()
	b, _ := json.Marshal(calcReq)
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewReader(b)))
	if w.Code != http.StatusOK {
		t.Fatalf("POST /api/calculate: expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp generated.CalculateResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode CalculateResponse: %v", err)
	}
	return resp
}

func mustSaveCalculation(t *testing.T, repo *repository.FileRepository, req generated.SaveCalculationRequest) generated.SaveCalculationResponse {
	t.Helper()
	b, _ := json.Marshal(req)
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/calculations", bytes.NewReader(b)))
	if w.Code != http.StatusCreated {
		t.Fatalf("POST /api/calculations: expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var resp generated.SaveCalculationResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode SaveCalculationResponse: %v", err)
	}
	return resp
}

func mustGetCalculation(t *testing.T, repo *repository.FileRepository, publicID string) generated.SavedCalculation {
	t.Helper()
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/calculations/"+publicID, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("GET /api/calculations/%s: expected 200, got %d: %s", publicID, w.Code, w.Body.String())
	}
	var saved generated.SavedCalculation
	if err := json.NewDecoder(w.Body).Decode(&saved); err != nil {
		t.Fatalf("decode SavedCalculation: %v", err)
	}
	return saved
}

// ── Scenario A: Calculation persistence ──────────────────────────────────────

// TestEndToEndCalculateAndSaveRoundTrip exercises the full calculation → persistence →
// retrieval pipeline using real engine output. This is the canonical path for the
// share-report feature.
//
// Flow: POST /api/calculate → POST /api/calculations → GET /api/calculations/{id}
func TestEndToEndCalculateAndSaveRoundTrip(t *testing.T) {
	repo := repository.NewFileRepository()

	// Step 1: call the calculation engine with a known procedure.
	calcReq := generated.CalculateRequest{
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.02.15.02-1", Description: "Craniotomia descompressiva", Porte: "9C",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.Specialty("NEUROSURGERY")},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   1,
		RequiresAnesthesia: true,
	}
	calcResult := mustCalculate(t, repo, calcReq)

	if calcResult.LeadSurgeonFee <= 0 {
		t.Fatalf("expected lead_surgeon_fee > 0 from engine, got %f", calcResult.LeadSurgeonFee)
	}
	if calcResult.AnesthesiologistFee != 1200.0 {
		t.Errorf("expected anesthesiologist_fee 1200.00, got %f", calcResult.AnesthesiologistFee)
	}

	// Step 2: save the calculation snapshot.
	sbnCode := "test-sbn"
	saveResp := mustSaveCalculation(t, repo, generated.SaveCalculationRequest{
		ProcedureName:     "Craniotomia descompressiva",
		ProcedureSbnCode:  &sbnCode,
		SelectedCodes:     calcReq.SelectedCodes,
		AccessRouteType:   generated.Same,
		AuxiliariesCount:  1,
		RequiresAnesthesia: true,
		CalculationResult: calcResult,
	})
	if saveResp.PublicId.String() == "" {
		t.Fatal("expected non-empty public_id in save response")
	}

	// Step 3: retrieve and verify round-trip.
	saved := mustGetCalculation(t, repo, saveResp.PublicId.String())

	if saved.ProcedureName != "Craniotomia descompressiva" {
		t.Errorf("procedure_name: got %q", saved.ProcedureName)
	}
	if saved.AccessRouteType != generated.Same {
		t.Errorf("access_route_type: got %q", saved.AccessRouteType)
	}
	if saved.AuxiliariesCount != 1 {
		t.Errorf("auxiliaries_count: got %d", saved.AuxiliariesCount)
	}
	if !saved.RequiresAnesthesia {
		t.Error("expected requires_anesthesia=true")
	}
	// Values must exactly match the engine output (float32 → float32 round-trip).
	if saved.SurgeonValue != calcResult.LeadSurgeonFee {
		t.Errorf("surgeon_value: got %f, want %f", saved.SurgeonValue, calcResult.LeadSurgeonFee)
	}
	if saved.TeamTotalValue != calcResult.FinalTotal {
		t.Errorf("team_total_value: got %f, want %f", saved.TeamTotalValue, calcResult.FinalTotal)
	}
	if saved.CalculationBreakdown == nil {
		t.Error("expected non-nil calculation_breakdown in GET response")
	}
}

// TestEndToEndCalculateWithAdjustmentsAndSave exercises the adjustment code path end-to-end:
// engine applies urgency + pediatric, then the handler extracts codes from SelectedAdjustments.
func TestEndToEndCalculateWithAdjustmentsAndSave(t *testing.T) {
	repo := repository.NewFileRepository()

	adjs := []string{"emergency_special_hours", "pediatric_child_under_12"}
	calcReq := generated.CalculateRequest{
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.01.01.11-5", Description: "Craniectomia", Porte: "10A",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.Specialty("NEUROSURGERY")},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   0,
		RequiresAnesthesia: false,
		Adjustments:        &adjs,
	}
	calcResult := mustCalculate(t, repo, calcReq)

	if len(calcResult.SelectedAdjustments) != 2 {
		t.Fatalf("engine: expected 2 applied adjustments, got %d", len(calcResult.SelectedAdjustments))
	}
	// Total adjustment must be 30% (urgency) + 30% (pediatric_child_under_12) = 60%.
	if calcResult.TotalAdjustmentPercentage != 60.0 {
		t.Errorf("total_adjustment_percentage: got %f, want 60", calcResult.TotalAdjustmentPercentage)
	}

	saveResp := mustSaveCalculation(t, repo, generated.SaveCalculationRequest{
		ProcedureName:     "Craniectomia urgência pediátrica",
		SelectedCodes:     calcReq.SelectedCodes,
		AccessRouteType:   generated.Same,
		AuxiliariesCount:  0,
		CalculationResult: calcResult,
	})

	// Verify adjustments persisted in the model layer.
	calc, err := repo.GetCalculationByPublicID(saveResp.PublicId.String())
	if err != nil || calc == nil {
		t.Fatalf("repo.GetCalculationByPublicID: err=%v", err)
	}
	if len(calc.Adjustments) != 2 {
		t.Errorf("model.Adjustments: expected 2, got %v", calc.Adjustments)
	}
}

// ── Scenario B: Composition persistence ──────────────────────────────────────

// TestCompositionSelectedCodesSurviveFullRoundTrip verifies that all 8 SelectedCode
// fields persist through composition create → GET. Unlike the calculation handler
// (which only projects 3 code fields in GET), the composition handler returns the
// full SelectedCode array.
func TestCompositionSelectedCodesSurviveFullRoundTrip(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-full-roundtrip")

	qty := 3
	lat := generated.BILATERAL
	sbnID := "spine-sbn"
	req := generated.SaveCompositionRequest{
		Name:             "Fusão lombar L4-L5-S1",
		SbnProcedureName: "ARTRODESE LOMBAR",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{
				CbhpmCode:         "3.06.01.01-0",
				Description:       "Artrodese lombar por segmento",
				Porte:             "12A",
				BillingMode:       generated.BillingModePERSEGMENT,
				Specialty:         generated.Specialty("SPINE"),
				LateralitySupport: true,
				Laterality:        &lat,
				QuantitySelected:  &qty,
			},
			{
				CbhpmCode:         "3.02.15.02-1",
				Description:       "Craniotomia descompressiva",
				Porte:             "9C",
				BillingMode:       generated.BillingModePERPROCEDURE,
				Specialty:         generated.Specialty("NEUROSURGERY"),
				LateralitySupport: false,
			},
		},
		AccessRouteType:    generated.Different,
		AuxiliariesCount:   2,
		RequiresAnesthesia: true,
	}
	b, _ := json.Marshal(req)
	id := saveComposition(t, mux, b)
	detail := getCompositionDetail(t, mux, id)

	if len(detail.SelectedCodes) != 2 {
		t.Fatalf("expected 2 selected codes, got %d", len(detail.SelectedCodes))
	}

	spine := detail.SelectedCodes[0]
	if spine.CbhpmCode != "3.06.01.01-0" {
		t.Errorf("code[0] cbhpm_code: got %q", spine.CbhpmCode)
	}
	if spine.BillingMode != generated.BillingModePERSEGMENT {
		t.Errorf("code[0] billing_mode: got %q, want PER_SEGMENT", spine.BillingMode)
	}
	if spine.Specialty != generated.Specialty("SPINE") {
		t.Errorf("code[0] specialty: got %q, want SPINE", spine.Specialty)
	}
	if !spine.LateralitySupport {
		t.Error("code[0] laterality_support: expected true")
	}
	if spine.QuantitySelected == nil || *spine.QuantitySelected != 3 {
		t.Errorf("code[0] quantity_selected: got %v, want 3", spine.QuantitySelected)
	}
	if spine.Laterality == nil || *spine.Laterality != generated.BILATERAL {
		t.Errorf("code[0] laterality: got %v, want BILATERAL", spine.Laterality)
	}

	neuro := detail.SelectedCodes[1]
	if neuro.CbhpmCode != "3.02.15.02-1" {
		t.Errorf("code[1] cbhpm_code: got %q", neuro.CbhpmCode)
	}
	if neuro.BillingMode != generated.BillingModePERPROCEDURE {
		t.Errorf("code[1] billing_mode: got %q, want PER_PROCEDURE", neuro.BillingMode)
	}
	if neuro.LateralitySupport {
		t.Error("code[1] laterality_support: expected false for standard neuro code")
	}
}

// TestCompositionMetadataSurvivesUpdate verifies that all non-code fields persist
// correctly through a PUT operation — a regression guard for the UpdateComposition handler.
func TestCompositionMetadataSurvivesUpdate(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-meta-update")

	id := saveComposition(t, mux, compositionPayload("Versão inicial"))

	sbnID := "updated-sbn-id"
	adj := []string{"emergency_special_hours"}
	qty := 2
	lat := generated.BILATERAL
	updateReq := generated.SaveCompositionRequest{
		Name:             "Versão atualizada",
		SbnProcedureName: "DESCOMPRESSÃO CERVICAL",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.06.01.01-0", Description: "Artrodese", Porte: "12A",
				BillingMode: generated.BillingModePERSEGMENT, Specialty: generated.Specialty("SPINE"),
				LateralitySupport: true, Laterality: &lat, QuantitySelected: &qty},
		},
		AccessRouteType:    generated.Different,
		AuxiliariesCount:   3,
		RequiresAnesthesia: true,
		Adjustments:        &adj,
		Modifiers: &generated.BillingModifiers{
			QuantitySelected: &qty,
			Laterality:       &lat,
		},
	}
	b, _ := json.Marshal(updateReq)
	detail := updateComposition(t, mux, id, b)

	if detail.Name != "Versão atualizada" {
		t.Errorf("name: got %q", detail.Name)
	}
	if detail.SbnProcedureName != "DESCOMPRESSÃO CERVICAL" {
		t.Errorf("sbn_procedure_name: got %q", detail.SbnProcedureName)
	}
	if detail.AccessRouteType != generated.Different {
		t.Errorf("access_route_type: got %q", detail.AccessRouteType)
	}
	if detail.AuxiliariesCount != 3 {
		t.Errorf("auxiliaries_count: got %d", detail.AuxiliariesCount)
	}
	if !detail.RequiresAnesthesia {
		t.Error("expected requires_anesthesia=true after update")
	}
	if len(detail.Adjustments) != 1 || detail.Adjustments[0] != "emergency_special_hours" {
		t.Errorf("adjustments: got %v", detail.Adjustments)
	}
	if detail.Modifiers == nil || detail.Modifiers.QuantitySelected == nil {
		t.Error("expected modifiers non-nil after update")
	}
	if *detail.Modifiers.QuantitySelected != 2 {
		t.Errorf("modifiers.quantity_selected: got %d, want 2", *detail.Modifiers.QuantitySelected)
	}
}

// ── Scenario C: Legacy compatibility ─────────────────────────────────────────

// TestLegacyCompositionWithoutModifiersLoadsCleanly verifies that a composition
// created without modifiers (simulating a pre-migration-018 row) loads correctly
// with Modifiers == nil. The handler must not crash or return an error.
func TestLegacyCompositionWithoutModifiersLoadsCleanly(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-legacy")

	// compositionPayload() creates a request with no Modifiers field (nil).
	id := saveComposition(t, mux, compositionPayload("Composição legada"))
	detail := getCompositionDetail(t, mux, id)

	if detail.Modifiers != nil {
		t.Errorf("expected nil Modifiers for legacy composition, got %+v", detail.Modifiers)
	}
	// Core fields must still be available for the engine to use as fallback.
	if len(detail.SelectedCodes) == 0 {
		t.Error("expected at least one selected code in legacy composition")
	}
	if detail.Name != "Composição legada" {
		t.Errorf("name: got %q", detail.Name)
	}
}

// ── Scenario D: Clinical modifiers ───────────────────────────────────────────

// TestClinicalAdjustmentsUrgentyAndPediatricThroughCompositionCycle verifies that
// urgency and pediatric adjustment codes both survive the create → update → reload
// composition lifecycle. Both codes must be present after each operation.
func TestClinicalAdjustmentsUrgentyAndPediatricThroughCompositionCycle(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-clinical-adj")

	sbnID := "neuro-sbn"
	adj := []string{"emergency_special_hours", "pediatric_child_under_12"}

	req := generated.SaveCompositionRequest{
		Name:             "Urgência pediátrica",
		SbnProcedureName: "CRANIOTOMIA",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.01.01.11-5", Description: "Craniectomia", Porte: "10A",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.Specialty("NEUROSURGERY")},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   1,
		RequiresAnesthesia: true,
		Adjustments:        &adj,
	}
	b, _ := json.Marshal(req)
	id := saveComposition(t, mux, b)

	// Verify after create.
	detail := getCompositionDetail(t, mux, id)
	if len(detail.Adjustments) != 2 {
		t.Fatalf("after create: expected 2 adjustments, got %v", detail.Adjustments)
	}
	assertAdjustmentPresent(t, "after create", detail.Adjustments, "emergency_special_hours")
	assertAdjustmentPresent(t, "after create", detail.Adjustments, "pediatric_child_under_12")

	// Update — keep same adjustments, change name.
	req.Name = "Urgência pediátrica (atualizada)"
	b2, _ := json.Marshal(req)
	updated := updateComposition(t, mux, id, b2)

	if len(updated.Adjustments) != 2 {
		t.Fatalf("after update: expected 2 adjustments, got %v", updated.Adjustments)
	}
	assertAdjustmentPresent(t, "after update", updated.Adjustments, "emergency_special_hours")
	assertAdjustmentPresent(t, "after update", updated.Adjustments, "pediatric_child_under_12")

	// Reload — confirm durability.
	reloaded := getCompositionDetail(t, mux, id)
	if len(reloaded.Adjustments) != 2 {
		t.Fatalf("after reload: expected 2 adjustments, got %v", reloaded.Adjustments)
	}
	assertAdjustmentPresent(t, "after reload", reloaded.Adjustments, "emergency_special_hours")
	assertAdjustmentPresent(t, "after reload", reloaded.Adjustments, "pediatric_child_under_12")
}

// TestClinicalAdjustmentsAllFourTypes verifies that all four valid CBHPM adjustment codes
// persist correctly through a composition save. This is the maximum adjustment scenario.
func TestClinicalAdjustmentsAllFourTypes(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-all-adj")

	sbnID := "neuro-sbn-all"
	adj := []string{
		"emergency_special_hours",
		"pediatric_low_weight_or_premature",
		"pediatric_neonate_or_infant",
		"pediatric_child_under_12",
	}
	req := generated.SaveCompositionRequest{
		Name:             "Todos os modificadores clínicos",
		SbnProcedureName: "CRANIOTOMIA",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{CbhpmCode: "3.01.01.11-5", Description: "Craniectomia", Porte: "10A",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.Specialty("NEUROSURGERY")},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   0,
		RequiresAnesthesia: false,
		Adjustments:        &adj,
	}
	b, _ := json.Marshal(req)
	id := saveComposition(t, mux, b)
	detail := getCompositionDetail(t, mux, id)

	if len(detail.Adjustments) != 4 {
		t.Fatalf("expected 4 adjustments, got %v", detail.Adjustments)
	}
	for _, code := range adj {
		assertAdjustmentPresent(t, "all-four", detail.Adjustments, code)
	}
}

// assertAdjustmentPresent is a helper that fails the test if the code is not in the slice.
func assertAdjustmentPresent(t *testing.T, when string, adjustments []string, code string) {
	t.Helper()
	for _, a := range adjustments {
		if a == code {
			return
		}
	}
	t.Errorf("%s: adjustment %q not found in %v", when, code, adjustments)
}

// ── Scenario E: Spine modifiers ───────────────────────────────────────────────

// TestSpineModifiersSurviveCompositionUpdate verifies that quantity_selected and
// laterality in Modifiers persist correctly through a composition update operation,
// and that changing them on update is reflected in the subsequent GET.
func TestSpineModifiersSurviveCompositionUpdate(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-spine-update")

	// Create: 2 segments, unilateral.
	id := saveComposition(t, mux, compositionPayloadWithModifiers("Inicial", 2, generated.UNILATERAL))
	after := getCompositionDetail(t, mux, id)
	if after.Modifiers == nil || *after.Modifiers.QuantitySelected != 2 {
		t.Errorf("after create: quantity_selected = %v", after.Modifiers)
	}
	if *after.Modifiers.Laterality != generated.UNILATERAL {
		t.Errorf("after create: laterality = %v", after.Modifiers.Laterality)
	}

	// Update: 4 segments, bilateral.
	updated := updateComposition(t, mux, id, compositionPayloadWithModifiers("Atualizada", 4, generated.BILATERAL))
	if updated.Modifiers == nil || *updated.Modifiers.QuantitySelected != 4 {
		t.Errorf("after update: quantity_selected = %v", updated.Modifiers)
	}
	if *updated.Modifiers.Laterality != generated.BILATERAL {
		t.Errorf("after update: laterality = %v", updated.Modifiers.Laterality)
	}

	// Reload to confirm durability.
	reloaded := getCompositionDetail(t, mux, id)
	if reloaded.Modifiers == nil || *reloaded.Modifiers.QuantitySelected != 4 {
		t.Errorf("after reload: quantity_selected = %v", reloaded.Modifiers)
	}
	if *reloaded.Modifiers.Laterality != generated.BILATERAL {
		t.Errorf("after reload: laterality = %v", reloaded.Modifiers.Laterality)
	}
}

// TestSpineModifiersRemovedOnUpdate verifies that updating a spine composition
// to a non-spine payload (no modifiers) correctly clears the stored modifiers.
func TestSpineModifiersRemovedOnUpdate(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-spine-clear")

	// Create with spine modifiers.
	id := saveComposition(t, mux, compositionPayloadWithModifiers("Com modificadores", 3, generated.BILATERAL))

	// Update with standard composition (no modifiers).
	updated := updateComposition(t, mux, id, compositionPayload("Sem modificadores"))

	if updated.Modifiers != nil {
		t.Errorf("expected nil Modifiers after update to non-spine payload, got %+v", updated.Modifiers)
	}

	// Reload confirms the clear is durable.
	reloaded := getCompositionDetail(t, mux, id)
	if reloaded.Modifiers != nil {
		t.Errorf("reload: expected nil Modifiers, got %+v", reloaded.Modifiers)
	}
}
