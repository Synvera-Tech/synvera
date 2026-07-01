"use client";

import { Info, Layers, Stethoscope } from "lucide-react";
import type { CBHPMCode, CodeModifierInfo, SpineBillingModifiers } from "@/lib/procedure/types";
import { cn } from "@/components/ui/utils";

interface SpineVariablesPanelProps {
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  spineModifiers: SpineBillingModifiers;
  onSpineModifiersChange: (modifiers: SpineBillingModifiers) => void;
  codeQuantities: Record<string, number>;
  onCodeQuantityChange: (code: string, quantity: number) => void;
}

// Billing modes whose value scales with a per-code quantity (segments/vertebrae/structures).
const COUNTABLE = new Set([
  "PER_SEGMENT",
  "PER_VERTEBRA",
  "PER_STRUCTURE",
  "PER_STRUCTURE_DECREMENT",
]);

// PT-BR label for the quantity unit of a countable billing mode.
function unitLabel(billingMode: string): string {
  switch (billingMode) {
    case "PER_SEGMENT":
      return "Segmentos";
    case "PER_VERTEBRA":
      return "Vértebras";
    default:
      return "Estruturas";
  }
}

// Short PT-BR description of the rule, shown under each code.
function ruleDetail(m: CodeModifierInfo): string {
  switch (m.billing_mode) {
    case "PER_SEGMENT":
      return "Multiplicado pelo número de segmentos operados.";
    case "PER_VERTEBRA":
      return "Multiplicado pelo número de vértebras operadas.";
    case "PER_STRUCTURE":
      return "Multiplicado pelo número de estruturas abordadas.";
    case "PER_STRUCTURE_DECREMENT":
      return `1ª estrutura a 100% + ${m.decrement_pct ?? 0}% por estrutura adicional.`;
    default:
      if (m.supported_modifiers.includes("endoscopic_access")) {
        return "Acesso endoscópico — cobrado uma única vez por cirurgia.";
      }
      if (m.supported_modifiers.includes("complementary_step")) {
        return "Etapa complementar — cobrada uma única vez por cirurgia.";
      }
      return "Cobrado uma única vez por cirurgia.";
  }
}

// Contextual spine panel.
//
// For each selected code that carries a normative modifier (ADR-005), renders the applicable
// control: a functional quantity selector for countable codes (segment/vertebra/structure),
// or an informational line for once-per-surgery codes. A code only carries `modifier` when the
// API attached it (SPINE domain), so neurosurgery procedures show no cards here.
export function SpineVariablesPanel({
  allCbhpmCodes,
  selectedCodes,
  spineModifiers,
  onSpineModifiersChange,
  codeQuantities,
  onCodeQuantityChange,
}: SpineVariablesPanelProps) {
  const codesWithRules = allCbhpmCodes.filter((c) => selectedCodes.has(c.code) && c.modifier);
  const hasLateralitySupport = allCbhpmCodes.some((c) => selectedCodes.has(c.code) && c.laterality_support);

  if (codesWithRules.length === 0 && !hasLateralitySupport) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
      <div className="flex items-center gap-2">
        <Stethoscope aria-hidden="true" className="text-primary" size={15} />
        <span className="text-[13px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Multiplicadores e Regras de Cobrança (Coluna)
        </span>
      </div>

      {codesWithRules.length > 0 && (
        <ul className="space-y-2">
          {codesWithRules.map((c) => {
            const m = c.modifier!;
            const countable = COUNTABLE.has(m.billing_mode);
            const max = m.max_quantity && m.max_quantity > 0 ? m.max_quantity : 6;
            const current = codeQuantities[c.code] && codeQuantities[c.code] > 0 ? codeQuantities[c.code] : 1;
            const citation = m.source_page ? `Manual de Coluna · p.${m.source_page}` : "Manual de Coluna";

            return (
              <li key={c.code} className="rounded-xl border border-stone-100 dark:border-stone-800 px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <Layers aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-primary dark:text-[#A99876]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">
                        {c.description}
                      </span>
                      <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">{c.code}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500 dark:text-stone-400">
                      {ruleDetail(m)}
                    </p>

                    {countable && (
                      <div className="mt-2">
                        <label className="block text-[10.5px] font-semibold uppercase tracking-[0.4px] text-stone-500 dark:text-stone-400 mb-1.5">
                          {unitLabel(m.billing_mode)}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: max }, (_, i) => i + 1).map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              aria-pressed={current === qty}
                              onClick={() => onCodeQuantityChange(c.code, qty)}
                              className={cn(
                                "h-9 w-9 cursor-pointer rounded-xl border text-sm font-semibold transition-colors",
                                current === qty
                                  ? "border-primary bg-primary text-white dark:border-[#A18C63] dark:bg-[#A18C63]"
                                  : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600",
                              )}
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <p
                      className="mt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500"
                      title={m.source_excerpt ?? undefined}
                    >
                      {citation}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {codesWithRules.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5 dark:border-stone-800 dark:bg-stone-800/30">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            <Info aria-hidden="true" size={11} />
            Regras de coluna (informativo)
          </div>
          <ul className="space-y-1 text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-400">
            <li>
              <span className="font-semibold text-stone-600 dark:text-stone-300">Bilateral:</span>{" "}
              não duplica no mesmo segmento/nível <span className="text-stone-400 dark:text-stone-500">(Manual p.9)</span>.
            </li>
            <li>
              <span className="font-semibold text-stone-600 dark:text-stone-300">Via de acesso:</span>{" "}
              códigos adicionais a 50%, inclusive 360° <span className="text-stone-400 dark:text-stone-500">(Manual p.42/62)</span>.
            </li>
            <li>
              <span className="font-semibold text-stone-600 dark:text-stone-300">Técnica cirúrgica:</span>{" "}
              aberta · tubular · endoscópica · percutânea — não altera o valor do honorário.
            </li>
          </ul>
        </div>
      )}

      {hasLateralitySupport && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.4px] text-stone-500 dark:text-stone-400 mb-2">
            Lateralidade
          </label>
          <div className="space-y-1.5">
            {(["UNILATERAL", "BILATERAL"] as const).map((lateral) => (
              <button
                key={lateral}
                type="button"
                onClick={() => onSpineModifiersChange({ ...spineModifiers, laterality: lateral })}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  spineModifiers.laterality === lateral
                    ? "border-primary/30 bg-[#F5F2EB] dark:border-[#A18C63]/20 dark:bg-[#332D21]/50"
                    : "border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700",
                )}
              >
                <span className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  spineModifiers.laterality === lateral
                    ? "border-primary bg-primary dark:border-[#A18C63] dark:bg-[#A18C63]"
                    : "border-stone-300 dark:border-stone-600",
                )}>
                  {spineModifiers.laterality === lateral && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <div>
                  <div className={cn(
                    "text-[13px] font-semibold",
                    spineModifiers.laterality === lateral ? "text-primary dark:text-[#A99876]" : "text-stone-700 dark:text-stone-300",
                  )}>
                    {lateral === "UNILATERAL" ? "Unilateral" : "Bilateral"}
                  </div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500">
                    {lateral === "UNILATERAL" ? "Um lado" : "Coluna: não duplica no mesmo segmento"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
