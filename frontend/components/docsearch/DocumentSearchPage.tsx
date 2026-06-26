"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  BookOpen,
  Moon,
  Sun,
  LogIn,
} from "lucide-react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/components/ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  document: string;
  version: string;
  page: number;
  section: string;
  excerpt: string;
  score: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const EXAMPLE_QUERIES = [
  "Como funciona urgência?",
  "Qual a regra para auxiliares?",
  "Como a CBHPM define via de acesso?",
  "Como funciona múltiplos procedimentos?",
  "Artrodese cervical em múltiplos níveis",
  "Porte cirúrgico pediátrico",
];

const DOC_FILTERS = [
  { id: "all",    label: "Todos",        docType: "" },
  { id: "cbhpm",  label: "CBHPM",        docType: "cbhpm" },
  { id: "sbn",    label: "Manual SBN",   docType: "sbn_manual" },
  { id: "coluna", label: "Manual Coluna", docType: "spine_manual" },
] as const;

type FilterId = (typeof DOC_FILTERS)[number]["id"];

const PAGE_SIZE = 15;

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const docLabel = result.version ? `${result.document} ${result.version}` : result.document;

  return (
    <article
      className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 p-5 transition-shadow hover:shadow-md dark:hover:shadow-slate-900/60"
      style={{ animationDelay: `${index * 60}ms`, animation: "slideUp 0.28s ease both" }}
    >
      {/* Source row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 dark:bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary dark:text-blue-300 leading-none">
          <FileText size={10} aria-hidden="true" />
          {docLabel}
        </span>
        <span className="text-[11.5px] text-slate-400 dark:text-slate-500">
          p.&nbsp;{result.page}
        </span>
        {result.section && (
          <span className="max-w-[280px] truncate rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10.5px] text-slate-500 dark:text-slate-400 leading-none">
            {result.section}
          </span>
        )}
      </div>

      {/* Section title */}
      {result.section && (
        <p className="mb-2 text-[13.5px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
          {result.section}
        </p>
      )}

      {/* Divider */}
      <div className="mb-3 h-px bg-slate-100 dark:bg-slate-700/60" />

      {/* Excerpt with «» highlight */}
      <p
        className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightExcerpt(result.excerpt) }}
      />
    </article>
  );
}

function highlightExcerpt(excerpt: string): string {
  return excerpt
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /«/g,
      '<mark class="bg-primary/12 text-primary dark:bg-primary/25 dark:text-blue-300 rounded px-0.5 not-italic font-semibold">'
    )
    .replace(/»/g, "</mark>");
}

// ─── Empty / idle states ──────────────────────────────────────────────────────

function EmptyState({
  query,
  isFiltered,
  filterLabel,
  onBroaden,
}: {
  query: string;
  isFiltered: boolean;
  filterLabel: string;
  onBroaden: () => void;
}) {
  if (!query) return null;
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-6 py-10 text-center">
      <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
        {isFiltered ? (
          <>
            Nenhuma referência em{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{filterLabel}</span>{" "}
            para esta consulta. O termo pode estar em outro manual.
          </>
        ) : (
          "Nenhuma referência encontrada para esta consulta."
        )}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onBroaden}
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-primary/25 dark:border-primary/30 bg-primary/8 dark:bg-primary/15 px-3 py-1.5 text-[12px] font-semibold text-primary dark:text-blue-300 hover:bg-primary/15 dark:hover:bg-primary/25 transition-colors"
        >
          Buscar em todos os manuais
        </button>
      )}
    </div>
  );
}

// ─── Page nav ─────────────────────────────────────────────────────────────────

