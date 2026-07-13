"use client";

import { SignInButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BookmarkCheck,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InternalNavigation } from "@/components/navigation/InternalNavigation";
import { useCompositions } from "@/hooks/useCompositions";
import { compositionHref, type CompositionItem } from "@/lib/compositions";
import { useTheme } from "@/components/theme-provider";

type SortOption = "recent" | "oldest" | "name";

export default function CompositionsPage() {
  const { setPageTheme } = useTheme();
  const {
    authLoaded,
    isSignedIn,
    compositions,
    loading,
    error,
    refresh,
    deleteComposition,
  } = useCompositions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [pendingDelete, setPendingDelete] = useState<CompositionItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPageTheme("light");
    return () => setPageTheme(null);
  }, [setPageTheme]);

  const visibleCompositions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const filtered = normalizedQuery
      ? compositions.filter((composition) =>
          `${composition.name} ${composition.sbn_procedure_name}`
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedQuery),
        )
      : [...compositions];

    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      const difference = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "oldest" ? difference : -difference;
    });
  }, [compositions, query, sort]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteComposition(pendingDelete.public_id);
      setPendingDelete(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Não foi possível remover a composição.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="internal-page min-h-screen pb-24 lg:pb-10" style={{ background: "linear-gradient(180deg, #F2EDE3 0%, #E9E3D8 100%)" }}>
      <InternalNavigation active="compositions" returnTo="/composicoes" themeLocked />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-[#8B7E64]">
              <BookmarkCheck size={22} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">Biblioteca pessoal</span>
            </div>
            <h1 className="m-0 text-3xl font-extrabold text-[#282011] sm:text-4xl">Minhas composições</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#665D4A]">
              Localize, abra e atualize modelos salvos sem manter valores financeiros desatualizados.
            </p>
          </div>
          <Link
            href="/novo-calculo"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A18C63] px-5 text-sm font-bold text-white no-underline shadow-[0_10px_24px_rgba(90,72,35,0.18)] transition-colors hover:bg-[#725D32]"
          >
            <Plus size={17} aria-hidden="true" />
            Novo cálculo
          </Link>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[rgba(132,108,59,0.12)] bg-[#F9F7F3] shadow-[0_1px_2px_rgba(40,32,17,0.04),0_8px_24px_rgba(40,32,17,0.08),0_24px_70px_rgba(40,32,17,0.12)]">
          {authLoaded && isSignedIn && (
            <div className="border-b border-[#E8E1D5] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Buscar composições</span>
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7E64]" size={17} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nome ou procedimento..."
                    className="h-11 w-full rounded-xl border border-[#D4CBBA] bg-white pl-10 pr-4 text-sm text-[#282011] outline-none transition-shadow placeholder:text-[#A59B88] focus:border-[#A18C63] focus:ring-4 focus:ring-[rgba(132,108,59,0.12)]"
                  />
                </label>
                <label>
                  <span className="sr-only">Ordenar composições</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="h-11 w-full rounded-xl border border-[#D4CBBA] bg-white px-3 text-sm font-semibold text-[#665D4A] outline-none focus:border-[#A18C63] sm:w-44"
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigas</option>
                    <option value="name">Nome (A–Z)</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6">
            {!authLoaded || loading ? (
              <LoadingState />
            ) : !isSignedIn ? (
              <SignInState />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void refresh()} />
            ) : compositions.length === 0 ? (
              <EmptyState />
            ) : visibleCompositions.length === 0 ? (
              <NoResults query={query} onClear={() => setQuery("")} />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 px-1">
                  <p className="m-0 text-xs font-semibold text-[#8B7E64]">
                    {visibleCompositions.length} de {compositions.length} composição{compositions.length === 1 ? "" : "ões"}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleCompositions.map((composition) => (
                    <CompositionCard
                      key={composition.public_id}
                      composition={composition}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {pendingDelete && (
        <DeleteDialog
          composition={pendingDelete}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setPendingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </main>
  );
}

function CompositionCard({
  composition,
  onDelete,
}: {
  composition: CompositionItem;
  onDelete: (composition: CompositionItem) => void;
}) {
  const date = new Date(composition.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group flex min-w-0 flex-col rounded-xl border border-[#E4DDD1] bg-white p-4 transition-all hover:border-[#B9A77F] hover:shadow-[0_8px_22px_rgba(40,32,17,0.08)]">
      <Link href={compositionHref(composition.public_id)} className="min-w-0 flex-1 text-inherit no-underline">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[15px] font-bold text-[#282011]">{composition.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#665D4A]">{composition.sbn_procedure_name}</p>
          </div>
          <ArrowRight className="mt-0.5 shrink-0 text-[#A18C63] transition-transform group-hover:translate-x-0.5" size={17} aria-hidden="true" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Tag>{composition.access_route_type === "same" ? "Mesma via" : "Vias diferentes"}</Tag>
          {composition.auxiliaries_count > 0 && <Tag>{composition.auxiliaries_count} aux.</Tag>}
          {composition.requires_anesthesia && <Tag>Anestesia</Tag>}
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-[#EFEAE1] pt-3">
        <span className="text-[11px] font-medium text-[#8B7E64]">Salva em {date}</span>
        <div className="flex items-center gap-2">
          <Link
            href={compositionHref(composition.public_id)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#725D32] no-underline hover:bg-[#F3EFE7]"
          >
            Abrir e editar
          </Link>
          <button
            type="button"
            onClick={() => onDelete(composition)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E1D5] bg-white text-[#8B7E64] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label={`Remover ${composition.name}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-[#F3EFE7] px-2 py-1 text-[10.5px] font-semibold text-[#665D4A]">{children}</span>;
}

function LoadingState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-[#8B7E64]" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DFD9CD] border-t-[#725D32]" aria-hidden="true" />
      Carregando composições...
    </div>
  );
}

function SignInState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F1ECE2] text-[#8B7E64]">
        <LogIn size={21} aria-hidden="true" />
      </span>
      <h2 className="m-0 text-lg font-bold text-[#282011]">Entre para gerenciar suas composições</h2>
      <p className="mb-5 mt-2 max-w-md text-sm leading-6 text-[#8B7E64]">
        Seus modelos ficam vinculados à sua conta e disponíveis em qualquer dispositivo.
      </p>
      <SignInButton mode="modal">
        <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#A18C63] px-5 text-sm font-bold text-white hover:bg-[#725D32]" type="button">
          <LogIn size={15} aria-hidden="true" /> Entrar
        </button>
      </SignInButton>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
      <p className="m-0 text-sm font-semibold text-[#665D4A]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D4CBBA] px-4 py-2 text-sm font-bold text-[#725D32] hover:bg-white">
        <RefreshCw size={14} aria-hidden="true" /> Tentar novamente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
      <BookmarkCheck className="mb-4 text-[#C9C0AF]" size={38} aria-hidden="true" />
      <h2 className="m-0 text-lg font-bold text-[#282011]">Nenhuma composição salva</h2>
      <p className="mb-5 mt-2 max-w-md text-sm leading-6 text-[#8B7E64]">
        Crie um cálculo e use “Salvar composição” para reutilizar essa configuração depois.
      </p>
      <Link href="/novo-calculo" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CFC5B2] bg-white px-5 text-sm font-bold text-[#725D32] no-underline hover:bg-[#F8F5EF]">
        <Plus size={15} aria-hidden="true" /> Criar primeira composição
      </Link>
    </div>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
      <Search className="mb-3 text-[#C9C0AF]" size={30} aria-hidden="true" />
      <p className="m-0 text-sm font-semibold text-[#665D4A]">Nenhuma composição encontrada para “{query.trim()}”.</p>
      <button type="button" onClick={onClear} className="mt-3 text-sm font-bold text-[#725D32] hover:underline">Limpar busca</button>
    </div>
  );
}

function DeleteDialog({
  composition,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  composition: CompositionItem;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(40,32,17,0.45)] p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-composition-title" onMouseDown={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-[#EFEAE1] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
          <Trash2 size={19} aria-hidden="true" />
        </span>
        <h2 id="delete-composition-title" className="m-0 text-lg font-bold text-[#282011]">Remover composição?</h2>
        <p className="mb-0 mt-2 text-sm leading-6 text-[#665D4A]">
          “{composition.name}” será removida permanentemente. Essa ação não pode ser desfeita.
        </p>
        {error && <p role="alert" className="mb-0 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button type="button" disabled={deleting} onClick={onCancel} className="min-h-10 flex-1 rounded-xl border border-[#D4CBBA] bg-white text-sm font-bold text-[#665D4A] disabled:opacity-50">Cancelar</button>
          <button type="button" disabled={deleting} onClick={onConfirm} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:bg-red-300">
            {deleting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {deleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}
