"use client";

import { X, CheckCircle2, Share2 } from "lucide-react";
import { compositionDemoData } from "@/lib/composition-demo-data";

interface CompositionDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompositionDemoModal({
  isOpen,
  onClose,
}: CompositionDemoModalProps) {
  if (!isOpen) return null;

  const data = compositionDemoData;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 200ms ease-out",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: isOpen
            ? "translateX(-50%) translateY(-50%) scale(1)"
            : "translateX(-50%) translateY(-50%) scale(0.95)",
          opacity: isOpen ? 1 : 0,
          transition: "all 200ms ease-out",
          zIndex: 50,
          width: "90%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#0a0a0c",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
          border: "1px solid rgba(120, 148, 184, 0.16)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#0a0a0c",
            borderBottom: "1px solid rgba(120, 148, 184, 0.08)",
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
                color: "#f7f8f8",
              }}
            >
              Composição Exemplo
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#8a8f98",
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
              color: "#8a8f98",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "#d0d6e0")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "#8a8f98")
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
              backgroundColor: "rgba(94, 106, 210, 0.04)",
              borderRadius: "10px",
              padding: "24px",
              border: "1px solid rgba(94, 106, 210, 0.12)",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#8a8f98",
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
                color: "#5e6ad2",
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
                color: "#8a8f98",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Procedimento Principal
            </p>
            <div
              style={{
                backgroundColor: "rgba(120, 148, 184, 0.04)",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(120, 148, 184, 0.12)",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#f7f8f8",
                }}
              >
                {data.procedure.code}
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  color: "#d0d6e0",
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
                  color: "#8a8f98",
                  backgroundColor: "rgba(120, 148, 184, 0.08)",
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
                color: "#8a8f98",
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
                    backgroundColor: "rgba(120, 148, 184, 0.04)",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid rgba(120, 148, 184, 0.12)",
                  }}
                >
                  <CheckCircle2
                    size={20}
                    style={{
                      color: "#5e6ad2",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#d0d6e0",
                      lineHeight: 1.5,
                    }}
                  >
                    {component.description}
                  </p>
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
                color: "#8a8f98",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Regra Aplicada
            </p>
            <div
              style={{
                backgroundColor: "rgba(94, 106, 210, 0.04)",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(94, 106, 210, 0.12)",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#5e6ad2",
                }}
              >
                {data.rule.name}
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  color: "#d0d6e0",
                  lineHeight: 1.5,
                }}
              >
                {data.rule.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#8a8f98",
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
                color: "#8a8f98",
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
                    backgroundColor: "rgba(120, 148, 184, 0.04)",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid rgba(120, 148, 184, 0.12)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#d0d6e0",
                      }}
                    >
                      {member.role}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#8a8f98",
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
                      color: "#5e6ad2",
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
                color: "#8a8f98",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Compartilhamento
            </p>
            <div
              style={{
                backgroundColor: "rgba(120, 148, 184, 0.04)",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(120, 148, 184, 0.12)",
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
                    gap: "8px",
                    padding: "12px 16px",
                    backgroundColor: "rgba(94, 106, 210, 0.08)",
                    border: "1px solid rgba(94, 106, 210, 0.24)",
                    borderRadius: "8px",
                    color: "#d0d6e0",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(94, 106, 210, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(94, 106, 210, 0.08)";
                  }}
                >
                  <Share2 size={16} />
                  Link Público
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    backgroundColor: "rgba(94, 106, 210, 0.08)",
                    border: "1px solid rgba(94, 106, 210, 0.24)",
                    borderRadius: "8px",
                    color: "#d0d6e0",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(94, 106, 210, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(94, 106, 210, 0.08)";
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
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#8a8f98",
                    fontWeight: 600,
                  }}
                >
                  QR Code
                </p>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: "#333",
                    fontWeight: 600,
                  }}
                >
                  [QR Code]
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(120, 148, 184, 0.08)",
            padding: "16px 24px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid rgba(120, 148, 184, 0.24)",
              borderRadius: "6px",
              color: "#d0d6e0",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(120, 148, 184, 0.08)";
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