function PageNav() {
  const { isDark, toggle } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="relative z-10 px-5 pt-5">
      <nav className="nav-bar mx-auto flex max-w-[960px] items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/procedure" className="flex items-center gap-2.5 no-underline">
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

          {/* Documentação — active state: you are here */}
          <Link
            href="/consulta-documental"
            aria-current="page"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-500/80 bg-white dark:bg-slate-800/90 px-3 py-1.5 text-[11.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-primary/10 dark:ring-primary/20 transition-colors no-underline"
          >
            <BookOpen size={12} aria-hidden="true" />
            Documentação
          </Link>
        </div>

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
            aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            className="theme-switch relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            role="switch"
            type="button"
          >
            <Sun aria-hidden="true" size={13} className="absolute left-2 text-amber-500 transition-opacity dark:opacity-35" />
            <Moon aria-hidden="true" size={13} className="absolute right-2 text-slate-500 opacity-45 transition-opacity dark:text-[#94A3B8] dark:opacity-100" />
            <span
              aria-hidden="true"
              className={`theme-switch-thumb absolute top-1 h-6 w-6 rounded-full transition-transform duration-200 ${isDark ? "translate-x-7" : "translate-x-1"}`}
            />
          </button>
        </div>
      </nav>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

export function DocumentSearchPageContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery]               = useState(initialQ);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults]           = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [hasMore, setHasMore]           = useState(false);
  const [offset, setOffset]             = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (
    q: string,
    opts?: { docType?: string; offset?: number; append?: boolean }
  ) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) return;

    const currentOffset = opts?.offset ?? 0;
    const append = opts?.append ?? false;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
      setSubmittedQuery(trimmed);
      setOffset(0);
    }

    try {
      const body: Record<string, unknown> = { query: trimmed, limit: PAGE_SIZE, offset: currentOffset };
      if (opts?.docType) body.document_type = opts.docType;

      const res = await fetch(`${BACKEND_URL}/api/document-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Erro ao consultar documentos. Tente novamente.");
        if (!append) setResults(null);
        return;
      }
      const data = await res.json();
      const fresh: SearchResult[] = data.results ?? [];
      if (append) {
        setResults((prev) => [...(prev ?? []), ...fresh]);
        setOffset(currentOffset + fresh.length);
      } else {
        setResults(fresh);
        setOffset(fresh.length);
      }
      setHasMore(fresh.length === PAGE_SIZE);
    } catch {
      setError("Não foi possível conectar ao servidor.");
      if (!append) setResults(null);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Auto-search on initial ?q= param
  useEffect(() => {
    if (initialQ.trim().length >= 3) {
      runSearch(initialQ);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filter = DOC_FILTERS.find((f) => f.id === activeFilter);
    runSearch(query, { docType: filter?.docType });
  };

  const handleExample = (example: string) => {
    setQuery(example);
    const filter = DOC_FILTERS.find((f) => f.id === activeFilter);
    runSearch(example, { docType: filter?.docType });
    inputRef.current?.focus();
  };

  const handleFilterChange = (filterId: FilterId) => {
    setActiveFilter(filterId);
    if (submittedQuery) {
      const filter = DOC_FILTERS.find((f) => f.id === filterId);
      runSearch(submittedQuery, { docType: filter?.docType });
    }
  };

  const handleLoadMore = () => {
    const filter = DOC_FILTERS.find((f) => f.id === activeFilter);
    runSearch(submittedQuery, { docType: filter?.docType, offset, append: true });
  };

  const hasResults  = results !== null && results.length > 0;
  const hasSearched = submittedQuery.length > 0;

  return (
    <main
      className="hex-bg relative min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <PageNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-[1] mx-auto max-w-[960px] px-5 pb-8 pt-12 text-center">
        {/* Source badge */}
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 dark:border-primary/30 bg-primary/8 dark:bg-primary/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary dark:text-blue-300 leading-none">
            <FileText size={11} aria-hidden="true" />
            CBHPM · Manual SBN · Manual Coluna
          </span>
        </div>

        {/* Title */}
        <h1 className="m-0 mb-3 text-[34px] font-extrabold tracking-tight text-slate-950 dark:text-slate-50 leading-tight sm:text-[40px]">
          Consulte a documentação oficial
        </h1>
        <p className="mx-auto m-0 mb-8 max-w-xl text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Pesquise regras, diretrizes e fundamentos diretamente na CBHPM&nbsp;2025-2026,
          Manual SBN Neurocirurgia&nbsp;2018 e Manual de Cirurgia de Coluna&nbsp;3ª&nbsp;ed.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="relative mx-auto max-w-2xl"
          role="search"
        >
          <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 shadow-sm dark:shadow-none focus-within:border-primary/50 dark:focus-within:border-primary/40 transition-colors">
            <Search
              size={18}
              className="absolute left-5 text-slate-400 dark:text-slate-500 pointer-events-none flex-shrink-0"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: como funciona urgência? regra para auxiliares…"
              aria-label="Consulta documental"
              minLength={3}
              maxLength={300}
              className="w-full rounded-2xl bg-transparent py-4 pl-13 pr-32 text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
              style={{ paddingLeft: "3.25rem" }}
            />
            <button
              type="submit"
              disabled={query.trim().length < 3 || isLoading}
              className={cn(
                "absolute right-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors",
                "bg-primary text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hover:enabled:bg-primary/90"
              )}
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </form>

        {/* Example queries */}
        {!hasSearched && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleExample(ex)}
                className="cursor-pointer rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/60 px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Results area ─────────────────────────────────────────────────── */}
      {(hasSearched || isLoading) && (
        <section
          className="relative z-[1] mx-auto max-w-[960px] px-5 pb-16"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {/* Filter pills + count bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {/* Result count */}
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isLoading
                ? "Buscando…"
                : hasResults
                ? `${results!.length} referência${results!.length !== 1 ? "s" : ""} encontrada${results!.length !== 1 ? "s" : ""}`
                : "Nenhuma referência"}
            </p>

            {/* Document filters */}
            <div className="flex items-center gap-1">
              {DOC_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilterChange(f.id)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors",
                    activeFilter === f.id
                      ? "border-primary/30 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-primary/30 hover:text-primary dark:hover:text-primary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="mb-4 text-[13px] text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40"
                />
              ))}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && hasResults && (
            <div className="space-y-3">
              {results!.map((r, i) => (
                <ResultCard key={`${r.document}-${r.page}-${i}`} result={r} index={i} />
              ))}
            </div>
          )}

          {/* Load more */}
          {!isLoading && hasResults && hasMore && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={cn(
                  "rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-[13px] font-semibold transition-colors",
                  "bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300",
                  "hover:enabled:border-primary/40 hover:enabled:text-primary dark:hover:enabled:text-primary",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Carregando…
                  </span>
                ) : (
                  "Carregar mais"
                )}
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && results !== null && results.length === 0 && (
            <EmptyState
              query={submittedQuery}
              isFiltered={activeFilter !== "all"}
              filterLabel={DOC_FILTERS.find((f) => f.id === activeFilter)?.label ?? ""}
              onBroaden={() => handleFilterChange("all")}
            />
          )}
        </section>
      )}

      <footer className="relative z-[1] px-5 pb-6 text-center">
        <div className="footer-divider mb-3.5 h-px" />
        <p className="m-0 text-xs font-medium text-slate-400 dark:text-slate-500">
          2026 &nbsp;·&nbsp; <span className="font-bold text-slate-500">LabF5</span> &nbsp;·&nbsp; Todos os direitos reservados
        </p>
      </footer>
    </main>
  );
}
