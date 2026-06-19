"use client";

import { motion } from "framer-motion";
import { History, FileText, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: History,
    title: "Preservação do Racional",
    desc: "Justificativa técnica detalhada para cada agrupamento cirúrgico.",
  },
  {
    icon: FileText,
    title: "Rastreabilidade de Códigos",
    desc: "Consulte a diretriz da CBHPM aplicada para cada multiplicador.",
  },
  {
    icon: ShieldCheck,
    title: "Memória Imutável",
    desc: "Histórico temporal consolidado para auditorias internas seguras.",
  },
];

const meshStyle = {
  backgroundImage: [
    "radial-gradient(at 0% 0%, rgba(94,106,210,0.15) 0px, transparent 50%)",
    "radial-gradient(at 100% 0%, rgba(122,139,255,0.1) 0px, transparent 50%)",
    "radial-gradient(at 50% 100%, rgba(30,58,95,0.15) 0px, transparent 50%)",
  ].join(", "),
};

export function AuditabilitySection() {
  return (
    <section className="py-32 px-4 relative overflow-hidden" id="produto">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={meshStyle} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left: text + feature cards */}
        <div className="space-y-8 text-left">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-grotesk text-4xl md:text-5xl font-bold leading-tight text-[#E6EEF7]">
              Auditabilidade absoluta em cada regra aplicada
            </h2>
            <p className="text-lg text-[#8A8F98] leading-relaxed">
              Transforme regras CBHPM e SBN em uma memória de cálculo clara, estruturada e compartilhável.
            </p>
          </motion.div>

          <div className="grid gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#5e6ad2]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-[#E6EEF7]">{feat.title}</h4>
                    <p className="text-sm text-[#8A8F98]">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: floating isometric cards */}
        <div className="relative flex items-center justify-center h-[480px]">
          {/* Front card */}
          <motion.div
            className="absolute w-72 h-44 bg-[rgba(12,13,15,0.85)] border border-[rgba(120,148,184,0.18)] rounded-2xl backdrop-blur-md p-5 flex flex-col justify-between shadow-2xl text-left z-10"
            style={{ rotate: "-12deg", y: -60, x: -40 }}
            animate={{ y: ["-60px", "-68px", "-60px"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">CBHPM 2025</span>
              <ShieldCheck className="w-4 h-4 text-[#5e6ad2]" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Procedimento Principal</p>
              <p className="text-[11px] font-semibold text-[#E6EEF7] leading-tight">
                Artrodese Cervical — 3 níveis
              </p>
            </div>
            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <span className="text-lg font-grotesk font-bold text-[#E6EEF7]">R$ 7.340,00</span>
              <span className="text-[9px] text-[#5e6ad2] font-medium">Porte 14C · SBN</span>
            </div>
          </motion.div>

          {/* Mid card */}
          <motion.div
            className="absolute w-72 h-44 bg-zinc-900 border border-white/10 rounded-2xl p-6"
            style={{ rotate: "2deg", y: 20, x: 20 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.55 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <div className="space-y-3">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          </motion.div>

          {/* Back card */}
          <motion.div
            className="absolute w-72 h-44 bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 rounded-2xl p-6 flex items-center justify-center"
            style={{ rotate: "15deg", y: 100, x: -20, zIndex: -1 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
          >
            <History className="w-12 h-12 text-[#5e6ad2]/20" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
