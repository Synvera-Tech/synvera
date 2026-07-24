"use client";

import { ArrowLeft, Stethoscope } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/components/theme-provider";
import { InternalNavigation, type NavigationTheme } from "@/components/navigation/InternalNavigation";

import type { AccessRouteType } from "@/lib/procedure/types";
import { buildShareUrl, EMPTY_ANESTHESIA_JUSTIFICATION, type AnesthesiaAuxiliaryJustification } from "@/lib/procedure/payload-builders";

import { useProcedureSelection } from "@/hooks/procedure/useProcedureSelection";
import { useClinicalAdjustments } from "@/hooks/procedure/useClinicalAdjustments";
import { useSpineVariables } from "@/hooks/procedure/useSpineVariables";
import { useRealtimeCalculation } from "@/hooks/procedure/useRealtimeCalculation";
import { useCompositionPersistence } from "@/hooks/procedure/useCompositionPersistence";

import { ProcedureSearchPanel } from "@/components/procedure/ProcedureSearchPanel";
import { SelectedCodesPanel } from "@/components/procedure/SelectedCodesPanel";
import { SpineVariablesPanel } from "@/components/procedure/SpineVariablesPanel";
import { ClinicalAdjustmentsPanel } from "@/components/procedure/ClinicalAdjustmentsPanel";
import { TeamFeesPanel } from "@/components/procedure/TeamFeesPanel";
import { ValuationSummary } from "@/components/procedure/ValuationSummary";
import { ShareModal } from "@/components/procedure/ShareModal";
import { SaveCompositionPanel } from "@/components/procedure/SaveCompositionPanel";
import { DocBridge } from "@/components/procedure/DocBridge";

// ─── Workflow content ─────────────────────────────────────────────────────────

