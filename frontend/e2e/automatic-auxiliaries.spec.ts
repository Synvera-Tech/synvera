import { expect, test } from "@playwright/test";

test("auxiliary count is backend-derived, read-only, and preserves normative zero", async ({ page }) => {
  await page.goto("/procedure?q=Punção%20lombar");

  const calculationRequest = page.waitForRequest((request) =>
    request.url().includes("/api/calculate") && request.method() === "POST",
  );
  await page.getByText("CONSULTA + PUNÇÃO LOMBAR", { exact: false }).first().click();

  const request = await calculationRequest;
  expect(request.postDataJSON()).not.toHaveProperty("auxiliaries_count");

  const card = page.getByTestId("auxiliaries-card");
  await expect(card).toContainText("Definido automaticamente pela CBHPM");
  await expect(card).toContainText("0 auxiliares");
  await expect(card.locator("button, input, [role=radio]")).toHaveCount(0);
});

test("auxiliary card displays a positive count returned by the backend", async ({ page }) => {
  await page.goto("/procedure?q=Cateter%20de%20PIC");
  await page.getByText("CATETER DE PIC", { exact: false }).first().click();

  const card = page.getByTestId("auxiliaries-card");
  await expect(card).toContainText("2 auxiliares");
  await expect(card.locator("button, input, [role=radio]")).toHaveCount(0);
});

test("auxiliary card is visually validated in light and dark modes", async ({ page }) => {
  await page.goto("/procedure?q=Cateter%20de%20PIC&theme=light");
  await page.getByText("CATETER DE PIC", { exact: false }).first().click();

  const card = page.getByTestId("auxiliaries-card");
  await expect(card).toContainText("2 auxiliares");
  await card.screenshot({ path: "../docs/automatic-auxiliaries-light.png" });

  await page.getByRole("switch", { name: "Mudar para modo escuro" }).click();
  await expect(page.getByRole("switch", { name: "Mudar para modo claro" })).toBeVisible();
  await card.screenshot({ path: "../docs/automatic-auxiliaries-dark.png" });
});
