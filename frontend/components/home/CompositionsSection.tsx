"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookmarkCheck, Check, Plus } from "lucide-react";

type CompositionCode = {
  code: string;
  name: string;
  porte: string;
  value: string;
  isPrincipal?: boolean;
};

type Composition = {
  name: string;
  subtitle: string;
  lastUsed: string;
  rule: string;
  total: string;
  codes: CompositionCode[];
};

const compositions: Composition[] = [
  {
    name: "Artrodese Cervical",
    subtitle: "Artrodese Cervical — 3 níveis",
    lastUsed: "2h atrás",
    rule: "CBHPM 4.1 — mesma via de acesso",
    total: "R$ 7.340,00",
    codes: [
      {
        code: "3.07.15.11-0",
        name: "Artrodese anterior com instrumentação",
        porte: "14C",
        value: "R$ 4.210,00",
        isPrincipal: true,
      },
      {
        code: "3.07.15.02-1",
        name: "Descompressão medular anterior",
        porte: "10C",
        value: "R$ 2.150,00",
      },
      {
        code: "3.07.15.18-7",
        name: "Enxerto ósseo autólogo",
        porte: "8C",
        value: "R$ 980,00",
      },
    ],
  },
  {
    name: "Craniotomia Descomp.",
    subtitle: "Craniotomia Descompressiva",
    lastUsed: "1d atrás",
    rule: "CBHPM 4.1 — via única",
    total: "R$ 8.040,00",
    codes: [
      {
        code: "3.04.01.01-0",
        name: "Craniotomia descompressiva",
        porte: "18A",
        value: "R$ 6.800,00",
        isPrincipal: true,
      },
      {
        code: "3.04.01.04-5",
        name: "Monitorização intracraniana contínua",
        porte: "8B",
        value: "R$ 1.240,00",
      },
    ],
  },
  {
    name: "Infiltração Facetária",
    subtitle: "Infiltração Facetária Lombar",
    lastUsed: "3d atrás",
    rule: "CBHPM 4.1 — via única",
    total: "R$ 1.830,00",
    codes: [
      {
        code: "3.07.12.06-3",
        name: "Bloqueio facetário bilateral lombossacro",
        porte: "6C",
        value: "R$ 1.450,00",
        isPrincipal: true,
      },
      {
        code: "3.07.12.07-1",
        name: "Fluoroscopia intraoperatória",
        porte: "4A",
        value: "R$ 380,00",
      },
    ],
  },
  {
    name: "Hematoma Intracraniano",
    subtitle: "Hematoma Intracraniano — Tratamento Cir.",
    lastUsed: "1sem atrás",
    rule: "CBHPM 4.1 — via única",
    total: "R$ 14.700,00",
    codes: [
      {
        code: "3.04.05.01-4",
        name: "Tratamento cirúrgico do hematoma intracraniano",
        porte: "18A",
        value: "R$ 12.600,00",
        isPrincipal: true,
      },
      {
        code: "3.04.08.03-3",
        name: "Monitorização neurofisiológica intraoperatória",
        porte: "8B",
        value: "R$ 2.100,00",
      },
    ],
  },
];

