"use client";

import { LogIn, Moon, Stethoscope, Sun } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useTheme } from "@/components/theme-provider";

import type { AccessRouteType } from "@/lib/procedure/types";
import { buildShareUrl } from "@/lib/procedure/payload-builders";

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
import { DocumentSearchPanel } from "@/components/procedure/DocumentSearchPanel";

// ─── Workflow content ─────────────────────────────────────────────────────────

function ProcedureContent({
  initialQuery,
  initialSbnId,
  initialRoute,
  initialCompositionId,
}: {
  initialQuery: string;
  initialSbnId: string;
  initialRoute: AccessRouteType;
  initialCompositionId: string;
}) {
  const { isDark, toggle } = useTheme();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // ── Cross-cutting clinical state ──────────────────────────────────────────
  const [accessRoute, setAccessRoute] = useState<AccessRouteType>(initialRoute);
  const [auxiliariesCount, setAuxiliariesCount] = useState(1);
  const [requiresAnesthesia, setRequiresAnesthesia] = useState(true);

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
      setAuxiliariesCount(comp.auxiliaries_count);
      setLoadedCompositionId(comp.public_id);
      setLoadedCompositionName(comp.name);
      setCompositionName(comp.name);
    },
  });

  // CBHPM 5.2: sync auxiliariesCount when mandated value changes.
  useEffect(() => {
    if (procedureState.cbhpmMandatedAux > 0) {
      setAuxiliariesCount(procedureState.cbhpmMandatedAux);
    }
  }, [procedureState.cbhpmMandatedAux]);

  const { calculation } = useRealtimeCalculation({
    allCbhpmCodes: procedureState.allCbhpmCodes,
    selectedCodes: procedureState.selectedCodes,
    spineModifiers: spineState.spineModifiers,
    auxiliariesCount,
    requiresAnesthesia,
    accessRoute,
    adjustments: adjustmentState.adjustments,
  });

  const compositionState = useCompositionPersistence({
    selectedProcedures: procedureState.selectedProcedures,
    allCbhpmCodes: procedureState.allCbhpmCodes,
    selectedCodes: procedureState.selectedCodes,
    spineModifiers: spineState.spineModifiers,
    auxiliariesCount,
    requiresAnesthesia,
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
      auxiliariesCount,
      requiresAnesthesia,
      accessRoute,
      adjustmentState.adjustments,
      spineState.spineModifiers,
    ));
  };

  const canShare = !!calculation && procedureState.selectedProcedures.length > 0;

  return (
    <main className="hex-bg relative min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Nav */}
      <div className="relative z-10 px-5 pt-5">
        <nav className="nav-bar mx-auto flex max-w-[1080px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="brand-mark h-9 w-9 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/synvera-symbol-dark.svg" alt="" aria-hidden="true" width={24} height={23} className="block dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/synvera-symbol-light.svg" alt="" aria-hidden="true" width={24} height={23} className="hidden dark:block" />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-slate-950 dark:text-slate-50">Synvera</span>
              <span className="block text-[10px] font-medium tracking-[0.3px] text-slate-500 dark:text-slate-400 leading-none">Neurocirurgia · Coluna</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isLoaded && (
              isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <LogIn size={13} aria-hidden="true" />
                    Entrar
                  </button>
                </SignInButton>
              )
            )}
            <button
              onClick={toggle}
              aria-checked={isDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="theme-switch relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              role="switch"
              type="button"
            >
              <Sun aria-hidden="true" size={13} className="absolute left-2 text-amber-500 transition-opacity dark:opacity-35" />
              <Moon aria-hidden="true" size={13} className="absolute right-2 text-slate-500 opacity-45 transition-opacity dark:text-[#94A3B8] dark:opacity-100" />
              <span aria-hidden="true" className={`theme-switch-thumb absolute top-1 h-6 w-6 rounded-full transition-transform duration-200 ${isDark ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <div className="relative z-[1] px-5 pb-6 pt-8 text-center">
        <h1 className="m-0 mb-1.5 text-[30px] font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
          Composição de Honorários
        </h1>
        <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">
          {loadedCompositionId
            ? <>Editando composição: <span className="font-semibold text-primary dark:text-[#718BAE]">{loadedCompositionName}</span></>
            : "Selecione o procedimento SBN · Monte a composição · Valorize em tempo real"}
        </p>
      </div>

      {/* Main grid */}
      <div className="main-grid relative z-[1] mx-auto grid max-w-[1080px] gap-7 px-5 pb-12">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="workspace-panel card-plush rounded-3xl border border-slate-200/80 dark:border-slate-700 dark:bg-slate-900 p-8">

          <ProcedureSearchPanel
            searchOptions={procedureState.searchOptions}
            selectedProcedures={procedureState.selectedProcedures}
            onProceduresChange={procedureState.handleProceduresChange}
            onSearch={procedureState.setSearchQuery}
            initialQuery={initialQuery}
          />

          {procedureState.loadingDetail && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
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
              />

              <TeamFeesPanel
                auxiliariesCount={auxiliariesCount}
                auxIsLocked={procedureState.auxIsLocked}
                cbhpmMandatedAux={procedureState.cbhpmMandatedAux}
                onAuxiliariesChange={setAuxiliariesCount}
                requiresAnesthesia={requiresAnesthesia}
                onRequiresAnesthesiaChange={setRequiresAnesthesia}
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
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center">
              <Stethoscope className="text-slate-300 dark:text-slate-600" size={32} />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Busque e selecione um procedimento SBN para montar a composição
              </p>
            </div>
          )}
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

      {/* Document Search (RAG v0) — read-only reference panel, no influence on calculations */}
      <div className="px-5 pt-1 pb-2">
        <DocumentSearchPanel />
      </div>

      <footer className="relative z-[1] px-5 pb-5 text-center">
        <div className="footer-divider mb-3.5 h-px" />
        <p className="m-0 text-xs font-medium text-slate-400 dark:text-slate-500">
          2026 &nbsp;·&nbsp; <span className="font-bold text-slate-500">LabF5</span> &nbsp;·&nbsp; Todos os direitos reservados
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
