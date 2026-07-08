"use client";

import { motion } from "framer-motion";
import { BookMarked, ScrollText, GitBranch, Lock, Sparkles } from "lucide-react";

// Authority-based trust signals. Every claim here is verifiable and true today:
// no fabricated testimonials, no invented usage counters. Real social proof
// (physician testimonials, processed-calculation metrics) plugs in later, only
// once it exists.

const pillars = [
  {
    icon: BookMarked,
    title: "Baseado na CBHPM 2025-2026",
    desc: "Cálculos ancorados na edição vigente da CBHPM, versionada e auditável. Nunca uma tabela indefinida.",
  },
  {
    icon: ScrollText,
    title: "Diretrizes SBN e Coluna",
    desc: "Regras extraídas dos Manuais SBN Neurocirurgia 2018 e Cirurgia de Coluna Vertebral 3ª ed. 2025, com proveniência.",
  },
  {
    icon: GitBranch,
    title: "Motor determinístico e auditável",
    desc: "Cada cálculo é reproduzível e rastreável até a regra aplicada. É o oposto de uma caixa-preta de IA.",
  },
  {
    icon: Lock,
    title: "Privacy-first",
    desc: "Procedimentos e preços reais nunca são registrados em log. Seus dados clínicos permanecem seus.",
  },
];

export function TrustSection() {
  return (
    <section
      id="confianca"
      className="relative overflow-hidden px-4 py-32"
      style={{
        background: "linear-gradient(180deg, #050508 0%, #0B0A09 100%)",
        scrollMarginTop: "88px",
      }}
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          className="mx-auto max-w-2xl space-y-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-4xl font-bold leading-tight text-[#F6F1E7] md:text-5xl">
            Confiança construída sobre fontes, não sobre números
          </h2>
          <p className="text-lg leading-relaxed text-[#9B9387]">
            Sem depoimentos fabricados nem contadores inflados. A credibilidade do Synvera vem das
            normas oficiais em que ele se apoia e da rastreabilidade de cada cálculo.
          </p>
        </motion.div>

        {/* Authority pillars */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-200 hover:border-[#C9A867]/24"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#C9A867]/10">
                  <Icon className="h-5 w-5 text-[#C9A867]" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[#F6F1E7]">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-[#9B9387]">{pillar.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Honest early-access banner */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-[#C9A867]/20 bg-[#C9A867]/[0.06] px-6 py-5 text-center sm:flex-row sm:justify-center sm:text-left"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A867]/15">
            <Sparkles className="h-4 w-4 text-[#C9A867]" />
          </div>
          <p className="text-sm text-[#DFDAD1]">
            <span className="font-semibold text-[#F6F1E7]">Em fase inicial.</span>{" "}
            Construído por e para neurocirurgiões — entre cedo e ajude a moldar a ferramenta.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
