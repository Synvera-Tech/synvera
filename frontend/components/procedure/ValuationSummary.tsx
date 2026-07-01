"use client";

import { AlertCircle, Calculator, Info, Share2 } from "lucide-react";
import type { SBNProcedureOption } from "@/components/ui/autocomplete";
import type { CalculationResult, AccessRouteType } from "@/lib/procedure/types";
import { money, pct, formatAssistantReasons } from "@/lib/procedure/formatters";
import { cn } from "@/components/ui/utils";

interface ValuationSummaryProps {
  calculation: CalculationResult | null;
  accessRoute: AccessRouteType;
  selectedProcedures: SBNProcedureOption[];
  canShare: boolean;
  onShareClick: () => void;
  savePanel: React.ReactNode;
}

export function ValuationSummary({
  calculation,
  accessRoute,
  selectedProcedures,
  canShare,
  onShareClick,
  savePanel,
}: ValuationSummaryProps) {
  const ruleLabel = accessRoute === "same"
    ? "Mesma via de acesso — CBHPM 4.1 (50% para procedimentos adicionais)"
    : "Vias de acesso diferentes — CBHPM 4.2 (70% para procedimentos adicionais)";

  return (
    <div className="results-card relative overflow-hidden rounded-3xl border border-primary/15 dark:border-[#5D7EA7]/20 p-7">
      <div className="results-card-header mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator aria-hidden="true" className="text-primary" size={18} />
          <h2 className="m-0 text-[15px] font-bold text-slate-950 dark:text-slate-50">Valoração</h2>
        </div>
        <span className="clinical-pill rounded-full px-2.5 py-1 text-[11px] font-semibold">CBHPM 2025</span>
      </div>

      {calculation && (
        <div className="mb-6 flex items-baseline justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <span className="text-[13px] text-slate-600 dark:text-slate-400">Valor Total</span>
          <span className="font-grotesk text-[24px] font-bold text-slate-950 dark:text-[#f7f8f8]">
            {money.format(calculation.final_total)}
          </span>
        </div>
      )}

      {calculation ? (
        <>
          {/* Procedimentos selecionados */}
          <section className="mb-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-400 dark:text-slate-500">
              Procedimentos Selecionados
            </h3>
            <dl className="space-y-2">
              {calculation.code_breakdown.map((b) => (
                <div key={b.cbhpm_code} className={cn(
                  "flex items-end justify-between gap-1 rounded-xl px-3 py-2 transition-colors",
                  b.is_principal ? "border border-primary/20 bg-[#EAF0F6] principal-row" : "",
                )}>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{b.cbhpm_code}</span>
                      {b.is_principal && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary dark:bg-[#5D7EA7]/10 dark:text-[#718BAE]">
                          principal
                        </span>
                      )}
                    </dt>
                    <dd className="truncate text-[12px] text-slate-500 dark:text-slate-400">{b.description}</dd>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] font-semibold text-primary dark:text-[#718BAE]">{b.porte}</span>
                    <span className="font-grotesk text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {money.format(b.base_value)}
                    </span>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <div className="sapphire-divider my-4" />

          {/* Regra aplicada */}
          <section className="mb-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-400 dark:text-slate-500">
              Regra Aplicada
            </h3>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 px-3 py-2.5 text-[12px] text-slate-500 dark:text-slate-400">
              {ruleLabel}
            </div>
          </section>

          {/* Acréscimos CBHPM */}
          {(calculation.selected_adjustments ?? []).length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-400/20 bg-amber-50/70 dark:bg-amber-900/10 px-3.5 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
                  Acréscimos CBHPM — total +{(calculation.total_adjustment_percentage ?? 0).toFixed(0)}%
                </span>
                <span className="ml-auto font-grotesk text-[12px] font-bold text-amber-800 dark:text-amber-300">
                  +{money.format(calculation.adjustment_value ?? 0)}
                </span>
              </div>
              {(calculation.selected_adjustments ?? []).map((a) => (
                <div key={a.code} className="ml-6 flex items-center justify-between">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">{a.label}</span>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    +{a.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Cálculo do cirurgião */}
          <section className="mb-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-400 dark:text-slate-500">
              Cálculo do Cirurgião
            </h3>
            <dl className="space-y-1.5">
              <BreakdownRow label="Procedimento principal" value={calculation.surgeon_breakdown.principal_value} />
              {calculation.surgeon_breakdown.additional_gross > 0 && (
                <>
                  <BreakdownRow label="Procedimentos adicionais (bruto)" value={calculation.surgeon_breakdown.additional_gross} muted />
                  <BreakdownRow
                    label={`Desconto CBHPM (× ${calculation.surgeon_breakdown.discount_rate === 0.50 ? "50%" : "70%"})`}
                    value={calculation.surgeon_breakdown.additional_discounted}
                    muted
                  />
                </>
              )}
              <div className="pt-1">
                <BreakdownRow label="Total cirurgião" value={calculation.lead_surgeon_fee} strong />
              </div>
            </dl>
          </section>

          <div className="sapphire-divider my-4" />

          {/* Cálculo dos auxiliares */}
          <section className="mb-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-400 dark:text-slate-500">
              Cálculo dos Auxiliares
            </h3>
            <dl className="space-y-2.5 dark:text-slate-200">
              <ResultRow label="Cirurgião Principal" value={calculation.lead_surgeon_fee} strong />
              {calculation.individual_auxiliary_fees.map((af) => (
                <ResultRow
                  key={af.position}
                  label={`${af.position}º Auxiliar`}
                  note={pct(af.percentage)}
                  value={af.fee}
                />
              ))}
              {calculation.anesthesiologist_fee > 0 && (
                <ResultRow
                  label="Anestesiologista"
                  note={calculation.anesthesia_bilateral_applied ? "+70% bilateral (item 7)" : undefined}
                  value={calculation.anesthesiologist_fee}
                />
              )}
              {(calculation.anesthesia_assistant_fee ?? 0) > 0 && (
                <>
                  <ResultRow
                    label="Auxiliar de anestesia (60%)"
                    value={calculation.anesthesia_assistant_fee!}
                  />
                  {formatAssistantReasons(calculation.anesthesia_assistant_reasons) && (
                    <div className="-mt-1 pl-1 text-[11px] font-medium text-primary/80 dark:text-[#718BAE]">
                      Justificativa: {formatAssistantReasons(calculation.anesthesia_assistant_reasons)}
                    </div>
                  )}
                </>
              )}
            </dl>
          </section>

          <div className="sapphire-divider my-4" />

          {/* Valor Final */}
          <div
            className="rounded-2xl p-4 text-white"
            style={{ background: "linear-gradient(135deg, hsl(214,52%,24%), hsl(214,52%,18%))", boxShadow: "0 4px 20px hsla(214,52%,24%,0.35)" }}
          >
            <div className="mb-2 grid grid-cols-2 gap-1 text-[11px] opacity-75">
              <span>Cirurgião</span>
              <span className="text-right font-semibold">{money.format(calculation.lead_surgeon_fee)}</span>
              {calculation.auxiliaries_fee > 0 && (
                <>
                  <span>Auxiliares</span>
                  <span className="text-right font-semibold">{money.format(calculation.auxiliaries_fee)}</span>
                </>
              )}
              {calculation.anesthesiologist_fee > 0 && (
                <>
                  <span>Anestesiologista</span>
                  <span className="text-right font-semibold">{money.format(calculation.anesthesiologist_fee)}</span>
                </>
              )}
              {(calculation.anesthesia_assistant_fee ?? 0) > 0 && (
                <>
                  <span>Auxiliar de anestesia</span>
                  <span className="text-right font-semibold">{money.format(calculation.anesthesia_assistant_fee!)}</span>
                </>
              )}
              {(calculation.selected_adjustments ?? []).length > 0 && (
                <>
                  <span className="text-amber-300">
                    Acréscimos CBHPM (+{(calculation.total_adjustment_percentage ?? 0).toFixed(0)}%)
                  </span>
                  <span className="text-right font-semibold text-amber-300">
                    +{money.format(calculation.adjustment_value ?? 0)}
                  </span>
                </>
              )}
            </div>
            <div className="mb-0.5 text-xs font-semibold uppercase tracking-[0.5px] opacity-75">Total da Equipe</div>
            <div className="font-grotesk text-[36px] font-bold leading-none tracking-tight">
              {money.format(calculation.final_total)}
            </div>
            {selectedProcedures.length > 0 && (
              <div className="mt-1.5 text-[11px] font-medium opacity-65">
                {selectedProcedures.map((p) => p.name).join(" · ")}
              </div>
            )}
          </div>

          {canShare && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                id="share-calculation-btn"
                onClick={onShareClick}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 px-4 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/5 active:scale-[0.98] dark:border-[#5D7EA7]/20 dark:text-[#718BAE]"
                type="button"
              >
                <Share2 size={16} /> Compartilhar cálculo
              </button>
              {savePanel}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-3">
            <Info aria-hidden="true" className="mt-px shrink-0 text-slate-400 dark:text-slate-500" size={15} />
            <p className="m-0 text-[11px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
              Valores calculados conforme Tabela CBHPM 2025/2026 (Faixa Original). Sujeito à variação por convênio.
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <Calculator className="text-slate-200 dark:text-slate-700" size={40} />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Selecione ao menos um código CBHPM para ver a valoração
          </p>
        </div>
      )}
    </div>
  );
}

// ── Supporting row components ──────────────────────────────────────────────────

function ResultRow({ label, value, note, strong }: {
  label: string;
  value: number | undefined;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-1">
      <dt className={cn("shrink-0 text-[13px]", strong ? "font-semibold text-slate-700 dark:text-slate-300" : "font-medium text-slate-500 dark:text-slate-400")}>
        {label}
        {note && <span className="ml-1.5 text-[11px] font-semibold text-primary/70 dark:text-[#718BAE]/70">{note}</span>}
      </dt>
      <div className="leader" />
      <dd className={cn("font-grotesk shrink-0 text-sm font-semibold", strong ? "text-slate-950 dark:text-slate-50" : "text-slate-800 dark:text-slate-100")}>
        {value === undefined ? "—" : money.format(value)}
      </dd>
    </div>
  );
}

function BreakdownRow({ label, value, muted, strong }: {
  label: string;
  value: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-1">
      <span className={cn("text-[12px]", strong ? "font-semibold text-slate-700 dark:text-slate-200" : muted ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-300")}>
        {label}
      </span>
      <span className={cn("font-grotesk text-[13px] font-semibold", strong ? "text-slate-950 dark:text-slate-50" : muted ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100")}>
        {money.format(value)}
      </span>
    </div>
  );
}
