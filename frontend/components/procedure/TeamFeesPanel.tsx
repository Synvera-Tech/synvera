"use client";

import { HeartPulse } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/components/ui/utils";
import type { AnesthesiaAuxiliaryJustification } from "@/lib/procedure/payload-builders";

interface TeamFeesPanelProps {
  auxiliariesCount: number;
  auxIsLocked: boolean;
  cbhpmMandatedAux: number;
  onAuxiliariesChange: (n: number) => void;
  anesthesiaPorte?: number;
  anesthesiaAssistant: boolean;
  onAnesthesiaAssistantChange: (v: boolean) => void;
  assistantJustification: AnesthesiaAuxiliaryJustification;
  onAssistantJustificationChange: (key: keyof AnesthesiaAuxiliaryJustification, value: boolean) => void;
  anesthesiaBilateral: boolean;
  onAnesthesiaBilateralChange: (v: boolean) => void;
}

// P1 (CBHPM p.140 item 8): non-derivable clinical facts that only the surgeon knows. Order and
// labels are user-facing (PT-BR); keys match the canonical payload.
const JUSTIFICATION_OPTIONS: { key: keyof AnesthesiaAuxiliaryJustification; label: string }[] = [
  { key: "cec", label: "Circulação extracorpórea (CEC)" },
  { key: "duration_over_6h", label: "Cirurgia com duração acima de 6 horas" },
  { key: "surgical_neonatology", label: "Neonatologia cirúrgica" },
  { key: "bariatric_gastroplasty", label: "Gastroplastia para obesidade mórbida" },
];

export function TeamFeesPanel({
  auxiliariesCount,
  auxIsLocked,
  cbhpmMandatedAux,
  onAuxiliariesChange,
  anesthesiaPorte,
  anesthesiaAssistant,
  onAnesthesiaAssistantChange,
  assistantJustification,
  onAssistantJustificationChange,
  anesthesiaBilateral,
  onAnesthesiaBilateralChange,
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

        {/* P2 (CBHPM p.140 item 7): bilateral anesthetic act with no specific code → +70% of the
            principal anesthetic porte. USER_SELECTABLE; the backend ignores it when a selected code
            is already a specific bilateral code. */}
        <div className="medical-toggle-panel flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <HeartPulse aria-hidden="true" size={16} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-950 dark:text-slate-50">
                Ato anestésico bilateral (+70%)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Cirurgia bilateral no mesmo ato anestésico, sem código específico (CBHPM item 7).
                Acresce 70% do porte anestésico principal.
              </div>
            </div>
          </div>
          <Toggle checked={anesthesiaBilateral} onChange={onAnesthesiaBilateralChange} />
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

        {/* P1 (CBHPM p.140 item 8): non-derivable triggers that justify a second anesthesiologist
            beyond AN7/AN8. USER_SELECTABLE — the surgeon declares them; the backend decides. */}
        <div className="medical-toggle-panel rounded-2xl border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <HeartPulse aria-hidden="true" size={16} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-950 dark:text-slate-50">
                Auxiliar de anestesia
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Quando selecionado, habilita auxiliar de anestesia com 60% do porte anestésico
                principal, conforme CBHPM.
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2 pl-[42px]">
            {JUSTIFICATION_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={assistantJustification[opt.key]}
                  onChange={(e) => onAssistantJustificationChange(opt.key, e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#5D7EA7] focus:ring-2 focus:ring-primary/40 dark:border-slate-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
