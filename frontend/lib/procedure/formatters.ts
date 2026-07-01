// Shared monetary and percentage formatters — avoids re-instantiation across modules.

export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(n / 100);

// Friendly PT-BR labels for the anesthesia-assistant reasons (P1, CBHPM p.140 item 8).
const ASSISTANT_REASON_LABELS: Record<string, string> = {
  AN7: "AN7",
  AN8: "AN8",
  cec: "CEC",
  duration_over_6h: ">6h",
  surgical_neonatology: "neonatologia",
  bariatric_gastroplasty: "gastroplastia",
};

export function formatAssistantReasons(reasons?: string[]): string | undefined {
  if (!reasons || reasons.length === 0) return undefined;
  return reasons.map((r) => ASSISTANT_REASON_LABELS[r] ?? r).join(" · ");
}
