import { expect, test } from "@playwright/test";

test("internal navigation preserves desktop expansion behavior", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/procedure?theme=light");
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

  const desktopNav = page.locator("aside[aria-label='Navegação principal']");
  const contentBefore = await page.locator("main").boundingBox();
  await expect(desktopNav).toBeVisible();
  await expect(desktopNav).toHaveCSS("width", "224px");
  await expect(desktopNav.getByText("Principal", { exact: true })).toBeVisible();
  await expect(desktopNav.getByText("Consulta e referência", { exact: true })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Novo cálculo" })).toHaveAttribute("aria-current", "page");
  await expect(desktopNav.getByRole("button", { name: "Entrar" })).toBeVisible();
  await desktopNav.screenshot({ path: "../docs/sidebar-desktop-light.png" });

  await page.getByRole("button", { name: "Recolher navegação" }).click();
  await expect(desktopNav).toHaveCSS("width", "64px");
  const contentAfter = await page.locator("main").boundingBox();
  expect(contentAfter?.x).toBe(contentBefore?.x);
  expect(contentAfter?.width).toBe(contentBefore?.width);

  const logoBox = await desktopNav.getByRole("link", { name: "Synvera — ir para a Home" }).boundingBox();
  const expandButtonBox = await page.getByRole("button", { name: "Expandir navegação" }).boundingBox();
  expect(logoBox && expandButtonBox && logoBox.x + logoBox.width <= expandButtonBox.x).toBe(true);

  const calculationIconBox = await desktopNav.getByRole("link", { name: "Novo cálculo" }).locator("svg").boundingBox();
  const themeIconBox = await desktopNav.getByRole("switch", { name: "Mudar para modo escuro" }).locator("svg").boundingBox();
  expect(calculationIconBox && themeIconBox && calculationIconBox.x).toBe(themeIconBox?.x);

  await desktopNav.getByRole("link", { name: "Documentação" }).hover();
  await expect(page.getByRole("tooltip", { name: "Documentação" })).toBeVisible();
  await desktopNav.screenshot({ path: "/tmp/synvera-sidebar-after-desktop-collapsed.png" });

  await page.getByRole("button", { name: "Expandir navegação" }).click();
  await page.getByRole("switch", { name: "Mudar para modo escuro" }).click();
  await expect(page.getByRole("switch", { name: "Mudar para modo claro" })).toBeVisible();
  await expect(desktopNav.getByRole("button", { name: "Entrar" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await desktopNav.screenshot({ path: "../docs/sidebar-desktop-dark.png" });
});

test("internal navigation preserves mobile menu behavior", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/procedure?theme=light");
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

  const mobileNav = page.locator("nav[aria-label='Navegação principal']");
  await expect(mobileNav).toBeVisible();
  await expect(page.locator("aside[aria-label='Navegação principal']")).toBeHidden();
  await page.getByRole("button", { name: "Mais" }).click();
  await expect(page.locator("#internal-mobile-menu")).toBeVisible();
  await expect(page.locator("#internal-mobile-menu").getByRole("button", { name: "Entrar" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "../docs/sidebar-mobile-light.png" });

  await page.getByRole("button", { name: "Modo escuro" }).click();
  await expect(page.getByRole("button", { name: "Modo claro" })).toBeVisible();
  await page.screenshot({ path: "../docs/sidebar-mobile-dark.png" });
});

test("internal navigation preserves notebook and tablet breakpoints", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto("/procedure?theme=light");
  await expect(page.locator("aside[aria-label='Navegação principal']")).toBeVisible();
  await expect(page.locator("aside[aria-label='Navegação principal']")).toHaveCSS("width", "64px");
  await expect(page.locator("nav[aria-label='Navegação principal']")).toBeHidden();

  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.locator("aside[aria-label='Navegação principal']")).toBeHidden();
  await expect(page.locator("nav[aria-label='Navegação principal']")).toBeVisible();
});

test("active route remains perceptible in every navigation group", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("/composicoes");
  await expect(page.getByRole("link", { name: "Minhas composições" })).toHaveAttribute("aria-current", "page");

  await page.goto("/consulta-documental?theme=light&returnTo=%2Fprocedure");
  await expect(page.getByRole("link", { name: "Documentação" })).toHaveAttribute("aria-current", "page");
});
