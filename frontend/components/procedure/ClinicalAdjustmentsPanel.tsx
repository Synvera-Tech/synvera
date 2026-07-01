"use client";

import { AlertCircle, Check } from "lucide-react";
import { ADJUSTMENT_CATALOG } from "@/lib/procedure/adjustment-catalog";
import { cn } from "@/components/ui/utils";

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
    <div className="mt-4 rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle aria-hidden="true" className="text-primary" size={15} />
        <span className="text-[13px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Acréscimos CBHPM
        </span>
      </div>

      {/* Urgência/emergência — checkbox */}
      <button
        type="button"
        onClick={toggleEmergency}
        className={cn(
          "mb-3 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
          isEmergencyActive
            ? "border-amber-200 bg-amber-50/60 dark:border-amber-400/20 dark:bg-amber-900/10"
            : "border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700",
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
          isEmergencyActive
            ? "border-amber-500 bg-amber-500 dark:border-amber-400 dark:bg-amber-400"
            : "border-stone-300 dark:border-stone-600",
        )}>
          {isEmergencyActive && <Check size={10} strokeWidth={3} className="text-white" />}
        </span>
        <div>
          <div className={cn(
            "text-[13px] font-semibold",
            isEmergencyActive ? "text-amber-800 dark:text-amber-300" : "text-stone-700 dark:text-stone-300",
          )}>
            {emergency.label} (+{emergency.pct}%)
          </div>
          {emergency.helper && (
            <div className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
              {emergency.helper}
            </div>
          )}
        </div>
      </button>

      {/* Pediátrico — radio group (mutually exclusive) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.4px] text-stone-400 dark:text-stone-500 mb-1.5">
          Paciente pediátrico
        </div>

        <button
          type="button"
          onClick={() => setPediatric(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
            activePediatric === null
              ? "border-primary/30 bg-[#F5F2EB] dark:border-[#A18C63]/20 dark:bg-[#332D21]/50"
              : "border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700",
          )}
        >
          <span className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            activePediatric === null
              ? "border-primary bg-primary dark:border-[#A18C63] dark:bg-[#A18C63]"
              : "border-stone-300 dark:border-stone-600",
          )}>
            {activePediatric === null && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
          <span className={cn(
            "text-[13px] font-medium",
            activePediatric === null ? "text-primary dark:text-[#A99876]" : "text-stone-600 dark:text-stone-400",
          )}>
            Não pediátrico
          </span>
        </button>

        {pediatricOptions.map((adj) => {
          const isActive = activePediatric === adj.code;
          return (
            <button
              key={adj.code}
              type="button"
              onClick={() => setPediatric(adj.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "border-primary/30 bg-[#F5F2EB] dark:border-[#A18C63]/20 dark:bg-[#332D21]/50"
                  : "border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700",
              )}
            >
              <span className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isActive
                  ? "border-primary bg-primary dark:border-[#A18C63] dark:bg-[#A18C63]"
                  : "border-stone-300 dark:border-stone-600",
              )}>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <div>
                <span className={cn(
                  "text-[13px] font-medium",
                  isActive ? "text-primary dark:text-[#A99876]" : "text-stone-600 dark:text-stone-400",
                )}>
                  {adj.label}
                </span>
                <span className={cn(
                  "ml-2 text-[12px] font-semibold",
                  isActive ? "text-primary dark:text-[#A99876]" : "text-stone-400",
                )}>
                  +{adj.pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
