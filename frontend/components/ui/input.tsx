import * as React from "react";
import { cn } from "@/components/ui/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full bg-white dark:bg-[#11100F] px-3.5 text-sm text-stone-950 dark:text-[#f7f8f8] outline-none transition",
        "border border-stone-200 dark:border-[#2A2723] ring-0 focus:ring-0 focus:outline-none focus:border-stone-300 dark:focus:border-[#3C3832] appearance-none",
        "placeholder:text-stone-400 dark:placeholder:text-[#9B9387]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        border: 'none !important',
        outline: 'none !important',
        boxShadow: 'none !important',
        borderColor: 'transparent !important',
        borderWidth: '0 !important',
        appearance: 'none',
        WebkitAppearance: 'none'
      }}
      {...props}
    />
  );
}
