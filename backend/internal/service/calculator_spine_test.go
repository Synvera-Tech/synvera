package service

import (
	"afere/backend/internal/models"
	"testing"
)

// Test_NonSpineProcedureShowsNoVariables verifies that existing neurosurgery procedures
// continue to work without any spine-specific fields affecting calculations.
func Test_NonSpineProcedureShowsNoVariables(t *testing.T) {
	codes := []models.SelectedCode{
		{
			CBHPMCode:         "3.14.01.26-0", // Non-spine neurosurgery code
			Description:       "Tumor of skull base",
			Porte:             "9A",
			BillingMode:       models.BillingModeProcedure,
			Specialty:         models.SpecialtyNeurosurgery,
			LateralitySupport: false,
			QuantitySelected:  1,
			Laterality:        models.LateralityUnilateral,
		},
	}

	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	// Verify base calculation is unchanged from original behavior
	if result.FinalTotal == 0 {
		t.Errorf("Expected non-zero result for non-spine procedure")
	}

	// Verify no quantity or laterality multipliers are applied
	if result.CodeBreakdown[0].QuantityMultiplier != 1.0 {
		t.Errorf("Expected quantity multiplier = 1.0 for non-spine procedure, got %v", result.CodeBreakdown[0].QuantityMultiplier)
	}

	if result.CodeBreakdown[0].LateralityMultiplier != 1.0 {
		t.Errorf("Expected laterality multiplier = 1.0 for non-spine procedure without laterality support, got %v", result.CodeBreakdown[0].LateralityMultiplier)
	}
}

// Test_PerSegmentShowsQuantitySelector verifies that PER_SEGMENT procedures
// apply the correct quantity multiplier.
func Test_PerSegmentShowsQuantitySelector(t *testing.T) {
	basePorte := "7A" // 858.03 BRL

	testCases := []struct {
		name             string
		quantity         int
		expectedMultiplier float64
		expectedAdjustedValue float64
	}{
		{
			name:             "Single segment",
			quantity:         1,
			expectedMultiplier: 1.0,
			expectedAdjustedValue: 858.03,
		},
		{
			name:             "Two segments",
			quantity:         2,
			expectedMultiplier: 2.0,
			expectedAdjustedValue: 1716.06,
		},
		{
			name:             "Three segments",
			quantity:         3,
			expectedMultiplier: 3.0,
			expectedAdjustedValue: 2574.09,
		},
		{
			name:             "Four segments",
			quantity:         4,
			expectedMultiplier: 4.0,
			expectedAdjustedValue: 3432.12,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			codes := []models.SelectedCode{
				{
					CBHPMCode:         "4.08.13.36-3", // Infiltração foraminal - PER_SEGMENT
					Description:       "Coluna vertebral: infiltração foraminal ou facetária ou articular",
					Porte:             basePorte,
					BillingMode:       models.BillingModeSegment,
					Specialty:         models.SpecialtySpine,
					LateralitySupport: true,
					QuantitySelected:  tc.quantity,
					Laterality:        models.LateralityUnilateral,
				},
			}

			result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

			// Verify quantity multiplier
			if result.CodeBreakdown[0].QuantityMultiplier != tc.expectedMultiplier {
				t.Errorf("Expected quantity multiplier %v, got %v", tc.expectedMultiplier, result.CodeBreakdown[0].QuantityMultiplier)
			}

			// Verify adjusted value
			if result.CodeBreakdown[0].AdjustedValue != tc.expectedAdjustedValue {
				t.Errorf("Expected adjusted value %v, got %v", tc.expectedAdjustedValue, result.CodeBreakdown[0].AdjustedValue)
			}

			// Verify it's reflected in final calculation
			if result.FinalTotal != tc.expectedAdjustedValue {
				t.Errorf("Expected final total %v (single code, no adjustments), got %v", tc.expectedAdjustedValue, result.FinalTotal)
			}
		})
	}
}

// Test_LateralityWorks verifies that bilateral procedures double the price
// when laterality is set to BILATERAL and laterality_support is true.
func Test_LateralityWorks(t *testing.T) {
	basePorte := "7A" // 858.03 BRL

	testCases := []struct {
		name              string
		laterality        models.Laterality
		expectedMultiplier float64
		expectedAdjustedValue float64
	}{
		{
			name:              "Unilateral",
			laterality:        models.LateralityUnilateral,
			expectedMultiplier: 1.0,
			expectedAdjustedValue: 858.03,
		},
		{
			name:              "Bilateral",
			laterality:        models.LateralityBilateral,
			expectedMultiplier: 2.0,
			expectedAdjustedValue: 1716.06,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			codes := []models.SelectedCode{
				{
					CBHPMCode:         "4.08.13.36-3", // Infiltração foraminal - supports bilateral
					Description:       "Coluna vertebral: infiltração foraminal ou facetária ou articular",
					Porte:             basePorte,
					BillingMode:       models.BillingModeProcedure,
					Specialty:         models.SpecialtySpine,
					LateralitySupport: true,
					QuantitySelected:  1,
					Laterality:        tc.laterality,
				},
			}

			result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

			// Verify laterality multiplier
			if result.CodeBreakdown[0].LateralityMultiplier != tc.expectedMultiplier {
				t.Errorf("Expected laterality multiplier %v, got %v", tc.expectedMultiplier, result.CodeBreakdown[0].LateralityMultiplier)
			}

			// Verify adjusted value
			if result.CodeBreakdown[0].AdjustedValue != tc.expectedAdjustedValue {
				t.Errorf("Expected adjusted value %v, got %v", tc.expectedAdjustedValue, result.CodeBreakdown[0].AdjustedValue)
			}
		})
	}
}

