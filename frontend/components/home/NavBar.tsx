"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Experiência",    href: "#experiencia" },
  { label: "Como funciona",  href: "#como-funciona" },
  { label: "Recursos",       href: "#recursos" },
  { label: "Planos",         href: "#planos" },
  { label: "Dúvidas",        href: "#duvidas" },
];

export function NavBar() {
  return (
    <motion.nav
      className="landing-navbar"
      style={{
        // Positioning
        position: "fixed",
        top: "20px",
        left: "50%",
        x: "-50%",
        zIndex: 50,
        maxWidth: "calc(100vw - 24px)",

        // Glass pill — dark neutral translucent surface.
        // brightness() was removed: it amplified the hero's indigo bloom
        // and turned the navbar solid blue. Glass on dark must come from
        // transparency + blur + highlight, not from color amplification.
        display: "flex",
        alignItems: "center",
        borderRadius: "9999px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "rgba(8, 10, 16, 0.42)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.16)",
          "inset 0 -1px 0 rgba(255,255,255,0.04)",
          "0 18px 60px rgba(0,0,0,0.42)",
          "0 0 30px rgba(94,106,210,0.12)",
        ].join(", "),
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >

      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 20px 10px 14px",
          flexShrink: 0,
        }}
      >
        <img
          src="/brand/synvera-symbol-light.svg"
          alt="Synvera"
          style={{ width: "28px", height: "28px", display: "block" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span
            className="font-grotesk"
            style={{
              fontWeight: 800,
              fontSize: "14px",
              letterSpacing: "-0.03em",
              color: "#E6EEF7",
              lineHeight: 1.2,
              display: "block",
            }}
          >
            Synvera
          </span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 500,
              color: "rgba(230,238,247,0.55)",
              letterSpacing: "0.3px",
              lineHeight: 1,
              display: "block",
            }}
          >
            Neurocirurgia · Coluna
          </span>
        </div>
      </div>

      {/* Nav links — hidden on mobile */}
      <div
        className="hidden md:flex"
        style={{ alignItems: "center", gap: "1px", padding: "6px 14px" }}
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              padding: "7px 11px",
              borderRadius: "9999px",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "rgba(230,238,247,0.65)",
              background: "transparent",
              textDecoration: "none",
              cursor: "pointer",
              transition: "color 150ms ease, background 150ms ease",
              whiteSpace: "nowrap",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E6EEF7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(230,238,247,0.65)";
              e.currentTarget.style.background = "transparent";
            }}
            onFocus={(e) => {
              e.currentTarget.style.color = "#E6EEF7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.color = "rgba(230,238,247,0.65)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          padding: "6px 8px 6px 12px",
          flexShrink: 0,
        }}
      >
        <SignInButton mode="modal">
          <button
            className="hidden sm:block"
            style={{
              padding: "7px 12px",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "rgba(230,238,247,0.65)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: "9999px",
              transition: "color 150ms ease, background 150ms ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E6EEF7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(230,238,247,0.65)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Entrar
          </button>
        </SignInButton>
        <Link
          href="/novo-calculo"
          className="shimmer-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 16px",
            borderRadius: "9999px",
            fontSize: "12.5px",
            fontWeight: 600,
            color: "white",
            background: "#5e6ad2",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 2px 12px rgba(94,106,210,0.42)",
            whiteSpace: "nowrap",
          }}
        >
          Iniciar cálculo
          <ChevronRight style={{ width: "13px", height: "13px" }} />
        </Link>
      </div>

    </motion.nav>
  );
}
