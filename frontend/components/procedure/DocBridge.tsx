import Link from "next/link";
import { BookOpen } from "lucide-react";

interface DocBridgeProps {
  contextQuery?: string;
}

export function DocBridge({ contextQuery }: DocBridgeProps) {
  const q = contextQuery?.trim();
  const href = q
    ? `/consulta-documental?q=${encodeURIComponent(q)}`
    : "/consulta-documental";

  const ctaLabel = q
    ? q.length > 26 ? q.slice(0, 24) + "…" : q
    : "Abrir documentação";

  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/15">
          <BookOpen size={14} className="text-primary dark:text-blue-300" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold leading-none text-slate-700 dark:text-slate-200 mb-0.5">
            Dúvida sobre uma regra?
          </p>
          <p className="text-[10.5px] leading-none text-slate-400 dark:text-slate-500">
            CBHPM &middot; Manual SBN &middot; Manual de Coluna
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-primary/25 dark:border-primary/30 bg-primary/8 dark:bg-primary/15 px-3 py-1.5 text-[11.5px] font-semibold text-primary no-underline transition-colors hover:bg-primary/15 dark:text-blue-300 dark:hover:bg-primary/25"
        title={q ? `Pesquisar "${q}" na documentação oficial` : undefined}
        aria-label={q ? `Consultar documentação para ${q}` : "Abrir documentação oficial"}
      >
        <span className="max-w-[140px] truncate">{ctaLabel}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
