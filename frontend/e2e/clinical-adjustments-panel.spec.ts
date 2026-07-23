import { expect, test } from "@playwright/test";

test("clinical adjustments use accessible controls and preserve the calculation payload", async ({ page }) => {
  await page.goto("/procedure?q=Cateter%20de%20PIC");
  await page.getByText("CATETER DE PIC", { exact: false }).first().click();

  const panel = page.getByTestId("clinical-adjustments-panel");
  await expect(panel).toContainText("Condições normativas que podem alterar a valoração");

  const emergencyResponse = page.waitForResponse(async (response) => {
    if (!response.url().includes("/api/calculate") || response.request().method() !== "POST") return false;
    const payload = response.request().postDataJSON() as { adjustments?: string[] };
    return payload.adjustments?.includes("emergency_special_hours") ?? false;
  });
  await panel.getByRole("switch", { name: "Urgência/emergência em horário especial" }).click();
  await emergencyResponse;

  const pediatricResponse = page.waitForResponse(async (response) => {
    if (!response.url().includes("/api/calculate") || response.request().method() !== "POST") return false;
    const payload = response.request().postDataJSON() as { adjustments?: string[] };
    return payload.adjustments?.includes("pediatric_neonate_or_infant") ?? false;
  });
  await panel.getByRole("radio", { name: /Neonato\/lactante/ }).click();
  await pediatricResponse;

  await expect(panel.getByRole("radio", { name: /Neonato\/lactante/ })).toHaveAttribute("aria-checked", "true");
  await expect(panel.getByRole("radio", { name: "Não pediátrico" })).toHaveAttribute("aria-checked", "false");

  await panel.screenshot({ path: "/tmp/synvera-clinical-adjustments-light.png" });
  await page.getByRole("switch", { name: "Mudar para modo escuro" }).click();
  await expect(page.getByRole("switch", { name: "Mudar para modo claro" })).toBeVisible();
  await panel.screenshot({ path: "/tmp/synvera-clinical-adjustments-dark.png" });
});
