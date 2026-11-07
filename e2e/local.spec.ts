// Local-mode smoke tests: the default MagistriScholaeDB in a fresh, isolated
// browser context (never a real profile). Covers backups and reset, which only
// exist in local/mock modes.
import {
  characterCard, createCharacter, createFamiliar, downloadJson, expect, familiarCard, openApp,
  openCharacter, reloadApp, setEditMode, test, visibleOf,
} from "./helpers";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

async function bond(page: Page, characterName: string, familiarName: string) {
  await openCharacter(page, characterName);
  await setEditMode(page, true);
  await visibleOf(page, "header-familiar-bond-btn", "header-familiar-bond-btn-mobile").click();
  await page.getByRole("button", { name: new RegExp(familiarName) }).last().click();
  await setEditMode(page, false);
  await page.locator("#btn-detail-back").click();
  await expect(familiarCard(page, familiarName)).toContainText(characterName);
}

async function openSettings(page: Page) {
  await page.locator("#btn-settings").click();
  await expect(page.locator("#settings-screen")).toBeVisible();
}

async function resetAll(page: Page) {
  await openSettings(page);
  await page.locator("#input-reset-confirm").fill("ELIMINAR TODO");
  await page.locator("#btn-submit-reset").click();
  await page.locator("#btn-settings-back").click();
  await expect(page.locator("#empty-list-state")).toBeVisible();
}

async function importFile(page: Page, path: string, mode: "merge" | "replace") {
  await page.locator("#file-input-header").setInputFiles(path);
  await expect(page.locator("#backup-import-dialog")).toBeVisible();
  await page.locator(`#btn-import-${mode}`).click();
  await expect(page.locator("#backup-import-dialog")).toHaveCount(0);
  await expect(page.locator("#app-global-toast")).toBeVisible();
}

const backlinks = (data: any) => data.characters.flatMap((c: any) =>
  data.familiars.filter((f: any) => f.id === c.familiarId && String(f.studentId) === String(c.id)).map(() => c.nombre));

test("local mode starts empty and shows no demo banner", async ({ page }) => {
  await expect(page.locator("#empty-list-state")).toBeVisible();
  await expect(page.locator("#mock-mode-banner")).toHaveCount(0);
});

test("full backup survives reset and add-import with the bond intact", async ({ page }) => {
  await createCharacter(page, "Local Student", { fill: async () => { await page.locator("#input-concepto").fill("Backup test"); } });
  await page.locator("#btn-detail-back").click();
  await createFamiliar(page, "Local Owl", "Owl");
  await bond(page, "Local Student", "Local Owl");

  await openSettings(page);
  const { data, path } = await downloadJson(page, page.locator("#btn-export-backup-all"));
  expect(data).toMatchObject({ backupVersion: "1.0", app: "Magistri Scholae" });
  expect(data.characters).toHaveLength(1);
  expect(data.familiars).toHaveLength(1);
  expect(backlinks(data)).toEqual(["Local Student"]);
  await page.locator("#btn-settings-back").click();

  await resetAll(page);
  await reloadApp(page);
  await expect(page.locator("#empty-list-state")).toBeVisible();

  await importFile(page, path, "merge");
  await expect(characterCard(page, "Local Student")).toBeVisible();
  await expect(familiarCard(page, "Local Owl")).toContainText("Local Student");
  await reloadApp(page);
  await expect(familiarCard(page, "Local Owl")).toContainText("Local Student");
});

test("selected export carries the linked familiar; replace-import swaps the whole collection", async ({ page }) => {
  await createCharacter(page, "Chosen Student");
  await page.locator("#btn-detail-back").click();
  await createCharacter(page, "Other Student");
  await page.locator("#btn-detail-back").click();
  await createFamiliar(page, "Chosen Cat", "Cat");
  await bond(page, "Chosen Student", "Chosen Cat");

  await openSettings(page);
  await page.locator("#btn-export-selective").click();
  const dialog = page.locator("#backup-export-selective-dialog");
  await expect(dialog).toBeVisible();
  const box = (name: string) => dialog.locator("label", { hasText: name }).locator('input[type="checkbox"]');
  if (await box("Other Student").isChecked()) await box("Other Student").uncheck();
  await box("Chosen Student").check();
  const { data, path } = await downloadJson(page, page.locator("#btn-export-selective-download"));
  expect(data.characters.map((c: any) => c.nombre)).toEqual(["Chosen Student"]);
  expect(data.familiars.map((f: any) => f.nombre)).toEqual(["Chosen Cat"]);
  expect(backlinks(data)).toEqual(["Chosen Student"]);
  if (await dialog.isVisible()) await page.locator("#btn-export-selective-cancel").click();
  await page.locator("#btn-settings-back").click();

  await importFile(page, path, "replace");
  await expect(characterCard(page, "Chosen Student")).toBeVisible();
  await expect(characterCard(page, "Other Student")).toHaveCount(0);
  await expect(familiarCard(page, "Chosen Cat")).toContainText("Chosen Student");
  await reloadApp(page);
  await expect(characterCard(page, "Other Student")).toHaveCount(0);
  await expect(familiarCard(page, "Chosen Cat")).toContainText("Chosen Student");
});

test("familiar-only backup round trips through reset", async ({ page }) => {
  await createFamiliar(page, "Lonely Raven", "Raven");
  await openSettings(page);
  const { data, path } = await downloadJson(page, page.locator("#btn-export-backup-all"));
  expect(data.characters).toEqual([]);
  expect(data.familiars.map((f: any) => f.nombre)).toEqual(["Lonely Raven"]);
  await page.locator("#btn-settings-back").click();

  await resetAll(page);
  await importFile(page, path, "merge");
  await expect(familiarCard(page, "Lonely Raven")).toContainText("Raven");
  await reloadApp(page);
  await expect(familiarCard(page, "Lonely Raven")).toBeVisible();
});
