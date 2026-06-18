// Shared monetary and percentage formatters — avoids re-instantiation across modules.

export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(n / 100);
