"use client";

import { motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

type Plan = {
  name: string;
  desc: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge?: string;
};

const plans: Plan[] = [
  {
    name: "Gratuito",
    desc: "Ideal para avaliação da plataforma.",
    price: "R$ 0",
    period: "",
    features: [
      "5 cálculos por mês",
      "Até 4 composições salvas",
      "Histórico de 7 dias",
      "Compartilhamento básico",
    ],
    cta: "Começar grátis",
    featured: false,
  },
  {
    name: "Profissional",
    desc: "Para especialistas que usam o Synvera na rotina.",
    price: "R$ 299",
    period: "/mês",
    features: [
      "Cálculos ilimitados",
      "Composições ilimitadas",
      "Histórico completo",
      "Memória de cálculo auditável",
      "Versionamento CBHPM",
      "Compartilhamento avançado",
    ],
    cta: "Assinar plano profissional",
    featured: true,
    badge: "POPULAR",
  },
  {
    name: "Equipe",
    desc: "Para clínicas e grupos cirúrgicos.",
    price: "Sob consulta",
    period: "",
    features: [
      "Múltiplos usuários",
      "Biblioteca compartilhada",
      "Governança de composições",
      "Relatórios institucionais",
      "Implantação assistida",
    ],
    cta: "Falar com vendas",
    featured: false,
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PricingSection() {
  return (
    <section className="py-32 px-4" id="planos" style={{ scrollMarginTop: "88px" }}>
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-grotesk text-4xl font-bold mb-4 text-[#E6EEF7]">
            Planos projetados para sua escala
          </h2>
          <p className="text-[#8A8F98] text-lg">
            Escolha a precisão que melhor se adapta à sua prática.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariant}
              className={`p-8 rounded-3xl flex flex-col h-full relative overflow-hidden text-left ${
                plan.featured
                  ? "bg-[#5e6ad2]/5 border border-[#5e6ad2]/30"
                  : "bg-[rgba(15,16,17,0.6)] backdrop-blur-md border border-white/5"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-[#5e6ad2] text-white text-[10px] font-bold px-2 py-1 rounded">
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-grotesk text-xl font-bold mb-2 text-[#E6EEF7]">{plan.name}</h3>
                <p className="text-zinc-500 text-sm">{plan.desc}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="font-grotesk text-3xl font-bold text-[#E6EEF7]">{plan.price}</span>
                {plan.period && <span className="text-zinc-500 text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-center gap-3 text-sm ${
                      plan.featured ? "text-[#E6EEF7]" : "text-zinc-400"
                    }`}
                  >
                    <Check className="w-4 h-4 text-[#5e6ad2] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/novo-calculo"
                className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all block ${
                  plan.featured
                    ? "bg-[#5e6ad2] text-white hover:opacity-90 shadow-lg shadow-blue-600/20"
                    : "border border-white/10 text-[#E6EEF7] hover:bg-white/5"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
