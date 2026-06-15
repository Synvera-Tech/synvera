import * as React from "react";
import { cn } from "@/components/ui/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full bg-white dark:bg-[#151A21] px-3.5 text-sm text-slate-950 dark:text-[#F4F6F8] outline-none transition",
        "border-none ring-0 focus:ring-0 focus:outline-none focus:border-none appearance-none",
        "focus:dark:bg-[#202938]",
        "placeholder:text-slate-400 dark:placeholder:text-[#7D8896]",
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
