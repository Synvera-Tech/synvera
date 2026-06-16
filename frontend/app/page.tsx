"use client";

import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { BookmarkCheck, ChevronRight, FileText, Plus, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { ProductPreview } from "@/components/home/ProductPreview";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg:          "#E2EBF3",
  surface:     "#FFFFFF",
  cardBorder:  "rgba(53,92,138,0.12)",
  primary:     "#0F172A",
  secondary:   "#475569",
  muted:       "#64748B",
  inputBorder: "#CBD5E1",
  inputFocus:  "#94A3B8",
  btnBg:       "#1E293B",
  btnHover:    "#334155",
  sapphire:        "#232D3B",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type CompositionItem = {
  public_id: string;
  name: string;
  sbn_procedure_name: string;
  access_route_type: "same" | "different";
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  created_at: string;
};

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [compositions, setCompositions] = useState<CompositionItem[]>([]);
  const [compositionsLoaded, setCompositionsLoaded] = useState(false);

  const fetchCompositions = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch("/api/compositions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: CompositionItem[] = await res.json();
        setCompositions((data ?? []).slice(0, 5));
      }
    } catch {
      // network failure — leave empty
    } finally {
      setCompositionsLoaded(true);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetchCompositions();
    } else {
      setCompositionsLoaded(true);
    }
  }, [isLoaded, isSignedIn, fetchCompositions]);

  if (!isLoaded) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "20px", height: "20px",
            border: `2px solid ${T.inputBorder}`, borderTopColor: T.primary,
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }}
        />
      </main>
    );
  }

  if (!isSignedIn) {
    return <UnauthenticatedHome />;
  }

  const firstName = user?.firstName;
  const greeting = firstName ? `Bem-vindo, Dr. ${firstName}.` : "Bem-vindo ao Afere.";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: [
          "radial-gradient(circle at top center, rgba(53,92,138,0.18) 0%, transparent 45%)",
          "radial-gradient(circle at 15% 88%, rgba(30,58,95,0.08) 0%, transparent 40%)",
          "radial-gradient(ellipse 700px 500px at 80% 20%, rgba(30,58,95,0.06) 0%, transparent 60%)",
          "linear-gradient(180deg, #E2EBF3 0%, #D6E1EB 100%)",
        ].join(", "),
      }}
    >
      {/* ── Navigation ── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "rgba(243,246,249,0.72)",
          backdropFilter: "blur(12px) saturate(160%)",
          WebkitBackdropFilter: "blur(12px) saturate(160%)",
          borderBottom: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "960px", margin: "0 auto",
            padding: "0 24px", height: "56px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div
              style={{
                width: "34px", height: "34px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(145deg, #E6EEF5, #D8E5EE)",
                borderRadius: "9px",
                border: "1px solid rgba(53,92,138,0.12)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/afere-symbol.svg" alt="" aria-hidden="true" width={22} height={21} style={{ display: "block" }} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 800, letterSpacing: "-0.3px", color: T.primary }}>Afere</span>
              <span style={{ display: "block", fontSize: "9px", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: T.muted, lineHeight: 1 }}>NEUROCIRURGIA</span>
            </div>
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <NavLink href="/" active>Início</NavLink>
            <NavLink href="/novo-calculo">Novo cálculo</NavLink>
            <NavLink href="#" disabled label="Composições" />
            <NavLink href="#" disabled label="Documentação" />
          </div>

          {/* Auth */}
          <UserButton />
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* Greeting + CTA */}
        <div style={{ marginBottom: "56px" }}>
          <h1 style={{
            margin: "0 0 6px",
            fontSize: "28px", fontWeight: 800,
            letterSpacing: "-0.5px", color: T.primary, lineHeight: 1.15,
          }}>
            {greeting}
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: "14px", color: T.muted }}>
            O que deseja calcular hoje?
          </p>
          <Link
            href="/novo-calculo"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px",
              backgroundColor: "#5D7EA7",
              color: "#fff",
              borderRadius: "10px",
              fontSize: "14px", fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2C4F78")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5D7EA7")}
          >
            <Plus size={15} aria-hidden="true" />
            Novo cálculo
          </Link>
        </div>

        {/* Recent compositions */}
        <section style={{ marginBottom: "52px" }}>
          <SectionHeader title="Composições recentes" />
          {!compositionsLoaded ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0", color: T.muted, fontSize: "13.5px" }}>
              <div
                style={{
                  width: "16px", height: "16px",
                  border: `2px solid ${T.inputBorder}`, borderTopColor: T.primary,
                  borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }}
              />
              Carregando...
            </div>
          ) : compositions.length === 0 ? (
            <div
              style={{
                borderRadius: "12px",
                border: `1.5px dashed ${T.cardBorder}`,
                padding: "40px 24px", textAlign: "center",
              }}
            >
              <BookmarkCheck size={32} aria-hidden="true" style={{ color: T.inputBorder, margin: "0 auto 14px", display: "block" }} />
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: T.secondary }}>
                Nenhuma composição salva ainda
              </p>
              <p style={{ margin: "0 0 22px", fontSize: "12.5px", color: T.muted, lineHeight: 1.6 }}>
                Monte uma composição e salve para acessar rapidamente aqui.
              </p>
              <Link
                href="/novo-calculo"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "9px 20px",
                  border: `1.5px solid ${T.inputBorder}`,
                  borderRadius: "8px",
                  fontSize: "13px", fontWeight: 600,
                  color: T.primary,
                  textDecoration: "none",
                }}
              >
                Criar primeira composição
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {compositions.map((comp) => (
                <CompositionCard key={comp.public_id} comp={comp} />
              ))}
            </div>
          )}
        </section>

        {/* Quick tools */}
        <section style={{ marginBottom: "52px" }}>
          <SectionHeader title="Ferramentas" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            <ToolCard
              icon={<Plus size={18} aria-hidden="true" />}
              title="Novo cálculo"
              description="Monte uma composição e calcule a valoração."
              href="/novo-calculo"
            />
            <ToolCard
              icon={<BookmarkCheck size={18} aria-hidden="true" />}
              title="Minhas composições"
              description="Acesse, edite e reutilize suas composições."
              href="/novo-calculo"
            />
            <ToolCard
              icon={<FileText size={18} aria-hidden="true" />}
              title="Documentação"
              description="Consulte fundamentos CBHPM e SBN."
              disabled
            />
            <ToolCard
              icon={<Share2 size={18} aria-hidden="true" />}
              title="Relatórios compartilhados"
              description="Revise cálculos compartilhados."
              disabled
            />
          </div>
        </section>

      </div>
    </main>
  );
}

