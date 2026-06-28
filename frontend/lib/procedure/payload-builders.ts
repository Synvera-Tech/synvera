// Canonical payload construction for the calculate, save, and update flows.
//
// This is the SINGLE source of truth for selected_codes wire format.
// All three call sites (calculate, save composition, update composition) must use
// buildCodeEntry so that a schema change propagates automatically everywhere.
//
// share/page.tsx also uses buildCodeEntry for the static reconstruction from URL params.

import type {
  CBHPMCode,
  SpineBillingModifiers,
  AccessRouteType,
  SelectedCodePayload,
} from "./types";

export type { SelectedCodePayload };

export type SBNProcedureRef = { id: string; name: string };

// Per-code quantity selections, keyed by CBHPM code. Codes absent from the map use 1.
// Quantity is per-code (a composition can mix a ×3 arthrodesis with a ×1 graft); laterality
// remains a single global selection.
export type CodeQuantities = Record<string, number>;

export function quantityFor(quantities: CodeQuantities, code: string): number {
  const q = quantities[code];
  return q && q > 0 ? q : 1;
}

// ── Code entry ───────────────────────────────────────────────────────────────

export function buildCodeEntry(
  c: CBHPMCode,
  spineModifiers: Pick<SpineBillingModifiers, "quantity_selected" | "laterality">,
): SelectedCodePayload {
  return {
    cbhpm_code: c.code,
    description: c.description,
    porte: c.porte,
    billing_mode: c.billing_mode ?? "PER_PROCEDURE",
    specialty: c.specialty ?? "NEUROSURGERY",
    laterality_support: c.laterality_support ?? false,
    quantity_selected: spineModifiers.quantity_selected,
    laterality: spineModifiers.laterality,
  };
}

// ── Calculate payload ────────────────────────────────────────────────────────

export type CalculatePayload = {
  selected_codes: SelectedCodePayload[];
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  access_route_type: AccessRouteType;
  adjustments: string[];
  modifiers: SpineBillingModifiers;
};

export function buildCalculatePayload(
  allCbhpmCodes: CBHPMCode[],
  selectedCodes: Set<string>,
  spineModifiers: SpineBillingModifiers,
  codeQuantities: CodeQuantities,
  auxiliariesCount: number,
  requiresAnesthesia: boolean,
  accessRoute: AccessRouteType,
  adjustments: string[],
): CalculatePayload | null {
  const checked = allCbhpmCodes.filter((c) => selectedCodes.has(c.code));
  if (checked.length === 0) return null;
  return {
    selected_codes: checked.map((c) =>
      buildCodeEntry(c, { quantity_selected: quantityFor(codeQuantities, c.code), laterality: spineModifiers.laterality }),
    ),
    auxiliaries_count: auxiliariesCount,
    requires_anesthesia: requiresAnesthesia,
    access_route_type: accessRoute,
    adjustments,
    modifiers: spineModifiers,
  };
}

// ── Composition payload (save + update share the same shape) ─────────────────

export type CompositionPayload = {
  name: string;
  sbn_procedure_id: string;
  sbn_procedure_name: string;
  selected_codes: SelectedCodePayload[];
  access_route_type: AccessRouteType;
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  adjustments: string[];
  modifiers: SpineBillingModifiers;
};

export function buildCompositionPayload(
  name: string,
  selectedProcedures: SBNProcedureRef[],
  allCbhpmCodes: CBHPMCode[],
  selectedCodes: Set<string>,
  spineModifiers: SpineBillingModifiers,
  codeQuantities: CodeQuantities,
  auxiliariesCount: number,
  requiresAnesthesia: boolean,
  accessRoute: AccessRouteType,
  adjustments: string[],
): CompositionPayload {
  const checkedCodes = allCbhpmCodes.filter((c) => selectedCodes.has(c.code));
  return {
    name,
    sbn_procedure_id: selectedProcedures[0].id,
    sbn_procedure_name: selectedProcedures.map((p) => p.name).join(" + "),
    selected_codes: checkedCodes.map((c) =>
      buildCodeEntry(c, { quantity_selected: quantityFor(codeQuantities, c.code), laterality: spineModifiers.laterality }),
    ),
    access_route_type: accessRoute,
    auxiliaries_count: auxiliariesCount,
    requires_anesthesia: requiresAnesthesia,
    adjustments,
    modifiers: spineModifiers,
  };
}

// ── Share URL ────────────────────────────────────────────────────────────────

// Per-code quantities are encoded in the share URL as "code:qty;code:qty", listing only
// codes whose quantity differs from 1. parseShareQuantities reverses it on the share page.
export function encodeShareQuantities(
  checkedCodes: string[],
  codeQuantities: CodeQuantities,
): string {
  return checkedCodes
    .map((code) => [code, quantityFor(codeQuantities, code)] as const)
    .filter(([, qty]) => qty !== 1)
    .map(([code, qty]) => `${code}:${qty}`)
    .join(";");
}

export function parseShareQuantities(param: string | null): CodeQuantities {
  const out: CodeQuantities = {};
  if (!param) return out;
  for (const pair of param.split(";")) {
    const idx = pair.lastIndexOf(":");
    if (idx <= 0) continue;
    const code = pair.slice(0, idx);
    const qty = Number(pair.slice(idx + 1));
    if (code && qty > 0) out[code] = qty;
  }
  return out;
}

export function buildShareUrl(
  selectedProcedures: SBNProcedureRef[],
  allCbhpmCodes: CBHPMCode[],
  selectedCodes: Set<string>,
  auxiliariesCount: number,
  requiresAnesthesia: boolean,
  accessRoute: AccessRouteType,
  adjustments: string[],
  spineModifiers: SpineBillingModifiers,
  codeQuantities: CodeQuantities,
): string {
  const url = new URL("/share", window.location.origin);
  url.searchParams.set("sbn", selectedProcedures.map((p) => p.id).join(","));
  const checked = allCbhpmCodes.filter((c) => selectedCodes.has(c.code)).map((c) => c.code);
  url.searchParams.set("codes", checked.join(","));
  url.searchParams.set("a", String(auxiliariesCount));
  url.searchParams.set("an", requiresAnesthesia ? "1" : "0");
  url.searchParams.set("route", accessRoute);
  if (adjustments.length > 0) url.searchParams.set("adj", adjustments.join(","));
  const qtyParam = encodeShareQuantities(checked, codeQuantities);
  if (qtyParam) url.searchParams.set("qty", qtyParam);
  if (spineModifiers.laterality !== "UNILATERAL")
    url.searchParams.set("lat", spineModifiers.laterality);
  return url.toString();
}
