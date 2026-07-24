import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Synvera",
  description: "Calculadora de honorários médicos para neurocirurgia.",
  manifest: "/site.webmanifest",
  // Next.js App Router auto-generates the favicon <link> tags from app/icon.svg
  // and app/apple-icon.png. The explicit entries below keep the public/ copies
  // wired for the PWA manifest and legacy crawlers.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// In Next 15, themeColor belongs in the viewport export (not metadata), which
// keeps the build warning-free while emitting <meta name="theme-color">.
export const viewport: Viewport = {
  themeColor: "#4E4636",
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    let theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // The procedure screen uses a page-scoped theme. Apply the requested/default
    // value on first paint too so a hard load never flashes the global theme.
    if (window.location.pathname.indexOf("/procedure") === 0) {
      const requested = new URLSearchParams(window.location.search).get("theme");
      theme = requested === "dark" ? "dark" : "light";
    }
    // Documentation links carry the effective theme of the originating screen.
    // Apply it before hydration so navigation and hard reloads do not flash the
    // user's unrelated global preference.
    if (window.location.pathname.indexOf("/consulta-documental") === 0) {
      const requested = new URLSearchParams(window.location.search).get("theme");
      if (requested === "light" || requested === "dark") theme = requested;
    }
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <meta name="color-scheme" content="light dark" />
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
