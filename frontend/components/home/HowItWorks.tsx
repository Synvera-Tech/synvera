"use client";

import { Search, CheckSquare, Zap, Share2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Pesquise o procedimento",
    description: "Encontre o procedimento SBN na base atualizada de neurocirurgias.",
  },
  {
    icon: CheckSquare,
    title: "Revise a composição CBHPM",
    description: "Analise os códigos selecionados, ajustes e cálculos passo a passo.",
  },
  {
    icon: Zap,
    title: "Calcule os honorários",
    description: "Obtenha o valor para cirurgião, auxiliares e anestesista instantaneamente.",
  },
  {
    icon: Share2,
    title: "Compartilhe o relatório",
    description: "Exporte, compartilhe por link ou QR code com colegas e pacientes.",
  },
];

export function HowItWorks() {
  return (
    <section
      style={{
        padding: "80px 24px 100px",
        background: "linear-gradient(180deg, #050508 0%, #0B0D10 100%)",
        borderTop: "1px solid rgba(35,37,42,0.6)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "32px",
              fontWeight: 700,
              color: "#f7f8f8",
              letterSpacing: "-0.8px",
              animation: "slideUp 0.7s ease-out",
            }}
          >
            Como funciona
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
            Fluxo simples e determinístico, baseado em regras oficiais
          </p>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                style={{
                  padding: "32px 24px",
                  background: "#0f1011",
                  border: "1px solid rgba(35,37,42,0.8)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "all 200ms ease",
                  animation: `slideUp 0.7s ease-out ${0.2 + index * 0.1}s both`,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(15,16,17,0.8)";
                  e.currentTarget.style.borderColor = "rgba(120,148,184,0.32)";
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0f1011";
                  e.currentTarget.style.borderColor = "rgba(35,37,42,0.8)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(94,106,210,0.2), rgba(94,106,210,0.1))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#5e6ad2",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "rgba(120,148,184,0.2)",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#f7f8f8",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      color: "#8a8f98",
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
