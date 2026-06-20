"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Produto" },
  { label: "Como funciona" },
  { label: "Auditabilidade" },
  { label: "Benefícios" },
  { label: "Preços" },
];

const pillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderRadius: "9999px",
  background: "rgba(8,10,18,0.62)",
  backdropFilter: "blur(20px) saturate(140%)",
  WebkitBackdropFilter: "blur(20px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.09)",
    "inset 0 -1px 0 rgba(0,0,0,0.22)",
    "0 18px 60px rgba(0,0,0,0.45)",
    "0 0 36px rgba(94,106,210,0.10)",
  ].join(", "),
  overflow: "hidden",
  whiteSpace: "nowrap" as const,
};

const dividerStyle: React.CSSProperties = {
  width: "1px",
  alignSelf: "stretch",
  background: "rgba(120,148,184,0.10)",
  flexShrink: 0,
};

export function NavBar() {
  return (
    <motion.nav
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        x: "-50%",
        zIndex: 50,
        maxWidth: "calc(100vw - 24px)",
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div style={pillStyle}>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px 10px 14px",
            flexShrink: 0,
          }}
        >
          <img
            src="/brand/synvera-symbol-light.svg"
            alt="Synvera"
            style={{ width: "28px", height: "28px", display: "block" }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: "3px" }}>
            <span
              className="font-grotesk"
              style={{
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: "-0.03em",
                color: "#E6EEF7",
                lineHeight: 1,
                display: "block",
              }}
            >
              Synvera
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 500,
                color: "#8A8F98",
                letterSpacing: "0.3px",
                lineHeight: 1,
                display: "block",
              }}
            >
              Neurocirurgia · Coluna
            </span>
          </div>
        </div>

        {/* Separator */}
        <div style={dividerStyle} className="hidden md:block" />

        {/* Nav links — hidden on mobile */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: "1px", padding: "6px 10px" }}
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              style={{
                padding: "7px 11px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 500,
                color: "#8A8F98",
                background: "transparent",
                border: "none",
                cursor: "default",
                transition: "color 150ms ease, background 150ms ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#E6EEF7";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A8F98";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={dividerStyle} />

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "6px 8px",
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
                color: "#8A8F98",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "9999px",
                transition: "color 150ms ease, background 150ms ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#E6EEF7";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A8F98";
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

      </div>
    </motion.nav>
  );
}
