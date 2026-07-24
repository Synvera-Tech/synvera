"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, BookmarkCheck, Check, LogIn, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InternalNavigation } from "@/components/navigation/InternalNavigation";
import { useTheme } from "@/components/theme-provider";
import { useCompositions } from "@/hooks/useCompositions";
import { compositionHref, type CompositionItem } from "@/lib/compositions";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  surface:      "var(--calc-surface)",
  card:         "var(--calc-card)",
  cardBorder:   "var(--calc-card-border)",
  primary:      "var(--calc-primary)",
  secondary:    "var(--calc-secondary)",
  muted:        "var(--calc-muted)",
  inputBorder:  "var(--calc-input-border)",
  inputFocus:   "var(--calc-input-focus)",
  inputStrong:  "var(--calc-input-strong)",
  selected:     "var(--calc-selected)",
  soft:         "var(--calc-soft)",
  hover:        "var(--calc-hover)",
  divider:      "var(--calc-divider)",
  link:         "var(--calc-link)",
  button:       "var(--calc-button)",
  buttonHover:  "var(--calc-button-hover)",
  buttonPressed:"var(--calc-button-pressed)",
  disabled:     "var(--calc-disabled)",
  disabledText: "var(--calc-disabled-text)",
  cardShadow:   "var(--calc-card-shadow)",
  inputShadow:  "var(--calc-input-shadow)",
  focusShadow:  "var(--calc-focus-shadow)",
} as const;

