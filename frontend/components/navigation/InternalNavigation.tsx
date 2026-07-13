"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  BookOpen,
  BookmarkCheck,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Home,
  LogIn,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/components/ui/utils";

export type InternalNavigationSection = "calculation" | "compositions" | "documentation";
export type NavigationTheme = "light" | "dark";

export function buildDocumentationHref({
  theme,
  returnTo,
  query,
}: {
  theme: NavigationTheme;
  returnTo: string;
  query?: string;
}) {
  const params = new URLSearchParams({ theme, returnTo });
  if (query?.trim()) params.set("q", query.trim());
  return `/consulta-documental?${params.toString()}`;
}

type InternalNavigationProps = {
  active: InternalNavigationSection;
  returnTo: string;
  themeLocked?: boolean;
};

const itemBase =
  "group flex min-h-11 items-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function InternalNavigation({
  active,
  returnTo,
  themeLocked = false,
}: InternalNavigationProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isDark, toggle, pageTheme, setPageTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem("synvera:internal-nav-expanded");
    if (savedPreference === "true" || savedPreference === "false") {
      setExpanded(savedPreference === "true");
      return;
    }

    // Introduce the navigation with labels where there is enough room, while
    // preserving workspace width on smaller desktop and tablet layouts.
    setExpanded(window.matchMedia("(min-width: 1280px)").matches);
  }, []);

  const setNavigationExpanded = (next: boolean) => {
    setExpanded(next);
    localStorage.setItem("synvera:internal-nav-expanded", String(next));
  };

  const handleThemeToggle = () => {
    if (themeLocked) return;
    if (pageTheme) {
      setPageTheme(isDark ? "light" : "dark");
      return;
    }
    toggle();
  };

  const documentationHref = buildDocumentationHref({
    theme: isDark ? "dark" : "light",
    returnTo,
  });

  const desktopItemClass = (selected: boolean) =>
    cn(
      itemBase,
      expanded ? "gap-3 px-3" : "justify-center px-0",
      selected
        ? "bg-primary text-white shadow-sm dark:bg-[#A99876] dark:text-stone-950"
        : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50",
    );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-50 hidden flex-col rounded-[22px] border border-white/70 bg-white/80 p-2 shadow-[0_12px_40px_rgba(40,30,20,0.12)] backdrop-blur-xl transition-[width] duration-200 dark:border-stone-800 dark:bg-stone-950/85 dark:shadow-black/30 lg:flex",
          expanded ? "w-[224px]" : "w-16",
        )}
        aria-label="Navegação principal"
      >
        <div className={cn("flex h-12 items-center", expanded ? "justify-between px-1" : "justify-center") }>
          <Link
            href="/"
            className={cn("flex min-w-0 items-center no-underline", expanded ? "gap-2.5" : "justify-center")}
            title="Ir para a Home"
            aria-label="Synvera — ir para a Home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/synvera-symbol-dark.svg" alt="" aria-hidden="true" width={25} height={24} className="block shrink-0 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/synvera-symbol-light.svg" alt="" aria-hidden="true" width={25} height={24} className="hidden shrink-0 dark:block" />
            {expanded && (
              <span className="truncate text-sm font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
                Synvera
              </span>
            )}
          </Link>
          {expanded && (
            <button
              type="button"
              onClick={() => setNavigationExpanded(false)}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              aria-label="Recolher navegação"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => setNavigationExpanded(true)}
            className="mt-1 flex h-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Expandir navegação"
            title="Expandir"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}

        <div className="my-3 h-px bg-stone-200/80 dark:bg-stone-800" />

        <nav className="flex flex-1 flex-col gap-1" aria-label="Áreas internas">
          <Link href="/" className={desktopItemClass(false)} title={expanded ? undefined : "Início"}>
            <Home size={18} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Início</span>}
          </Link>
          <Link
            href="/novo-calculo"
            aria-current={active === "calculation" ? "page" : undefined}
            className={desktopItemClass(active === "calculation")}
            title={expanded ? undefined : "Novo cálculo"}
          >
            <Calculator size={18} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Novo cálculo</span>}
          </Link>
          <Link
            href="/composicoes"
            aria-current={active === "compositions" ? "page" : undefined}
            className={desktopItemClass(active === "compositions")}
            title={expanded ? undefined : "Minhas composições"}
          >
            <BookmarkCheck size={18} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Minhas composições</span>}
          </Link>
          <Link
            href={documentationHref}
            aria-current={active === "documentation" ? "page" : undefined}
            className={desktopItemClass(active === "documentation")}
            title={expanded ? undefined : "Documentação"}
          >
            <BookOpen size={18} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Documentação</span>}
          </Link>
        </nav>

        <div className="mb-1 h-px bg-stone-200/80 dark:bg-stone-800" />
        {!themeLocked && (
          <button
            type="button"
            onClick={handleThemeToggle}
            className={cn(
              itemBase,
              expanded
                ? "justify-between gap-3 px-3 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                : "justify-center px-0 text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
            aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-checked={isDark}
            role="switch"
            title={expanded ? undefined : isDark ? "Modo claro" : "Modo escuro"}
          >
            {expanded ? (
              <>
                <span className="flex items-center gap-3">
                  {isDark ? <Moon size={18} className="shrink-0" aria-hidden="true" /> : <Sun size={18} className="shrink-0" aria-hidden="true" />}
                  <span>Tema</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
                    isDark ? "border-[#8F805F] bg-[#5F543C]" : "border-stone-300 bg-stone-200",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
                      isDark ? "translate-x-[18px]" : "translate-x-0.5",
                    )}
                  />
                </span>
              </>
            ) : isDark ? (
              <Sun size={18} className="shrink-0" aria-hidden="true" />
            ) : (
              <Moon size={18} className="shrink-0" aria-hidden="true" />
            )}
          </button>
        )}
        <div className={cn("mt-1 flex min-h-11 items-center", expanded ? "px-3" : "justify-center") }>
          {isLoaded && (
            isSignedIn ? (
              <div className={cn("flex items-center", expanded && "gap-3")}>
                <UserButton />
                {expanded && <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">Minha conta</span>}
              </div>
            ) : (
              <SignInButton mode="modal">
                <button type="button" className={cn("flex items-center text-sm font-semibold text-stone-600 dark:text-stone-300", expanded ? "gap-3" : "justify-center")}>
                  <LogIn size={18} aria-hidden="true" />
                  {expanded && <span>Entrar</span>}
                </button>
              </SignInButton>
            )
          )}
        </div>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 flex h-16 items-center justify-around rounded-2xl border border-white/70 bg-white/90 px-1 shadow-[0_10px_35px_rgba(40,30,20,0.18)] backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90 dark:shadow-black/40 lg:hidden"
        aria-label="Navegação principal"
      >
        <MobileItem href="/" label="Início" icon={<Home size={19} aria-hidden="true" />} />
        <MobileItem href="/novo-calculo" label="Novo cálculo" selected={active === "calculation"} icon={<Calculator size={19} aria-hidden="true" />} />
        <MobileItem href="/composicoes" label="Composições" selected={active === "compositions"} icon={<BookmarkCheck size={19} aria-hidden="true" />} />
        <MobileItem href={documentationHref} label="Documentação" selected={active === "documentation"} icon={<BookOpen size={19} aria-hidden="true" />} />
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400"
          aria-expanded={mobileMenuOpen}
          aria-controls="internal-mobile-menu"
        >
          {mobileMenuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          Mais
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          id="internal-mobile-menu"
          className="fixed bottom-20 right-3 z-50 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl dark:border-stone-800 dark:bg-stone-950 lg:hidden"
        >
          {!themeLocked && (
            <button type="button" onClick={handleThemeToggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
              {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              {isDark ? "Modo claro" : "Modo escuro"}
            </button>
          )}
          <div className="my-1 h-px bg-stone-200 dark:bg-stone-800" />
          <div className="flex min-h-11 items-center px-3">
            {isLoaded && (isSignedIn ? <UserButton /> : (
              <SignInButton mode="modal">
                <button type="button" className="flex items-center gap-3 text-sm font-semibold text-stone-700 dark:text-stone-200">
                  <LogIn size={18} aria-hidden="true" /> Entrar
                </button>
              </SignInButton>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MobileItem({
  href,
  label,
  icon,
  selected = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  selected?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors",
        selected ? "bg-primary/10 text-primary dark:bg-[#A99876]/15 dark:text-[#C8B890]" : "text-stone-500 dark:text-stone-400",
      )}
    >
      {icon}
      <span className="max-w-[72px] truncate">{label}</span>
    </Link>
  );
}
