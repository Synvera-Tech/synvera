// Package models defines the core domain types for the Synvera platform.
package models

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"time"
)

// SBNProcedure represents a procedure package as defined in the SBN manual.
// One SBN procedure aggregates one or more CBHPM codes.
type SBNProcedure struct {
	ID   string
	Name string
}

// BillingMode determines how a procedure's value is calculated relative to quantity.
type BillingMode string

const (
	// BillingModeProcedure — no quantity multiplier (default for all procedures)
	BillingModeProcedure BillingMode = "PER_PROCEDURE"
	// BillingModeSegment — value is multiplied by the number of segments treated
	BillingModeSegment BillingMode = "PER_SEGMENT"
	// BillingModeVertebra — value is multiplied by the number of vertebrae treated
	BillingModeVertebra BillingMode = "PER_VERTEBRA"
	// BillingModeStructure — value is multiplied by the number of structures treated
	BillingModeStructure BillingMode = "PER_STRUCTURE"
	// BillingModeStructureDecrement — first structure at 100%, each additional at a
	// fixed percentage (CodeModifier.DecrementPct). Used by costectomy (Manual de
	// Coluna p.13: "100% + 30% por arco adicional"). Defined for the normative modifier
	// layer (ADR-005); NOT yet consumed by the engine (roadmap stage N5).
	BillingModeStructureDecrement BillingMode = "PER_STRUCTURE_DECREMENT"
)

// Laterality indicates whether a procedure can be billed for one or both sides.
type Laterality string

const (
	// LateralityUnilateral — procedure billed once (one side)
	LateralityUnilateral Laterality = "UNILATERAL"
	// LateralityBilateral — procedure billed for both sides (may double the cost)
	LateralityBilateral Laterality = "BILATERAL"
)

// Specialty classifies a procedure by its medical domain.
type Specialty string

const (
	// SpecialtyNeurosurgery — general neurosurgery procedures (default)
	SpecialtyNeurosurgery Specialty = "NEUROSURGERY"
	// SpecialtySpine — spine-specific procedures with billing variables
	SpecialtySpine Specialty = "SPINE"
)

// CBHPMCode is a single billable code from the CBHPM catalog,
// annotated with the default porte assigned by the SBN manual for this procedure package.
// The porte is an intrinsic property of the code (CBHPM 2022, item 1.2) and is not editable.
// Extended with spine-specific billing variables.
type CBHPMCode struct {
	Code               string
	Description        string
	Porte              string
	NumAuxiliaries     int
	BillingMode        BillingMode // How value scales with quantity (default: PER_PROCEDURE)
	Specialty          Specialty   // Medical domain (default: NEUROSURGERY)
	LateralitySupport  bool        // Whether bilateral billing is applicable
}

// ProcedureWithCodes is an SBN procedure together with its associated CBHPM codes.
type ProcedureWithCodes struct {
	SBNProcedure
	// SourceDocument and SourceVersion record which manual the procedure was
	// imported from (SBN neurosurgery 2018 vs spine coding manual 3rd ed. 2025).
	// Empty for legacy rows that predate provenance tracking (migration 026).
	SourceDocument string
	SourceVersion  string
	Codes          []CBHPMCode
}

// CodeModifier is a normative, data-driven billing rule for a single CBHPM code
// within a specialty (ADR-005, table cbhpm_code_modifiers). It carries the rule, its
// parameters, the UI hints, and the verbatim manual provenance that justifies it.
//
// This is the read model for the normative layer. As of roadmap stage N3 it is loaded
// by the repository but NOT consumed by the valuation engine — calculations are
// unchanged until stage N5. Absence of a CodeModifier for a code means PER_PROCEDURE
// with default CBHPM via/laterality behaviour.
type CodeModifier struct {
	CBHPMCode          string
	Specialty          Specialty
	BillingMode        BillingMode
	LateralityRule     string   // NONE | NO_DUPLICATE | BILATERAL_DOUBLE | CBHPM_4_3
	ViaRule            string   // CBHPM_DEFAULT | SPINE_50
	DecrementPct       *float64 // for PER_STRUCTURE_DECREMENT; nil otherwise
	MaxQuantity        *int     // UI cap; nil = unbounded
	SupportedModifiers []string // UI hints, e.g. ["segment_count"]
	SourceDocument     string
	SourceVersion      string
	SourcePage         *int
	SourceExcerpt      string
	Confidence         string // CONFIRMED | INFERRED | WEAK
}

