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
          "radial-gradient(ellipse 70% 200px at 50% 0%, rgba(201, 168, 103,0.22) 0%, transparent 100%)",
          "radial-gradient(circle at top center, rgba(179, 161, 125,0.12) 0%, transparent 50%)",
          "radial-gradient(circle at bottom right, rgba(179, 161, 125,0.06) 0%, transparent 60%)",
          "linear-gradient(180deg, #010102 0%, #050508 100%)",
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
          background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(196, 181, 152,0.20) 0%, transparent 100%)",
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
            #f7f8f8 0%,
            #f7f8f8 10%,
            rgba(201, 168, 103, 0.25) 25%,
            rgba(201, 168, 103, 0.35) 50%,
            rgba(201, 168, 103, 0.25) 75%,
            #f7f8f8 90%,
            #f7f8f8 100%
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
          background: "radial-gradient(circle, rgba(201, 168, 103,0.08), transparent 70%)",
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
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              background: "linear-gradient(180deg, #ffffff 0%, #F9F5EC 55%, #EADBBD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 18px rgba(223, 199, 152,0.50)) drop-shadow(0 0 60px rgba(201, 168, 103,0.22))",
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
              background: "rgba(234, 219, 189,0.55)",
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
            border: "1px solid rgba(179, 161, 125,0.32)",
            background: "linear-gradient(135deg, rgba(179, 161, 125,0.12), rgba(179, 161, 125,0.06))",
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
            background: "#C9A867",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#DFDAD1", letterSpacing: "0.5px" }}>
            VALORAÇÃO PARA NEUROCIRURGIA • COLUNA
          </span>
        </div>

        {/* Main headline with shimmer stripe */}
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "clamp(36px, 6vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-1.5px",
            color: "#f7f8f8",
            lineHeight: 1.1,
            animation: "slideUp 0.7s ease-out 0.1s both",
            position: "relative",
          }}
        >
          <span className="hero-stripe-text">
            Valoração médica com
          </span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #C9A867 0%, #E1CBA0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
            color: "#DFDAD1",
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
              background: "linear-gradient(135deg, #5A4823 0%, #AF8C46 100%)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 200ms ease",
              boxShadow: "0 2px 4px rgba(90, 72, 35,0.15), 0 6px 16px rgba(90, 72, 35,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(90, 72, 35,0.20), 0 10px 24px rgba(90, 72, 35,0.32), 0 16px 40px rgba(90, 72, 35,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(90, 72, 35,0.15), 0 6px 16px rgba(90, 72, 35,0.25)";
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
              background: "rgba(179, 161, 125,0.12)",
              color: "#f7f8f8",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              border: "1px solid rgba(179, 161, 125,0.24)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(179, 161, 125,0.18)";
              e.currentTarget.style.borderColor = "rgba(187, 174, 147,0.32)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(179, 161, 125,0.12)";
              e.currentTarget.style.borderColor = "rgba(179, 161, 125,0.24)";
            }}
          >
            Ver composição exemplo
          </button>
        </div>

        {/* Sign in hint */}
        <p style={{ margin: 0, fontSize: "13px", color: "#9B9387", marginBottom: "32px" }}>
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
                color: "#DFDAD1",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationColor: "rgba(179, 161, 125,0.24)",
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
          <span style={{ fontSize: "15px", color: "#DFDAD1", fontWeight: 600, whiteSpace: "nowrap" }}>
            Veja como funciona
          </span>
          <ChevronDown
            size={18}
            style={{
              color: "#9B9387",
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
