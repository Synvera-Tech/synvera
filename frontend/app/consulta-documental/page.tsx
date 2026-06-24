import { Suspense } from "react";
import type { Metadata } from "next";
import { DocumentSearchPageContent } from "@/components/docsearch/DocumentSearchPage";

export const metadata: Metadata = {
  title: "Consulta Documental · Synvera",
  description:
    "Pesquise regras, diretrizes e fundamentos diretamente na CBHPM, Manual SBN Neurocirurgia e Manual de Cirurgia de Coluna.",
};

export default function ConsultaDocumentalPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DocumentSearchPageContent />
    </Suspense>
  );
}