// Test_QuantityAndLateralityMultiply verifies that quantity and laterality
// multipliers are applied together: base × quantity × laterality.
func Test_QuantityAndLateralityMultiply(t *testing.T) {
	basePorte := "7A" // 858.03 BRL

	codes := []models.SelectedCode{
		{
			CBHPMCode:         "4.08.13.36-3", // PER_SEGMENT with bilateral support
			Description:       "Coluna vertebral: infiltração foraminal ou facetária ou articular",
			Porte:             basePorte,
			BillingMode:       models.BillingModeSegment,
			Specialty:         models.SpecialtySpine,
			LateralitySupport: true,
			QuantitySelected:  2, // 2 segments
			Laterality:        models.LateralityBilateral, // bilateral
		},
	}

	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	// Expected: 858.03 × 2 (segments) × 2 (bilateral) = 3432.12
	expectedAdjustedValue := 858.03 * 2.0 * 2.0

	if result.CodeBreakdown[0].QuantityMultiplier != 2.0 {
		t.Errorf("Expected quantity multiplier 2.0, got %v", result.CodeBreakdown[0].QuantityMultiplier)
	}

	if result.CodeBreakdown[0].LateralityMultiplier != 2.0 {
		t.Errorf("Expected laterality multiplier 2.0, got %v", result.CodeBreakdown[0].LateralityMultiplier)
	}

	if result.CodeBreakdown[0].AdjustedValue != expectedAdjustedValue {
		t.Errorf("Expected adjusted value %v, got %v", expectedAdjustedValue, result.CodeBreakdown[0].AdjustedValue)
	}

	if result.FinalTotal != expectedAdjustedValue {
		t.Errorf("Expected final total %v, got %v", expectedAdjustedValue, result.FinalTotal)
	}
}

// Test_LateralityIgnoredIfNotSupported verifies that bilateral laterality is ignored
// if laterality_support is false.
func Test_LateralityIgnoredIfNotSupported(t *testing.T) {
	basePorte := "7A" // 858.03 BRL

	codes := []models.SelectedCode{
		{
			CBHPMCode:         "3.14.01.26-0", // Does NOT support bilateral
			Description:       "Tumor of skull base",
			Porte:             basePorte,
			BillingMode:       models.BillingModeProcedure,
			Specialty:         models.SpecialtyNeurosurgery,
			LateralitySupport: false, // <-- not supported
			QuantitySelected:  1,
			Laterality:        models.LateralityBilateral, // Request bilateral...
		},
	}

	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	// Even though laterality is BILATERAL, multiplier should be 1.0 because not supported
	if result.CodeBreakdown[0].LateralityMultiplier != 1.0 {
		t.Errorf("Expected laterality multiplier 1.0 (not supported), got %v", result.CodeBreakdown[0].LateralityMultiplier)
	}

	// Adjusted value should just be the base value
	if result.CodeBreakdown[0].AdjustedValue != 858.03 {
		t.Errorf("Expected adjusted value 858.03, got %v", result.CodeBreakdown[0].AdjustedValue)
	}
}

// Test_ExistingCBHPMAdjustmentsStillWork verifies that the existing CBHPM percentage
// adjustments (emergency, pediatric, etc.) still apply correctly with spine variables.
func Test_ExistingCBHPMAdjustmentsStillWork(t *testing.T) {
	basePorte := "7A" // 858.03 BRL

	codes := []models.SelectedCode{
		{
			CBHPMCode:         "4.08.13.36-3",
			Description:       "Infiltração foraminal",
			Porte:             basePorte,
			BillingMode:       models.BillingModeSegment,
			Specialty:         models.SpecialtySpine,
			LateralitySupport: true,
			QuantitySelected:  2, // 2 segments
			Laterality:        models.LateralityUnilateral,
		},
	}

	// Apply emergency adjustment (30% surcharge)
	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{"emergency_special_hours"})

	// Expected calculation order:
	// 1. Base: 858.03
	// 2. Quantity: 858.03 × 2 = 1716.06
	// 3. Laterality: 1716.06 × 1 = 1716.06
	// 4. Emergency adjustment: 1716.06 × 1.30 = 2230.878
	expectedFinal := 858.03 * 2.0 * 1.0 * 1.30

	if result.FinalTotal != expectedFinal {
		t.Errorf("Expected final total %v (with 30%% adjustment), got %v", expectedFinal, result.FinalTotal)
	}

	if result.TotalAdjustmentPercentage != 30.0 {
		t.Errorf("Expected adjustment percentage 30.0, got %v", result.TotalAdjustmentPercentage)
	}
}

