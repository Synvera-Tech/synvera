// Shared domain types for the procedure calculation workflow.
// Single source of truth — imported by procedure/page.tsx, share/page.tsx, and all hooks.

export type CBHPMCode = {
  code: string;
  description: string;
  porte: string;
  num_auxiliaries: number;
  billing_mode?: string;
  specialty?: string;
  laterality_support?: boolean;
};

export type ProcedureDetail = {
  id: string;
  name: string;
  cbhpm_codes: CBHPMCode[];
};

export type AccessRouteType = "same" | "different";

export type SpineBillingModifiers = {
  quantity_selected: number;
  laterality: "UNILATERAL" | "BILATERAL";
};

export type AuxiliaryFee = {
  position: number;
  percentage: number;
  fee: number;
};

export type SurgeonBreakdown = {
  principal_value: number;
  additional_gross: number;
  discount_rate: number;
  additional_discounted: number;
  surgeon_total: number;
};

export type CodeBreakdown = {
  cbhpm_code: string;
  description: string;
  porte: string;
  base_value: number;
  is_principal: boolean;
  billing_mode?: string;
  quantity_selected?: number;
  quantity_multiplier?: number;
  laterality?: string;
  laterality_multiplier?: number;
  adjusted_value?: number;
};

export type AppliedAdjustment = {
  code: string;
  label: string;
  percentage: number;
  source: string;
};

export type CalculationResult = {
  code_breakdown: CodeBreakdown[];
  access_route_type: AccessRouteType;
  surgeon_breakdown: SurgeonBreakdown;
  lead_surgeon_fee: number;
  individual_auxiliary_fees: AuxiliaryFee[];
  auxiliaries_fee: number;
  anesthesiologist_fee: number;
  final_total: number;
  total_base: number;
  base_surgeon_value: number;
  base_auxiliaries_total_value: number;
  base_anesthesiologist_value: number;
  base_team_total_value: number;
  selected_adjustments: AppliedAdjustment[];
  total_adjustment_percentage: number;
  adjustment_value: number;
};

export type CompositionDetail = {
  public_id: string;
  name: string;
  sbn_procedure_id: string;
  sbn_procedure_name: string;
  selected_codes: SelectedCodePayload[];
  access_route_type: "same" | "different";
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  adjustments: string[];
  created_at: string;
  updated_at: string;
};

// Wire-format for a selected code sent to /api/calculate and /api/compositions.
export type SelectedCodePayload = {
  cbhpm_code: string;
  description: string;
  porte: string;
  billing_mode: string;
  specialty: string;
  laterality_support: boolean;
  quantity_selected: number;
  laterality: string;
};
