package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/repository"
)

// N5a (endpoint): POST /api/calculate must enrich each code with the normative rule from the
// database — the backend is the numerical authority. A spine PER_VERTEBRA code submitted with
// the catalog's PER_PROCEDURE billing mode and quantity 2 must be billed ×2, while the same
// code in a neurosurgery context (specialty NEUROSURGERY) is NOT enriched (×1).
func TestCalculateEndpoint_AppliesNormativeModifiers(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-calc-modifiers")

	qty := 2
	calc := func(specialty generated.Specialty) generated.CodeBreakdown {
		req := generated.CalculateRequest{
			SelectedCodes: []generated.SelectedCode{{
				CbhpmCode: "3.07.15.19-9", // Laminectomia — PER_VERTEBRA in the modifier table
				Description: "Laminectomia",
				Porte:       "9C",
				// Client sends the catalog default; the backend must override it for spine.
				BillingMode:       generated.BillingModePERPROCEDURE,
				Specialty:         specialty,
				LateralitySupport: false,
				QuantitySelected:  &qty,
			}},
			AccessRouteType:    generated.Same,
			AuxiliariesCount:   0,
			RequiresAnesthesia: false,
		}
		w := postCalculateRequest(t, mux, req)
		if w.Code != http.StatusOK {
			t.Fatalf("calculate (%s): status %d, body %s", specialty, w.Code, w.Body.String())
		}
		var resp generated.CalculateResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if len(resp.CodeBreakdown) != 1 {
			t.Fatalf("expected 1 code breakdown, got %d", len(resp.CodeBreakdown))
		}
		return resp.CodeBreakdown[0]
	}

	// SPINE: enriched to PER_VERTEBRA → ×2.
	spine := calc(generated.SPINE)
	if spine.BillingMode != generated.BillingModePERVERTEBRA {
		t.Errorf("spine billing_mode = %q, want PER_VERTEBRA (backend override)", spine.BillingMode)
	}
	if spine.QuantityMultiplier != 2 {
		t.Errorf("spine quantity_multiplier = %v, want 2", spine.QuantityMultiplier)
	}
	if spine.AdjustedValue != spine.BaseValue*2 {
		t.Errorf("spine adjusted = %v, want base×2 = %v", spine.AdjustedValue, spine.BaseValue*2)
	}

	// NEUROSURGERY: not enriched → stays PER_PROCEDURE, ×1.
	neuro := calc(generated.NEUROSURGERY)
	if neuro.QuantityMultiplier != 1 {
		t.Errorf("neuro quantity_multiplier = %v, want 1 (no enrichment)", neuro.QuantityMultiplier)
	}
	if neuro.AdjustedValue != neuro.BaseValue {
		t.Errorf("neuro adjusted = %v, want base = %v", neuro.AdjustedValue, neuro.BaseValue)
	}
}

// A9 (endpoint): a second anesthesiologist (60%) is added for an AN8 procedure when requested.
func TestCalculateEndpoint_AnesthesiaAssistantForAN8(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-anesthesia-assistant")

	assistant := true
	req := generated.CalculateRequest{
		SelectedCodes: []generated.SelectedCode{{
			CbhpmCode: "3.07.15.01-6", // anesthetic porte AN8
			Description: "Artrodese", Porte: "12C",
			BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.SPINE,
			LateralitySupport: false,
		}},
		AccessRouteType:     generated.Same,
		AuxiliariesCount:    0,
		AnesthesiaAssistant: &assistant,
	}
	w := postCalculateRequest(t, mux, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d: %s", w.Code, w.Body.String())
	}
	var resp generated.CalculateResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.AnesthesiaPorte == nil || *resp.AnesthesiaPorte != 8 {
		t.Fatalf("anesthesia_porte = %v, want 8", resp.AnesthesiaPorte)
	}
	if resp.AnesthesiaAssistantFee == nil {
		t.Fatal("anesthesia_assistant_fee missing")
	}
	want := resp.AnesthesiologistFee * 0.60
	if diff := *resp.AnesthesiaAssistantFee - want; diff > 0.01 || diff < -0.01 {
		t.Errorf("assistant fee = %v, want %v (60%% of anesthesiologist)", *resp.AnesthesiaAssistantFee, want)
	}
}
