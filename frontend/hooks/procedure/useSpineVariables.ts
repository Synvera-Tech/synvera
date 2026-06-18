"use client";

import { useState } from "react";
import type { SpineBillingModifiers } from "@/lib/procedure/types";

export function useSpineVariables() {
  const [spineModifiers, setSpineModifiers] = useState<SpineBillingModifiers>({
    quantity_selected: 1,
    laterality: "UNILATERAL",
  });

  return { spineModifiers, setSpineModifiers };
}
