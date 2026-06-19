"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Produto" },
  { label: "Como funciona" },
  { label: "Auditabilidade" },
  { label: "Benefícios" },
  { label: "Preços" },
];

export function NavBar() {
  return (
    <motion.nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between rounded-full px-6 py-3 bg-[rgba(10,11,13,0.72)] backdrop-blur-xl border border-[rgba(120,148,184,0.15)] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.25)]">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <img
            src="/brand/synvera-symbol-light.svg"
            alt="Synvera"
            className="w-8 h-8"
          />
          <div className="flex flex-col leading-none gap-[3px]">
            <span className="font-grotesk font-extrabold text-[15px] tracking-tight text-[#E6EEF7] leading-none">
              Synvera
            </span>
            <span className="text-[9px] font-medium text-[#8A8F98] tracking-[0.3px] leading-none">
              Neurocirurgia · Coluna
            </span>
          </div>
        </div>

        {/* Nav links — visual only, no navigation */}
        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#8A8F98]">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="hover:text-[#E6EEF7] transition-colors duration-150 cursor-default"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <button className="text-[13px] font-medium text-[#8A8F98] hover:text-[#E6EEF7] transition-colors hidden sm:block">
              Entrar
            </button>
          </SignInButton>
          <Link
            href="/novo-calculo"
            className="shimmer-btn flex items-center gap-1.5 bg-[#5e6ad2] px-5 py-2.5 rounded-full text-[13px] font-semibold text-white border border-white/10 shadow-lg shadow-[#5e6ad2]/20 hover:scale-105 transition-transform active:scale-95"
          >
            Iniciar cálculo
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
