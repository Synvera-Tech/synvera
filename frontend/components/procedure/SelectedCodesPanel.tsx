"use client";

import { Calculator, Check, Route, X } from "lucide-react";
import type { CBHPMCode, AccessRouteType } from "@/lib/procedure/types";
import { cn } from "@/components/ui/utils";

interface SelectedCodesPanelProps {
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  onToggleCode: (code: string) => void;
  accessRoute: AccessRouteType;
  onAccessRouteChange: (route: AccessRouteType) => void;
}

export function SelectedCodesPanel({
  allCbhpmCodes,
  selectedCodes,
  onToggleCode,
  accessRoute,
  onAccessRouteChange,
}: SelectedCodesPanelProps) {
  const showAccessRoute = !allCbhpmCodes.every((c) => c.specialty === "SPINE");

  return (
    <>
      <div className="mb-4 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-5">
        <Calculator aria-hidden="true" className="text-primary" size={15} />
        <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Composição CBHPM
        </span>
      </div>

      <div className="mb-5 space-y-2">
        {allCbhpmCodes.map((c) => {
          const checked = selectedCodes.has(c.code);
          return (
            <div
              key={c.code}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                checked
                  ? "selected-cbhpm-card"
                  : "border-slate-100 dark:border-slate-800 opacity-60",
              )}
            >
              <button
                type="button"
                onClick={() => onToggleCode(c.code)}
                aria-pressed={checked}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                  checked
                    ? "border-primary bg-primary text-white dark:border-[#9DB3D0] dark:bg-[#6F8FB8] checkbox-glow"
                    : "border-slate-300 dark:border-slate-600",
                )}
              >
                {checked && <Check size={12} strokeWidth={3} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {c.code}
                  </span>
                  <span className={cn(
                    "rounded-lg border px-2 py-0.5 text-[11px] font-semibold",
                    checked
                      ? "border-primary/30 text-primary dark:border-[#5D7EA7]/30 dark:text-[#718BAE]"
                      : "border-slate-200 dark:border-slate-700 text-slate-400",
                  )}>
                    {c.porte}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
                  {c.description}
                </p>
              </div>

              {checked && (
                <button
                  type="button"
                  onClick={() => onToggleCode(c.code)}
                  aria-label={`Remover ${c.code}`}
                  className="mt-0.5 shrink-0 text-slate-300 hover:text-red-400 dark:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAccessRoute && (
        <div className="mb-5 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Route aria-hidden="true" className="text-primary" size={15} />
            <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Via de Acesso
            </span>
          </div>
          <div className="space-y-2">
            {(["same", "different"] as const).map((route) => {
              const isSelected = accessRoute === route;
              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => onAccessRouteChange(route)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary/30 bg-[#EAF0F6] dark:border-[#5D7EA7]/20 dark:bg-[#1F2A35]/50"
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700",
                  )}
                >
                  <span className={cn(
                    "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary dark:border-[#5D7EA7] dark:bg-[#5D7EA7]"
                      : "border-slate-300 dark:border-slate-600",
                  )}>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <div>
                    <div className={cn(
                      "text-[13px] font-semibold",
                      isSelected ? "text-primary dark:text-[#718BAE]" : "text-slate-700 dark:text-slate-300",
                    )}>
                      {route === "same" ? "Mesma via de acesso" : "Vias de acesso diferentes"}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {route === "same"
                        ? "CBHPM 4.1 — procedimento adicional valorado a 50%"
                        : "CBHPM 4.2 — procedimento adicional valorado a 70%"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
