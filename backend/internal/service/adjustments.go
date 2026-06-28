package service

// Valid adjustment code identifiers — used in the adjustments slice of a calculation request.
const (
	AdjCodeEmergencySpecialHours         = "emergency_special_hours"
	AdjCodePediatricLowWeightOrPremature = "pediatric_low_weight_or_premature"
	AdjCodePediatricNeonateOrInfant      = "pediatric_neonate_or_infant"
	AdjCodePediatricChildUnder12         = "pediatric_child_under_12"
)

type adjMeta struct {
	label      string
	percentage float64
	source     string
}

// AdjustmentCatalog maps each valid adjustment code to its display metadata and percentage.
//
// Percentages are additive: emergency(30%) + pediatric(30%) → multiplier 1.60, not 1.30×1.30.
// Source: CBHPM 2022 Instruções Gerais.
var AdjustmentCatalog = map[string]adjMeta{
	AdjCodeEmergencySpecialHours: {
		label:      "Urgência/emergência em horário especial",
		percentage: 30.0,
		source:     "CBHPM 2022, Instruções Gerais, item 2",
	},
	AdjCodePediatricLowWeightOrPremature: {
		label:      "Criança < 2.500 g ou prematura < 37 semanas",
		percentage: 100.0,
		source:     "CBHPM 2022, Instruções Gerais, item 4.6",
	},
	AdjCodePediatricNeonateOrInfant: {
		label:      "Neonato/lactante — 0 a 24 meses",
		percentage: 50.0,
		source:     "CBHPM 2022, Instruções Gerais, item 4.7",
	},
	AdjCodePediatricChildUnder12: {
		label:      "Pediátrico — 24 meses completos a 12 anos incompletos",
		percentage: 30.0,
		source:     "CBHPM 2022, Instruções Gerais, item 4.8",
	},
}
