"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { BookmarkCheck, BookOpen, Check, LogIn, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg:          "#F2EDE3",
  surface:     "#FFFFFF",
  cardBorder:  "#EFEBE3",
  primary:     "#282011",
  secondary:   "#665D4A",
  muted:       "#8B7E64",
  inputBorder: "#DFD9CD",
  inputFocus:  "#A18C63",
  btnBg:       "#A18C63",
  btnHover:    "#725D32",
  btnDisabled: "#DFD9CD",
  dropHover:   "#F8FAFC",
  sapphire:        "#393225",
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

type CompositionItem = {
  public_id: string;
  name: string;
  sbn_procedure_id: string;
  sbn_procedure_name: string;
  access_route_type: "same" | "different";
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  created_at: string;
};

// ─── Novo cálculo ─────────────────────────────────────────────────────────────

export default function NovoCalculo() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"search" | "compositions">("search");

  // Search state
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [hits, setHits] = useState<ProcedureHit[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  // The procedure the user picked, kept on screen while the Procedure page loads
  // so the selection is confirmed and the transition isn't silent.
  const [navigating, setNavigating] = useState<ProcedureHit | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Compositions state
  const [compositions, setCompositions] = useState<CompositionItem[]>([]);
  const [compositionsLoaded, setCompositionsLoaded] = useState(false);

  // ── Fetch compositions (auth-aware) ───────────────────────────────────────

  const fetchCompositions = useCallback(async () => {
    if (!isSignedIn) {
      setCompositions([]);
      setCompositionsLoaded(true);
      return;
    }
    setCompositionsLoaded(false);
    try {
      const token = await getToken();
      const res = await fetch("/api/compositions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCompositions(res.ok ? await res.json() : []);
    } catch {
      setCompositions([]);
    } finally {
      setCompositionsLoaded(true);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) fetchCompositions();
  }, [isLoaded, fetchCompositions]);

  useEffect(() => {
    if (activeTab === "compositions" && isLoaded) fetchCompositions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Debounced search ───────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Don't re-open the dropdown once a selection is navigating away.
    if (navigating) return;
    if (query.trim().length < 2) {
      setHits([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/procedures/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: ProcedureHit[] = await res.json();
          setHits(data ?? []);
          setDropdownOpen((data ?? []).length > 0);
          setActiveIdx(-1);
        }
      } catch {
        // leave existing hits on network error
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, navigating]);

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
  // selectHit/handleSubmit set `navigating` to show a brief transition before
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
    // Confirm the choice in the input and keep the chosen row highlighted in the
    // dropdown for a brief, perceptible moment before routing, so the user can
    // clearly see which procedure was selected.
    setQuery(hit.name);
    setActiveIdx(hits.findIndex((h) => h.id === hit.id));
    setNavigating(hit);
    window.setTimeout(() => {
      router.push(`/procedure?sbn=${encodeURIComponent(hit.id)}`);
    }, 480);
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (activeIdx >= 0 && hits[activeIdx]) { selectHit(hits[activeIdx]); return; }
    if (hits.length > 0) { selectHit(hits[0]); return; }
    const q = query.trim();
    if (!q) { inputRef.current?.focus(); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    setDropdownOpen(false);
    try {
      const res = await fetch(`/api/procedures/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: ProcedureHit[] = await res.json();
        if (data?.length > 0) { selectHit(data[0]); return; }
      }
    } catch {}
    setSearching(false);
    setNavigating({ id: "", name: q });
    router.push(`/procedure?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || hits.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") { setDropdownOpen(false); }
  }

  function fillExample(ex: string) {
    setQuery(ex);
    inputRef.current?.focus();
  }

  const showDropdown = dropdownOpen && hits.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: [
          "radial-gradient(circle at top center, rgba(132, 108, 59,0.18) 0%, transparent 45%)",
          "radial-gradient(circle at 15% 88%, rgba(90, 72, 35,0.08) 0%, transparent 40%)",
          "linear-gradient(180deg, #F2EDE3 0%, #E9E3D8 100%)",
        ].join(", "),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 20px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "620px" }}>

        {/* ── Top bar: home link + auth ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky", top: 0, zIndex: 40,
            background: "rgba(249, 247, 243,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.45)",
            borderRadius: "24px",
            boxShadow: "0 12px 30px rgba(40, 32, 17,0.08)",
            padding: "10px 20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/"
              style={{
                display: "flex", alignItems: "center", gap: "9px",
                textDecoration: "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/synvera-symbol.svg" alt="" aria-hidden="true" width={20} height={19} style={{ display: "block", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: T.primary, letterSpacing: "-0.2px", lineHeight: 1 }}>
                  Synvera
                </span>
                <span style={{ fontSize: "9px", fontWeight: 500, color: "rgba(102, 93, 74,0.58)", letterSpacing: "0.2px", lineHeight: 1 }}>
                  Neurocirurgia · Coluna
                </span>
              </div>
            </Link>

            {/* Documentação — entry to the documentation module */}
            <Link
              href="/consulta-documental"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "8px",
                border: "1.5px solid rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                fontSize: "12.5px", fontWeight: 600, fontFamily: "inherit",
                color: T.primary, textDecoration: "none",
              }}
            >
              <BookOpen size={13} aria-hidden="true" />
              Documentação
            </Link>
          </div>

          {isLoaded && (
            isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button
                  type="button"
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 14px", borderRadius: "8px",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    fontSize: "12.5px", fontWeight: 600, fontFamily: "inherit",
                    color: T.primary, cursor: "pointer",
                  }}
                >
                  <LogIn size={13} aria-hidden="true" />
                  Entrar
                </button>
              </SignInButton>
            )
          )}
        </div>

        {/* ── Tab bar ── */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "28px",
            background: "rgba(255,255,255,0.55)",
            borderRadius: "12px",
            padding: "4px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(181, 171, 151,0.22)",
            boxShadow: "0 1px 4px rgba(40, 32, 17,0.07)",
          }}
        >
          <TabBtn active={activeTab === "search"} onClick={() => setActiveTab("search")}>
            <Search size={13} aria-hidden="true" />
            Pesquisar
          </TabBtn>
          <TabBtn active={activeTab === "compositions"} onClick={() => setActiveTab("compositions")}>
            <BookmarkCheck size={13} aria-hidden="true" />
            Minhas composições
            {isSignedIn && compositions.length > 0 && activeTab !== "compositions" && (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: "18px", height: "18px", padding: "0 5px",
                  borderRadius: "100px", fontSize: "10px", fontWeight: 700,
                  backgroundColor: "#A18C63", color: "#fff", lineHeight: 1,
                }}
              >
                {compositions.length > 9 ? "9+" : compositions.length}
              </span>
            )}
          </TabBtn>
        </div>

        {/* ── Card ── */}
        <div
          style={{
            background: "#F9F7F3",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderRadius: "16px",
            border: "1px solid rgba(132, 108, 59,0.10)",
            padding: "44px 40px 36px",
            boxShadow: "0 1px 2px rgba(40, 32, 17,0.04), 0 8px 24px rgba(40, 32, 17,0.08), 0 24px 70px rgba(40, 32, 17,0.14)",
          }}
        >

          {/* ── Brand ── */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/synvera-symbol.svg"
                alt=""
                aria-hidden="true"
                width={51}
                height={48}
                style={{ display: "block" }}
              />
            </div>
            <h1
              style={{
                margin: "0 0 7px", fontSize: "27px", fontWeight: 800,
                letterSpacing: "-0.5px", color: T.primary, lineHeight: 1.1,
              }}
            >
              Novo cálculo
            </h1>
            <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 500, color: T.secondary, letterSpacing: "0.1px" }}>
              Valoração de Procedimentos Médicos
            </p>
          </div>

          {/* ── Tab content ── */}
          {activeTab === "search" ? (
            <>
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
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setFocused(true); if (hits.length > 0) setDropdownOpen(true); }}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite o nome do procedimento..."
                    style={{
                      width: "100%", height: "48px", paddingLeft: "38px", paddingRight: navigating ? "40px" : "14px",
                      fontSize: "14.5px", fontFamily: "inherit", color: T.primary,
                      backgroundColor: T.surface,
                      border: `1.5px solid ${focused || navigating ? "#A18C63" : "#D4CBBA"}`,
                      borderRadius: showDropdown ? "10px 10px 0 0" : "10px",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 150ms ease, border-radius 80ms ease",
                      boxShadow: focused || navigating ? "0 0 0 4px rgba(132, 108, 59,0.14)" : "none",
                    }}
                  />

                  {navigating && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        color: "#A18C63", zIndex: 1,
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
                        borderTop: "1px solid #F4F2EF",
                        borderRadius: "0 0 10px 10px",
                        boxShadow: "0 8px 24px rgba(40, 32, 17,0.09)",
                        maxHeight: "240px", overflowY: "auto",
                        listStyle: "none", margin: 0, padding: "4px 0", zIndex: 50,
                      }}
                    >
                      {hits.map((hit, i) => {
                        const isChosen = navigating?.id === hit.id;
                        const isDimmed = !!navigating && !isChosen;
                        return (
                        <li
                          key={hit.id}
                          id={`hit-${i}`}
                          role="option"
                          aria-selected={isChosen || i === activeIdx}
                          onPointerDown={(e) => { e.preventDefault(); selectHit(hit); }}
                          onMouseEnter={() => { if (!navigating) setActiveIdx(i); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "9px 14px", cursor: navigating ? "default" : "pointer",
                            backgroundColor: isChosen ? "#A18C63" : i === activeIdx ? T.dropHover : "transparent",
                            opacity: isDimmed ? 0.45 : 1,
                            transition: "background-color 120ms ease, opacity 120ms ease",
                          }}
                        >
                          {isChosen ? (
                            <span
                              aria-hidden="true"
                              style={{
                                width: "13px", height: "13px", flexShrink: 0,
                                border: "2px solid rgba(255,255,255,0.45)", borderTopColor: "#FFFFFF",
                                borderRadius: "50%", display: "inline-block",
                                animation: "spin 0.7s linear infinite",
                              }}
                            />
                          ) : (
                            <Search size={12} aria-hidden="true" style={{ color: T.inputFocus, flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              fontSize: "13.5px", fontWeight: isChosen ? 600 : 500,
                              color: isChosen ? "#FFFFFF" : T.primary,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {hit.name}
                          </span>
                          {isChosen && (
                            <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
                              Abrindo…
                            </span>
                          )}
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {navigating ? (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
                      width: "100%", minHeight: "46px", padding: "0 16px",
                      backgroundColor: "rgba(132, 108, 59,0.08)",
                      border: "1px solid rgba(132, 108, 59,0.20)",
                      borderRadius: "10px",
                      fontSize: "13.5px", fontWeight: 600, color: T.inputFocus,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "14px", height: "14px", flexShrink: 0,
                        border: "2px solid rgba(132, 108, 59,0.30)", borderTopColor: "#A18C63",
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
                  <PesquisarButton disabled={query.trim().length < 2} loading={searching} />
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
            </>
          ) : (
            /* ── Compositions tab ── */
            !isLoaded ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: "20px", height: "20px", margin: "0 auto",
                    border: "2px solid #DFD9CD", borderTopColor: T.primary,
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }}
                />
              </div>
            ) : !isSignedIn ? (
              <SignInGate />
            ) : (
              <CompositionList
                compositions={compositions}
                loaded={compositionsLoaded}
                getToken={getToken}
                onDelete={(publicID) =>
                  setCompositions((prev) => prev.filter((c) => c.public_id !== publicID))
                }
              />
            )
          )}

        </div>
      </div>
    </main>
  );
}

// ─── Sign-in gate ─────────────────────────────────────────────────────────────

function SignInGate() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div
        style={{
          width: "48px", height: "48px", margin: "0 auto 18px",
          borderRadius: "50%", backgroundColor: "#F8F6F2",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <LogIn size={22} aria-hidden="true" style={{ color: T.muted }} />
      </div>
      <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: T.primary }}>
        Entre para ver suas composições
      </p>
      <p style={{ margin: "0 0 22px", fontSize: "12.5px", lineHeight: 1.6, color: T.muted }}>
        Suas composições são salvas na sua conta e ficam disponíveis em qualquer dispositivo.
      </p>
      <SignInButton mode="modal">
        <button
          type="button"
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "10px 24px", borderRadius: "10px", border: "none",
            backgroundColor: T.btnBg, color: "#FFFFFF",
            fontSize: "13.5px", fontWeight: 600, fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <LogIn size={14} aria-hidden="true" />
          Entrar
        </button>
      </SignInButton>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: "6px", padding: "8px 14px", borderRadius: "9px", border: "none",
        fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
        transition: "background-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
        backgroundColor: active ? "#FFFFFF" : "transparent",
        color: active ? T.primary : "#8B7E64",
        boxShadow: active ? "0 8px 24px rgba(40, 32, 17,0.08), 0 1px 3px rgba(40, 32, 17,0.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ─── Composition list ─────────────────────────────────────────────────────────

function CompositionList({
  compositions,
  loaded,
  getToken,
  onDelete,
}: {
  compositions: CompositionItem[];
  loaded: boolean;
  getToken: () => Promise<string | null>;
  onDelete: (publicID: string) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<CompositionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/compositions/${pendingDelete.public_id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok || res.status === 404) {
        onDelete(pendingDelete.public_id);
        setPendingDelete(null);
      }
    } catch {
      // leave item on network error
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div
          style={{
            width: "20px", height: "20px", margin: "0 auto 12px",
            border: "2px solid #DFD9CD", borderTopColor: T.primary,
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  if (compositions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <BookmarkCheck
          size={36}
          aria-hidden="true"
          style={{ color: T.inputBorder, margin: "0 auto 14px", display: "block" }}
        />
        <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: T.secondary }}>
          Nenhuma composição salva ainda
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: T.muted }}>
          Monte uma composição e clique em{" "}
          <span style={{ fontWeight: 600, color: T.primary }}>&ldquo;Salvar composição&rdquo;</span>{" "}
          para guardá-la aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <p style={{ margin: "0 0 14px", fontSize: "11.5px", fontWeight: 600, color: T.muted, letterSpacing: "0.2px" }}>
          {compositions.length} composição{compositions.length !== 1 ? "ões" : ""} salva{compositions.length !== 1 ? "s" : ""}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {compositions.map((comp) => (
            <CompositionRow
              key={comp.public_id}
              comp={comp}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDeleteDialog
          composition={pendingDelete}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => { if (!deleting) setPendingDelete(null); }}
        />
      )}
    </>
  );
}

function CompositionRow({
  comp,
  onRequestDelete,
}: {
  comp: CompositionItem;
  onRequestDelete: (comp: CompositionItem) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [trashHovered, setTrashHovered] = useState(false);

  const date = new Date(comp.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const href = `/procedure?composition=${encodeURIComponent(comp.public_id)}`;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", textDecoration: "none",
        borderRadius: "10px",
        border: `1.5px solid ${hovered ? T.inputFocus : T.cardBorder}`,
        padding: "12px 14px",
        backgroundColor: hovered ? T.dropHover : T.surface,
        transition: "border-color 130ms ease, background-color 110ms ease",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: "0 0 2px", fontSize: "13.5px", fontWeight: 700,
              color: T.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {comp.name}
          </p>
          <p
            style={{
              margin: "0 0 5px", fontSize: "11.5px", color: T.secondary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {comp.sbn_procedure_name}
          </p>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: T.muted }}>{date}</span>
            {comp.auxiliaries_count > 0 && (
              <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#393225", background: "rgba(132, 108, 59,0.12)", borderRadius: "4px", padding: "1px 6px" }}>
                {comp.auxiliaries_count} aux.
              </span>
            )}
            {comp.requires_anesthesia && (
              <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#C2963F", background: "#F9F5EE", borderRadius: "4px", padding: "1px 6px" }}>
                Anest.
              </span>
            )}
            <span style={{ fontSize: "10.5px", color: T.muted }}>
              {comp.access_route_type === "same" ? "Mesma via" : "Vias diferentes"}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Remover composição"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequestDelete(comp); }}
          onMouseEnter={() => setTrashHovered(true)}
          onMouseLeave={() => setTrashHovered(false)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "30px", height: "30px",
            border: `1px solid ${trashHovered ? "#FECACA" : T.cardBorder}`,
            borderRadius: "7px",
            backgroundColor: trashHovered ? "#FFF1F1" : "transparent",
            color: trashHovered ? "#DC2626" : T.muted,
            cursor: "pointer",
            transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
            flexShrink: 0, marginTop: "2px",
          }}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </Link>
  );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  composition,
  deleting,
  onConfirm,
  onCancel,
}: {
  composition: CompositionItem;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const [cancelHovered, setCancelHovered] = useState(false);
  const [confirmHovered, setConfirmHovered] = useState(false);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(40, 32, 17,0.42)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 120ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "380px",
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          border: "1px solid rgba(239, 235, 227,0.9)",
          padding: "28px 28px 24px",
          boxShadow:
            "0 4px 6px rgba(40, 32, 17,0.06), 0 12px 32px rgba(40, 32, 17,0.14), 0 32px 56px -8px rgba(40, 32, 17,0.10)",
          animation: "slideUp 160ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{
          width: "46px", height: "46px", borderRadius: "50%",
          backgroundColor: "#FEF2F2", border: "1.5px solid #FECACA",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "18px",
        }}>
          <Trash2 size={20} aria-hidden="true" style={{ color: "#DC2626" }} />
        </div>

        <h2 id="confirm-delete-title" style={{
          margin: "0 0 8px", fontSize: "16px", fontWeight: 700,
          color: T.primary, letterSpacing: "-0.2px", lineHeight: 1.2,
        }}>
          Remover composição?
        </h2>

        <p style={{
          margin: "0 0 26px", fontSize: "13.5px", lineHeight: 1.6,
          color: T.secondary,
        }}>
          A composição{" "}
          <span style={{ fontWeight: 700, color: T.primary }}>
            &ldquo;{composition.name}&rdquo;
          </span>{" "}
          será removida permanentemente. Esta ação não pode ser desfeita.
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => setCancelHovered(false)}
            style={{
              flex: 1, height: "40px", borderRadius: "10px",
              border: `1.5px solid ${cancelHovered ? "#DFD9CD" : "#EFEBE3"}`,
              backgroundColor: cancelHovered ? "#F8FAFC" : "transparent",
              color: T.secondary, fontSize: "13.5px", fontWeight: 600,
              fontFamily: "inherit", cursor: deleting ? "default" : "pointer",
              transition: "background-color 120ms ease, border-color 120ms ease",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => setConfirmHovered(false)}
            style={{
              flex: 1, height: "40px", borderRadius: "10px",
              border: "none",
              backgroundColor: deleting ? "#FCA5A5" : confirmHovered ? "#B91C1C" : "#DC2626",
              color: "#FFFFFF", fontSize: "13.5px", fontWeight: 600,
              fontFamily: "inherit", cursor: deleting ? "default" : "pointer",
              transition: "background-color 120ms ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            {deleting
              ? <><span style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Removendo...</>
              : "Remover"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Search sub-components ────────────────────────────────────────────────────

function PesquisarButton({ disabled, loading }: { disabled: boolean; loading: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;

  const bgColor = inactive
    ? "transparent"
    : pressed
    ? "#393225"
    : hovered
    ? "#725D32"
    : "#A18C63";

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
        width: "100%", height: inactive ? "44px" : "46px",
        backgroundColor: bgColor,
        color: inactive ? "#8A6A34" : "#FFFFFF",
        border: inactive ? "1.5px solid rgba(138, 106, 52, 0.55)" : "none",
        borderRadius: "10px",
        fontSize: "14px", fontWeight: 600, letterSpacing: "0.1px",
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
            border: "2px solid rgba(138, 106, 52, 0.30)", borderTopColor: "#8A6A34",
            borderRadius: "50%", display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      {loading ? "Pesquisando..." : "Pesquisar"}
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
        backgroundColor: hovered ? "rgba(132, 108, 59,0.06)" : "#FFFFFF",
        border: `1px solid ${hovered ? "#A18C63" : "#DFD9CD"}`,
        borderRadius: "100px", fontSize: "12px", fontWeight: 500,
        fontFamily: "inherit", color: hovered ? "#393225" : "#665D4A",
        cursor: "pointer",
        transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
      }}
    >
      {label}
    </button>
  );
}
