package service

import (
	"encoding/json"
	"reflect"
	"testing"

	"synvera/backend/internal/models"
)

// P1 (CBHPM 2022 p.140 item 8): the anesthesia assistant (60% of the principal anesthetic porte)
// applies for AN7/AN8 (auto-detectable, gated by the toggle) OR any USER_SELECTABLE non-derivable
// trigger (CEC, >6h, surgical neonatology, bariatric gastroplasty). It is applied ONCE regardless
// of how many triggers fire, and every firing trigger is recorded for auditability.
//
// Round porte values keep the arithmetic unambiguous: AN6→9B=900, AN7→10C=1000, AN8→12A=1200.
var anPortesP1 = map[string]float64{"7C": 700, "9B": 900, "10C": 1000, "12A": 1200}

var noJust = models.AnesthesiaAssistantJustification{}

func p1Calc(anPorte int, toggle bool, j models.AnesthesiaAssistantJustification) models.CalculationResult {
	return CalculateWithPortesModifiersAndAnesthesia(
		[]models.SelectedCode{code("A")}, 0, false, models.AccessRouteSame, nil,
		anPortesP1, nil, map[string]int{"A": anPorte}, toggle, j, false,
	)
}

// 1. AN7 enables the assistant per the existing rule (toggle on).
func TestP1_AN7EnablesAssistant(t *testing.T) {
	got := p1Calc(7, true, noJust) // AN7 → 10C = 1000; assistant 60% = 600
	if !got.AnesthesiaAssistantApplied || got.AnesthesiaAssistantFee != 600 {
		t.Fatalf("AN7: applied=%v fee=%v, want true/600", got.AnesthesiaAssistantApplied, got.AnesthesiaAssistantFee)
	}
	if !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"AN7"}) {
		t.Errorf("reasons=%v, want [AN7]", got.AnesthesiaAssistantReasons)
	}
}

// 2. AN8 enables the assistant.
func TestP1_AN8EnablesAssistant(t *testing.T) {
	got := p1Calc(8, true, noJust) // AN8 → 12A = 1200; assistant 60% = 720
	if got.AnesthesiaAssistantFee != 720 || !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"AN8"}) {
		t.Fatalf("AN8: fee=%v reasons=%v, want 720/[AN8]", got.AnesthesiaAssistantFee, got.AnesthesiaAssistantReasons)
	}
}

// 3. AN6 with no trigger (even with the toggle on) → no assistant.
func TestP1_AN6NoTriggerNoAssistant(t *testing.T) {
	got := p1Calc(6, true, noJust)
	if got.AnesthesiaAssistantApplied || got.AnesthesiaAssistantFee != 0 {
		t.Fatalf("AN6 no trigger: applied=%v fee=%v, want false/0", got.AnesthesiaAssistantApplied, got.AnesthesiaAssistantFee)
	}
	if got.AnesthesiaAssistantReasons != nil {
		t.Errorf("reasons=%v, want nil", got.AnesthesiaAssistantReasons)
	}
}

// 4. AN6 + CEC → assistant (60% of 900 = 540).
func TestP1_AN6WithCEC(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{CEC: true})
	if got.AnesthesiaAssistantFee != 540 || !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"cec"}) {
		t.Fatalf("AN6+CEC: fee=%v reasons=%v, want 540/[cec]", got.AnesthesiaAssistantFee, got.AnesthesiaAssistantReasons)
	}
}

// 5. AN6 + duration over 6h.
func TestP1_AN6WithDurationOver6h(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{DurationOver6h: true})
	if got.AnesthesiaAssistantFee != 540 || !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"duration_over_6h"}) {
		t.Fatalf("AN6+>6h: fee=%v reasons=%v", got.AnesthesiaAssistantFee, got.AnesthesiaAssistantReasons)
	}
}

// 6. AN6 + surgical neonatology.
func TestP1_AN6WithNeonatology(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{SurgicalNeonatology: true})
	if got.AnesthesiaAssistantFee != 540 || !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"surgical_neonatology"}) {
		t.Fatalf("AN6+neonat: fee=%v reasons=%v", got.AnesthesiaAssistantFee, got.AnesthesiaAssistantReasons)
	}
}

// 7. AN6 + bariatric gastroplasty.
func TestP1_AN6WithGastroplasty(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{BariatricGastroplasty: true})
	if got.AnesthesiaAssistantFee != 540 || !reflect.DeepEqual(got.AnesthesiaAssistantReasons, []string{"bariatric_gastroplasty"}) {
		t.Fatalf("AN6+gastro: fee=%v reasons=%v", got.AnesthesiaAssistantFee, got.AnesthesiaAssistantReasons)
	}
}

// 8. Multiple triggers do NOT duplicate the 60% — a single fee, with all reasons recorded.
func TestP1_MultipleTriggersDoNotDuplicate(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{CEC: true, DurationOver6h: true, BariatricGastroplasty: true})
	if got.AnesthesiaAssistantFee != 540 { // still 60% once, not 180%
		t.Fatalf("multi-trigger fee=%v, want 540 (single 60%%)", got.AnesthesiaAssistantFee)
	}
	want := []string{"cec", "duration_over_6h", "bariatric_gastroplasty"}
	if !reflect.DeepEqual(got.AnesthesiaAssistantReasons, want) {
		t.Errorf("reasons=%v, want %v", got.AnesthesiaAssistantReasons, want)
	}
}

// 8b. AN7 (toggle) together with a justification trigger → still a single 60%, both reasons.
func TestP1_AN7PlusTriggerDoNotDuplicate(t *testing.T) {
	got := p1Calc(7, true, models.AnesthesiaAssistantJustification{CEC: true})
	if got.AnesthesiaAssistantFee != 600 { // 60% of AN7=1000, once
		t.Fatalf("AN7+CEC fee=%v, want 600 (single 60%%)", got.AnesthesiaAssistantFee)
	}
	if want := []string{"AN7", "cec"}; !reflect.DeepEqual(got.AnesthesiaAssistantReasons, want) {
		t.Errorf("reasons=%v, want %v", got.AnesthesiaAssistantReasons, want)
	}
}

// 9. The snapshot (engine JSON) preserves the reason and the normative source across a round-trip.
func TestP1_SnapshotPreservesReasonAndSource(t *testing.T) {
	got := p1Calc(6, false, models.AnesthesiaAssistantJustification{CEC: true})
	if got.AnesthesiaAssistantSource != "CBHPM 2022 p.140 item 8" {
		t.Errorf("source=%q, want CBHPM 2022 p.140 item 8", got.AnesthesiaAssistantSource)
	}
	blob, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var back models.CalculationResult
	if err := json.Unmarshal(blob, &back); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !back.AnesthesiaAssistantApplied || !reflect.DeepEqual(back.AnesthesiaAssistantReasons, []string{"cec"}) {
		t.Errorf("snapshot lost reason: applied=%v reasons=%v", back.AnesthesiaAssistantApplied, back.AnesthesiaAssistantReasons)
	}
}
