"use client";

import { useEffect, useState } from "react";
import { Calculator, Share2, Check, QrCode } from "lucide-react";

const PREVIEW_SCENARIOS = [
  {
    total: "R$ 26.263,16",
    mainProcedure: "Craniectomia descompressiva",
    rule: "SBN + CBHPM 2025 + Auxiliares",
    auxiliaryProcedures: [
      "Drenagem subdural",
      "Monitorização neurológica"
    ]
  },
  {
    total: "R$ 14.882,44",
    mainProcedure: "Derivação ventrículo-peritoneal",
    rule: "CBHPM 4.1 + composição agregada",
    auxiliaryProcedures: [
      "Implante de cateter ventricular",
      "Implante de cateter peritoneal"
    ]
  },
  {
    total: "R$ 8.321,17",
    mainProcedure: "Infiltração de coluna",
    rule: "CBHPM + variável por estrutura",
    auxiliaryProcedures: [
      "Infiltração facetária",
      "Bloqueio foraminal"
    ]
  }
];

export function ProductPreview() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const currentScenario = PREVIEW_SCENARIOS[currentScenarioIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentScenarioIndex((prev) => (prev + 1) % PREVIEW_SCENARIOS.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        padding: "80px 24px 100px",
        background: "linear-gradient(180deg, #0B0D10 0%, #050508 100%)",
        borderTop: "1px solid rgba(35,37,42,0.6)",
        marginTop: "-60px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <style>{`
        .preview-content {
          transition:
            opacity 300ms ease,
            transform 300ms ease;
        }

        .preview-content.transitioning {
          opacity: 0;
          transform: translateY(-12px);
        }

        @media (prefers-reduced-motion: reduce) {
          .preview-content {
            transition: none;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "48px", animation: "slideUp 0.7s ease-out" }}>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "32px",
              fontWeight: 700,
              color: "#f7f8f8",
              letterSpacing: "-0.8px",
            }}
          >
            Experiência intuitiva e precisa
          </h2>
          <p
            style={{
              margin: "0",
              fontSize: "16px",
              color: "#d0d6e0",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
              animation: "slideUp 0.7s ease-out 0.1s both",
            }}
          >
            Interface projetada para precisão, cada detalhe conta
          </p>
        </div>

        {/* Preview mockup - Enhanced Product Screen */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "flex-start",
            animation: "fadeInScale 0.8s ease-out 0.2s both",
          }}
        >
          {/* Left: Product interface mockup */}
          <div
            style={{
              background: "#0f1011",
              border: "1px solid rgba(120,148,184,0.16)",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.20), 0 8px 32px rgba(0,0,0,0.15)",
              animation: "slideUp 0.7s ease-out 0.3s both",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "rgba(20,21,22,0.9)",
                borderBottom: "1px solid rgba(35,37,42,0.6)",
                padding: "14px 16px",
                marginBottom: "28px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "slideUp 0.7s ease-out 0.35s both",
              }}
            >
              <Calculator size={16} style={{ color: "#5e6ad2" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#f7f8f8" }}>Valoração</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#8a8f98" }}>CBHPM 2025</span>
            </div>

            {/* Content that transitions - Caminho A */}
            <div
              className={`preview-content${isTransitioning ? " transitioning" : ""}`}
              style={{
                animation: "slideUp 0.7s ease-out 0.4s both",
              }}
            >
              {/* Total value - HERO of the preview */}
              <div style={{ marginBottom: "32px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.5px" }}>Valor Total</p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "40px",
                    fontWeight: 800,
                    color: "#f7f8f8",
                    letterSpacing: "-1px",
                  }}
                >
                  {currentScenario.total}
                </p>
              </div>

              {/* Main procedure */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.5px" }}>Procedimento Principal</p>
                <div style={{
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, rgba(94,106,210,0.15), rgba(94,106,210,0.05))",
                  border: "1px solid rgba(94,106,210,0.2)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#f7f8f8",
                }}>
                  {currentScenario.mainProcedure}
                </div>
              </div>

              {/* Applied rule */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.5px" }}>Regra Aplicada</p>
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(120,148,184,0.08)",
                  border: "1px solid rgba(120,148,184,0.16)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#d0d6e0",
                  fontFamily: "monospace",
                }}>
                  {currentScenario.rule}
                </div>
              </div>

              {/* Auxiliary procedures */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.5px" }}>Procedimentos Auxiliares</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {currentScenario.auxiliaryProcedures.map((proc) => (
                    <div
                      key={proc}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        background: "linear-gradient(180deg, rgba(120,148,184,0.08), rgba(120,148,184,0.03))",
                        border: "1px solid rgba(120,148,184,0.16)",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        color: "#d0d6e0",
                      }}
                    >
                      <Check size={14} style={{ color: "#6F8FB8", flexShrink: 0 }} />
                      {proc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom actions - QR + Share */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* QR Code mockup */}
                <div
                  style={{
                    padding: "16px",
                    background: "rgba(120,148,184,0.08)",
                    border: "1px solid rgba(120,148,184,0.16)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(120,148,184,0.12)";
                    e.currentTarget.style.borderColor = "rgba(120,148,184,0.24)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(120,148,184,0.08)";
                    e.currentTarget.style.borderColor = "rgba(120,148,184,0.16)";
                  }}
                >
                  <QrCode size={20} style={{ color: "#5e6ad2" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#8a8f98" }}>QR Code</span>
                </div>

                {/* Share button */}
                <button
                  style={{
                    padding: "16px",
                    background: "rgba(120,148,184,0.12)",
                    border: "1px solid rgba(120,148,184,0.24)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    color: "#f7f8f8",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(120,148,184,0.18)";
                    e.currentTarget.style.borderColor = "rgba(143,163,191,0.32)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(120,148,184,0.12)";
                    e.currentTarget.style.borderColor = "rgba(120,148,184,0.24)";
                  }}
                >
                  <Share2 size={20} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Key benefits staggered */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "4px" }}>
            {[
              {
                title: "Cálculo Determinístico",
                description: "Mesma entrada sempre gera o mesmo resultado, garantido por regras da CBHPM.",
              },
              {
                title: "Composições Reutilizáveis",
                description: "Monte uma composição uma vez, use múltiplas vezes com diferentes ajustes.",
              },
              {
                title: "Compartilhamento Seguro",
                description: "Gere um link ou QR code para compartilhar cálculos com colegas e pacientes.",
              },
              {
                title: "Histórico Completo",
                description: "Acesse todos os seus cálculos anteriores e revise quando necessário.",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "14px",
                  animation: `slideInRight 0.7s ease-out ${0.4 + i * 0.08}s both`,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, rgba(94,106,210,0.2), rgba(94,106,210,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#5e6ad2",
                    fontWeight: 700,
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#f7f8f8" }}>
                    {benefit.title}
                  </h3>
                  <p style={{ margin: "0", fontSize: "13px", color: "#8a8f98", lineHeight: 1.6 }}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
