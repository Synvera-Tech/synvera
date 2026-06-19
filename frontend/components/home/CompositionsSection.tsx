"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Check, Plus } from "lucide-react";

type Composition = {
  name: string;
  subtitle: string;
  lastUsed: string;
  codes: { code: string; name: string; value: string }[];
};

const compositions: Composition[] = [
  {
    name: "Artrodese Cervical",
    subtitle: "Artrodese Cervical (3 níveis)",
    lastUsed: "2h atrás",
    codes: [
      { code: "3.07.15.11-0", name: "Artrodese anterior", value: "R$ 4.210,00" },
      { code: "3.07.15.02-1", name: "Descompressão medular", value: "R$ 2.150,00" },
      { code: "3.07.15.18-7", name: "Enxerto ósseo", value: "R$ 980,00" },
    ],
  },
  {
    name: "Craniotomia Descomp.",
    subtitle: "Craniotomia Descompressiva",
    lastUsed: "1d atrás",
    codes: [
      { code: "3.04.01.01-0", name: "Craniotomia descompressiva", value: "R$ 6.800,00" },
      { code: "3.04.01.04-5", name: "Monitorização intracraniana", value: "R$ 1.240,00" },
    ],
  },
  {
    name: "Infiltração Facetária",
    subtitle: "Infiltração Facetária Lombar",
    lastUsed: "3d atrás",
    codes: [
      { code: "3.07.12.06-3", name: "Bloqueio facetário bilateral", value: "R$ 1.450,00" },
      { code: "3.07.12.07-1", name: "Fluoroscopia intraoperatória", value: "R$ 380,00" },
    ],
  },
  {
    name: "Microcirurgia Vascular",
    subtitle: "Microcirurgia Vascular Cerebral",
    lastUsed: "1sem atrás",
    codes: [
      { code: "3.04.08.01-7", name: "Clipagem de aneurisma", value: "R$ 12.600,00" },
      { code: "3.04.08.03-3", name: "Monitorização neurofisiológica", value: "R$ 2.100,00" },
      { code: "3.04.08.05-0", name: "Neuronavegação", value: "R$ 1.800,00" },
    ],
  },
];

export function CompositionsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = compositions[activeIndex];

  return (
    <section className="py-32 px-4 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          className="max-w-2xl mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-4xl font-bold mb-4 text-[#E6EEF7]">
            Sua biblioteca de táticas cirúrgicas
          </h2>
          <p className="text-[#8A8F98] text-lg">
            Não recalcule do zero. Salve modelos base para procedimentos recorrentes.
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl text-left"
          style={{ background: "rgba(12,13,14,0.7)", backdropFilter: "blur(16px)" }}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header bar */}
          <div className="bg-zinc-900/80 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-zinc-300">Minhas Composições</span>
            </div>
            <button className="bg-[#5e6ad2] px-3 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Nova
            </button>
          </div>

          <div className="flex flex-col md:flex-row h-[420px]">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-white/5 p-4 space-y-1 bg-black/20 flex-shrink-0">
              {compositions.map((comp, i) => (
                <button
                  key={comp.name}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left p-2 rounded text-xs font-bold transition-colors duration-150 ${
                    i === activeIndex
                      ? "bg-[#5e6ad2]/10 text-[#5e6ad2]"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  {comp.name}
                </button>
              ))}
            </div>

            {/* Animated content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 p-8 space-y-6 overflow-auto"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#E6EEF7]">{active.subtitle}</h4>
                    <span className="text-[10px] text-zinc-500">Último uso: {active.lastUsed}</span>
                  </div>

                  <div className="space-y-3">
                    {active.codes.map((c) => (
                      <div
                        key={c.code}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-zinc-400">
                            <span className="font-mono">{c.code}</span> {c.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0 ml-4">{c.value}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full border border-[#5e6ad2]/30 text-[#5e6ad2] py-3 rounded-lg text-sm font-bold hover:bg-[#5e6ad2]/5 transition-colors">
                    Aplicar modelo ao novo cálculo
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