// ─── Unauthenticated Home ─────────────────────────────────────────────────────

function UnauthenticatedHome() {
  return (
    <>
      <HeroSection />
      <ProductPreview />
      <HowItWorks />
      <FeaturesGrid />

      {/* CTA Footer */}
      <section
        style={{
          padding: "60px 24px",
          background: "linear-gradient(180deg, #050508 0%, #010102 100%)",
          borderTop: "1px solid rgba(35,37,42,0.6)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "32px",
              fontWeight: 700,
              color: "#f7f8f8",
              letterSpacing: "-0.8px",
            }}
          >
            Pronto para começar?
          </h2>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "16px",
              color: "#d0d6e0",
            }}
          >
            Valorize seus procedimentos com precisão. Sem surpresas, sem erros.
          </p>
          <Link
            href="/novo-calculo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #1E3A5F 0%, #3D7DB8 100%)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 200ms ease",
              boxShadow: "0 2px 4px rgba(30,58,95,0.15), 0 6px 16px rgba(30,58,95,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(30,58,95,0.20), 0 10px 24px rgba(30,58,95,0.32), 0 16px 40px rgba(30,58,95,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(30,58,95,0.15), 0 6px 16px rgba(30,58,95,0.25)";
            }}
          >
            Iniciar cálculo
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

interface NavLinkProps {
  href: string;
  children?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label?: string;
}

function NavLink({ href, children, active, disabled, label }: NavLinkProps) {
  const text = children || label;
  if (disabled) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 500,
          color: T.muted,
          opacity: 0.5,
          cursor: "not-allowed",
        }}
      >
        {text}
      </span>
    );
  }
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: active ? T.primary : T.secondary,
        textDecoration: "none",
        borderRadius: "6px",
        transition: "background-color 150ms ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(15,23,42,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {text}
    </Link>
  );
}

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "0 2px" }}>
      <h2
        style={{
          margin: 0, fontSize: "14px", fontWeight: 700,
          color: T.secondary, letterSpacing: "0.3px",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: T.cardBorder }} />
    </div>
  );
}

interface CompositionCardProps {
  comp: CompositionItem;
}

function CompositionCard({ comp }: CompositionCardProps) {
  return (
    <Link
      href={`/novo-calculo?composition=${comp.public_id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 14px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        border: `1px solid ${T.cardBorder}`,
        textDecoration: "none",
        transition: "all 150ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F8FAFC";
        e.currentTarget.style.borderColor = "rgba(53,92,138,0.24)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#fff";
        e.currentTarget.style.borderColor = T.cardBorder;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div>
        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: T.primary }}>{comp.name}</p>
        <p style={{ margin: "0 0 6px", fontSize: "11.5px", color: T.muted }}>{comp.sbn_procedure_name}</p>
      </div>
      <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: T.secondary }}>
        <span>
          {comp.auxiliaries_count} {comp.auxiliaries_count === 1 ? "auxiliar" : "auxiliares"}
        </span>
        {comp.requires_anesthesia && <span>• Anestesia</span>}
      </div>
    </Link>
  );
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
  signIn?: boolean;
}

function ToolCard({ icon, title, description, href, disabled, signIn }: ToolCardProps) {
  const content = (
    <>
      <div style={{ color: disabled ? T.inputBorder : T.primary }}>{icon}</div>
      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: T.primary }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "12px", color: T.muted, lineHeight: 1.5 }}>{description}</p>
      </div>
    </>
  );

  const baseStyle = {
    display: "flex",
    gap: "12px",
    padding: "14px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    border: `1px solid ${T.cardBorder}`,
    textDecoration: "none",
    transition: "all 150ms ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  } as const;

  if (disabled) {
    return <div style={baseStyle}>{content}</div>;
  }

  if (signIn) {
    return (
      <SignInButton mode="modal">
        <button style={{ ...baseStyle, background: "none", padding: "14px", border: `1px solid ${T.cardBorder}` }}>
          {content}
        </button>
      </SignInButton>
    );
  }

  return (
    <Link
      href={href || "#"}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F8FAFC";
        e.currentTarget.style.borderColor = "rgba(53,92,138,0.24)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#fff";
        e.currentTarget.style.borderColor = T.cardBorder;
      }}
    >
      {content}
    </Link>
  );
}
