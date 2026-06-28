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

        // buildCompositionPayload saves sbn_procedure_id = selectedProcedures[0].id only,
        // but selected_codes contains codes from ALL selected procedures. Any code in
        // comp.selected_codes that is not in the primary procedure's cbhpm_codes belongs to
        // an additional procedure whose detail is not fetched. These orphan codes must be
        // merged into the primary procedure's detail so allCbhpmCodes covers them and
        // buildCalculatePayload never gets an empty intersection with selectedCodes.
        const primaryCodeSet = new Set(detail.cbhpm_codes.map((c) => c.code));
        const additionalCodes: CBHPMCode[] = comp.selected_codes
          .filter((c) => !primaryCodeSet.has(c.cbhpm_code))
          .map((c) => ({
            code: c.cbhpm_code,
            description: c.description,
            porte: c.porte,
            billing_mode: c.billing_mode,
            specialty: c.specialty,
            laterality_support: c.laterality_support,
            // num_auxiliaries is not stored in compositions; auxiliaries_count is
            // separately restored from comp.auxiliaries_count via onCompositionLoaded.
            num_auxiliaries: 0,
          }));
        const restoredDetail: ProcedureDetail =
          additionalCodes.length > 0
            ? { ...detail, cbhpm_codes: [...detail.cbhpm_codes, ...additionalCodes] }
            : detail;

        setSelectedProcedures([proc]);
        setDetailsMap({ [detail.id]: restoredDetail });
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
          // Stamp the procedure domain onto each code's specialty. The catalog stores an
          // inconsistent per-code specialty (some spine-procedure codes are tagged
          // "Neurocirurgia, Coluna Vertebral"), but a code's billing domain is a property of
          // the PROCEDURE, not the shared code. Using detail.domain makes the access-route
          // gating and the backend's normative-modifier resolution (which key on SPINE)
          // correct and consistent. Falls back to the code's own specialty when domain is absent.
          codes.push(detail.domain ? { ...c, specialty: detail.domain } : c);
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
        if (prevIds.has(proc.id)) continue;

        const cachedDetail = detailsMap[proc.id];
        if (cachedDetail) {
          // Detail already cached — re-add its codes without refetching.
          setSelectedCodes((prev) => {
            const next = new Set(prev);
            for (const c of cachedDetail.cbhpm_codes) next.add(c.code);
            return next;
          });
          continue;
        }

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
