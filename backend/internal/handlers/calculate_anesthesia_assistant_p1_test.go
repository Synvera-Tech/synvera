package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/repository"
)

// P1 endpoint contract: the client sends the USER_SELECTABLE anesthesia-assistant triggers in the
// canonical payload (anesthesia_auxiliary_justification); the backend — the numerical authority —
// decides whether the 60% applies and records the reason. This proves the frontend→backend wiring
// end to end (the frontend only collects the booleans).
func TestCalculateEndpoint_AnesthesiaAssistantJustification(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-p1-anesthesia")

	boolPtr := func(b bool) *bool { return &b }

	// A code that carries an anesthetic porte in the catalog (3.01.01.55-7 → AN4), so there is a
	// principal anesthesiologist fee to base the 60% on.
	newReq := func(j *generated.AnesthesiaAuxiliaryJustification) generated.CalculateRequest {
		return generated.CalculateRequest{
			SelectedCodes: []generated.SelectedCode{{
				CbhpmCode:         "3.01.01.55-7",
				Description:       "Procedimento com porte anestésico",
				Porte:             "6B",
				BillingMode:       generated.BillingModePERPROCEDURE,
				Specialty:         generated.NEUROSURGERY,
				LateralitySupport: false,
			}},
			AccessRouteType:                 generated.Same,
			AuxiliariesCount:                0,
			RequiresAnesthesia:              false,
			AnesthesiaAuxiliaryJustification: j,
		}
	}

	call := func(j *generated.AnesthesiaAuxiliaryJustification) generated.CalculateResponse {
		w := postCalculateRequest(t, mux, newReq(j))
		if w.Code != http.StatusOK {
			t.Fatalf("status %d, body %s", w.Code, w.Body.String())
		}
		var resp generated.CalculateResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode: %v", err)
		}
		return resp
	}

	// No justification → no assistant (AN4 is not AN7/AN8).
	base := call(nil)
	if base.AnesthesiaAssistantApplied != nil && *base.AnesthesiaAssistantApplied {
		t.Fatalf("no-justification: assistant applied, want not applied")
	}
	if base.AnesthesiologistFee <= 0 {
		t.Fatalf("expected a positive anesthesiologist fee to base the test on, got %v", base.AnesthesiologistFee)
	}

	// CEC selected → assistant applied at 60%, reason recorded.
	got := call(&generated.AnesthesiaAuxiliaryJustification{Cec: boolPtr(true)})
	if got.AnesthesiaAssistantApplied == nil || !*got.AnesthesiaAssistantApplied {
		t.Fatalf("CEC: assistant not applied, want applied")
	}
	if got.AnesthesiaAssistantFee == nil || *got.AnesthesiaAssistantFee <= 0 {
		t.Fatalf("CEC: assistant fee = %v, want > 0", got.AnesthesiaAssistantFee)
	}
	// 60% of the principal anesthesiologist fee (float32 tolerance).
	if want := got.AnesthesiologistFee * 0.60; abs32(*got.AnesthesiaAssistantFee-want) > 0.01 {
		t.Errorf("assistant fee = %v, want ≈ %v (60%% of %v)", *got.AnesthesiaAssistantFee, want, got.AnesthesiologistFee)
	}
	if got.AnesthesiaAssistantReasons == nil || len(*got.AnesthesiaAssistantReasons) != 1 || (*got.AnesthesiaAssistantReasons)[0] != "cec" {
		t.Errorf("reasons = %v, want [cec]", got.AnesthesiaAssistantReasons)
	}
}

func abs32(f float32) float32 {
	if f < 0 {
		return -f
	}
	return f
}
