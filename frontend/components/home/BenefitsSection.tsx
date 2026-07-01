"use client";

import { motion, type Variants } from "framer-motion";
import { Stethoscope, Receipt, Users, BookOpen } from "lucide-react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardBase =
  "p-10 rounded-3xl bg-[rgba(17, 16, 15,0.6)] backdrop-blur-md border border-white/10 hover:border-[#C9A867]/35 hover:-translate-y-1 transition-all duration-300 cursor-default";

export function BenefitsSection() {
  return (
    <section className="py-32 px-4" id="beneficios">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-4xl font-bold mb-4 text-[#F6F1E7]">
            Projetado para toda a equipe
          </h2>
          <p className="text-[#9B9387] text-lg">
            Da mesa cirúrgica ao faturamento e equipe administrativa.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Cirurgiões — wide */}
          <motion.div variants={cardVariant} className={`md:col-span-2 ${cardBase} space-y-6`}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-grotesk text-2xl font-bold text-[#F6F1E7]">Cirurgiões & PAs</h3>
            <p className="text-[#9B9387] leading-relaxed">
              Clareza imediata sobre enquadramento de procedimentos e vias de acesso. Elimine o "achismo" técnico e foque no paciente, com a segurança de que sua valoração segue rigorosamente a norma oficial.
            </p>
            <div className="flex gap-3 pt-1 flex-wrap">
              {["Neurocirurgia", "Coluna", "Crânio"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#9B9387]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Faturamento */}
          <motion.div variants={cardVariant} className={`${cardBase} flex flex-col justify-center space-y-6`}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-grotesk text-2xl font-bold text-[#F6F1E7]">Faturamento</h3>
            <p className="text-[#9B9387] text-sm leading-relaxed">
              Apoie justificativas técnicas com relatórios estruturados e rastreáveis para a comunicação com operadoras de saúde.
            </p>
          </motion.div>

          {/* Instrumentadores */}
          <motion.div variants={cardVariant} className={`${cardBase} space-y-6`}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-grotesk text-xl font-bold text-[#F6F1E7]">Instrumentadores</h3>
            <p className="text-[#9B9387] text-sm leading-relaxed">
              Organização imediata do mapa de sala e compartilhamento do racional de cálculo cirúrgico.
            </p>
          </motion.div>

          {/* Consulta Documental — wide */}
          <motion.div
            variants={cardVariant}
            className={`md:col-span-2 ${cardBase} flex flex-col md:flex-row items-center gap-10`}
          >
            <div className="flex-1 space-y-4">
              <h3 className="font-grotesk text-2xl font-bold text-[#F6F1E7]">Consulta Documental</h3>
              <p className="text-[#9B9387] leading-relaxed">
                Acesse fundamentos CBHPM e SBN diretamente na plataforma. O conhecimento técnico das sociedades de especialidade na palma da sua mão.
              </p>
            </div>
            <div className="w-full md:w-48 h-32 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl border border-white/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-10 h-10 text-stone-600" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
