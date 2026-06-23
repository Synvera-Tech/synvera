"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Como o Synvera se mantém atualizado com a CBHPM?",
    answer:
      "Nossa equipe de especialistas revisa periodicamente as atualizações das tabelas CBHPM e diretrizes da SBN. Novas versões do catálogo são disponibilizadas automaticamente no sistema sem custos adicionais.",
  },
  {
    question: "Posso exportar os relatórios em PDF?",
    answer:
      "Os cálculos podem ser compartilhados via link seguro ou QR Code. A exportação em PDF está prevista para versões futuras da plataforma.",
  },
  {
    question: "O sistema realiza cobrança direta?",
    answer:
      "Não. O Synvera é focado exclusivamente na valoração técnica e na rastreabilidade documental dos cálculos cirúrgicos, servindo como base sólida para o seu processo de faturamento.",
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(15,16,17,0.4)] overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-[#E6EEF7] pr-4 text-[15px]">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="py-32 px-4" id="duvidas" style={{ scrollMarginTop: "88px" }}>
      <div className="max-w-3xl mx-auto">
        <motion.h2
          className="font-grotesk text-4xl font-bold mb-12 text-center text-[#E6EEF7]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          Perguntas Frequentes
        </motion.h2>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
