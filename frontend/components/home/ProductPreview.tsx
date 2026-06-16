"use client";

import { useEffect, useState } from "react";
import { Calculator, Share2, Check } from "lucide-react";

const VALUES = [
  "R$ 26.263,16",
  "R$ 14.882,44",
  "R$ 8.321,17",
];

export function ProductPreview() {
  const [currentValueIndex, setCurrentValueIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValueIndex((prev) => (prev + 1) % VALUES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #0B0D10 0%, #050508 100%)",
        borderTop: "1px solid rgba(35,37,42,0.6)",
      }}
    >

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
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

        {/* Preview mockup */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "center",
            animation: "fadeInScale 0.8s ease-out 0.2s both",
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const mockup = e.currentTarget.querySelector("[data-mockup]") as HTMLElement;
            if (mockup) {
              mockup.style.transform = `perspective(1000px) rotateX(${(y - 0.5) * 5}deg) rotateY(${(x - 0.5) * 5}deg)`;
            }
          }}
          onMouseLeave={(e) => {
            const mockup = e.currentTarget.querySelector("[data-mockup]") as HTMLElement;
            if (mockup) {
              mockup.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
            }
          }}
        >
          {/* Left: mockup */}
          <div
            data-mockup
            style={{
              background: "#0f1011",
              border: "1px solid rgba(120,148,184,0.16)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.15)",
              transition: "all 500ms ease-out",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Mock header */}
            <div
              style={{
                background: "rgba(20,21,22,0.9)",
                borderBottom: "1px solid rgba(35,37,42,0.6)",
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calculator size={16} style={{ color: "#5e6ad2" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#f7f8f8" }}>Valoração</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#8a8f98" }}>CBHPM 2025</span>
            </div>

            {/* Mock value display - dynamic */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#8a8f98" }}>Valor Total</p>
              <div style={{ position: "relative", height: "36px", display: "flex", alignItems: "center" }}>
                {VALUES.map((value, idx) => (
                  <p
                    key={idx}
                    style={{
                      position: "absolute",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#f7f8f8",
                      transition: "opacity 250ms ease-in-out",
                      opacity: idx === currentValueIndex ? 1 : 0,
                    }}
                  >
                    {value}
                  </p>
                ))}
              </div>
            </div>

            {/* Mock procedures */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: "#8a8f98", textTransform: "uppercase" }}>
                Procedimentos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {["Craniectomia", "Drenagem subdural"].map((proc) => (
                  <div
                    key={proc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: "linear-gradient(180deg, rgba(120,148,184,0.08), rgba(120,148,184,0.03))",
                      border: "1px solid rgba(120,148,184,0.16)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      color: "#d0d6e0",
                    }}
                  >
                    <Check size={14} style={{ color: "#6F8FB8", flexShrink: 0 }} />
                    {proc}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock share button */}
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 16px",
                background: "rgba(120,148,184,0.12)",
                border: "1px solid rgba(120,148,184,0.24)",
                borderRadius: "6px",
                color: "#f7f8f8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
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
              <Share2 size={14} />
              Compartilhar com QR Code
            </button>
          </div>

          {/* Right: benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                title: "Cálculo Determinístico",
                description: "Mesma entrada sempre gera o mesmo resultado, garantido por regras da CBHPM.",
                icon: "✓",
              },
              {
                title: "Composições Reutilizáveis",
                description: "Monte uma composição uma vez, use múltiplas vezes com diferentes ajustes.",
                icon: "✓",
              },
              {
                title: "Relatórios Compartilháveis",
                description: "Gere um link ou QR code para compartilhar cálculos com colegas.",
                icon: "✓",
              },
              {
                title: "Histórico de Cálculos",
                description: "Acesse todos os seus cálculos anteriores e revise quando necessário.",
                icon: "✓",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                style={{
                  animation: `slideInRight 0.7s ease-out ${0.3 + i * 0.1}s both`,
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
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
                    {benefit.icon}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
