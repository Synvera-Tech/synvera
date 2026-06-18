"use client";

import { useState } from "react";
import { PEDIATRIC_CODES } from "@/lib/procedure/adjustment-catalog";

// Manages CBHPM adjustment selections.
// Emergency and pediatric groups are independent; pediatric codes are mutually exclusive.
export function useClinicalAdjustments(initialAdjustments: string[] = []) {
  const [adjustments, setAdjustments] = useState<string[]>(initialAdjustments);

  const hasAdjustment = (code: string) => adjustments.includes(code);

  const toggleEmergency = () =>
    setAdjustments((prev) =>
      prev.includes("emergency_special_hours")
        ? prev.filter((c) => c !== "emergency_special_hours")
        : [...prev, "emergency_special_hours"],
    );

  // Only one pediatric code may be active at a time (radio group, not checkbox).
  const setPediatric = (code: string | null) =>
    setAdjustments((prev) => {
      const withoutPediatric = prev.filter((c) => !PEDIATRIC_CODES.includes(c));
      return code ? [...withoutPediatric, code] : withoutPediatric;
    });

  const activePediatric = adjustments.find((c) => PEDIATRIC_CODES.includes(c)) ?? null;

  return {
    adjustments,
    setAdjustments,
    hasAdjustment,
    toggleEmergency,
    setPediatric,
    activePediatric,
  };
}
