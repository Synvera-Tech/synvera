package handlers_test

import (
	"encoding/json"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/repository"
)

// N5b: a composition must preserve a DISTINCT quantity per code (not a single global value).
// This is the persistence guarantee behind the per-code quantity selector: saving and reloading
// must round-trip each code's own quantity_selected.
func TestComposition_PerCodeQuantitiesSurviveRoundTrip(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "user-percode-qty")

	q3, q2 := 3, 2
	sbnID := "spine-sbn"
	req := generated.SaveCompositionRequest{
		Name:             "Artrodese 3 níveis + descompressão 2 níveis",
		SbnProcedureName: "ARTRODESE LOMBAR",
		SbnProcedureId:   &sbnID,
		SelectedCodes: []generated.SelectedCode{
			{
				CbhpmCode: "3.07.15.01-6", Description: "Artrodese por segmento", Porte: "12C",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.SPINE,
				LateralitySupport: false, QuantitySelected: &q3,
			},
			{
				CbhpmCode: "3.07.15.09-1", Description: "Descompressão medular", Porte: "9C",
				BillingMode: generated.BillingModePERPROCEDURE, Specialty: generated.SPINE,
				LateralitySupport: false, QuantitySelected: &q2,
			},
		},
		AccessRouteType:    generated.Same,
		AuxiliariesCount:   1,
		RequiresAnesthesia: true,
	}
	b, _ := json.Marshal(req)
	id := saveComposition(t, mux, b)
	detail := getCompositionDetail(t, mux, id)

	got := map[string]int{}
	for _, c := range detail.SelectedCodes {
		if c.QuantitySelected != nil {
			got[c.CbhpmCode] = *c.QuantitySelected
		}
	}
	if got["3.07.15.01-6"] != 3 {
		t.Errorf("artrodese quantity = %d, want 3", got["3.07.15.01-6"])
	}
	if got["3.07.15.09-1"] != 2 {
		t.Errorf("descompressão quantity = %d, want 2", got["3.07.15.09-1"])
	}
}
