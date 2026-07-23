"use client";

import { useEffect, useRef, useState } from "react";
import type { CBHPMCode, CalculationResult, AccessRouteType, SpineBillingModifiers } from "@/lib/procedure/types";
import { buildCalculatePayload, type CodeQuantities, type AnesthesiaAuxiliaryJustification } from "@/lib/procedure/payload-builders";

// Fires a debounced POST /api/calculate whenever any input changes.
// Debounce of 150 ms prevents request storms during rapid interaction.
export function useRealtimeCalculation({
  allCbhpmCodes,
  selectedCodes,
  selectedProcedureIds,
  spineModifiers,
  codeQuantities,
  requiresAnesthesia,
  anesthesiaAssistant,
  assistantJustification,
  anesthesiaBilateral,
  accessRoute,
  adjustments,
}: {
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  selectedProcedureIds: string[];
  spineModifiers: SpineBillingModifiers;
  codeQuantities: CodeQuantities;
  requiresAnesthesia: boolean;
  anesthesiaAssistant: boolean;
  assistantJustification: AnesthesiaAuxiliaryJustification;
  anesthesiaBilateral: boolean;
  accessRoute: AccessRouteType;
  adjustments: string[];
}) {
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (calcTimer.current) clearTimeout(calcTimer.current);
    const payload = buildCalculatePayload(
      allCbhpmCodes,
      selectedCodes,
      selectedProcedureIds,
      spineModifiers,
      codeQuantities,
      requiresAnesthesia,
      anesthesiaAssistant,
      accessRoute,
      adjustments,
      assistantJustification,
      anesthesiaBilateral,
    );
    if (!payload) {
      setCalculation(null);
      setCalculationError(null);
      setIsCalculating(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setCalculation(null);
    setIsCalculating(true);
    setCalculationError(null);
    calcTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (res.ok) {
          setCalculation(await res.json());
        } else {
          setCalculation(null);
          setCalculationError(
            res.status === 422
              ? "Número de auxiliares não disponível para este procedimento. O cálculo não pode prosseguir sem dados normativos completos."
              : "Não foi possível obter o número normativo de auxiliares.",
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCalculation(null);
        setCalculationError("Não foi possível obter o número normativo de auxiliares.");
      } finally {
        if (active) setIsCalculating(false);
      }
    }, 150);

    return () => {
      active = false;
      controller.abort();
      if (calcTimer.current) clearTimeout(calcTimer.current);
    };
  }, [allCbhpmCodes, selectedCodes, selectedProcedureIds, spineModifiers, codeQuantities, requiresAnesthesia, anesthesiaAssistant, assistantJustification, anesthesiaBilateral, accessRoute, adjustments]);

  return { calculation, setCalculation, isCalculating, calculationError };
}
