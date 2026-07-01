"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Experiência",    href: "#experiencia" },
  { label: "Como funciona",  href: "#como-funciona" },
  { label: "Recursos",       href: "#recursos" },
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

        // Glass pill — frosted dark surface.
        // background at 0.28 (not 0.42) exposes 72% of the blurred content,
        // making the frosted effect visible instead of hidden under the fill.
        // brightness(1.08) is conservative — lifts the blur slightly without
        // amplifying the hero's indigo bloom into a solid color fill.
        display: "flex",
        alignItems: "center",
        borderRadius: "9999px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "rgba(19, 16, 11, 0.28)",
        backdropFilter: "blur(28px) saturate(180%) brightness(1.08)",
        WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(1.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 0 -1px 0 rgba(255,255,255,0.05)",
          "0 20px 70px rgba(0,0,0,0.42)",
          "0 0 42px rgba(201, 168, 103,0.14)",
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
              color: "#F6F1E7",
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
              color: "rgba(246, 241, 231,0.55)",
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
              color: "rgba(246, 241, 231,0.65)",
              background: "transparent",
              textDecoration: "none",
              cursor: "pointer",
              transition: "color 150ms ease, background 150ms ease",
              whiteSpace: "nowrap",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F6F1E7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(246, 241, 231,0.65)";
              e.currentTarget.style.background = "transparent";
            }}
            onFocus={(e) => {
              e.currentTarget.style.color = "#F6F1E7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.color = "rgba(246, 241, 231,0.65)";
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
              color: "rgba(246, 241, 231,0.65)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: "9999px",
              transition: "color 150ms ease, background 150ms ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F6F1E7";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(246, 241, 231,0.65)";
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
            background: "#C9A867",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 2px 12px rgba(201, 168, 103,0.42)",
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
