"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CompositionDemoModal } from "@/components/composition/CompositionDemoModal";

export function HeroSection() {
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);

  return (
    <>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "110px 24px 60px",
        background: [
          // Subtle indigo bloom at very top — gives navbar backdrop-filter material to blur
          "radial-gradient(ellipse 70% 200px at 50% 0%, rgba(79, 61, 25,0.22) 0%, transparent 100%)",
          "radial-gradient(circle at top center, rgba(115, 89, 37,0.12) 0%, transparent 50%)",
          "radial-gradient(circle at bottom right, rgba(115, 89, 37,0.06) 0%, transparent 60%)",
          "linear-gradient(180deg, #171310 0%, #0F0B09 100%)",
        ].join(", "),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Navbar backdrop material — gives the frosted glass blur a soft light
          variation to reveal. Without this, the blur samples near-black
          uniformly and the glass effect is imperceptible. Neutral cool-gray
          gradient intentionally avoids blue so the navbar does not tint blue. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "960px",
          maxWidth: "100%",
          height: "160px",
          background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(143, 118, 67,0.20) 0%, transparent 100%)",
          filter: "blur(32px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <style>{`
        @keyframes stripeShift {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .hero-stripe-text {
          background: linear-gradient(
            90deg,
            #F3EEE4 0%,
            #F3EEE4 10%,
            rgba(79, 61, 25, 0.25) 25%,
            rgba(79, 61, 25, 0.35) 50%,
            rgba(79, 61, 25, 0.25) 75%,
            #F3EEE4 90%,
            #F3EEE4 100%
          );
          background-size: 200% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: stripeShift 20s linear infinite;
          display: inline-block;
        }

        @keyframes scrollCue {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          25% { transform: translateY(4px) scale(1.05); opacity: 0.6; }
          50% { transform: translateY(7px) scale(1.08); opacity: 1; }
          75% { transform: translateY(4px) scale(1.05); opacity: 0.6; }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes stripeShift {
            0%, 100% { background-position: 0; }
          }
          @keyframes scrollCue {
            0%, 100% { transform: none; opacity: 0; }
            50% { transform: none; opacity: 0; }
          }
        }
      `}</style>

      {/* Subtle background accent */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "0",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          pointerEvents: "none",
          background: "radial-gradient(circle, rgba(79, 61, 25,0.08), transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: "720px",
          textAlign: "center",
          position: "relative",
          // Sit above the next section, which overlaps the hero by 60px
          // (ProductPreview marginTop:-60px, zIndex:10) and draws the divider
          // line on top. Keeping the hero content above z-10 ensures the
          // scroll-cue chevron stays fully visible at the bottom of its bounce.
          // Still below the fixed NavBar (zIndex:50).
          zIndex: 11,
          width: "100%",
          // Breathing room so the scroll-cue chevron keeps clear hero space
          // beneath it and never reaches the divider line of the next section.
          paddingBottom: "14px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            marginBottom: "48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            animation: "slideUp 0.4s ease-out",
          }}
        >
          <span
            style={{
              fontSize: "52px",
              fontWeight: 600,
              fontFamily: "'Fraunces', Georgia, serif",
              letterSpacing: "-0.02em",
              background: "linear-gradient(180deg, #ffffff 0%, #F0EDE8 55%, #C5B085 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 18px rgba(132, 104, 48,0.50)) drop-shadow(0 0 60px rgba(79, 61, 25,0.22))",
              lineHeight: 1,
              display: "inline-block",
              paddingBottom: "0.15em",
            }}
          >
            Synvera
          </span>
          {/* Brand accent — architectural rule */}
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "rgba(189, 165, 116,0.55)",
              borderRadius: "1px",
            }}
          />
        </div>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid rgba(115, 89, 37,0.32)",
            background: "linear-gradient(135deg, rgba(115, 89, 37,0.12), rgba(115, 89, 37,0.06))",
            marginBottom: "28px",
            animation: "slideUp 0.6s ease-out, float 3s ease-in-out infinite 0.3s",
            backdropFilter: "blur(10px)",
          }}
        >
          <span style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#4F3D19",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#C9C0B2", letterSpacing: "0.5px" }}>
            VALORAÇÃO PARA NEUROCIRURGIA • COLUNA
          </span>
        </div>

        {/* Main headline with shimmer stripe */}
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "clamp(36px, 6vw, 52px)",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            color: "#F3EEE4",
            lineHeight: 1.1,
            animation: "slideUp 0.7s ease-out 0.1s both",
            position: "relative",
          }}
        >
          <span className="hero-stripe-text">
            Valoração médica com
          </span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #4F3D19 0%, #735925 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            precisão documental
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            margin: "0 0 40px",
            maxWidth: "580px",
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#C9C0B2",
            marginLeft: "auto",
            marginRight: "auto",
            animation: "slideUp 0.7s ease-out 0.2s both",
          }}
        >
          Baseado nas regras oficiais da CBHPM e da SBN, com cálculo determinístico, composições reutilizáveis e relatórios compartilháveis.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "48px",
            animation: "slideUp 0.7s ease-out 0.3s both",
          }}
        >
          <Link
            href="/novo-calculo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #725C30 0%, #735925 100%)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 200ms ease",
              boxShadow: "0 2px 4px rgba(41, 32, 13,0.15), 0 6px 16px rgba(41, 32, 13,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(41, 32, 13,0.20), 0 10px 24px rgba(41, 32, 13,0.32), 0 16px 40px rgba(41, 32, 13,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(41, 32, 13,0.15), 0 6px 16px rgba(41, 32, 13,0.25)";
            }}
          >
            Iniciar cálculo
            <ChevronRight size={16} />
          </Link>

          <button
            onClick={() => setIsCompositionModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: "rgba(115, 89, 37,0.12)",
              color: "#F3EEE4",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              border: "1px solid rgba(115, 89, 37,0.24)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(115, 89, 37,0.18)";
              e.currentTarget.style.borderColor = "rgba(143, 118, 67,0.32)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(115, 89, 37,0.12)";
              e.currentTarget.style.borderColor = "rgba(115, 89, 37,0.24)";
            }}
          >
            Ver composição exemplo
          </button>
        </div>

        {/* Sign in hint */}
        <p style={{ margin: 0, fontSize: "13px", color: "#90877A", marginBottom: "32px" }}>
          Já tem conta?{" "}
          <SignInButton mode="modal">
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: 600,
                color: "#C9C0B2",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationColor: "rgba(115, 89, 37,0.24)",
              }}
            >
              Entrar
            </button>
          </SignInButton>
        </p>

        {/* Scroll cue */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "slideUp 0.8s ease-out 0.5s both",
          }}
        >
          <span style={{ fontSize: "15px", color: "#C9C0B2", fontWeight: 600, whiteSpace: "nowrap" }}>
            Veja como funciona
          </span>
          <ChevronDown
            size={18}
            style={{
              color: "#90877A",
              animation: "scrollCue 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>

    <CompositionDemoModal
      isOpen={isCompositionModalOpen}
      onClose={() => setIsCompositionModalOpen(false)}
    />
    </>
  );
}
