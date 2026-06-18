import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Synvera — Relatório de Valoração Médica",
  description: "Valoração referencial de procedimento médico gerada pelo Synvera.",
  openGraph: {
    title: "Synvera — Relatório de Valoração Médica",
    description: "Valoração referencial de procedimento médico gerada pelo Synvera.",
    type: "article",
    siteName: "Synvera",
  },
  twitter: {
    card: "summary",
    title: "Synvera — Relatório de Valoração Médica",
    description: "Valoração referencial de procedimento médico gerada pelo Synvera.",
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