// AccessRouteType encodes the CBHPM 4.1/4.2 access route classification.
type AccessRouteType string

const (
	// AccessRouteSame applies CBHPM 4.1: principal porte + 50% of each additional porte.
	AccessRouteSame AccessRouteType = "same"
	// AccessRouteDifferent applies CBHPM 4.2: principal porte + 70% of each additional porte.
	AccessRouteDifferent AccessRouteType = "different"
)

// SelectedCode is a CBHPM code chosen by the physician.
// The porte is taken from the catalog and cannot be changed by the physician.
// Extended to include spine-specific billing modifiers.
type SelectedCode struct {
	CBHPMCode          string
	Description        string
	Porte              string
	BillingMode        BillingMode // Inherited from procedure catalog
	Specialty          Specialty   // Inherited from procedure catalog
	LateralitySupport  bool        // Inherited from procedure catalog

	// Spine billing variables (only applicable if BillingMode/LateralitySupport indicate)
	QuantitySelected int       // Number of segments/vertebrae/structures (default: 1)
	Laterality       Laterality // UNILATERAL or BILATERAL (default: UNILATERAL if not supported)
}

// CodeBreakdown is the per-code contribution in a valuation result.
// Extended to show the calculation steps for billing variables.
type CodeBreakdown struct {
	CBHPMCode          string
	Description        string
	Porte              string
	BaseValue          float64
	IsPrincipal        bool
	// Spine billing variable details (for transparency in shared reports)
	BillingMode        BillingMode
	QuantitySelected   int
	QuantityMultiplier float64 // The multiplier applied (e.g., 1.0, 2.0, 3.0 for segments)
	Laterality         Laterality
	LateralityMultiplier float64 // The multiplier applied (1.0 for unilateral, 2.0 for bilateral)
	AdjustedValue      float64 // BaseValue × QuantityMultiplier × LateralityMultiplier (before other adjustments)
}

// SurgeonBreakdown contains the step-by-step surgeon fee derivation per CBHPM 4.1/4.2.
type SurgeonBreakdown struct {
	PrincipalValue       float64
	AdditionalGross      float64
	DiscountRate         float64
	AdditionalDiscounted float64
	SurgeonTotal         float64
}

// AuxiliaryFee is the individual fee for one auxiliary surgeon per CBHPM 5.1.
type AuxiliaryFee struct {
	Position   int
	Percentage float64
	Fee        float64
}

// AppliedAdjustment is one CBHPM percentage adjustment applied to a calculation.
// Adjustments are additive and sourced from CBHPM 2022 General Instructions.
type AppliedAdjustment struct {
	Code       string
	Label      string
	Percentage float64
	Source     string
}

// CalculationResult is the full output of the valuation engine.
//
// The base values reflect the CBHPM composition before any percentage adjustments.
// The final values (LeadSurgeonFee, AuxiliariesFee, AnesthesiologistFee, FinalTotal)
// are the base values scaled by (1 + TotalAdjustmentPercentage/100). When no adjustments
// are selected the base and final values are identical.
type CalculationResult struct {
	CodeBreakdown    []CodeBreakdown
	AccessRouteType  AccessRouteType
	SurgeonBreakdown SurgeonBreakdown
	TotalBase        float64

	// Base medical remuneration — pre-adjustment CBHPM values.
	BaseSurgeonValue          float64
	BaseAuxiliaresTotalValue  float64
	BaseAnesthesiologistValue float64
	BaseTeamTotalValue        float64

	// Adjustment summary — CBHPM percentages applied additively (not multiplicatively).
	SelectedAdjustments       []AppliedAdjustment
	TotalAdjustmentPercentage float64
	AdjustmentValue           float64 // absolute monetary value of all combined adjustments

	// Final (adjusted) values — equal to base values when no adjustments apply.
	LeadSurgeonFee      float64
	IndividualAuxFees   []AuxiliaryFee
	AuxiliariesFee      float64
	AnesthesiologistFee float64

	// Anesthesia assistant (CBHPM p.140 item 8, A9): 60% of the anesthesiologist fee, only for
	// AN7/AN8 (the auto-detectable triggers). AnesthesiaPorte is the principal anesthetic porte
	// used (0 when none), exposed so the UI can offer the assistant only when applicable.
	AnesthesiaPorte             int
	BaseAnesthesiaAssistantValue float64
	AnesthesiaAssistantFee      float64

	// AnesthesiaAssistantApplied / Reasons / Source record whether the 60% second
	// anesthesiologist was applied and why — any of AN7, AN8, cec, duration_over_6h,
	// surgical_neonatology, bariatric_gastroplasty — with its normative source (CBHPM p.140
	// item 8), so the stored breakdown/snapshot explains the fee (ADR-001).
	AnesthesiaAssistantApplied bool
	AnesthesiaAssistantReasons []string
	AnesthesiaAssistantSource  string

	// Anesthesia bilateral (P2, CBHPM p.140 item 7): +70% of the principal anesthetic porte added
	// to the anesthesiologist fee when the act was bilateral and no specific bilateral code exists.
	// BaseAnesthesiaBilateralValue is the pre-adjustment increment folded into the anesthesia fee.
	AnesthesiaBilateralApplied   bool
	BaseAnesthesiaBilateralValue float64
	AnesthesiaBilateralSource    string

	FinalTotal float64
}