const EXAMPLES = [
  "Cateter de PIC",
  "Craniotomia descompressiva",
  "Derivação ventrículo-peritoneal",
  "Aneurisma cerebral",
  "Hematoma intracraniano",
  "Tumores gerais",
  "Infiltração de coluna (dor axial e/ou radicular)",
  "Hérnia de disco de coluna lombar",
  "Artrodese cervical",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcedureHit = { id: string; name: string };

// ─── Novo cálculo ─────────────────────────────────────────────────────────────

export default function NovoCalculo() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { authLoaded, isSignedIn, compositions, loading: compositionsLoading } = useCompositions();

  // Preserve old bookmarks while the composition manager moves to its own URL.
  useEffect(() => {
    if (window.location.hash === "#compositions") router.replace("/composicoes");
  }, [router]);

  // Search state
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [hits, setHits] = useState<ProcedureHit[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [selectedHit, setSelectedHit] = useState<ProcedureHit | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  // The procedure the user picked, kept on screen while the Procedure page loads
  // so the selection is confirmed and the transition isn't silent.
  const [navigating, setNavigating] = useState<ProcedureHit | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Debounced search ───────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // A confirmed selection is stable until the user edits the field again.
    if (selectedHit || navigating) return;
    if (query.trim().length < 2) {
      setHits([]);
      setDropdownOpen(false);
      setSearchMessage(null);
      return;
    }
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/procedures/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: ProcedureHit[] = await res.json();
          if (cancelled) return;
          setHits(data ?? []);
          setDropdownOpen((data ?? []).length > 0);
          setActiveIdx(-1);
          setSearchMessage((data ?? []).length === 0 ? "Nenhum procedimento encontrado." : null);
        }
      } catch {
        // leave existing hits on network error
      }
    }, 180);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedHit, navigating]);

  // ── Close dropdown on outside click ───────────────────────────────────────

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Release the "Abrindo…" lock when returning via back/forward ─────────────
  // openSelectedHit sets `navigating` to show a brief transition before
  // routing to /procedure, and the input is disabled while it is set. The App
  // Router can preserve this component's state across client-side back navigation,
  // so without an explicit reset the input would stay disabled (forbidden cursor)
  // after the user returns to the search page. popstate covers SPA back/forward;
  // pageshow covers bfcache restores after a full reload.
  useEffect(() => {
    function release() {
      setNavigating(null);
      setSearching(false);
    }
    window.addEventListener("popstate", release);
    window.addEventListener("pageshow", release);
    return () => {
      window.removeEventListener("popstate", release);
      window.removeEventListener("pageshow", release);
    };
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────

  function selectHit(hit: ProcedureHit) {
    if (navigating) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(hit.name);
    setSelectedHit(hit);
    setActiveIdx(-1);
    setDropdownOpen(false);
    setSearching(false);
    setSearchMessage(null);
  }

  function openSelectedHit() {
    if (!selectedHit || navigating) return;
    setNavigating(selectedHit);
    window.setTimeout(() => {
      router.push(`/procedure?sbn=${encodeURIComponent(selectedHit.id)}&theme=${isDark ? "dark" : "light"}`);
    }, 800);
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (selectedHit) { openSelectedHit(); return; }
    if (activeIdx >= 0 && hits[activeIdx]) { selectHit(hits[activeIdx]); return; }
    const q = query.trim();
    if (q.length < 2) { inputRef.current?.focus(); return; }
    if (hits.length > 0) { setDropdownOpen(true); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    setDropdownOpen(false);
    setSearchMessage(null);
    try {
      const res = await fetch(`/api/procedures/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: ProcedureHit[] = await res.json();
        setHits(data ?? []);
        setActiveIdx(-1);
        setDropdownOpen((data ?? []).length > 0);
        setSearchMessage((data ?? []).length === 0 ? "Nenhum procedimento encontrado." : null);
      }
    } catch {
      setSearchMessage("Não foi possível pesquisar agora. Tente novamente.");
    } finally {
      setSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || hits.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") { setDropdownOpen(false); }
  }

  function fillExample(ex: string) {
    setQuery(ex);
    setSelectedHit(null);
    setHits([]);
    setDropdownOpen(false);
    setSearchMessage(null);
    inputRef.current?.focus();
  }

  const showDropdown = dropdownOpen && hits.length > 0;

  return (
    <main
      className="internal-page calculation-theme-page"
      style={{
        minHeight: "100vh",
        background: "var(--calc-page-background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 20px 96px",
      }}
    >
      <InternalNavigation
        active="calculation"
        returnTo="/novo-calculo"
      />
      <div style={{ width: "100%", maxWidth: "620px" }}>
        {/* ── Card ── */}
        <div
          style={{
            background: T.card,
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderRadius: "16px",
            border: `1px solid ${T.cardBorder}`,
            padding: "44px 40px 36px",
            boxShadow: T.cardShadow,
          }}
        >

          {/* ── Brand ── */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/synvera-symbol-dark.svg"
                alt=""
                aria-hidden="true"
                width={51}
                height={48}
                className="block dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/synvera-symbol-light.svg"
                alt=""
                aria-hidden="true"
                width={51}
                height={48}
                className="hidden dark:block"
              />
            </div>
            <h1
              style={{
                margin: "0 0 7px", fontSize: "28px", fontWeight: 700,
                fontFamily: "'Geist', 'Plus Jakarta Sans', Arial, sans-serif",
                letterSpacing: "-0.9px", color: T.primary, lineHeight: 1.08,
              }}
            >
              Novo cálculo
            </h1>
            <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 500, color: T.secondary, letterSpacing: "0.1px" }}>
              Valoração de Procedimentos Médicos
            </p>
          </div>

          {/* ── Search ── */}
              <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
                <label
                  htmlFor="procedure-search"
                  style={{ display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: 600, color: T.secondary }}
                >
                  Procedimento
                </label>

                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <Search
                    size={15}
                    aria-hidden="true"
                    style={{
                      position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)",
                      color: T.inputFocus, pointerEvents: "none", zIndex: 1,
                    }}
                  />
                  <input
                    id="procedure-search"
                    ref={inputRef}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-activedescendant={activeIdx >= 0 ? `hit-${activeIdx}` : undefined}
                    type="text"
                    value={query}
                    disabled={!!navigating}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedHit(null);
                      setHits([]);
                      setDropdownOpen(false);
                      setActiveIdx(-1);
                      setSearchMessage(null);
                    }}
                    onFocus={() => { setFocused(true); if (!selectedHit && hits.length > 0) setDropdownOpen(true); }}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite o nome do procedimento..."
                    className="placeholder:text-[#A59B88] dark:placeholder:text-stone-600"
                    style={{
                      width: "100%", height: "48px", paddingLeft: "38px", paddingRight: selectedHit || navigating ? "40px" : "14px",
                      fontSize: "14.5px", fontFamily: "inherit", color: T.primary,
                      backgroundColor: selectedHit ? T.selected : T.surface,
                      border: `1.5px solid ${selectedHit || navigating ? T.inputStrong : focused ? T.inputStrong : T.inputFocus}`,
                      borderRadius: showDropdown ? "10px 10px 0 0" : "10px",
                      outline: "none", boxSizing: "border-box",
                      transition: "background-color 150ms ease, border-color 150ms ease, border-radius 80ms ease, box-shadow 150ms ease",
                      boxShadow: focused || selectedHit || navigating
                        ? T.focusShadow
                        : T.inputShadow,
                    }}
                  />

                  {(selectedHit || navigating) && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        color: T.inputFocus, zIndex: 1,
                      }}
                    />
                  )}

                  {showDropdown && (
                    <ul
                      role="listbox"
                      aria-label="Procedimentos encontrados"
                      style={{
                        position: "absolute", top: "47px", left: 0, right: 0,
                        backgroundColor: T.surface,
                        border: `1.5px solid ${T.inputFocus}`,
                        borderTop: `1px solid ${T.divider}`,
                        borderRadius: "0 0 10px 10px",
                        boxShadow: "0 8px 24px rgba(40, 32, 17,0.09)",
                        maxHeight: "240px", overflowY: "auto",
                        listStyle: "none", margin: 0, padding: "4px 0", zIndex: 50,
                      }}
                    >
                      {hits.map((hit, i) => {
                        return (
                        <li
                          key={hit.id}
                          id={`hit-${i}`}
                          role="option"
                          aria-selected={i === activeIdx}
                          onPointerDown={(e) => { e.preventDefault(); selectHit(hit); }}
                          onMouseEnter={() => { if (!navigating) setActiveIdx(i); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "9px 14px", cursor: "pointer",
                            backgroundColor: i === activeIdx ? T.hover : "transparent",
                            transition: "background-color 120ms ease",
                          }}
                        >
                          <Search size={12} aria-hidden="true" style={{ color: T.inputFocus, flexShrink: 0 }} />
                          <span
                            style={{
                              fontSize: "13.5px", fontWeight: 500,
                              color: T.primary,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {hit.name}
                          </span>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {selectedHit && !navigating && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{ display: "flex", alignItems: "center", gap: "6px", margin: "-1px 0 9px", color: T.link, fontSize: "11.5px", fontWeight: 600 }}
                  >
                    <Check size={13} aria-hidden="true" />
                    Procedimento selecionado. Confirme para abrir.
                  </div>
                )}

                {navigating ? (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
                      width: "100%", minHeight: "46px", padding: "0 16px",
                      backgroundColor: T.soft,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: "10px",
                      fontSize: "13.5px", fontWeight: 600, color: T.inputFocus,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "14px", height: "14px", flexShrink: 0,
                        border: `2px solid ${T.inputBorder}`, borderTopColor: T.inputFocus,
                        borderRadius: "50%", display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Abrindo {navigating.name}…
                    </span>
                  </div>
                ) : (
                  // Truly disabled (outline, inverted colors) until there are at
                  // least 2 characters to search — matches the live-search minimum
                  // and prevents an empty submit.
                  <SearchButton
                    disabled={query.trim().length < 2}
                    loading={searching}
                    selected={!!selectedHit}
                  />
                )}

                {searchMessage && !selectedHit && !navigating && (
                  <p role="status" aria-live="polite" style={{ margin: "9px 2px 0", color: T.muted, fontSize: "11.5px", lineHeight: 1.5 }}>
                    {searchMessage}
                  </p>
                )}
              </form>

              <p style={{ margin: "16px 0 0", fontSize: "12.5px", lineHeight: "1.65", color: T.muted }}>
                Pesquise um procedimento para revisar os códigos CBHPM sugeridos,
                selecionar a composição desejada e calcular a valoração final.
              </p>

              <div style={{ marginTop: "22px" }}>
                <p style={{ margin: "0 0 9px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: T.muted }}>
                  Exemplos
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {EXAMPLES.map((ex) => (
                    <ExampleChip key={ex} label={ex} onClick={() => fillExample(ex)} />
                  ))}
                </div>
              </div>

              <RecentCompositions
                authLoaded={authLoaded}
                isSignedIn={isSignedIn}
                loading={compositionsLoading}
                compositions={compositions}
              />

        </div>
      </div>
    </main>
  );
}

// ─── Recent compositions ─────────────────────────────────────────────────────

function RecentCompositions({
  authLoaded,
  isSignedIn,
  loading,
  compositions,
}: {
  authLoaded: boolean;
  isSignedIn: boolean | undefined;
  loading: boolean;
  compositions: CompositionItem[];
}) {
  const recent = [...compositions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <section style={{ marginTop: "28px", paddingTop: "22px", borderTop: `1px solid ${T.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
          <BookmarkCheck size={15} aria-hidden="true" style={{ color: T.inputFocus, flexShrink: 0 }} />
          <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: T.secondary }}>
            Composições recentes
          </h2>
        </div>
        <Link
          href="/composicoes"
          style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: T.link, fontSize: "11.5px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Ver todas <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>

      {!authLoaded || loading ? (
        <div role="status" style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px", color: T.muted, fontSize: "12px" }}>
          <span aria-hidden="true" style={{ width: "14px", height: "14px", border: `2px solid ${T.inputBorder}`, borderTopColor: T.inputFocus, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Carregando...
        </div>
      ) : !isSignedIn ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", borderRadius: "10px", background: T.soft, padding: "11px 12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: T.secondary, fontSize: "11.5px", lineHeight: 1.5 }}>
            <LogIn size={14} aria-hidden="true" /> Entre para acessar seus modelos salvos.
          </span>
          <SignInButton mode="modal">
            <button type="button" style={{ border: 0, background: "transparent", color: T.link, fontSize: "11.5px", fontWeight: 700, cursor: "pointer", padding: 0 }}>
              Entrar
            </button>
          </SignInButton>
        </div>
      ) : recent.length === 0 ? (
        <div style={{ borderRadius: "10px", border: `1px dashed ${T.inputBorder}`, padding: "13px", color: T.muted, fontSize: "11.5px", lineHeight: 1.6 }}>
          Nenhuma composição salva ainda. Faça o primeiro cálculo e salve sua configuração para reutilizá-la.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {recent.map((composition) => (
            <Link
              key={composition.public_id}
              href={compositionHref(composition.public_id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", border: `1px solid ${T.divider}`, borderRadius: "10px", background: T.surface, padding: "10px 12px", color: "inherit", textDecoration: "none" }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.primary, fontSize: "12.5px", fontWeight: 700 }}>
                  {composition.name}
                </span>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px", color: T.muted, fontSize: "10.5px" }}>
                  {composition.sbn_procedure_name}
                </span>
              </span>
              <ArrowRight size={14} aria-hidden="true" style={{ color: T.inputFocus, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
function SearchButton({
  disabled,
  loading,
  selected,
}: {
  disabled: boolean;
  loading: boolean;
  selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;

  const bgColor = inactive
    ? T.disabled
    : pressed
    ? T.buttonPressed
    : hovered
    ? T.buttonHover
    : T.button;

  return (
    <button
      type="submit"
      disabled={inactive}
      aria-disabled={inactive}
      onMouseEnter={() => !inactive && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !inactive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: "100%", height: "46px",
        backgroundColor: bgColor,
        color: inactive ? T.disabledText : "#FFFFFF",
        border: inactive ? `1px solid ${T.inputBorder}` : "none",
        borderRadius: "10px",
        fontSize: "14px", fontWeight: 700, letterSpacing: "0.1px",
        fontFamily: "inherit", cursor: inactive ? "not-allowed" : "pointer",
        boxShadow: inactive ? "none" : "0 10px 24px rgba(90, 72, 35,0.18)",
        transition: "background 150ms ease, box-shadow 150ms ease",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      }}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: "14px", height: "14px",
            border: `2px solid ${T.inputBorder}`, borderTopColor: T.inputStrong,
            borderRadius: "50%", display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      {loading ? "Pesquisando..." : selected ? "Abrir procedimento" : "Pesquisar"}
    </button>
  );
}

function ExampleChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "5px 12px",
        backgroundColor: hovered ? T.hover : T.surface,
        border: `1px solid ${hovered ? T.inputFocus : T.inputBorder}`,
        borderRadius: "100px", fontSize: "12px", fontWeight: 500,
        fontFamily: "inherit", color: hovered ? T.primary : T.secondary,
        cursor: "pointer",
        transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
      }}
    >
      {label}
    </button>
  );
}
