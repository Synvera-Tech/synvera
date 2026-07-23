"use client";

import { HeartPulse, Info } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import type { AnesthesiaAuxiliaryJustification } from "@/lib/procedure/payload-builders";

interface TeamFeesPanelProps {
  auxiliariesCount: number;
  auxiliariesLoading: boolean;
  auxiliariesError: string | null;
  anesthesiaPorte?: number;
  requiresAnesthesia: boolean;
  onRequiresAnesthesiaChange: (v: boolean) => void;
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
  auxiliariesLoading,
  auxiliariesError,
  anesthesiaPorte,
  requiresAnesthesia,
  onRequiresAnesthesiaChange,
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
        <div data-testid="auxiliaries-card" className="rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-4 shadow-sm dark:border-stone-700/80 dark:bg-stone-900/60">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-[#A18C63]/15 dark:text-[#B8A47D]">
              <Info aria-hidden="true" size={17} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.4px] text-stone-500 dark:text-stone-400">
                Número de auxiliares
              </div>
              <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Definido automaticamente pela CBHPM
              </div>
              {auxiliariesLoading ? (
                <div className="mt-3 h-7 w-28 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" aria-label="Carregando número de auxiliares" />
              ) : auxiliariesError ? (
                <p className="mt-3 text-xs font-medium leading-relaxed text-red-700 dark:text-red-300" role="alert">
                  {auxiliariesError}
                </p>
              ) : (
                <div className="mt-2 text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                  {auxiliariesCount} {auxiliariesCount === 1 ? "auxiliar" : "auxiliares"}
                </div>
              )}
              <div className="mt-1 text-[10px] font-medium text-primary/80 dark:text-[#A99876]">
                Conforme CBHPM
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="medical-toggle-panel flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <HeartPulse aria-hidden="true" size={16} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-stone-950 dark:text-stone-50">
                Incluir honorários do anestesiologista na valoração
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Ative quando estiver prevista a participação do anestesiologista. O honorário será
                calculado automaticamente conforme o porte anestésico da CBHPM. Procedimentos com
                anestesia local (AN0) não geram honorário.
              </div>
            </div>
          </div>
          <Toggle checked={requiresAnesthesia} onChange={onRequiresAnesthesiaChange} />
        </div>

        {requiresAnesthesia && (
          <>
            {/* P2 (CBHPM p.140 item 7): bilateral anesthetic act with no specific code → +70% of the
                principal anesthetic porte. USER_SELECTABLE; the backend ignores it when a selected code
                is already a specific bilateral code. */}
            <div className="medical-toggle-panel flex items-center justify-between gap-4 rounded-2xl border px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <HeartPulse aria-hidden="true" size={16} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-stone-950 dark:text-stone-50">
                    Ato anestésico bilateral (+70%)
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Cirurgia bilateral no mesmo ato anestésico, sem código específico (CBHPM item 7).
                    Acresce 70% do porte anestésico principal.
                  </div>
                </div>
              </div>
              <Toggle checked={anesthesiaBilateral} onChange={onAnesthesiaBilateralChange} />
            </div>

            {/* CBHPM p.140 item 8: AN7/AN8 and the non-derivable clinical situations are
                alternative criteria for the same second-anesthesiologist fee. They share one
                card to make the OR relationship explicit; the backend remains authoritative. */}
            <div
              data-testid="second-anesthesiologist-card"
              className="medical-toggle-panel rounded-2xl border px-4 py-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="clinical-icon-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <HeartPulse aria-hidden="true" size={16} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-stone-950 dark:text-stone-50">
                    Segundo anestesiologista (60%)
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Aplicável por porte AN7/AN8 ou por uma das situações clínicas previstas na
                    CBHPM. Os critérios são independentes.
                  </div>
                </div>
              </div>

              {assistantEligible && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-white/50 px-3 py-3 dark:bg-white/[0.035]">
                  <div>
                    <div className="text-[12.5px] font-semibold text-stone-800 dark:text-stone-200">
                      Critério por porte anestésico
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                      Porte principal AN{anesthesiaPorte}, previsto no item 8 da CBHPM.
                    </div>
                  </div>
                  <Toggle
                    checked={anesthesiaAssistant}
                    onChange={onAnesthesiaAssistantChange}
                    ariaLabel={`Incluir segundo anestesiologista por porte AN${anesthesiaPorte}`}
                  />
                </div>
              )}

              <div className={assistantEligible ? "mt-4 border-t border-stone-200/70 pt-4 dark:border-stone-700/60" : "mt-4"}>
                <div className="mb-2 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                  Outras situações previstas
                </div>
                <div className="space-y-2">
                {JUSTIFICATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-[12.5px] text-stone-700 transition-colors hover:text-stone-950 dark:text-stone-300 dark:hover:text-stone-50"
                  >
                    <input
                      type="checkbox"
                      checked={assistantJustification[opt.key]}
                      onChange={(e) => onAssistantJustificationChange(opt.key, e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-stone-300 accent-[#A18C63] focus:ring-2 focus:ring-primary/40 dark:border-stone-600"
                    />
                    {opt.label}
                  </label>
                ))}
                </div>
                <p className="mt-3 text-[10.5px] leading-relaxed text-stone-500 dark:text-stone-400">
                  Basta um dos critérios aplicáveis para inclusão do segundo anestesiologista.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
