"use client";

import { AlertCircle, Baby } from "lucide-react";
import { ADJUSTMENT_CATALOG } from "@/lib/procedure/adjustment-catalog";
import { cn } from "@/components/ui/utils";
import { Toggle } from "@/components/ui/toggle";

interface ClinicalAdjustmentsPanelProps {
  hasAdjustment: (code: string) => boolean;
  toggleEmergency: () => void;
  activePediatric: string | null;
  setPediatric: (code: string | null) => void;
}

export function ClinicalAdjustmentsPanel({
  hasAdjustment,
  toggleEmergency,
  activePediatric,
  setPediatric,
}: ClinicalAdjustmentsPanelProps) {
  const emergency = ADJUSTMENT_CATALOG.find((a) => a.code === "emergency_special_hours")!;
  const pediatricOptions = ADJUSTMENT_CATALOG.filter((a) => a.group === "pediatric");
  const isEmergencyActive = hasAdjustment(emergency.code);

  return (
    <section
      aria-labelledby="clinical-adjustments-title"
      data-testid="clinical-adjustments-panel"
      className="medical-toggle-panel mt-4 rounded-2xl border px-4 py-4"
    >
      <div className="flex items-center gap-2.5">
        <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <AlertCircle aria-hidden="true" size={16} />
        </div>
        <div>
          <h3
            id="clinical-adjustments-title"
            className="text-[13px] font-semibold text-stone-950 dark:text-stone-50"
          >
            Acréscimos CBHPM
          </h3>
          <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
            Condições normativas que podem alterar a valoração
          </p>
        </div>
      </div>

      {/* Urgência/emergência — independent toggle */}
      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors",
          isEmergencyActive
            ? "bg-amber-50/80 dark:bg-amber-900/15"
            : "bg-white/45 dark:bg-white/[0.025]",
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[13px] font-semibold",
                isEmergencyActive
                  ? "text-amber-900 dark:text-amber-200"
                  : "text-stone-800 dark:text-stone-200",
              )}
            >
              {emergency.label}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                isEmergencyActive
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                  : "bg-stone-200/60 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
              )}
            >
              +{emergency.pct}%
            </span>
          </div>
          {emergency.helper && (
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
              {emergency.helper}
            </p>
          )}
        </div>
        <Toggle
          checked={isEmergencyActive}
          onChange={toggleEmergency}
          className="shrink-0"
          ariaLabel={emergency.label}
        />
      </div>

      {/* Pediátrico — radio group (mutually exclusive) */}
      <div className="mt-4 border-t border-stone-200/70 pt-4 dark:border-stone-700/60">
        <div className="mb-2 flex items-center gap-2">
          <Baby aria-hidden="true" size={14} className="text-stone-400 dark:text-stone-500" />
          <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            Faixa pediátrica
          </div>
        </div>

        <div role="radiogroup" aria-label="Faixa pediátrica" className="space-y-1">
          <button
            type="button"
            role="radio"
            aria-checked={activePediatric === null}
            onClick={() => setPediatric(null)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
              activePediatric === null
                ? "bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/15 dark:bg-[#A18C63]/10 dark:text-[#C0AD86] dark:ring-[#A18C63]/15"
                : "text-stone-600 hover:bg-white/60 dark:text-stone-400 dark:hover:bg-white/[0.035]",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                activePediatric === null
                  ? "border-primary bg-primary dark:border-[#A18C63] dark:bg-[#A18C63]"
                  : "border-stone-300 dark:border-stone-600",
              )}
            >
              {activePediatric === null && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="text-[13px] font-medium">Não pediátrico</span>
          </button>

          {pediatricOptions.map((adj) => {
            const isActive = activePediatric === adj.code;
            return (
              <button
                key={adj.code}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setPediatric(adj.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/15 dark:bg-[#A18C63]/10 dark:text-[#C0AD86] dark:ring-[#A18C63]/15"
                    : "text-stone-600 hover:bg-white/60 dark:text-stone-400 dark:hover:bg-white/[0.035]",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive
                      ? "border-primary bg-primary dark:border-[#A18C63] dark:bg-[#A18C63]"
                      : "border-stone-300 dark:border-stone-600",
                  )}
                >
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className={cn(
                  "min-w-0 flex-1 text-[13px] font-medium",
                  isActive && "text-primary dark:text-[#C0AD86]",
                )}>
                  {adj.label}
                </span>
                <span className={cn(
                  "shrink-0 text-[11px] font-semibold tabular-nums",
                  isActive ? "text-primary dark:text-[#C0AD86]" : "text-stone-400 dark:text-stone-500",
                )}>
                  +{adj.pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
