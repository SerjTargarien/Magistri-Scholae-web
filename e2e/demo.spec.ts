// The account app against the in-browser mock server (R3.3): roles and hidden
// fields, saves through the sheet store, local rule checks, automatic merging,
// same-field conflicts, connection drops and exact retries. Each test starts
// with fresh demo data (a new browser context has empty storage).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers";

const status = (page: Page) => page.locator(".remote-status");

async function openSheet(page: Page, name: string, role?: "gm" | "player" | "reader") {
  await page.goto("/");
  await expect(page.locator("#demo-banner")).toBeVisible();
  if (role && role !== "player") {
    await page.locator(`#demo-role-${role}`).click();
    await expect(page.locator(`#demo-role-${role}`)).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByLabel("Campaña").selectOption("demo-campaign");
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("#field-nombre")).toHaveValue(name);
}

async function reopen(page: Page, name: string) {
  await page.reload();
  await page.getByLabel("Campaña").selectOption("demo-campaign");
  await page.getByRole("button", { name, exact: true }).click();
}

test("player: the GM-only field is absent, own fields save and survive a reload", async ({ page }) => {
  await openSheet(page, "Luna de Bruma");
  await expect(page.locator("#field-economia")).toHaveCount(0);
  await expect(page.locator("#field-linaje")).toHaveValue("Familia de herbolarias del Pirineo");
  await page.locator("#field-concepto").fill("Rastreadora editada en la demo");
  await expect(status(page)).toHaveText(/^Guardado/);
  await reopen(page, "Luna de Bruma");
  await expect(page.locator("#field-concepto")).toHaveValue("Rastreadora editada en la demo");
});

test("an edit that breaks a rule is refused with its rule and never saved", async ({ page }) => {
  await openSheet(page, "Luna de Bruma");
  await page.locator("#field-nombre").fill("");
  await expect(status(page)).toContainText("No aceptado: nombre (required)");
  await page.getByRole("button", { name: "Sesión", exact: true }).click();
  await page.locator("#field-puntosDestino").fill("11");
  await expect(status(page)).toContainText("puntosDestino (range [0,10])");
  await reopen(page, "Luna de Bruma");
  await expect(page.locator("#field-nombre")).toHaveValue("Luna de Bruma");
  await page.getByRole("button", { name: "Sesión", exact: true }).click();
  await expect(page.locator("#field-puntosDestino")).toHaveValue("3");
});

test("someone else's change to another field merges without a conflict", async ({ page }) => {
  await openSheet(page, "Luna de Bruma");
  await page.locator("#demo-other-nombre").click();
  await page.locator("#field-concepto").fill("Mi concepto");
  await expect(status(page)).toHaveText(/^Guardado/);
  await expect(page.locator("#field-nombre")).toHaveValue(/cambiado por otra persona/);
  await expect(page.getByRole("button", { name: "Mantener el mío" })).toHaveCount(0);
});

test("offline edits wait for the connection; a same-field collision asks which value to keep", async ({ page }) => {
  await openSheet(page, "Luna de Bruma");
  await page.locator("#demo-offline").click();
  await expect(status(page)).toHaveText(/^Sin conexión/);
  await page.locator("#field-nombre").fill("Luna, versión propia");
  await page.locator("#field-concepto").fill("Concepto escrito sin conexión");
  await page.locator("#demo-other-nombre").click();
  await page.locator("#demo-offline").click();
  await expect(page.getByRole("button", { name: "Mantener el mío" })).toBeVisible();
  await expect(status(page)).toHaveText(/^Otra persona cambió el mismo campo/);
  await page.getByRole("button", { name: "Mantener el mío" }).click();
  await expect(status(page)).toHaveText(/^Guardado/);
  await reopen(page, "Luna, versión propia");
  await expect(page.locator("#field-nombre")).toHaveValue("Luna, versión propia");
  await expect(page.locator("#field-concepto")).toHaveValue("Concepto escrito sin conexión");
});

test("a save whose reply is lost is retried as the same operation", async ({ page }) => {
  await openSheet(page, "Luna de Bruma");
  await page.locator("#demo-lose-reply").click();
  await page.locator("#field-concepto").fill("Guardado una sola vez");
  await expect(status(page)).toHaveText(/^Guardado/, { timeout: 15_000 });
  await reopen(page, "Luna de Bruma");
  await expect(page.locator("#field-concepto")).toHaveValue("Guardado una sola vez");
});

test("shared reader: restricted and GM-only fields are absent and nothing is editable", async ({ page }) => {
  await openSheet(page, "Luna de Bruma", "reader");
  await expect(page.getByRole("button", { name: "Diego Marés" })).toHaveCount(0);
  for (const hidden of ["#field-linaje", "#field-economia"]) await expect(page.locator(hidden)).toHaveCount(0);
  await expect(page.locator("#field-concepto")).toBeDisabled();
});

test("GM: sees GM-only fields and the GM's own character", async ({ page }) => {
  await openSheet(page, "Luna de Bruma", "gm");
  await expect(page.locator("#field-economia")).toHaveValue("Modesta");
  await page.getByRole("button", { name: /Volver|Back/ }).click();
  await expect(page.getByRole("button", { name: "Profesor Silvio Niebla", exact: true })).toBeVisible();
});