function ProcedureContent({
  initialQuery,
  initialSbnId,
  initialRoute,
  initialCompositionId,
  initialTheme,
}: {
  initialQuery: string;
  initialSbnId: string;
  initialRoute: AccessRouteType;
  initialCompositionId: string;
  initialTheme: NavigationTheme;
}) {
  const { pageTheme, setPageTheme } = useTheme();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // The Procedure page is always presented in light mode so there is no abrupt
  // dark→light jump coming from the Search page. The user can still flip to dark
  // *for this page only* via the navigation rail — their saved global preference is
  // left untouched and is restored automatically when they leave the page.
  useEffect(() => {
    setPageTheme(initialTheme);
    return () => setPageTheme(null);
  }, [initialTheme, setPageTheme]);

  const isDark = pageTheme === "dark";

  // ── Cross-cutting clinical state ──────────────────────────────────────────
  const [accessRoute, setAccessRoute] = useState<AccessRouteType>(initialRoute);
  const [requiresAnesthesia, setRequiresAnesthesia] = useState(true);
  // Anesthesia assistant (CBHPM item 8, A9): 60% second anesthesiologist, only offered for AN7/AN8.
  const [anesthesiaAssistant, setAnesthesiaAssistant] = useState(false);
  // P1 (CBHPM p.140 item 8): USER_SELECTABLE, non-derivable triggers (CEC, >6h, neonatology,
  // gastroplasty) that justify the assistant beyond AN7/AN8. Collected here; the backend decides.
  const [assistantJustification, setAssistantJustification] =
    useState<AnesthesiaAuxiliaryJustification>(EMPTY_ANESTHESIA_JUSTIFICATION);
  const handleAssistantJustificationChange = (
    key: keyof AnesthesiaAuxiliaryJustification,
    value: boolean,
  ) => setAssistantJustification((prev) => ({ ...prev, [key]: value }));
  // P2 (CBHPM p.140 item 7): USER_SELECTABLE bilateral anesthetic act (+70%). The backend ignores
  // it when a selected code is already a specific bilateral code.
  const [anesthesiaBilateral, setAnesthesiaBilateral] = useState(false);

  // Anesthesia-specific additions cannot remain selected when the base anesthesiologist
  // remuneration is excluded from the prospective valuation.
  useEffect(() => {
    if (requiresAnesthesia) return;
    setAnesthesiaAssistant(false);
    setAssistantJustification(EMPTY_ANESTHESIA_JUSTIFICATION);
    setAnesthesiaBilateral(false);
  }, [requiresAnesthesia]);

  // Per-code quantity selections (segments/vertebrae/structures). Keyed by CBHPM code;
  // codes absent from the map default to 1. Drives the per-code ×N billing (N5b).
  const [codeQuantities, setCodeQuantities] = useState<Record<string, number>>({});
  const setCodeQuantity = (code: string, qty: number) =>
    setCodeQuantities((prev) => ({ ...prev, [code]: qty }));

  // Composition identity and name — owned here so they're available before compositionState is built,
  // and so onCompositionLoaded can set them synchronously in a single callback.
  const [loadedCompositionId, setLoadedCompositionId] = useState<string | null>(null);
  const [loadedCompositionName, setLoadedCompositionName] = useState("");
  const [compositionName, setCompositionName] = useState("");

  // ── Domain hooks ──────────────────────────────────────────────────────────
  const adjustmentState = useClinicalAdjustments();
  const spineState = useSpineVariables();

  const procedureState = useProcedureSelection({
    initialQuery,
    initialSbnId,
    initialCompositionId,
    isLoaded,
    getToken,
    onCompositionLoaded: (comp) => {
      setAccessRoute(comp.access_route_type);
      setRequiresAnesthesia(comp.requires_anesthesia);
      adjustmentState.setAdjustments(comp.adjustments ?? []);
      setLoadedCompositionId(comp.public_id);
      setLoadedCompositionName(comp.name);
      setCompositionName(comp.name);
      // Restore per-code quantities saved with the composition.
      const restored: Record<string, number> = {};
      for (const c of comp.selected_codes ?? []) {
        if (c.quantity_selected && c.quantity_selected > 1) restored[c.cbhpm_code] = c.quantity_selected;
      }
      setCodeQuantities(restored);
      setAnesthesiaAssistant(comp.modifiers?.anesthesia_assistant ?? false);
      setAssistantJustification(comp.modifiers?.anesthesia_auxiliary_justification ?? EMPTY_ANESTHESIA_JUSTIFICATION);
      setAnesthesiaBilateral(comp.modifiers?.anesthesia_bilateral ?? false);
    },
  });

  const selectedProcedureIds = useMemo(
    () => procedureState.selectedProcedures.map((procedure) => procedure.id),
    [procedureState.selectedProcedures],
  );
  const { calculation, isCalculating, calculationError } = useRealtimeCalculation({
    allCbhpmCodes: procedureState.allCbhpmCodes,
    selectedCodes: procedureState.selectedCodes,
    selectedProcedureIds,
    spineModifiers: spineState.spineModifiers,
    codeQuantities,
    requiresAnesthesia,
    anesthesiaAssistant,
    assistantJustification,
    anesthesiaBilateral,
    accessRoute,
    adjustments: adjustmentState.adjustments,
  });
  const auxiliariesCount = calculation?.principal_procedure.num_auxiliaries ?? 0;

  const compositionState = useCompositionPersistence({
    selectedProcedures: procedureState.selectedProcedures,
    allCbhpmCodes: procedureState.allCbhpmCodes,
    selectedCodes: procedureState.selectedCodes,
    spineModifiers: spineState.spineModifiers,
    codeQuantities,
    auxiliariesCount,
    requiresAnesthesia,
    anesthesiaAssistant,
    assistantJustification,
    anesthesiaBilateral,
    accessRoute,
    adjustments: adjustmentState.adjustments,
    calculation,
    getToken,
    loadedCompositionId,
    loadedCompositionName,
    compositionName,
    setCompositionName,
  });

  // ── Share state ───────────────────────────────────────────────────────────
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShareClick = () => {
    if (procedureState.selectedProcedures.length === 0 || !calculation) return;
    setShareUrl(buildShareUrl(
      procedureState.selectedProcedures,
      procedureState.allCbhpmCodes,
      procedureState.selectedCodes,
      requiresAnesthesia,
      accessRoute,
      adjustmentState.adjustments,
      spineState.spineModifiers,
      codeQuantities,
      anesthesiaAssistant,
      assistantJustification,
      anesthesiaBilateral,
    ));
  };

  const canShare = !!calculation && procedureState.selectedProcedures.length > 0;
  const procedureReturnParams = new URLSearchParams();
  if (initialQuery) procedureReturnParams.set("q", initialQuery);
  if (initialSbnId) procedureReturnParams.set("sbn", initialSbnId);
  if (initialRoute !== "same") procedureReturnParams.set("route", initialRoute);
  if (initialCompositionId) procedureReturnParams.set("composition", initialCompositionId);
  procedureReturnParams.set("theme", isDark ? "dark" : "light");
  const procedureReturnTo = `/procedure${procedureReturnParams.size ? `?${procedureReturnParams.toString()}` : ""}`;

  return (
    <main className="internal-page procedure-bg relative min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: "hsl(var(--background))" }}>
      <InternalNavigation active="calculation" returnTo={procedureReturnTo} />

      {/* Hero */}
      <div className="relative z-[1] px-5 pb-6 pt-6 text-center lg:pt-8">
        <div className="mx-auto mb-4 flex max-w-[1080px] justify-start">
          <Link href="/novo-calculo" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-white/60 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-900/60 dark:hover:text-stone-100">
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar para a pesquisa
          </Link>
        </div>
        <h1 className="m-0 mb-1.5 font-display text-[32px] font-bold leading-tight tracking-[-0.03em] text-[#2D271F] dark:text-[#F6F1E7]">
          Composição de Honorários
        </h1>
        <p className="m-0 text-sm font-medium text-stone-500 dark:text-stone-400">
          {loadedCompositionId
            ? <>Editando composição: <span className="font-semibold text-primary dark:text-[#A99876]">{loadedCompositionName}</span></>
            : "Selecione o procedimento SBN · Monte a composição · Valorize em tempo real"}
        </p>
      </div>

      {/* Main grid */}
      <div className="main-grid relative z-[1] mx-auto grid max-w-[1080px] gap-7 px-5 pb-12">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="workspace-panel card-plush min-w-0 rounded-3xl border border-stone-200/80 p-5 dark:border-stone-700 dark:bg-stone-900 sm:p-8">

          <ProcedureSearchPanel
            searchOptions={procedureState.searchOptions}
            selectedProcedures={procedureState.selectedProcedures}
            onProceduresChange={procedureState.handleProceduresChange}
            onSearch={procedureState.setSearchQuery}
            initialQuery={initialQuery}
          />

          {(() => {
            const sources = Array.from(
              new Map(
                procedureState.selectedProcedures
                  .map((p) => procedureState.detailsMap[p.id]?.source)
                  .filter((s): s is NonNullable<typeof s> => !!s)
                  .map((s) => [`${s.document} ${s.version}`, s]),
              ).values(),
            );
            if (sources.length === 0) return null;
            return (
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map((s) => (
                  <span
                    key={`${s.document}-${s.version}`}
                    title={`${s.document} — ${s.version}`}
                    className="inline-flex items-start gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10.5px] font-medium leading-snug text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  >
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary dark:bg-[#A99876]" />
                    <span>Fonte: {s.document} — {s.version}</span>
                  </span>
                ))}
              </div>
            );
          })()}

          {procedureState.loadingDetail && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando códigos CBHPM...
            </div>
          )}

          {procedureState.allCbhpmCodes.length > 0 && !procedureState.loadingDetail && (
            <>
              <SelectedCodesPanel
                allCbhpmCodes={procedureState.allCbhpmCodes}
                selectedCodes={procedureState.selectedCodes}
                onToggleCode={procedureState.toggleCode}
                accessRoute={accessRoute}
                onAccessRouteChange={setAccessRoute}
              />

              <SpineVariablesPanel
                allCbhpmCodes={procedureState.allCbhpmCodes}
                selectedCodes={procedureState.selectedCodes}
                spineModifiers={spineState.spineModifiers}
                onSpineModifiersChange={spineState.setSpineModifiers}
                codeQuantities={codeQuantities}
                onCodeQuantityChange={setCodeQuantity}
              />

              <TeamFeesPanel
                auxiliariesCount={auxiliariesCount}
                auxiliariesLoading={isCalculating}
                auxiliariesError={calculationError}
                anesthesiaPorte={calculation?.anesthesia_porte}
                requiresAnesthesia={requiresAnesthesia}
                onRequiresAnesthesiaChange={setRequiresAnesthesia}
                anesthesiaAssistant={anesthesiaAssistant}
                onAnesthesiaAssistantChange={setAnesthesiaAssistant}
                assistantJustification={assistantJustification}
                onAssistantJustificationChange={handleAssistantJustificationChange}
                anesthesiaBilateral={anesthesiaBilateral}
                onAnesthesiaBilateralChange={setAnesthesiaBilateral}
              />

              <ClinicalAdjustmentsPanel
                hasAdjustment={adjustmentState.hasAdjustment}
                toggleEmergency={adjustmentState.toggleEmergency}
                activePediatric={adjustmentState.activePediatric}
                setPediatric={adjustmentState.setPediatric}
              />
            </>
          )}

          {procedureState.selectedProcedures.length === 0 && !procedureState.loadingDetail && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 py-10 text-center">
              <Stethoscope className="text-stone-300 dark:text-stone-600" size={32} />
              <p className="text-sm text-stone-400 dark:text-stone-500">
                Busque e selecione um procedimento SBN para montar a composição
              </p>
            </div>
          )}

          {/* Contextual bridge to Documentation module — visible throughout the workflow */}
          <DocBridge
            contextQuery={
              procedureState.selectedProcedures.length > 0
                ? procedureState.selectedProcedures.map((p) => p.name).join(" ")
                : undefined
            }
            theme={isDark ? "dark" : "light"}
            returnTo={procedureReturnTo}
          />
        </div>

        {/* ── Right panel ───────────────────────────────────────────────── */}
        <ValuationSummary
          calculation={calculation}
          accessRoute={accessRoute}
          selectedProcedures={procedureState.selectedProcedures}
          canShare={canShare}
          onShareClick={handleShareClick}
          savePanel={
            canShare ? (
              <SaveCompositionPanel
                isLoaded={isLoaded}
                isSignedIn={isSignedIn}
                loadedCompositionId={loadedCompositionId}
                compositionSaved={compositionState.compositionSaved}
                savingComposition={compositionState.savingComposition}
                compositionSaveError={compositionState.compositionSaveError}
                showSaveForm={compositionState.showSaveForm}
                compositionName={compositionName}
                nameInputRef={compositionState.nameInputRef}
                onShowSaveForm={() => {
                  compositionState.setShowSaveForm(true);
                  setTimeout(() => compositionState.nameInputRef.current?.focus(), 50);
                }}
                onHideSaveForm={() => compositionState.setShowSaveForm(false)}
                onCompositionNameChange={setCompositionName}
                onSaveComposition={compositionState.handleSaveComposition}
                onUpdateComposition={compositionState.handleUpdateComposition}
              />
            ) : null
          }
        />
      </div>

      <footer className="relative z-[1] px-5 pb-5 text-center">
        <div className="footer-divider mb-3.5 h-px" />
        <p className="m-0 text-xs font-medium text-stone-400 dark:text-stone-500">
          2026 &nbsp;·&nbsp; <span className="font-bold text-stone-500">LabF5</span> &nbsp;·&nbsp; Todos os direitos reservados
        </p>
      </footer>

      {/* Share modal */}
      {shareUrl && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />
      )}
    </main>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function SearchParamsReader() {
  const searchParams = useSearchParams();
  const rawRoute = searchParams.get("route");
  const initialRoute: AccessRouteType = rawRoute === "different" ? "different" : "same";
  return (
    <ProcedureContent
      initialQuery={searchParams.get("q") ?? ""}
      initialSbnId={searchParams.get("sbn") ?? ""}
      initialRoute={initialRoute}
      initialCompositionId={searchParams.get("composition") ?? ""}
      initialTheme={searchParams.get("theme") === "dark" ? "dark" : "light"}
    />
  );
}

export default function ProcedurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "hsl(var(--background))" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SearchParamsReader />
    </Suspense>
  );
}
