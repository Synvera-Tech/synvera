"use client";

import { useState, useRef, useCallback } from "react";
import { BookOpen, Search, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
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

const DOCUMENT_CHIPS = [
  { label: "Urgência / Emergência", query: "urgência emergência adicional" },
  { label: "Pediatria", query: "pediatria peso criança adicional" },
  { label: "Múltiplos procedimentos", query: "múltiplos procedimentos sessão cirúrgica" },
  { label: "Auxiliares", query: "auxiliares porte cirúrgico" },
  { label: "Via de acesso", query: "via de acesso cirúrgico" },
  { label: "Artrodese cervical", query: "artrodese cervical ACDF segmentos" },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function DocumentSearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        body: JSON.stringify({ query: trimmed, limit: 10 }),
      });
      if (!res.ok) {
        setError("Erro ao consultar documentos. Tente novamente.");
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

  const handleToggle = () => {
    setIsOpen((v) => !v);
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Consulta Documental
          </span>
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none">
            CBHPM · SBN · Coluna
          </span>
        </div>
        {isOpen
          ? <ChevronUp size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          : <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        }
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Description */}
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 leading-relaxed -mt-1">
            Pesquise regras clínicas, ajustes e composições diretamente na CBHPM 2025-2026, Manual SBN Neurocirurgia 2018 e Manual Cirurgia de Coluna 3ª ed.
          </p>

          {/* Quick-access chips */}
          <div className="flex flex-wrap gap-1.5">
            {DOCUMENT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChip(chip.query)}
                className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
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
                placeholder="Ex: urgência noturna, pediatria porte, artrodese C4-C5"
                className={cn(
                  "w-full rounded-xl border py-2 pl-8 pr-8 text-[13px] outline-none transition-colors",
                  "border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-900/60",
                  "text-slate-800 dark:text-slate-200",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                  "focus:border-primary/50 dark:focus:border-primary/40",
                )}
                aria-label="Consulta documental"
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
                "hover:enabled:bg-primary/90",
              )}
            >
              {isLoading ? "…" : "Buscar"}
            </button>
          </form>

          {/* Error state */}
          {error && (
            <p className="text-[12px] text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Empty state */}
          {!isLoading && !error && results !== null && results.length === 0 && (
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-5 text-center">
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                Nenhum resultado encontrado para esta consulta.
              </p>
              <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">
                Tente termos mais gerais como &ldquo;urgência&rdquo;, &ldquo;auxiliar&rdquo; ou &ldquo;via de acesso&rdquo;.
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && results !== null && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((r, i) => (
                <ResultCard key={i} result={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const docLabel = `${result.document} ${result.version}`;
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3 space-y-1.5">
      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <FileText size={11} className="text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{docLabel}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">p.&nbsp;{result.page}</span>
        {result.section && (
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-none max-w-[200px] truncate">
            {result.section}
          </span>
        )}
      </div>

      {/* Excerpt — ts_headline wraps matches with «…» delimiters */}
      <p
        className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightExcerpt(result.excerpt) }}
      />
    </div>
  );
}

// ts_headline uses «…» delimiters (configured in the SQL query).
// Wrap them in a <mark> for visual emphasis without using arbitrary HTML from the server.
function highlightExcerpt(excerpt: string): string {
  return excerpt
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/«/g, '<mark class="bg-primary/15 text-primary dark:bg-primary/20 dark:text-blue-300 rounded px-0.5 not-italic">')
    .replace(/»/g, "</mark>");
}
