"use client";

import { BookmarkCheck, Clock, Share2, FileText } from "lucide-react";

const features = [
  {
    icon: BookmarkCheck,
    title: "Composições Reutilizáveis",
    description: "Salve composições para reutilizar em novos cálculos com diferentes ajustes.",
  },
  {
    icon: Clock,
    title: "Histórico Completo",
    description: "Acesse todos os seus cálculos anteriores e revise a qualquer momento.",
  },
  {
    icon: Share2,
    title: "Compartilhamento com QR",
    description: "Gere links compartilháveis e QR codes para distribuir relatórios.",
  },
  {
    icon: FileText,
    title: "Consulta Documental",
    description: "Acesse fundamentos CBHPM e SBN diretamente na plataforma.",
  },
];

export function FeaturesGrid() {
  return (
    <section
      style={{
        padding: "80px 24px 120px",
        background: "linear-gradient(180deg, #0B0D10 0%, #050508 100%)",
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
            Recursos principais
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
            Tudo que um cirurgião premium precisa para gerenciar valorações
          </p>
        </div>

        {/* Features grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                style={{
                  padding: "28px 24px",
                  background: "#0f1011",
                  border: "1px solid rgba(35,37,42,0.8)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "all 200ms ease",
                  animation: `fadeInScale 0.6s ease-out ${0.2 + index * 0.1}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#141516";
                  e.currentTarget.style.borderColor = "rgba(120,148,184,0.24)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0f1011";
                  e.currentTarget.style.borderColor = "rgba(35,37,42,0.8)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, rgba(94,106,210,0.20), rgba(94,106,210,0.10))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#5e6ad2",
                    transition: "all 300ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(94,106,210,0.30), rgba(94,106,210,0.20))";
                    e.currentTarget.style.transform = "scale(1.1) rotate(5deg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(94,106,210,0.20), rgba(94,106,210,0.10))";
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#f7f8f8",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      color: "#8a8f98",
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
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
