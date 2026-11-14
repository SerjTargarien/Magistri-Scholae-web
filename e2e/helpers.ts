import { readFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";
import { expect, test as base, type Locator, type Page } from "@playwright/test";

// Fails any test whose page throws an uncaught error.
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await use(errors);
    expect(errors, "uncaught page errors").toEqual([]);
  }, { auto: true }],
});
export { expect };

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

/** The visible one of two elements that exist in mobile and desktop variants. */
export const visibleOf = (page: Page, desktopId: string, mobileId: string) =>
  page.locator(`#${isMobile(page) ? mobileId : desktopId}`);

export async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.locator("#character-list-container")).toBeVisible();
}

/** Demo builds: waits until the sheet stores have sent every change. */
export async function flushWrites(page: Page) {
  await page.waitForFunction(() => (window as unknown as { __magistriSaved?: () => boolean }).__magistriSaved?.() ?? true);
}

export async function reloadApp(page: Page) {
  await flushWrites(page);
  await page.reload();
  await expect(page.locator("#character-list-container")).toBeVisible();
}

export const characterCard = (page: Page, name: string) =>
  page.locator('[id^="character-card-"]', { hasText: name });
export const familiarCard = (page: Page, name: string) =>
  page.locator('[id^="familiar-card-"]', { hasText: name });

export async function openCharacter(page: Page, name: string) {
  await characterCard(page, name).first().click();
  await expect(page.locator("#character-detail-screen")).toBeVisible();
}

export async function openFamiliar(page: Page, name: string) {
  await familiarCard(page, name).first().click();
  await expect(page.locator("#familiar-detail-container")).toBeVisible();
}

/** Creates a student or adult wizard through the real form and lands on its detail screen. */
export async function createCharacter(page: Page, name: string, options: {
  type?: "student" | "adult-wizard"; fill?: (form: Locator) => Promise<void>;
} = {}) {
  await page.locator("#btn-add-character-header").click();
  await page.locator(`#type-select-${options.type ?? "student"}`).click();
  const form = page.locator("#character-form-container");
  await expect(form).toBeVisible();
  await page.locator("#input-nombre").fill(name);
  await options.fill?.(form);
  await page.locator("#btn-form-save").click();
  await expect(page.locator("#character-detail-screen")).toBeVisible();
}

/** Creates a standalone familiar through the familiar editor and returns to the list. */
export async function createFamiliar(page: Page, name: string, species: string) {
  await page.locator("#btn-add-character-header").click();
  await page.locator("#type-select-familiar-editor").click();
  await page.locator("#input-familiar-nombre").fill(name);
  await page.locator("#input-familiar-especie").fill(species);
  await page.locator("#input-familiar-descripcion").fill(`${name} description`);
  await page.locator("#btn-save-familiar").click();
  // Saving opens the new familiar's sheet, as creating a character does; back to the list.
  await expect(page.locator("#familiar-detail-container")).toContainText(name);
  await page.locator("#btn-familiar-back").click();
  await expect(familiarCard(page, name)).toBeVisible();
}

export async function openTab(page: Page, tab: string) {
  await page.locator(`#tab-button-${tab}`).click();
  await expect(page.locator(`#detail-tab-${tab}`)).toBeVisible();
}

export async function setEditMode(page: Page, on: boolean) {
  const toggle = page.locator("#btn-detail-edit");
  const editing = async () => (await toggle.innerText()).includes("Finalizar") || (await toggle.innerText()).includes("Finish");
  if ((await editing()) !== on) await toggle.click();
}

/** A valid solid-colour PNG, generated so the tests need no binary fixtures. */
export function pngFile(name = "portrait.png", size = 96) {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3, Buffer.from([120, 60, 200]))]);
  const pixels = deflateSync(Buffer.concat(Array.from({ length: size }, () => row)));
  const buffer = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header), chunk("IDAT", pixels), chunk("IEND", Buffer.alloc(0))]);
  return { name, mimeType: "image/png", buffer };
}

/** Demo builds: signs in as another demo viewer (GM, assigned player, shared reader) and reloads. */
export async function viewAs(page: Page, role: "gm" | "player" | "reader" | "admin") {
  await page.evaluate(async role => {
    const mock = await import("/src/mock/server.ts" as string);
    mock.mockServer().signInAs(role);
  }, role);
  await page.reload();
  await expect(page.locator("#character-list-container")).toBeVisible();
}

/** Demo builds: the stored fields of the first sheet with this name, read from the mock server. */
export async function storedSheet(page: Page, name: string): Promise<Record<string, any> | undefined> {
  return page.evaluate(async name => {
    const mock = await import("/src/mock/server.ts" as string);
    return mock.mockServer().state.sheets.find((s: { fields: { nombre?: string } }) => s.fields.nombre === name)?.fields;
  }, name);
}
