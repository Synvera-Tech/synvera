"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  BookOpen,
  BookmarkCheck,
  Calculator,
  CircleUserRound,
  Home,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
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
};

const itemBase =
  "group relative flex min-h-11 items-center rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60 dark:focus-visible:ring-offset-stone-950/60";

export function InternalNavigation({
  active,
  returnTo,
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
        ? "bg-white/65 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_7px_20px_rgba(79,61,25,0.10)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary dark:bg-white/[0.09] dark:text-[#D6C59C] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_7px_22px_rgba(0,0,0,0.22)] dark:before:bg-[#C8B890]"
        : "text-stone-600 hover:bg-white/45 hover:text-stone-950 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:text-stone-300 dark:hover:bg-white/[0.07] dark:hover:text-stone-50 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]",
    );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-50 hidden flex-col overflow-visible rounded-[22px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.54)_0%,rgba(255,255,255,0.26)_48%,rgba(244,238,226,0.15)_100%)] p-2 shadow-[0_24px_72px_rgba(57,45,25,0.24),0_0_0_1px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,1),inset_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-[32px] backdrop-saturate-[210%] transition-[width] duration-200 dark:border-white/[0.22] dark:bg-[linear-gradient(145deg,rgba(42,36,30,0.56)_0%,rgba(24,20,17,0.36)_50%,rgba(8,7,6,0.24)_100%)] dark:shadow-[0_26px_76px_rgba(0,0,0,0.58),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.09)] lg:flex",
          expanded ? "w-[224px]" : "w-16",
        )}
        aria-label="Navegação principal"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[21px]">
          <span className="absolute -left-12 -top-20 h-64 w-32 rotate-[24deg] bg-white/55 blur-2xl dark:bg-white/[0.09]" />
          <span className="absolute -right-16 top-[32%] h-72 w-36 rounded-full bg-[#D8C69F]/25 blur-3xl dark:bg-[#A99876]/[0.10]" />
          <span className="absolute inset-x-3 top-0 h-px bg-white shadow-[0_1px_14px_rgba(255,255,255,0.95)] dark:bg-white/30 dark:shadow-[0_1px_12px_rgba(255,255,255,0.18)]" />
        </div>

        <div className={cn("relative z-10 flex h-12 items-center", expanded ? "px-2" : "justify-center")}>
          <Link
            href="/"
            className={cn("flex min-w-0 items-center no-underline", expanded ? "gap-2.5" : "justify-center")}
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
        </div>

        <button
          type="button"
          onClick={() => setNavigationExpanded(!expanded)}
          className="group/expand absolute -right-7 top-12 z-10 flex h-9 w-7 items-center justify-center rounded-r-xl border border-l-0 border-white/80 bg-white/55 text-stone-500 shadow-[5px_5px_18px_rgba(57,45,25,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[24px] backdrop-saturate-[180%] transition-[border-color,color,background-color] hover:border-primary/25 hover:bg-white/75 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 dark:border-white/[0.16] dark:border-l-0 dark:bg-white/[0.08] dark:text-stone-300 dark:shadow-[5px_5px_20px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.11)] dark:hover:border-[#A99876]/40 dark:hover:bg-white/[0.12] dark:hover:text-[#D6C59C]"
          aria-label={expanded ? "Recolher navegação" : "Expandir navegação"}
          aria-describedby="internal-nav-expand-tooltip"
        >
          {expanded ? (
            <PanelLeftClose size={15} strokeWidth={1.9} aria-hidden="true" />
          ) : (
            <PanelLeftOpen size={15} strokeWidth={1.9} aria-hidden="true" />
          )}
          <span
            id="internal-nav-expand-tooltip"
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 w-max -translate-y-1/2 rounded-lg bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100 dark:bg-stone-100 dark:text-stone-950"
          >
            {expanded ? "Recolher navegação" : "Expandir navegação"}
          </span>
        </button>

        <nav className="relative z-10 mt-4 flex flex-1 flex-col" aria-label="Áreas internas">
          <div aria-label="Navegação principal">
            {expanded && (
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-600">
                Principal
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <DesktopNavItem
                href="/"
                label="Início"
                tooltipId="internal-nav-home-tooltip"
                expanded={expanded}
                className={desktopItemClass(false)}
                icon={<Home size={18} strokeWidth={1.9} aria-hidden="true" />}
              />
              <DesktopNavItem
                href="/novo-calculo"
                label="Novo cálculo"
                tooltipId="internal-nav-calculation-tooltip"
                expanded={expanded}
                selected={active === "calculation"}
                className={desktopItemClass(active === "calculation")}
                icon={<Calculator size={18} strokeWidth={1.9} aria-hidden="true" />}
              />
              <DesktopNavItem
                href="/composicoes"
                label="Minhas composições"
                tooltipId="internal-nav-compositions-tooltip"
                expanded={expanded}
                selected={active === "compositions"}
                className={desktopItemClass(active === "compositions")}
                icon={<BookmarkCheck size={18} strokeWidth={1.9} aria-hidden="true" />}
              />
            </div>
          </div>

          <div className={expanded ? "mt-5" : "mt-4"} aria-label="Consulta e referência">
            {expanded && (
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-600">
                Consulta e referência
              </div>
            )}
            <DesktopNavItem
              href={documentationHref}
              label="Documentação"
              tooltipId="internal-nav-documentation-tooltip"
              expanded={expanded}
              selected={active === "documentation"}
              className={desktopItemClass(active === "documentation")}
              icon={<BookOpen size={18} strokeWidth={1.9} aria-hidden="true" />}
            />
          </div>
        </nav>

        <div className="relative z-10 mb-1 border-t border-white/60 pt-2 dark:border-white/[0.12]">
          <button
            type="button"
            onClick={handleThemeToggle}
            className={cn(
              itemBase,
              "w-full bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/55 dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.09]",
              expanded
                ? "justify-between gap-3 px-3 text-stone-600 dark:text-stone-200"
                : "justify-center px-0 text-stone-600 dark:text-stone-300",
            )}
            aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-checked={isDark}
            role="switch"
            aria-describedby={!expanded ? "internal-nav-theme-tooltip" : undefined}
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
            {!expanded && (
              <CollapsedTooltip
                id="internal-nav-theme-tooltip"
                label={isDark ? "Modo claro" : "Modo escuro"}
              />
            )}
          </button>
          <div className={cn("mt-1 flex min-h-11 items-center", expanded ? "px-3" : "justify-center")}>
            {isLoaded && (
              isSignedIn ? (
                <div
                  className={cn("group/account relative flex items-center", expanded && "gap-3")}
                  aria-label="Minha conta"
                >
                  <UserButton />
                  {expanded && <span className="text-sm font-semibold text-stone-600 dark:text-stone-200">Minha conta</span>}
                  {!expanded && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-[calc(100%+18px)] top-1/2 z-50 w-max -translate-y-1/2 rounded-lg bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/account:opacity-100 group-focus-within/account:opacity-100 dark:bg-stone-100 dark:text-stone-950"
                    >
                      Minha conta
                    </span>
                  )}
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className={cn(itemBase, "text-stone-600 hover:text-stone-950 dark:text-stone-200 dark:hover:text-stone-50", expanded ? "w-full gap-3" : "justify-center")}
                    aria-label="Entrar"
                    aria-describedby={!expanded ? "internal-nav-sign-in-tooltip" : undefined}
                  >
                    <CircleUserRound size={18} strokeWidth={1.9} aria-hidden="true" />
                    {expanded && <span>Entrar</span>}
                    {!expanded && <CollapsedTooltip id="internal-nav-sign-in-tooltip" label="Entrar" />}
                  </button>
                </SignInButton>
              )
            )}
          </div>
        </div>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 flex h-16 items-center justify-around rounded-2xl border border-white/80 bg-white/55 px-1 shadow-[0_14px_42px_rgba(57,45,25,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[26px] backdrop-saturate-[185%] dark:border-white/[0.16] dark:bg-stone-950/55 dark:shadow-[0_16px_46px_rgba(0,0,0,0.50),inset_0_1px_0_rgba(255,255,255,0.10)] lg:hidden"
        aria-label="Navegação principal"
      >
        <MobileItem href="/" label="Início" icon={<Home size={19} aria-hidden="true" />} />
        <MobileItem href="/novo-calculo" label="Novo cálculo" selected={active === "calculation"} icon={<Calculator size={19} aria-hidden="true" />} />
        <MobileItem href="/composicoes" label="Composições" selected={active === "compositions"} icon={<BookmarkCheck size={19} aria-hidden="true" />} />
        <MobileItem href={documentationHref} label="Documentação" selected={active === "documentation"} icon={<BookOpen size={19} aria-hidden="true" />} />
        <button
          type="button"
          onClick={handleThemeToggle}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-stone-500 transition-colors hover:bg-white/45 dark:text-stone-400 dark:hover:bg-white/[0.07]"
          aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          aria-checked={isDark}
          role="switch"
        >
          {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          <span className="max-w-full truncate">Tema</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400"
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
          className="fixed bottom-20 right-3 z-50 w-64 rounded-2xl border border-white/80 bg-white/60 p-2 shadow-[0_18px_55px_rgba(57,45,25,0.25),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[28px] backdrop-saturate-[185%] dark:border-white/[0.16] dark:bg-stone-950/60 dark:shadow-[0_20px_58px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.10)] lg:hidden"
        >
          <button type="button" onClick={handleThemeToggle} className="flex w-full items-center gap-3 rounded-xl bg-white/25 px-3 py-3 text-sm font-semibold text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-white/55 dark:bg-white/[0.04] dark:text-stone-200 dark:hover:bg-white/[0.09]">
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            {isDark ? "Modo claro" : "Modo escuro"}
          </button>
          <div className="my-1 h-px bg-white/60 dark:bg-white/[0.12]" />
          <div className="flex min-h-11 items-center px-3">
            {isLoaded && (isSignedIn ? <UserButton /> : (
              <SignInButton mode="modal">
                <button type="button" className="flex items-center gap-3 text-sm font-semibold text-stone-700 dark:text-stone-200">
                  <CircleUserRound size={18} strokeWidth={1.9} aria-hidden="true" /> Entrar
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
        "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
        selected
          ? "bg-primary/[0.07] text-primary after:absolute after:-bottom-0.5 after:h-0.5 after:w-4 after:rounded-full after:bg-primary dark:bg-[#A99876]/10 dark:text-[#C8B890] dark:after:bg-[#C8B890]"
          : "text-stone-500 dark:text-stone-400",
      )}
    >
      {icon}
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function DesktopNavItem({
  href,
  label,
  tooltipId,
  expanded,
  selected = false,
  className,
  icon,
}: {
  href: string;
  label: string;
  tooltipId: string;
  expanded: boolean;
  selected?: boolean;
  className: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      aria-label={!expanded ? label : undefined}
      aria-describedby={!expanded ? tooltipId : undefined}
      className={className}
    >
      {icon}
      {expanded ? <span>{label}</span> : <CollapsedTooltip id={tooltipId} label={label} />}
    </Link>
  );
}

function CollapsedTooltip({ id, label }: { id: string; label: string }) {
  return (
    <span
      id={id}
      role="tooltip"
      className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 w-max -translate-y-1/2 rounded-lg bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-stone-100 dark:text-stone-950"
    >
      {label}
    </span>
  );
}
