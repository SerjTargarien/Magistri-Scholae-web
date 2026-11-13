// The real screens through the sheet store, against the in-browser mock
// server (R3.3/R3.4): roles and hidden fields, local rule checks, automatic
// merging, same-field conflicts, connection drops and exact retries. Uses the
// demo's test panel. Each test starts with fresh demo data.
import type { Page } from "@playwright/test";
import { expect, openApp, openCharacter, openTab, reloadApp, setEditMode, storedSheet, test, viewAs } from "./helpers";

const status = (page: Page) => page.locator("#save-status");
const nameInput = (page: Page) => page.getByPlaceholder("Leonora Vance").first();
const conceptInput = (page: Page) => page.locator("#input-sheet-concepto");

async function openLuna(page: Page, role?: "gm" | "reader") {
  await openApp(page);
  if (role) await viewAs(page, role);
  await openCharacter(page, "Luna de Bruma");
}

test("player: the GM-only field is absent, own fields save and survive a reload", async ({ page }) => {
  await openLuna(page);
  await expect(page.locator("#detail-tab-perfil")).not.toContainText("Modesta");  // economía is GM-only
  await expect(page.locator("#detail-tab-perfil")).toContainText("Familia de herbolarias del Pirineo");
  await setEditMode(page, true);
  await conceptInput(page).fill("Rastreadora editada en la demo");
  await reloadApp(page);
  expect((await storedSheet(page, "Luna de Bruma"))!.concepto).toBe("Rastreadora editada en la demo");
});

test("an edit that breaks a rule is refused in plain words and never saved", async ({ page }) => {
  await openLuna(page);
  await setEditMode(page, true);
  // A custom field's name is required: emptying it is refused with its rule.
  // (The sheet's own name box never sends an empty name: see the features tests.)
  const customName = page.locator("#input-custom-name-custom-1");
  await expect(customName).toHaveValue("Patronus");
  await customName.fill("");
  // In plain words (R3.5): the field as the sheet names it, what is wrong; never a stored path.
  await expect(status(page)).toContainText("Campos Personalizados (nombre): no puede quedar vacío.");
  await expect(status(page)).not.toContainText("camposPersonalizados");
  await reloadApp(page);
  expect((await storedSheet(page, "Luna de Bruma"))!.camposPersonalizados[0]).toMatchObject({ id: "custom-1", nombre: "Patronus" });
});

test("someone else's change to another field merges without a conflict", async ({ page }) => {
  await openLuna(page);
  await page.locator("#demo-other-nombre").click();
  await setEditMode(page, true);
  await conceptInput(page).fill("Mi concepto");
  await reloadApp(page);
  const stored = (await storedSheet(page, "Mi concepto") ?? await page.evaluate(async () => {
    const mock = await import("/src/mock/server.ts" as string);
    return mock.mockServer().state.sheets.find((s: { id: string }) => s.id === "demo-luna").fields;
  }))!;
  expect(stored.concepto).toBe("Mi concepto");
  expect(stored.nombre).toMatch(/cambiado por otra persona/);
});

test("offline edits wait for the connection; a same-field collision asks which value to keep", async ({ page }) => {
  await openLuna(page);
  await setEditMode(page, true);
  await page.locator("#demo-offline").click();
  await expect(status(page)).toContainText("Sin conexión");
  await nameInput(page).fill("Luna, versión propia");
  await conceptInput(page).fill("Concepto escrito sin conexión");
  await page.locator("#demo-other-nombre").click();
  await page.locator("#demo-offline").click();
  await expect(status(page).getByRole("button", { name: "Mantener el mío" })).toBeVisible();
  // The field by the sheet's name, both values as typed.
  await expect(status(page)).toContainText("Nombre del Personaje");
  await expect(status(page)).toContainText("Tu valor: Luna, versión propia");
  await status(page).getByRole("button", { name: "Mantener el mío" }).click();
  await expect(status(page)).toHaveCount(0);
  await reloadApp(page);
  expect(await storedSheet(page, "Luna, versión propia")).toMatchObject({ concepto: "Concepto escrito sin conexión" });
});

test("a save whose reply is lost is retried as the same operation", async ({ page }) => {
  await openLuna(page);
  await page.locator("#demo-lose-reply").click();
  await setEditMode(page, true);
  await conceptInput(page).fill("Guardado una sola vez");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __magistriSaved: () => boolean }).__magistriSaved()), { timeout: 15_000 }).toBe(true);
  expect((await storedSheet(page, "Luna de Bruma"))!.concepto).toBe("Guardado una sola vez");
});

test("shared reader: restricted and GM-only fields are absent and nothing is editable", async ({ page }) => {
  await openLuna(page, "reader");
  await expect(page.locator("#detail-tab-perfil")).not.toContainText("Familia de herbolarias del Pirineo");
  await expect(page.locator("#detail-tab-perfil")).not.toContainText("Modesta");
  await expect(page.locator("#btn-detail-edit")).toHaveCount(0);
  await openTab(page, "notas");
  await expect(page.locator("#detail-tab-notas")).not.toContainText("Primera expedición");  // the journal is restricted
});

test("GM: sees GM-only fields and the GM's own character, and may archive", async ({ page }) => {
  await openLuna(page, "gm");
  await expect(page.locator("#detail-tab-perfil")).toContainText("Modesta");
  await expect(page.locator("#btn-detail-delete")).toBeVisible();
  await page.getByRole("button", { name: /Volver|Back/ }).first().click();
  await expect(page.locator('[id^="character-card-"]', { hasText: "Profesor Silvio Niebla" })).toBeVisible();
});