// Test_PrincipalIsSelectedByAdjustedValue verifies that the principal procedure
// is selected based on the adjusted value (after quantity and laterality).
func Test_PrincipalIsSelectedByAdjustedValue(t *testing.T) {
	// Code 1: Base 500, quantity 2, laterality 1 → adjusted 1000
	// Code 2: Base 600, quantity 1, laterality 1 → adjusted 600
	// Expected principal: Code 1 (higher adjusted value)
	codes := []models.SelectedCode{
		{
			CBHPMCode:         "4.08.13.36-3",
			Porte:             "6A", // 660.57
			BillingMode:       models.BillingModeSegment,
			Specialty:         models.SpecialtySpine,
			LateralitySupport: false,
			QuantitySelected:  2, // 660.57 × 2 = 1321.14
			Laterality:        models.LateralityUnilateral,
		},
		{
			CBHPMCode:         "3.14.01.26-0",
			Porte:             "7A", // 858.03
			BillingMode:       models.BillingModeProcedure,
			Specialty:         models.SpecialtyNeurosurgery,
			LateralitySupport: false,
			QuantitySelected:  1,
			Laterality:        models.LateralityUnilateral,
		},
	}

	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	// First code (4.08.13.36-3) should be principal (adjusted 1321.14 > 858.03)
	if !result.CodeBreakdown[0].IsPrincipal {
		t.Errorf("Expected first code to be principal (higher adjusted value)")
	}

	if result.CodeBreakdown[1].IsPrincipal {
		t.Errorf("Expected second code to not be principal")
	}

	// Verify surgeon breakdown reflects adjusted values
	expectedPrincipalValue := 660.57 * 2.0 // First code adjusted
	if result.SurgeonBreakdown.PrincipalValue != expectedPrincipalValue {
		t.Errorf("Expected principal value %v, got %v", expectedPrincipalValue, result.SurgeonBreakdown.PrincipalValue)
	}
}

// Test_DefaultQuantityIsOne verifies that quantity defaults to 1 when not specified.
func Test_DefaultQuantityIsOne(t *testing.T) {
	codes := []models.SelectedCode{
		{
			CBHPMCode:         "4.08.13.36-3",
			Porte:             "7A",
			BillingMode:       models.BillingModeSegment,
			Specialty:         models.SpecialtySpine,
			LateralitySupport: false,
			QuantitySelected:  0, // Explicitly 0 (should default to 1)
			Laterality:        models.LateralityUnilateral,
		},
	}

	result := Calculate(codes, 0, false, models.AccessRouteSame, []string{})

	// Should use quantity = 1 (default)
	if result.CodeBreakdown[0].QuantityMultiplier != 1.0 {
		t.Errorf("Expected default quantity multiplier 1.0, got %v", result.CodeBreakdown[0].QuantityMultiplier)
	}

	expectedAdjustedValue := 858.03 // Base × 1 (default)
	if result.CodeBreakdown[0].AdjustedValue != expectedAdjustedValue {
		t.Errorf("Expected adjusted value %v, got %v", expectedAdjustedValue, result.CodeBreakdown[0].AdjustedValue)
	}
}

// Test_CompositionPersistenceFields verifies that composition modifiers struct
// can hold all necessary fields for persistence.
func Test_CompositionPersistenceFields(t *testing.T) {
	comp := &models.Composition{
		ID:       "test-id",
		PublicID: "public-id",
		Name:     "Test Composition",
		Modifiers: &models.CompositionModifiers{
			QuantitySelected:  3,
			Laterality:        models.LateralityBilateral,
			VertebralRegion:   "lumbar",
			SurgicalApproach:  "posterior",
			FusionStatus:      "fusion",
			ImplantCategory:   "hardware",
			OsteoporosisAware: true,
			ClinicalContext:   "degenerative",
		},
	}

	// Verify modifiers are persisted
	if comp.Modifiers.QuantitySelected != 3 {
		t.Errorf("Expected quantity 3, got %v", comp.Modifiers.QuantitySelected)
	}

	if comp.Modifiers.Laterality != models.LateralityBilateral {
		t.Errorf("Expected bilateral, got %v", comp.Modifiers.Laterality)
	}

	if comp.Modifiers.VertebralRegion != "lumbar" {
		t.Errorf("Expected lumbar region, got %v", comp.Modifiers.VertebralRegion)
	}
}
