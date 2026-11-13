import { expect, type Page, type Response } from "@playwright/test";
import { characterCard, familiarCard, openCharacter, openTab, setEditMode, test } from "./helpers";

// The account app against a real Django/PostgreSQL backend (R3.6): the isolated
// fictional preview seeded by `prepare_remote_preview` (backend/README.md). Runs
// only with E2E_REMOTE=1 (CI job «e2e-backend»); the demo suite covers the rest of
// the feature checklist on the mock. Fictional accounts and data only.
const PASSWORD = "Fictional-preview-only-42!";
const GM_ONLY_CLUE = "Fictional GM-only clue";
// One value per run, so a run against a kept local preview still checks fresh data.
const RUN = Date.now().toString(36);
const CONCEPT = `Remote concept ${RUN}`;
const NOTE = `Remote note ${RUN}`;

test.describe.configure({ mode: "serial" });

/** Signs in through the real form; keeps every sheet response the page receives. */
async function signIn(page: Page, username: string) {
  const sheets: string[] = [];
  page.on("response", async (response: Response) => {
    if (/\/api\/v1\/(characters|familiars)/.test(response.url()) && response.ok()) sheets.push(await response.text().catch(() => ""));
  });
  await page.goto("/");
  await page.locator("#input-sign-in-username").fill(username);
  await page.locator("#input-sign-in-password").fill(PASSWORD);
  await page.locator("#btn-sign-in-submit").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  return sheets;
}

const saved = (page: Page, path: RegExp, method: string) =>
  page.waitForResponse(r => path.test(new URL(r.url()).pathname) && r.request().method() === method && r.ok());

test("assigned player: edits and private notes are kept by the server; a GM-only field never reaches the browser", async ({ page }) => {
  const sheets = await signIn(page, "preview_alice");
  await expect(characterCard(page, "Fictional Luna")).toBeVisible();
  await expect(characterCard(page, "Fictional Professor")).toBeVisible();
  await expect(familiarCard(page, "Fictional Owl")).toBeVisible();

  await openCharacter(page, "Fictional Luna");
  await setEditMode(page, true);
  const patched = saved(page, /\/api\/v1\/characters\/[^/]+$/, "PATCH");
  await page.locator("#input-sheet-concepto").fill(CONCEPT);
  await patched;
  await setEditMode(page, false);

  await openTab(page, "notas");
  await page.locator("#btn-new-private-note").click();
  const noteSaved = saved(page, /\/api\/v1\/personal-notes\/[^/]+$/, "PATCH");
  await page.locator('[id^="private-note-title-"]').fill(NOTE);
  await noteSaved;
  await page.locator('[id^="btn-private-note-done-"]').click();

  await page.reload();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await openCharacter(page, "Fictional Luna");
  await setEditMode(page, true); // the concept box exists only in edit mode
  await expect(page.locator("#input-sheet-concepto")).toHaveValue(CONCEPT);
  await setEditMode(page, false);
  await openTab(page, "notas");
  await expect(page.locator("#private-notes")).toContainText(NOTE);

  expect(sheets.length).toBeGreaterThan(0);
  for (const body of sheets) expect(body).not.toContain(GM_ONLY_CLUE);
});

test("GM: reads the player's edit and the GM-only field, but not the player's private note", async ({ page }) => {
  const sheets = await signIn(page, "preview_gm");
  await openCharacter(page, "Fictional Luna");
  await setEditMode(page, true);
  await expect(page.locator("#input-sheet-concepto")).toHaveValue(CONCEPT);
  await setEditMode(page, false);
  expect(sheets.some(body => body.includes(GM_ONLY_CLUE))).toBe(true);
  await openTab(page, "notas");
  await expect(page.locator("#private-notes")).toBeVisible();
  await expect(page.locator("#private-notes")).not.toContainText(NOTE);
});

test("shared reader: sees the shared sheet only, with no way to edit it", async ({ page }) => {
  const sheets = await signIn(page, "preview_bob");
  await expect(characterCard(page, "Fictional Luna")).toBeVisible();
  await expect(characterCard(page, "Fictional Professor")).toHaveCount(0);
  await expect(familiarCard(page, "Fictional Owl")).toHaveCount(0);
  await openCharacter(page, "Fictional Luna");
  await expect(page.locator("#btn-detail-edit")).toHaveCount(0);
  for (const body of sheets) expect(body).not.toContain(GM_ONLY_CLUE);
});
