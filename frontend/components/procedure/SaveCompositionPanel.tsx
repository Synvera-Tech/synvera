"use client";

import { BookmarkCheck, Check, LogIn, X } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import type { RefObject } from "react";

interface SaveCompositionPanelProps {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  loadedCompositionId: string | null;
  compositionSaved: boolean;
  savingComposition: boolean;
  compositionSaveError: string | null;
  showSaveForm: boolean;
  compositionName: string;
  nameInputRef: RefObject<HTMLInputElement | null>;
  onShowSaveForm: () => void;
  onHideSaveForm: () => void;
  onCompositionNameChange: (name: string) => void;
  onSaveComposition: () => void;
  onUpdateComposition: () => void;
}

export function SaveCompositionPanel({
  isLoaded,
  isSignedIn,
  loadedCompositionId,
  compositionSaved,
  savingComposition,
  compositionSaveError,
  showSaveForm,
  compositionName,
  nameInputRef,
  onShowSaveForm,
  onHideSaveForm,
  onCompositionNameChange,
  onSaveComposition,
  onUpdateComposition,
}: SaveCompositionPanelProps) {
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
        >
          <LogIn size={16} /> Entrar para salvar composição
        </button>
      </SignInButton>
    );
  }

  if (loadedCompositionId) {
    // Update flow
    if (compositionSaved) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-sapphire-200 dark:border-sapphire-700/40 bg-sapphire-50/70 dark:bg-sapphire-900/15 px-4 py-3 text-sm font-semibold text-sapphire-700 dark:text-sapphire-400">
          <Check size={16} />
          Composição atualizada com sucesso
        </div>
      );
    }
    return (
      <>
        <button
          onClick={onUpdateComposition}
          disabled={savingComposition}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98] disabled:opacity-50"
          type="button"
        >
          {savingComposition
            ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Atualizando...</>
            : <><BookmarkCheck size={16} /> Atualizar composição</>}
        </button>
        {compositionSaveError && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50/70 dark:bg-red-900/15 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
            <X size={15} />
            {compositionSaveError}
          </div>
        )}
      </>
    );
  }

  // Save flow
  if (compositionSaved) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-sapphire-200 dark:border-sapphire-700/40 bg-sapphire-50/70 dark:bg-sapphire-900/15 px-4 py-3 text-sm font-semibold text-sapphire-700 dark:text-sapphire-400">
        <Check size={16} />
        Composição salva!{" "}
        <Link href="/" className="underline underline-offset-2 hover:no-underline">
          Ver minhas composições
        </Link>
      </div>
    );
  }

  if (showSaveForm) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
        <label className="block text-xs font-semibold uppercase tracking-[0.4px] text-slate-500 dark:text-slate-400">
          Nome da composição
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={compositionName}
          onChange={(e) => onCompositionNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveComposition();
            if (e.key === "Escape") onHideSaveForm();
          }}
          placeholder="Ex: Craniotomia + DVP"
          maxLength={120}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary dark:focus:border-[#5D7EA7] focus:outline-none transition-colors"
        />
        <div className="flex gap-2">
          <button
            onClick={onSaveComposition}
            disabled={savingComposition || !compositionName.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50 dark:border-[#5D7EA7]/20 dark:text-[#718BAE] dark:hover:bg-[#5D7EA7]/10"
            type="button"
          >
            {savingComposition
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Salvando...</>
              : <><BookmarkCheck size={15} /> Salvar</>}
          </button>
          <button
            onClick={onHideSaveForm}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            type="button"
          >
            Cancelar
          </button>
        </div>
        {compositionSaveError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/70 dark:bg-red-900/15 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400">
            <X size={14} />
            {compositionSaveError}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onShowSaveForm}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
      type="button"
    >
      <BookmarkCheck size={16} /> Salvar composição
    </button>
  );
}
