"use client";

import { useEffect, useRef, useState } from "react";
import type { CBHPMCode, CalculationResult, AccessRouteType, SpineBillingModifiers } from "@/lib/procedure/types";
import { buildCalculatePayload, type CodeQuantities } from "@/lib/procedure/payload-builders";

// Fires a debounced POST /api/calculate whenever any input changes.
// Debounce of 150 ms prevents request storms during rapid interaction.
export function useRealtimeCalculation({
  allCbhpmCodes,
  selectedCodes,
  spineModifiers,
  codeQuantities,
  auxiliariesCount,
  requiresAnesthesia,
  anesthesiaAssistant,
  accessRoute,
  adjustments,
}: {
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  spineModifiers: SpineBillingModifiers;
  codeQuantities: CodeQuantities;
  auxiliariesCount: number;
  requiresAnesthesia: boolean;
  anesthesiaAssistant: boolean;
  accessRoute: AccessRouteType;
  adjustments: string[];
}) {
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (calcTimer.current) clearTimeout(calcTimer.current);
    const payload = buildCalculatePayload(
      allCbhpmCodes,
      selectedCodes,
      spineModifiers,
      codeQuantities,
      auxiliariesCount,
      requiresAnesthesia,
      anesthesiaAssistant,
      accessRoute,
      adjustments,
    );
    if (!payload) { setCalculation(null); return; }

    calcTimer.current = setTimeout(async () => {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setCalculation(await res.json());
    }, 150);

    return () => { if (calcTimer.current) clearTimeout(calcTimer.current); };
  }, [allCbhpmCodes, selectedCodes, spineModifiers, codeQuantities, auxiliariesCount, requiresAnesthesia, anesthesiaAssistant, accessRoute, adjustments]);

  return { calculation, setCalculation };
}
