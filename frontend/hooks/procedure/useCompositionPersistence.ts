"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SBNProcedureOption } from "@/components/ui/autocomplete";
import type {
  CBHPMCode,
  AccessRouteType,
  SpineBillingModifiers,
  CalculationResult,
} from "@/lib/procedure/types";
import { buildCompositionPayload } from "@/lib/procedure/payload-builders";

export function useCompositionPersistence({
  selectedProcedures,
  allCbhpmCodes,
  selectedCodes,
  spineModifiers,
  auxiliariesCount,
  requiresAnesthesia,
  accessRoute,
  adjustments,
  calculation,
  getToken,
  // Composition identity and name are owned by the page so they can be set
  // synchronously in the onCompositionLoaded callback before this hook runs.
  loadedCompositionId,
  loadedCompositionName,
  compositionName,
  setCompositionName,
}: {
  selectedProcedures: SBNProcedureOption[];
  allCbhpmCodes: CBHPMCode[];
  selectedCodes: Set<string>;
  spineModifiers: SpineBillingModifiers;
  auxiliariesCount: number;
  requiresAnesthesia: boolean;
  accessRoute: AccessRouteType;
  adjustments: string[];
  calculation: CalculationResult | null;
  getToken: () => Promise<string | null>;
  loadedCompositionId: string | null;
  loadedCompositionName: string;
  compositionName: string;
  setCompositionName: (name: string) => void;
}) {
  const [savingComposition, setSavingComposition] = useState(false);
  const [compositionSaved, setCompositionSaved] = useState(false);
  const [compositionSaveError, setCompositionSaveError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Clear save feedback when the calculation result changes.
  useEffect(() => {
    setCompositionSaved(false);
    setCompositionSaveError(null);
  }, [calculation]);

  // ── Save new composition ────────────────────────────────────────────────

  const handleSaveComposition = useCallback(async () => {
    const trimmedName = compositionName.trim();
    if (!trimmedName || selectedProcedures.length === 0) return;
    setSavingComposition(true);
    setCompositionSaveError(null);
    try {
      const token = await getToken();
      const payload = buildCompositionPayload(
        trimmedName,
        selectedProcedures,
        allCbhpmCodes,
        selectedCodes,
        spineModifiers,
        auxiliariesCount,
        requiresAnesthesia,
        accessRoute,
        adjustments,
      );
      const res = await fetch("/api/compositions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCompositionSaved(true);
        setShowSaveForm(false);
      } else if (res.status === 401) {
        setCompositionSaveError("Faça login para salvar composições.");
      } else {
        setCompositionSaveError("Não foi possível salvar. Tente novamente.");
      }
    } catch {
      setCompositionSaveError("Erro de conexão. Verifique a rede e tente novamente.");
    } finally {
      setSavingComposition(false);
    }
  }, [
    compositionName,
    selectedProcedures,
    allCbhpmCodes,
    selectedCodes,
    accessRoute,
    auxiliariesCount,
    requiresAnesthesia,
    adjustments,
    spineModifiers,
    getToken,
  ]);

  // ── Update loaded composition ───────────────────────────────────────────

  const handleUpdateComposition = useCallback(async () => {
    if (!loadedCompositionId || selectedProcedures.length === 0) return;
    setSavingComposition(true);
    setCompositionSaveError(null);
    try {
      const token = await getToken();
      const payload = buildCompositionPayload(
        loadedCompositionName,
        selectedProcedures,
        allCbhpmCodes,
        selectedCodes,
        spineModifiers,
        auxiliariesCount,
        requiresAnesthesia,
        accessRoute,
        adjustments,
      );
      const res = await fetch(`/api/compositions/${loadedCompositionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCompositionSaved(true);
      } else {
        setCompositionSaveError("Não foi possível atualizar. Tente novamente.");
      }
    } catch {
      setCompositionSaveError("Erro de conexão. Verifique a rede e tente novamente.");
    } finally {
      setSavingComposition(false);
    }
  }, [
    loadedCompositionId,
    loadedCompositionName,
    selectedProcedures,
    allCbhpmCodes,
    selectedCodes,
    accessRoute,
    auxiliariesCount,
    requiresAnesthesia,
    adjustments,
    spineModifiers,
    getToken,
  ]);

  return {
    savingComposition,
    compositionSaved,
    compositionSaveError,
    showSaveForm,
    setShowSaveForm,
    nameInputRef,
    handleSaveComposition,
    handleUpdateComposition,
  };
}
