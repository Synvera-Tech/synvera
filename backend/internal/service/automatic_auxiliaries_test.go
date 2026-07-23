package service

import (
	"testing"

	"synvera/backend/internal/models"
)

var automaticAuxPortes = map[string]float64{
	"8A":  800,
	"10B": 1000,
	"14A": 1400,
}

func automaticAuxResult(codes []models.SelectedCode) models.CalculationResult {
	return CalculateAutomaticAuxiliaries(
		codes,
		false,
		models.AccessRouteSame,
		nil,
		automaticAuxPortes,
		nil,
		nil,
		false,
		models.AnesthesiaAssistantJustification{},
		false,
		models.AuxiliaryRuleSource{
			Document:      "CBHPM 2022",
			Version:       "2022",
			SelectionRule: "highest porte, stable tie",
		},
	)
}

func TestAutomaticAuxiliaries_CountsZeroThroughThree(t *testing.T) {
	for count := 0; count <= 3; count++ {
		t.Run(string(rune('0'+count)), func(t *testing.T) {
			got := automaticAuxResult([]models.SelectedCode{{
				CBHPMCode:      "MAIN",
				Description:    "Principal",
				Porte:          "14A",
				NumAuxiliaries: count,
			}})
			if len(got.IndividualAuxFees) != count {
				t.Fatalf("fees = %d, want %d", len(got.IndividualAuxFees), count)
			}
			if got.PrincipalProcedure.NumAuxiliaries != count {
				t.Fatalf("snapshot count = %d, want %d", got.PrincipalProcedure.NumAuxiliaries, count)
			}
		})
	}
}

func TestAutomaticAuxiliaries_UsesPrincipalNotMaximumCount(t *testing.T) {
	got := automaticAuxResult([]models.SelectedCode{
		{CBHPMCode: "A", Description: "Maior porte", Porte: "14A", NumAuxiliaries: 2},
		{CBHPMCode: "B", Description: "Maior equipe", Porte: "10B", NumAuxiliaries: 3},
	})
	if len(got.IndividualAuxFees) != 2 {
		t.Fatalf("fees = %d, want 2 from the 14A principal", len(got.IndividualAuxFees))
	}
	if got.PrincipalProcedure.CBHPMCode != "A" {
		t.Fatalf("principal = %q, want A", got.PrincipalProcedure.CBHPMCode)
	}
}

func TestAutomaticAuxiliaries_PrincipalMayHaveMoreAuxiliaries(t *testing.T) {
	got := automaticAuxResult([]models.SelectedCode{
		{CBHPMCode: "LOW", Porte: "8A", NumAuxiliaries: 1},
		{CBHPMCode: "HIGH", Porte: "14A", NumAuxiliaries: 3},
	})
	if len(got.IndividualAuxFees) != 3 {
		t.Fatalf("fees = %d, want 3", len(got.IndividualAuxFees))
	}
}

func TestAutomaticAuxiliaries_StableTieAndAuditSource(t *testing.T) {
	got := automaticAuxResult([]models.SelectedCode{
		{CBHPMCode: "FIRST", Porte: "10B", NumAuxiliaries: 1},
		{CBHPMCode: "SECOND", Porte: "10B", NumAuxiliaries: 3},
	})
	if got.PrincipalProcedure.CBHPMCode != "FIRST" || len(got.IndividualAuxFees) != 1 {
		t.Fatalf("tie must keep first: principal=%q fees=%d", got.PrincipalProcedure.CBHPMCode, len(got.IndividualAuxFees))
	}
	if got.AuxiliaryRuleSource.Document != "CBHPM 2022" || got.AuxiliaryRuleSource.Version != "2022" {
		t.Fatalf("missing normative source: %+v", got.AuxiliaryRuleSource)
	}
}
