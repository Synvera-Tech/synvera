"use client";

import { HeartPulse } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/components/ui/utils";

interface TeamFeesPanelProps {
  auxiliariesCount: number;
  auxIsLocked: boolean;
  cbhpmMandatedAux: number;
  onAuxiliariesChange: (n: number) => void;
  anesthesiaPorte?: number;
  anesthesiaAssistant: boolean;
  onAnesthesiaAssistantChange: (v: boolean) => void;
}

export function TeamFeesPanel({
  auxiliariesCount,
  auxIsLocked,
  cbhpmMandatedAux,
  onAuxiliariesChange,
  anesthesiaPorte,
  anesthesiaAssistant,
  onAnesthesiaAssistantChange,
}: TeamFeesPanelProps) {
  // Item 8 (A9): the second anesthesiologist (60%) is only allowed for AN7/AN8.
  const assistantEligible = anesthesiaPorte === 7 || anesthesiaPorte === 8;
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.4px] text-slate-500 dark:text-slate-400">
              Número de Auxiliares
            </label>
            {auxIsLocked && (
              <span className="rounded-md bg-primary/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary dark:bg-[#5D7EA7]/10 dark:text-[#718BAE]">
                Definido pelo CBHPM
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { if (!auxIsLocked) onAuxiliariesChange(n); }}
                disabled={auxIsLocked}
                aria-disabled={auxIsLocked}
                className={cn(
                  "h-9 w-9 rounded-xl border text-sm font-semibold transition-colors",
                  auxIsLocked
                    ? auxiliariesCount === n
                      ? "border-primary bg-primary text-white dark:border-[#5D7EA7] dark:bg-[#5D7EA7] cursor-default"
                      : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : auxiliariesCount === n
                      ? "border-primary bg-primary text-white dark:border-[#5D7EA7] dark:bg-[#5D7EA7]"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="medical-toggle-panel flex items-center gap-2.5 rounded-2xl border px-4 py-4">
          <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <HeartPulse aria-hidden="true" size={16} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-950 dark:text-slate-50">
              Anestesiologista
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Honorário derivado automaticamente do porte anestésico (CBHPM). Procedimentos com
              anestesia local (AN0) não geram honorário.
            </div>
          </div>
        </div>

        {assistantEligible && (
          <div className="medical-toggle-panel flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <HeartPulse aria-hidden="true" size={16} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-950 dark:text-slate-50">
                  Auxiliar de anestesia (60%)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Permitido em AN7/AN8 (CBHPM item 8). Adiciona um 2º anestesiologista a 60%.
                </div>
              </div>
            </div>
            <Toggle checked={anesthesiaAssistant} onChange={onAnesthesiaAssistantChange} />
          </div>
        )}
      </div>
    </>
  );
}