export function CompositionsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const active = compositions[activeIndex];

  return (
    <section
      className="py-32 px-4"
      style={{ backgroundColor: "rgba(6,7,9,0.55)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          className="max-w-2xl mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-4xl font-bold mb-4 text-[#E6EEF7]">
            Sua biblioteca de composições cirúrgicas
          </h2>
          <p className="text-[#8A8F98] text-lg">
            Salve modelos para procedimentos recorrentes e aplique com um clique.
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-4xl rounded-2xl overflow-hidden text-left"
          style={{
            background: "rgba(10,11,13,0.80)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(120,148,184,0.11)",
            boxShadow: "0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3) inset",
          }}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{
              background: "rgba(0,0,0,0.28)",
              borderBottom: "1px solid rgba(120,148,184,0.07)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <BookmarkCheck className="w-4 h-4 text-[#5e6ad2]" />
              <span className="text-[13px] font-bold text-[#c4cdd8]">Minhas Composições</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#818cf8]"
              style={{
                background: "rgba(94,106,210,0.12)",
                border: "1px solid rgba(94,106,210,0.22)",
              }}
            >
              <Plus className="w-3 h-3" />
              Nova
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row">
            {/* Sidebar — mobile: horizontal scroll; desktop: vertical list */}
            <div
              className="flex-shrink-0 md:w-52"
              style={{
                background: "rgba(0,0,0,0.18)",
                borderRight: "1px solid rgba(120,148,184,0.06)",
              }}
            >
              {/* Mobile tabs */}
              <div className="flex md:hidden gap-1 p-3 overflow-x-auto">
                {compositions.map((comp, i) => (
                  <button
                    key={comp.name}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors duration-150 flex-shrink-0"
                    style={{
                      background:
                        i === activeIndex ? "rgba(94,106,210,0.14)" : "transparent",
                      color: i === activeIndex ? "#818cf8" : "#8A8F98",
                    }}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>

              {/* Desktop list */}
              <div className="hidden md:block p-3 space-y-0.5">
                {compositions.map((comp, i) => (
                  <button
                    key={comp.name}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-colors duration-150"
                    style={{
                      background:
                        i === activeIndex ? "rgba(94,106,210,0.11)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (i !== activeIndex)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (i !== activeIndex)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                    }}
                  >
                    <div
                      className="text-[12px] font-bold leading-tight"
                      style={{ color: i === activeIndex ? "#818cf8" : "#c4cdd8" }}
                    >
                      {comp.name}
                    </div>
                    <div
                      className="text-[10px] font-medium mt-0.5 leading-none"
                      style={{
                        color:
                          i === activeIndex
                            ? "rgba(129,140,248,0.55)"
                            : "rgba(138,143,152,0.6)",
                      }}
                    >
                      {comp.lastUsed}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content panel */}
            <div
              className="flex-1 overflow-hidden relative"
              style={{ minHeight: "390px" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: shouldReduceMotion ? 0.01 : 0.38,
                      ease: "easeOut",
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : -6,
                    transition: {
                      duration: shouldReduceMotion ? 0.01 : 0.18,
                      ease: "easeIn",
                    },
                  }}
                  className="absolute inset-0 flex flex-col gap-5 overflow-y-auto p-6"
                >
                  {/* Panel header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#E6EEF7] leading-tight">
                        {active.subtitle}
                      </h4>
                      <p className="text-[10px] font-mono text-[#8A8F98]/80 mt-1">
                        {active.rule}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#8A8F98]/60 whitespace-nowrap flex-shrink-0 pt-0.5">
                      {active.lastUsed}
                    </span>
                  </div>

                  {/* Code cards */}
                  <div className="space-y-2">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.5px] mb-3"
                      style={{ color: "rgba(138,143,152,0.55)" }}
                    >
                      Composição CBHPM
                    </div>
                    {active.codes.map((c) => (
                      <div
                        key={c.code}
                        className="flex items-start gap-3"
                        style={{
                          background: c.isPrincipal
                            ? "rgba(94,106,210,0.07)"
                            : "rgba(255,255,255,0.027)",
                          border: `1px solid ${
                            c.isPrincipal
                              ? "rgba(94,106,210,0.22)"
                              : "rgba(120,148,184,0.1)"
                          }`,
                          borderRadius: "14px",
                          padding: "10px 12px",
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="mt-0.5 flex-shrink-0 flex items-center justify-center rounded"
                          style={{
                            width: "18px",
                            height: "18px",
                            background: "#5e6ad2",
                            borderRadius: "4px",
                          }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>

                        {/* Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[11px] font-semibold text-[#8A8F98]">
                              {c.code}
                            </span>
                            <span
                              style={{
                                border: "1px solid rgba(94,106,210,0.35)",
                                borderRadius: "6px",
                                padding: "1px 6px",
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#818cf8",
                                lineHeight: 1.4,
                              }}
                            >
                              {c.porte}
                            </span>
                            {c.isPrincipal && (
                              <span
                                style={{
                                  background: "rgba(94,106,210,0.12)",
                                  borderRadius: "4px",
                                  padding: "1px 5px",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  color: "#818cf8",
                                }}
                              >
                                principal
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[12px] leading-snug"
                            style={{ color: "#b8c2d0" }}
                          >
                            {c.name}
                          </p>
                        </div>

                        {/* Value */}
                        <span
                          className="font-grotesk flex-shrink-0 mt-0.5"
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#E6EEF7",
                          }}
                        >
                          {c.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total strip */}
                  <div
                    className="mt-auto flex items-center justify-between rounded-xl px-4 py-3.5"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(28,48,85,0.6), rgba(18,32,60,0.75))",
                      border: "1px solid rgba(94,106,210,0.2)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.5px] mb-0.5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        Valor Base
                      </p>
                      <p
                        className="font-grotesk font-bold leading-none"
                        style={{ fontSize: "22px", color: "#E6EEF7" }}
                      >
                        {active.total}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-[12px] font-bold px-4 py-2 rounded-lg transition-colors"
                      style={{
                        color: "#818cf8",
                        border: "1px solid rgba(94,106,210,0.28)",
                        background: "transparent",
                      }}
                    >
                      Usar como base
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
