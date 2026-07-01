"use client";

import { Stethoscope } from "lucide-react";
import { Autocomplete, type SBNProcedureOption } from "@/components/ui/autocomplete";

interface ProcedureSearchPanelProps {
  searchOptions: SBNProcedureOption[];
  selectedProcedures: SBNProcedureOption[];
  onProceduresChange: (procedures: SBNProcedureOption[]) => void;
  onSearch: (query: string) => void;
  initialQuery: string;
}

export function ProcedureSearchPanel({
  searchOptions,
  selectedProcedures,
  onProceduresChange,
  onSearch,
  initialQuery,
}: ProcedureSearchPanelProps) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <Stethoscope aria-hidden="true" className="text-primary" size={18} />
        <h2 className="m-0 text-[15px] font-bold text-stone-950 dark:text-stone-50">
          Buscar Procedimento SBN
        </h2>
      </div>
      <div className="mb-6">
        <Autocomplete
          label="Procedimento"
          options={searchOptions}
          value={selectedProcedures}
          onChange={onProceduresChange}
          onSearch={onSearch}
          initialQuery={initialQuery}
        />
      </div>
    </>
  );
}
