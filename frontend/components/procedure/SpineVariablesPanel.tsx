"use client";

import { Stethoscope } from "lucide-react";
import type { CBHPMCode, SpineBillingModifiers } from "@/lib/procedure/types";
import { cn } from "@/components/ui/utils";

interface SpineVariablesPanelProps {
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  spineModifiers: SpineBillingModifiers;
  onSpineModifiersChange: (modifiers: SpineBillingModifiers) => void;
}

// Visible only when at least one checked code has non-standard billing or laterality support.
export function SpineVariablesPanel({
  allCbhpmCodes,
  selectedCodes,
  spineModifiers,
  onSpineModifiersChange,
}: SpineVariablesPanelProps) {
  const hasSpineVariants = allCbhpmCodes.some((c) => {
    const checked = selectedCodes.has(c.code);
    return checked && (c.billing_mode !== "PER_PROCEDURE" || c.laterality_support);
  });

  const hasLateralitySupport = allCbhpmCodes.some((c) => c.laterality_support);

  if (!hasSpineVariants) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
      <div className="flex items-center gap-2">
        <Stethoscope aria-hidden="true" className="text-primary" size={15} />
        <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Variantes
        </span>
      </div>

      {/* Quantity selector — locked to 1 per CBHPM */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.4px] text-slate-500 dark:text-slate-400 mb-2">
          Quantidade de Segmentos
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4].map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => onSpineModifiersChange({ ...spineModifiers, quantity_selected: qty })}
              disabled
              className={cn(
                "px-3 h-9 rounded-xl border text-sm font-semibold transition-colors",
                qty === 1
                  ? "border-primary bg-primary text-white dark:border-[#5D7EA7] dark:bg-[#5D7EA7] cursor-default"
                  : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed",
              )}
            >
              {qty}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Determinado pelo CBHPM. Para múltiplos segmentos, selecione o procedimento múltiplas vezes.
        </p>
      </div>

      {hasLateralitySupport && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.4px] text-slate-500 dark:text-slate-400 mb-2">
            Lateralidade
          </label>
          <div className="space-y-1.5">
            {(["UNILATERAL", "BILATERAL"] as const).map((lateral) => (
              <button
                key={lateral}
                type="button"
                onClick={() => onSpineModifiersChange({ ...spineModifiers, laterality: lateral })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  spineModifiers.laterality === lateral
                    ? "border-primary/30 bg-[#EAF0F6] dark:border-[#5D7EA7]/20 dark:bg-[#1F2A35]/50"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700",
                )}
              >
                <span className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  spineModifiers.laterality === lateral
                    ? "border-primary bg-primary dark:border-[#5D7EA7] dark:bg-[#5D7EA7]"
                    : "border-slate-300 dark:border-slate-600",
                )}>
                  {spineModifiers.laterality === lateral && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <div>
                  <div className={cn(
                    "text-[13px] font-semibold",
                    spineModifiers.laterality === lateral ? "text-primary dark:text-[#718BAE]" : "text-slate-700 dark:text-slate-300",
                  )}>
                    {lateral === "UNILATERAL" ? "Unilateral" : "Bilateral"}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {lateral === "UNILATERAL" ? "Um lado (1×)" : "Ambos os lados (2×)"}
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
