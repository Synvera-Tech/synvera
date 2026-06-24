"use client";

import { useState, useRef, useCallback } from "react";
import {
  BookOpen,
  Search,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/components/ui/utils";

interface SearchResult {
  document: string;
  version: string;
  page: number;
  section: string;
  excerpt: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
}

interface DocumentSearchPanelProps {
  /** Optional context from the current calculation (e.g. procedure name).
   *  Used to pre-fill the "Abrir central documental" link with ?q=. */
  contextQuery?: string;
}

const CONTEXT_CHIPS = [
  { label: "Urgência",           query: "urgência emergência" },
  { label: "Auxiliares",         query: "auxiliares porte cirúrgico" },
  { label: "Via de acesso",      query: "via de acesso cirúrgico" },
  { label: "Pediátrico",         query: "pediatria peso criança" },
  { label: "Múltiplos proc.",    query: "múltiplos procedimentos" },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function DocumentSearchPanel({ contextQuery }: DocumentSearchPanelProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/document-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 5 }),
      });
      if (!res.ok) {
        setError("Erro ao consultar. Tente novamente.");
        setResults(null);
        return;
      }
      const data: SearchResponse = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleChip = (chipQuery: string) => {
    setQuery(chipQuery);
    runSearch(chipQuery);
    if (!isOpen) setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setError(null);
    inputRef.current?.focus();
  };

  // Build the "open full page" URL — carry context or current query
  const fullPageHref = (() => {
    const q = query.trim() || contextQuery?.trim();
    return q ? `/consulta-documental?q=${encodeURIComponent(q)}` : "/consulta-documental";
  })();

  return (
    <div className="mx-auto max-w-[1080px] mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={isOpen}
        >
          <BookOpen size={14} className="text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-[12.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Consulta Documental
          </span>
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none">
            CBHPM · SBN
          </span>
          {isOpen
            ? <ChevronUp size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1" />
            : <ChevronDown size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1" />
          }
        </button>

        {/* CTA link — always visible */}
        <Link
          href={fullPageHref}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-primary/25 dark:border-primary/30 bg-primary/8 dark:bg-primary/15 px-2.5 py-1.5 text-[11.5px] font-semibold text-primary dark:text-blue-300 hover:bg-primary/15 dark:hover:bg-primary/25 transition-colors no-underline"
        >
          Central documental
          <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>

      {/* ── Expanded panel ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-3 space-y-3">
          {/* Context chips */}
          <div className="flex flex-wrap gap-1.5">
            {CONTEXT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChip(chip.query)}
                className="cursor-pointer rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Consulta rápida…"
                className={cn(
                  "w-full rounded-xl border py-2 pl-8 pr-8 text-[13px] outline-none transition-colors",
                  "border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-900/60",
                  "text-slate-800 dark:text-slate-200",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                  "focus:border-primary/50 dark:focus:border-primary/40"
                )}
                aria-label="Consulta rápida documental"
                minLength={3}
                maxLength={200}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label="Limpar consulta"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 3 || isLoading}
              className={cn(
                "flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors",
                "bg-primary text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hover:enabled:bg-primary/90"
              )}
            >
              {isLoading ? "…" : "Buscar"}
            </button>
          </form>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Empty state */}
          {!isLoading && !error && results !== null && results.length === 0 && (
            <p className="text-center text-[12.5px] text-slate-500 dark:text-slate-400 py-3">
              Nenhuma referência encontrada para esta consulta.
            </p>
          )}

          {/* Inline results (max 5, compact) */}
          {!isLoading && results !== null && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {results.length} referência{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((r, i) => (
                <CompactResultCard key={i} result={r} />
              ))}
              {/* Always offer to see full page */}
              <Link
                href={fullPageHref}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary transition-colors no-underline"
              >
                Ver na central documental
                <ExternalLink size={11} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompactResultCard({ result }: { result: SearchResult }) {
  const docLabel = result.version
    ? `${result.document} ${result.version}`
    : result.document;

  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <FileText size={10} className="text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{docLabel}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">p.&nbsp;{result.page}</span>
        {result.section && (
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-none max-w-[200px] truncate">
            {result.section}
          </span>
        )}
      </div>
      <p
        className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightExcerpt(result.excerpt) }}
      />
    </div>
  );
}

function highlightExcerpt(excerpt: string): string {
  return excerpt
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /«/g,
      '<mark class="bg-primary/15 text-primary dark:bg-primary/20 dark:text-blue-300 rounded px-0.5 not-italic">'
    )
    .replace(/»/g, "</mark>");
}
