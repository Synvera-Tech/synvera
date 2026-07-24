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
  expect(logoBox && expandButtonBox && logoBox.y + logoBox.height < expandButtonBox.y).toBe(true);

  const calculationIconBox = await desktopNav.getByRole("link", { name: "Novo cálculo" }).locator("svg").boundingBox();
  const themeIconBox = await desktopNav.getByRole("switch", { name: "Mudar para modo escuro" }).locator("svg").boundingBox();
  expect(calculationIconBox && themeIconBox && calculationIconBox.x).toBe(themeIconBox?.x);
  await page.screenshot({
    path: "/tmp/synvera-sidebar-after-desktop-collapsed-page.png",
    clip: { x: 0, y: 0, width: 112, height: 1000 },
  });

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

  const directThemeSwitch = page.getByRole("switch", { name: "Mudar para modo escuro" });
  await expect(directThemeSwitch).toBeVisible();
  await page.screenshot({ path: "/tmp/synvera-mobile-direct-theme.png" });
  await directThemeSwitch.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("switch", { name: "Mudar para modo claro" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);

  await page.getByRole("button", { name: "Mais" }).click();
  await expect(page.getByRole("switch", { name: "Mudar para modo escuro" })).toBeVisible();
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

test("theme control is available on calculation entry and compositions pages", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
    localStorage.setItem("synvera:internal-nav-expanded", "false");
  });
  await page.setViewportSize({ width: 1100, height: 900 });

  for (const route of ["/novo-calculo", "/composicoes"]) {
    await page.goto(route);
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    const darkModeSwitch = page.getByRole("switch", { name: "Mudar para modo escuro" });
    await expect(darkModeSwitch).toBeVisible();
    await darkModeSwitch.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("switch", { name: "Mudar para modo claro" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const screenshotName = route === "/novo-calculo" ? "novo-calculo" : "composicoes";
    if (route === "/novo-calculo") {
      await expect(page.getByRole("combobox", { name: "Procedimento" })).toHaveCSS("background-color", "rgb(33, 29, 25)");
      await expect(page.getByRole("button", { name: "Cateter de PIC" })).toHaveCSS("background-color", "rgb(33, 29, 25)");
    } else {
      await expect(page.locator("main > div section").first()).toHaveCSS("background-color", "rgb(25, 22, 19)");
    }
    await page.screenshot({ path: `/tmp/synvera-${screenshotName}-dark.png`, fullPage: true });

    await page.getByRole("switch", { name: "Mudar para modo claro" }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
  }
});

test("application fits small smartphone viewports without horizontal scrolling", async ({ page }) => {
  const routes = [
    "/",
    "/novo-calculo",
    "/composicoes",
    "/procedure?theme=light",
    "/consulta-documental?theme=light&returnTo=%2Fprocedure",
  ];

  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 800 });

    for (const route of routes) {
      await page.goto(route);
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

      const overflow = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter(({ left, right, width }) => width > 0 && (left < -1 || right > viewportWidth + 1))
          .slice(0, 12);

        return {
          viewportWidth,
          documentWidth: document.documentElement.scrollWidth,
          offenders,
        };
      });

      expect(overflow, `${route} at ${width}px`).toEqual({
        viewportWidth: width,
        documentWidth: width,
        offenders: [],
      });
    }
  }
});

test("filled calculation fits a small smartphone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/procedure?theme=light");
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

  const search = page.getByRole("textbox", { name: "Procedimento" });
  await search.fill("Craniotomia descompressiva");
  const option = page.getByRole("button", { name: /craniotomia descompressiva/i }).first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.getByText("Composição CBHPM", { exact: true })).toBeVisible();
  await expect(page.getByText("Total da Equipe", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(({ left, right, width }) => width > 0 && (left < -1 || right > document.documentElement.clientWidth + 1))
      .slice(0, 12),
  }));

  expect(overflow).toEqual({
    viewportWidth: 320,
    documentWidth: 320,
    offenders: [],
  });
});
