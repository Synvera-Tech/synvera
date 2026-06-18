// CBHPM adjustment catalog — single source of truth for frontend adjustment definitions.
// Percentages must match backend service/adjustments.go AdjustmentCatalog.
// Source: CBHPM 2022, Instruções Gerais.

export const ADJUSTMENT_CATALOG = [
  {
    code: "emergency_special_hours",
    label: "Urgência/emergência em horário especial",
    pct: 30,
    helper: "Entre 19h e 7h, ou em sábados, domingos e feriados, conforme Instruções Gerais da CBHPM.",
    group: "emergency" as const,
  },
  {
    code: "pediatric_low_weight_or_premature",
    label: "< 2.500 g ou prematuro < 37 semanas",
    pct: 100,
    helper: null,
    group: "pediatric" as const,
  },
  {
    code: "pediatric_neonate_or_infant",
    label: "Neonato/lactante — 0 a 24 meses",
    pct: 50,
    helper: null,
    group: "pediatric" as const,
  },
  {
    code: "pediatric_child_under_12",
    label: "Pediátrico — 24 meses a 12 anos incompletos",
    pct: 30,
    helper: null,
    group: "pediatric" as const,
  },
];

// Codes that form a mutually exclusive radio group (only one may be active at a time).
export const PEDIATRIC_CODES = ADJUSTMENT_CATALOG
  .filter((a) => a.group === "pediatric")
  .map((a) => a.code);
