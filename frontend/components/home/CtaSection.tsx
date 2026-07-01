"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const meshStyle = {
  backgroundImage: [
    "radial-gradient(at 0% 0%, rgba(201, 168, 103,0.18) 0px, transparent 50%)",
    "radial-gradient(at 100% 0%, rgba(223, 200, 154,0.12) 0px, transparent 50%)",
    "radial-gradient(at 50% 100%, rgba(90, 72, 35,0.18) 0px, transparent 50%)",
  ].join(", "),
};

const dotGridStyle = {
  backgroundImage: "radial-gradient(circle, #C9A867 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

export function CtaSection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden flex items-center justify-center text-center min-h-[480px]">
      <div className="absolute inset-0 bg-[#C9A867]/8" style={meshStyle} />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 opacity-[0.15] pointer-events-none"
        style={dotGridStyle}
      />

      <div className="relative z-10 max-w-3xl space-y-8">
        <motion.h2
          className="font-grotesk text-4xl md:text-5xl font-bold leading-tight text-[#F6F1E7]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Pronto para transformar sua valoração médica?
        </motion.h2>

        <motion.p
          className="text-lg text-stone-300"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Organize a memória de cálculo dos seus procedimentos com base nas regras oficiais da CBHPM e diretrizes da SBN.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <Link
            href="/novo-calculo"
            className="shimmer-btn inline-block bg-white text-black px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-white/10"
          >
            Iniciar cálculo
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
