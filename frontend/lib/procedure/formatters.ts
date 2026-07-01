// Shared monetary and percentage formatters — avoids re-instantiation across modules.

export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(n / 100);

// Friendly PT-BR labels for the anesthesia-assistant reasons (P1, CBHPM p.140 item 8).
// Full labels so the justification is explicit in the summary and the shared report.
const ASSISTANT_REASON_LABELS: Record<string, string> = {
  AN7: "AN7",
  AN8: "AN8",
  cec: "Circulação extracorpórea (CEC)",
  duration_over_6h: "Cirurgia acima de 6 horas",
  surgical_neonatology: "Neonatologia cirúrgica",
  bariatric_gastroplasty: "Gastroplastia para obesidade mórbida",
};

export function formatAssistantReasons(reasons?: string[]): string | undefined {
  if (!reasons || reasons.length === 0) return undefined;
  return reasons.map((r) => ASSISTANT_REASON_LABELS[r] ?? r).join(" · ");
}
