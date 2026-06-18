"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SBNProcedureOption } from "@/components/ui/autocomplete";
import type { CBHPMCode, ProcedureDetail, CompositionDetail } from "@/lib/procedure/types";

export function useProcedureSelection({
  initialQuery,
  initialSbnId,
  initialCompositionId,
  isLoaded,
  getToken,
  onCompositionLoaded,
}: {
  initialQuery: string;
  initialSbnId: string;
  initialCompositionId: string;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  // Called once when a composition is restored from URL; lets the parent set clinical state.
  onCompositionLoaded: (comp: CompositionDetail) => void;
}) {
  const [searchOptions, setSearchOptions] = useState<SBNProcedureOption[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [selectedProcedures, setSelectedProcedures] = useState<SBNProcedureOption[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, ProcedureDetail>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // ── Search ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/procedures/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) setSearchOptions(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Load composition from ?composition= param ────────────────────────────

  useEffect(() => {
    if (!initialCompositionId || !isLoaded) return;

    const load = async () => {
      const token = await getToken();
      const res = await fetch(`/api/compositions/${initialCompositionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const comp: CompositionDetail | null = res.ok ? await res.json() : null;
      if (!comp) return;

      onCompositionLoaded(comp);

      if (!comp.sbn_procedure_id) return;
      setLoadingIds(new Set([comp.sbn_procedure_id]));
      try {
        const detail: ProcedureDetail = await fetch(`/api/procedures/${comp.sbn_procedure_id}`).then((r) => r.json());
        const proc: SBNProcedureOption = { id: detail.id, name: detail.name };
        setSelectedProcedures([proc]);
        setDetailsMap({ [detail.id]: detail });
        setSelectedCodes(new Set(comp.selected_codes.map((c) => c.cbhpm_code)));
      } finally {
        setLoadingIds(new Set());
      }
    };

    load();
    // Re-runs when Clerk auth resolves so the Bearer token is available.
    // initialCompositionId is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // ── Load procedure from ?sbn= param ─────────────────────────────────────

  useEffect(() => {
    if (!initialSbnId || initialCompositionId) return;
    setLoadingIds(new Set([initialSbnId]));
    fetch(`/api/procedures/${initialSbnId}`)
      .then((r) => r.json())
      .then((detail: ProcedureDetail) => {
        const proc: SBNProcedureOption = { id: detail.id, name: detail.name };
        setSelectedProcedures([proc]);
        setDetailsMap({ [detail.id]: detail });
        setSelectedCodes(new Set(detail.cbhpm_codes.map((c) => c.code)));
      })
      .finally(() => setLoadingIds(new Set()));
    // Runs only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────

  const allCbhpmCodes = useMemo(() => {
    const seen = new Set<string>();
    const codes: CBHPMCode[] = [];
    for (const proc of selectedProcedures) {
      const detail = detailsMap[proc.id];
      if (!detail) continue;
      for (const c of detail.cbhpm_codes) {
        if (!seen.has(c.code)) {
          seen.add(c.code);
          codes.push(c);
        }
      }
    }
    return codes;
  }, [selectedProcedures, detailsMap]);

  // CBHPM 5.2: the highest num_auxiliaries among checked codes mandates the auxiliary count.
  const cbhpmMandatedAux = useMemo(() => {
    const checked = allCbhpmCodes.filter((c) => selectedCodes.has(c.code));
    if (checked.length === 0) return 0;
    return Math.max(0, ...checked.map((c) => c.num_auxiliaries));
  }, [allCbhpmCodes, selectedCodes]);

  // ── Multi-procedure change handler ──────────────────────────────────────

  const handleProceduresChange = useCallback(
    (procedures: SBNProcedureOption[]) => {
      const prevIds = new Set(selectedProcedures.map((p) => p.id));
      const removedProcs = selectedProcedures.filter((p) => !procedures.find((np) => np.id === p.id));

      setSelectedProcedures(procedures);

      if (removedProcs.length > 0) {
        const remainingCodeSet = new Set<string>();
        for (const proc of procedures) {
          const detail = detailsMap[proc.id];
          if (detail) for (const c of detail.cbhpm_codes) remainingCodeSet.add(c.code);
        }
        setSelectedCodes((prev) => {
          const next = new Set(prev);
          for (const proc of removedProcs) {
            const detail = detailsMap[proc.id];
            if (detail) {
              for (const c of detail.cbhpm_codes) {
                if (!remainingCodeSet.has(c.code)) next.delete(c.code);
              }
            }
          }
          return next;
        });
      }

      for (const proc of procedures) {
        if (prevIds.has(proc.id) || detailsMap[proc.id]) continue;
        setLoadingIds((prev) => new Set([...prev, proc.id]));
        fetch(`/api/procedures/${proc.id}`)
          .then((r) => r.json())
          .then((detail: ProcedureDetail) => {
            setDetailsMap((prev) => ({ ...prev, [proc.id]: detail }));
            setSelectedCodes((prev) => {
              const next = new Set(prev);
              for (const c of detail.cbhpm_codes) next.add(c.code);
              return next;
            });
          })
          .finally(() => {
            setLoadingIds((prev) => {
              const next = new Set(prev);
              next.delete(proc.id);
              return next;
            });
          });
      }
    },
    [selectedProcedures, detailsMap],
  );

  const toggleCode = useCallback((code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  return {
    searchOptions,
    searchQuery,
    setSearchQuery,
    selectedProcedures,
    detailsMap,
    loadingIds,
    loadingDetail: loadingIds.size > 0,
    selectedCodes,
    setSelectedCodes,
    allCbhpmCodes,
    cbhpmMandatedAux,
    auxIsLocked: cbhpmMandatedAux > 0,
    handleProceduresChange,
    toggleCode,
  };
}
