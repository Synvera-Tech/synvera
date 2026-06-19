"use client";

import { motion, type Variants } from "framer-motion";
import { Search, List, Zap, Share2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Pesquise",
    desc: "Localize o procedimento SBN na base atualizada.",
  },
  {
    icon: List,
    title: "Revise",
    desc: "Analise códigos, ajustes e multiplicadores passo a passo.",
  },
  {
    icon: Zap,
    title: "Calcule",
    desc: "Obtenha valores imediatos para toda a equipe.",
  },
  {
    icon: Share2,
    title: "Compartilhe",
    desc: "Exporte relatórios via link ou QR Code para faturamento.",
  },
];

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.05 },
  },
};

const stepVariant: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const connectorStyle = {
  background: "linear-gradient(90deg, #5e6ad2, transparent)",
  transformOrigin: "left" as const,
};

export function FlowSection() {
  return (
    <section className="py-32 px-4" id="como-funciona">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-3xl md:text-4xl font-bold mb-4 text-[#E6EEF7]">
            Fluxo simples e determinístico
          </h2>
          <p className="text-[#8A8F98] text-lg">
            Processamento em tempo real baseado em regras oficiais.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row items-start justify-center"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="contents">
                <motion.div
                  variants={stepVariant}
                  className="flex-1 flex flex-col items-center px-6 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#5e6ad2]/50 transition-colors duration-200 shadow-lg">
                    <Icon className="w-6 h-6 text-[#5e6ad2]" />
                  </div>
                  <h3 className="font-grotesk font-bold mb-3 text-[#E6EEF7]">{step.title}</h3>
                  <p className="text-sm text-[#8A8F98] leading-relaxed max-w-[180px]">{step.desc}</p>
                </motion.div>

                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center pt-8 flex-shrink-0">
                    <motion.div
                      className="h-px w-24"
                      style={connectorStyle}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.55, delay: 0.3 + i * 0.14, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
