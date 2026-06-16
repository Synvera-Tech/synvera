"use client";

import { X, CheckCircle2, Share2 } from "lucide-react";
import { compositionDemoData } from "@/lib/composition-demo-data";

interface CompositionDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fake QR Code SVG - simple grid pattern
function FakeQRCode() {
  const size = 120;
  const cellSize = 15;
  const cells = Math.floor(size / cellSize);

  const generateQRPattern = () => {
    const pattern = [];
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const isBlack = Math.random() > 0.5;
        pattern.push(
          <rect
            key={`${i}-${j}`}
            x={i * cellSize}
            y={j * cellSize}
            width={cellSize}
            height={cellSize}
            fill={isBlack ? "#000" : "#fff"}
          />
        );
      }
    }
    return pattern;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: "8px" }}
    >
      {generateQRPattern()}
    </svg>
  );
}

export function CompositionDemoModal({
  isOpen,
  onClose,
}: CompositionDemoModalProps) {
  if (!isOpen) return null;

  const data = compositionDemoData;

  return (
    <>
      <style>{`
        @keyframes modalGrowth {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-50%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(-50%) scale(1);
          }
        }

        @keyframes backdropFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .modal-backdrop {
          animation: backdropFade 200ms ease-out;
        }

        .modal-content {
          animation: modalGrowth 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 40,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal-content"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 50,
          width: "90%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#f5f3f0",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          pointerEvents: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#f5f3f0",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            zIndex: 51,
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "24px",
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              Composição Exemplo
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#6b6b6b",
              }}
            >
              {data.procedure.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: "8px",
              cursor: "pointer",
              color: "#6b6b6b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "#1a1a1a")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "#6b6b6b")
            }
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "24px",
            display: "grid",
            gap: "32px",
          }}
        >
          {/* Block 1: Total Value */}
          <div
            style={{
              backgroundColor: "#ede8e3",
              borderRadius: "10px",
              padding: "24px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Valor Total
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "40px",
                fontWeight: 800,
                color: "#1a5a96",
                lineHeight: 1,
              }}
            >
              R$ {data.totalValue.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Block 2: Main Procedure */}
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Procedimento Principal
            </p>
            <div
              style={{
                backgroundColor: "#f0ebe5",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                }}
              >
                {data.procedure.code}
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  color: "#3a3a3a",
                  lineHeight: 1.5,
                }}
              >
                {data.procedure.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6b6b6b",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "6px",
                }}
              >
                Porte {data.procedure.porte}
              </p>
            </div>
          </div>

          {/* Block 3: Composition */}
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Composição CBHPM
            </p>
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {data.components.map((component, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    backgroundColor: "#f0ebe5",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <CheckCircle2
                    size={20}
                    style={{
                      color: "#1a5a96",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "12px",
                        color: "#6b6b6b",
                        fontWeight: 600,
                      }}
                    >
                      {(component as any).code}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#3a3a3a",
                        lineHeight: 1.5,
                      }}
                    >
                      {component.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 4: Rule Applied */}
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Regra Aplicada
            </p>
            <div
              style={{
                backgroundColor: "#ede8e3",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1a5a96",
                }}
              >
                {data.rule.name}
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  color: "#3a3a3a",
                  lineHeight: 1.5,
                }}
              >
                {data.rule.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#6b6b6b",
                }}
              >
                {data.rule.details}
              </p>
            </div>
          </div>

          {/* Block 5: Team Breakdown */}
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Distribuição de Honorários
            </p>
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {data.teamBreakdown.map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f0ebe5",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#3a3a3a",
                      }}
                    >
                      {member.role}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#6b6b6b",
                      }}
                    >
                      {member.percentage}% do total
                    </p>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#1a5a96",
                    }}
                  >
                    R$ {member.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Block 6: Sharing */}
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b6b6b",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Compartilhamento
            </p>
            <div
              style={{
                backgroundColor: "#f0ebe5",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                display: "grid",
                gap: "20px",
              }}
            >
              {/* Share options */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    backgroundColor: "#e8dfd5",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    color: "#3a3a3a",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ddd1c5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8dfd5";
                  }}
                >
                  <Share2 size={16} />
                  Link Público
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    backgroundColor: "#e8dfd5",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    color: "#3a3a3a",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ddd1c5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8dfd5";
                  }}
                >
                  <Share2 size={16} />
                  Relatório PDF
                </button>
              </div>

              {/* QR Code */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b6b6b",
                    fontWeight: 600,
                  }}
                >
                  QR Code
                </p>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                >
                  <FakeQRCode />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            padding: "16px 24px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            backgroundColor: "#faf9f7",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "6px",
              color: "#3a3a3a",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
