"use client";

import type { ReactNode, MouseEvent } from "react";

function SocialIcon({
  href,
  label,
  hoverBorder,
  hoverGlow,
  hoverColor,
  children,
}: {
  href: string;
  label: string;
  hoverBorder: string;
  hoverGlow: string;
  hoverColor: string;
  children: ReactNode;
}) {
  const prevent = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

  return (
    <a
      href={href}
      onClick={prevent}
      aria-label={label}
      style={{
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        border: "1px solid rgba(120,148,184,0.12)",
        background: "rgba(255,255,255,0.03)",
        color: "#8A8F98",
        textDecoration: "none",
        transition: "border-color 200ms ease, color 200ms ease, box-shadow 200ms ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorder;
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.boxShadow = hoverGlow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(120,148,184,0.12)";
        e.currentTarget.style.color = "#8A8F98";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </a>
  );
}

export function Footer() {
  const preventNav = (e: MouseEvent) => e.preventDefault();

  return (
    <footer
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        borderTop: "1px solid rgba(120,148,184,0.08)",
      }}
      className="px-4 pt-12 pb-9"
    >
      <div className="max-w-5xl mx-auto">
        {/* Main row */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 mb-10">

          {/* Brand + tagline */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand/synvera-symbol-light.svg"
                alt="Synvera"
                style={{ width: "26px", height: "26px" }}
              />
              <span
                className="font-grotesk font-extrabold tracking-tight"
                style={{ fontSize: "15px", color: "#E6EEF7" }}
              >
                Synvera
              </span>
            </div>
            <p
              className="text-center md:text-left leading-relaxed"
              style={{ fontSize: "12px", color: "#8A8F98", maxWidth: "210px" }}
            >
              Valoração de honorários médicos para neurocirurgia e coluna vertebral.
            </p>
          </div>

          {/* Social + WhatsApp */}
          <div className="flex flex-col items-center md:items-end gap-4">
            {/* Icon row */}
            <div className="flex items-center gap-2.5">
              <SocialIcon
                href="#"
                label="Instagram"
                hoverBorder="rgba(225,48,108,0.38)"
                hoverGlow="0 0 14px rgba(225,48,108,0.18)"
                hoverColor="#e1306c"
              >
                {/* Instagram */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </SocialIcon>

              <SocialIcon
                href="#"
                label="LinkedIn"
                hoverBorder="rgba(10,102,194,0.38)"
                hoverGlow="0 0 14px rgba(10,102,194,0.18)"
                hoverColor="#4fa3e0"
              >
                {/* LinkedIn */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialIcon>
            </div>

            {/* WhatsApp pill */}
            <button
              type="button"
              onClick={preventNav}
              className="flex items-center gap-2 font-semibold"
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(37,211,102,0.20)",
                background: "rgba(37,211,102,0.04)",
                fontSize: "12px",
                color: "#8A8F98",
                cursor: "default",
                transition: "border-color 200ms ease, color 200ms ease, box-shadow 200ms ease, background 200ms ease",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(37,211,102,0.38)";
                e.currentTarget.style.color = "#b8c2d0";
                e.currentTarget.style.boxShadow = "0 0 16px rgba(37,211,102,0.10)";
                e.currentTarget.style.background = "rgba(37,211,102,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(37,211,102,0.20)";
                e.currentTarget.style.color = "#8A8F98";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "rgba(37,211,102,0.04)";
              }}
            >
              {/* WhatsApp icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: "rgba(37,211,102,0.7)", flexShrink: 0 }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Contato via WhatsApp
            </button>
          </div>
        </div>

        {/* Gradient divider */}
        <div
          className="mb-5"
          style={{
            height: "1px",
            background: "linear-gradient(to right, transparent, rgba(120,148,184,0.13), transparent)",
          }}
        />

        {/* Copyright */}
        <p
          className="text-center"
          style={{ fontSize: "11px", fontWeight: 500, color: "rgba(138,143,152,0.5)" }}
        >
          2026 · LabF5 · Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