// AnesthesiaAssistantJustification carries the USER_SELECTABLE, non-derivable clinical facts
// (informed by the surgeon) that authorise a second anesthesiologist (+60% of the principal
// anesthetic porte) beyond the auto-detectable AN7/AN8 triggers — CBHPM 2022 p.140 item 8.
// These are inputs, never DERIVED nor ENGINE_ONLY.
type AnesthesiaAssistantJustification struct {
	CEC                   bool `json:"cec,omitempty"`
	DurationOver6h        bool `json:"duration_over_6h,omitempty"`
	SurgicalNeonatology   bool `json:"surgical_neonatology,omitempty"`
	BariatricGastroplasty bool `json:"bariatric_gastroplasty,omitempty"`
}

// Any reports whether any non-derivable justification trigger is set.
func (j AnesthesiaAssistantJustification) Any() bool {
	return j.CEC || j.DurationOver6h || j.SurgicalNeonatology || j.BariatricGastroplasty
}

// Calculation is a persisted valuation record.
// BreakdownJSON holds the full CalculateResponse JSON for audit purposes.
// Adjustments holds the CBHPM adjustment codes that were active at calculation time
// (e.g. ["emergency_special_hours"]) so the result can be replayed deterministically.
// PhysicianID links to physician_accounts when the calculation was saved while authenticated;
// empty for anonymous (pre-login) calculations.
// CBHPMVersionID links to cbhpm_versions to record which porte table was active at save time.
// Empty for calculations saved before migration 021 (pre-versioning rows).
type Calculation struct {
	ID                    string
	PublicID              string
	PhysicianID           string // empty when calculation is anonymous
	CBHPMVersionID        string // empty for pre-versioning rows (before migration 021)
	CBHPMVersionCode      string // denormalized; e.g. "2025-2026" — empty for pre-021 rows
	ProcedureName         string
	ProcedureSBNCode      string
	SelectedCBHPMCodes    []SelectedCode
	Adjustments           []string // CBHPM adjustment codes applied to this calculation
	AccessRoute           AccessRouteType
	AuxiliariesCount      int
	RequiresAnesthesia    bool
	SurgeonValue          float64
	AuxiliariesTotalValue float64
	AnesthesiologistValue float64
	TeamTotalValue        float64
	BreakdownJSON         json.RawMessage
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

// CalculationSummary is a lightweight projection of Calculation used in list responses.
// It omits selected codes and the full breakdown JSON to keep list payloads small.
type CalculationSummary struct {
	PublicID              string
	ProcedureName         string
	ProcedureSBNCode      string
	SurgeonValue          float64
	AuxiliariesTotalValue float64
	AnesthesiologistValue float64
	TeamTotalValue        float64
	AuxiliariesCount      int
	RequiresAnesthesia    bool
	AccessRoute           AccessRouteType
	CreatedAt             time.Time
}

// CBHPMVersion identifies a specific edition of the CBHPM porte table.
// The active version is used for all new calculations; historical calculations
// reference the version that was active at creation time, enabling deterministic replay.
type CBHPMVersion struct {
	ID        string
	Code      string // e.g. "2025-2026"
	Label     string // e.g. "CBHPM 2025/2026 (INPC 5,10%)"
	IsActive  bool
	CreatedAt time.Time
}

// PhysicianAccount maps a Clerk identity to a Synvera physician record.
// The internal id is the FK used in compositions; clerk_user_id is the JWT sub.
// PlanType and SubscriptionStatus reflect the billing tier (see internal/billing).
type PhysicianAccount struct {
	ID                 string
	ClerkUserID        string
	Email              string
	Name               string
	PlanType           string
	SubscriptionStatus string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// CompositionModifiers holds the physician's global spine billing variable selections for a
// composition. Persisted as JSONB in compositions.modifiers (migration 018).
// QuantitySelected and Laterality affect calculations; the remaining fields are informational.
type CompositionModifiers struct {
	QuantitySelected  int        `json:"quantity_selected,omitempty"`
	Laterality        Laterality `json:"laterality,omitempty"`
	// AnesthesiaAssistant persists the A9 second-anesthesiologist (60%) selection so a saved
	// composition reproduces the same anesthesia fee on reload.
	AnesthesiaAssistant bool     `json:"anesthesia_assistant,omitempty"`
	// AnesthesiaAuxiliaryJustification (P1) and AnesthesiaBilateral (P2) persist the
	// USER_SELECTABLE anesthesia triggers so a saved composition reproduces the same fees.
	AnesthesiaAuxiliaryJustification *AnesthesiaAssistantJustification `json:"anesthesia_auxiliary_justification,omitempty"`
	AnesthesiaBilateral              bool                              `json:"anesthesia_bilateral,omitempty"`
	VertebralRegion   string     `json:"vertebral_region,omitempty"`
	SurgicalApproach  string     `json:"surgical_approach,omitempty"`
	FusionStatus      string     `json:"fusion_status,omitempty"`
	ImplantCategory   string     `json:"implant_category,omitempty"`
	OsteoporosisAware bool       `json:"osteoporosis_aware,omitempty"`
	ClinicalContext   string     `json:"clinical_context,omitempty"`
}

// Composition is a reusable surgical template created by the physician.
// It captures the procedural setup — SBN procedure, selected CBHPM codes,
// access route, anesthesia, auxiliary count, and CBHPM adjustment codes —
// without storing any financial values. Values are always recalculated fresh
// when executed. Extended to include spine-specific billing modifiers.
type Composition struct {
	ID                 string
	PublicID           string
	PhysicianID        string // internal UUID from physician_accounts; empty only in legacy rows
	Name               string
	SBNProcedureID     string
	SBNProcedureName   string
	SelectedCodes      []SelectedCode
	AccessRouteType    AccessRouteType
	AuxiliariesCount   int
	RequiresAnesthesia bool
	// Adjustments holds selected CBHPM adjustment codes (e.g. "emergency_special_hours").
	// See service.AdjustmentCatalog for valid codes and their percentages.
	Adjustments []string
	// Modifiers holds spine-specific billing variable selections
	Modifiers *CompositionModifiers // nil if no spine-specific modifiers
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// CompositionSummary is the lightweight projection for list responses.
type CompositionSummary struct {
	PublicID           string
	Name               string
	SBNProcedureID     string
	SBNProcedureName   string
	AccessRouteType    AccessRouteType
	AuxiliariesCount   int
	RequiresAnesthesia bool
	CreatedAt          time.Time
}

// GeneratePublicID returns a UUID v4 string for use in public-facing URLs
// (e.g. /calc/7f3a9e2c-5c3d-4f35-a8db-1f6f8c3d7e11).
// The internal database primary key is separate; only public_id is ever exposed externally.
func GeneratePublicID() (string, error) {
	var uuid [16]byte
	if _, err := rand.Read(uuid[:]); err != nil {
		return "", fmt.Errorf("generate public id: %w", err)
	}
	uuid[6] = (uuid[6] & 0x0f) | 0x40 // version 4
	uuid[8] = (uuid[8] & 0x3f) | 0x80 // variant bits (RFC 4122)
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:16]), nil
}
