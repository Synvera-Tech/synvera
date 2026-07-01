import { test, expect } from "@playwright/test";

// P1 (CBHPM 2022 p.140 item 8): the anesthesia-assistant justification checkboxes on the
// Procedure Page must (a) render, and (b) drive the 60% "Auxiliar de anestesia" fee — the
// backend is the numerical authority, so we assert on the real /api/calculate response.
// Requires the Go API reachable through the frontend /api proxy.

const JUSTIFICATION_LABELS = [
  "Circulação extracorpórea (CEC)",
  "Cirurgia com duração acima de 6 horas",
  "Neonatologia cirúrgica",
  "Gastroplastia para obesidade mórbida",
];

test("anesthesia-assistant justification renders and applies the 60% fee", async ({ page }) => {
  await page.goto("/procedure?q=Artrodese%20cervical");

  // Pick a procedure from the search dropdown → its CBHPM codes load and auto-select,
  // producing a live valuation.
  await page.getByText("ARTRODESE CERVICAL ANTERIOR", { exact: false }).first().click();

  // (a) The four justification checkboxes render.
  for (const label of JUSTIFICATION_LABELS) {
    await expect(page.getByText(label, { exact: false })).toBeVisible();
  }

  const cec = page.getByText("Circulação extracorpórea (CEC)", { exact: false });

  // (b) Checking CEC triggers a recalculation whose payload carries cec=true; assert the
  // backend applied the 60% assistant and recorded the reason.
  const calcResponse = page.waitForResponse(async (r) => {
    if (!r.url().includes("/api/calculate") || r.request().method() !== "POST") return false;
    try {
      const body = r.request().postDataJSON() as {
        anesthesia_auxiliary_justification?: { cec?: boolean };
      };
      return body?.anesthesia_auxiliary_justification?.cec === true;
    } catch {
      return false;
    }
  });

  await cec.click();

  const resp = await calcResponse;
  const data = (await resp.json()) as {
    anesthesia_assistant_applied?: boolean;
    anesthesia_assistant_reasons?: string[];
    anesthesia_assistant_fee?: number;
    anesthesiologist_fee?: number;
  };

  expect(data.anesthesia_assistant_applied).toBe(true);
  expect(data.anesthesia_assistant_reasons).toContain("cec");
  expect(data.anesthesia_assistant_fee ?? 0).toBeGreaterThan(0);
  // The assistant is exactly 60% of the principal anesthesiologist fee.
  expect(data.anesthesia_assistant_fee!).toBeCloseTo((data.anesthesiologist_fee ?? 0) * 0.6, 1);

  // The valuation reflects the applied assistant line.
  await expect(page.getByText("Auxiliar de anestesia (60%)").first()).toBeVisible();
});
