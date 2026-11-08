// Look baseline (release R3.1): every existing screen, in both visual styles
// and both languages, compared with reference pictures. The visual-desktop and
// visual-mobile projects run it, only inside the pinned Playwright container
// (CI job "visual"), so fonts and rendering are identical between runs.
//
// A difference fails the check. A justified change needs the owner's approval
// of before-and-after pictures; only then are the references replaced
// (docs/development.md, "Screenshot tests").
import type { Page } from "@playwright/test";
import { expect, openApp, openCharacter, openFamiliar, openTab, setEditMode, test } from "./helpers";
import { viewAs } from "./helpers";

// A sheet test takes twelve pictures; each waits until two captures match.
test.describe.configure({ timeout: 180_000 });

const STYLES = ["academy", "classic"] as const;
const LANGUAGES = ["es", "en"] as const;
const SHEET_TABS = ["perfil", "sesion", "habilidades", "hechizos", "notas", "galeria"];

async function prepare(page: Page, style: string, lang: string) {
  await page.clock.setFixedTime(new Date("2026-11-01T10:00:00Z"));
  await page.addInitScript(([style, lang]) => {
    localStorage.setItem("magistri_scholae_style", style);
    localStorage.setItem("magistri_scholae_lang", lang);
    // The demo's test panel is not part of the screens.
    localStorage.setItem("magistri_demo_panel", "off");
  }, [style, lang]);
  await openApp(page);
  // The GM sees every sheet and field, as the screenshots always have. The demo
  // data is the fictional characters these pictures were first taken with.
  await viewAs(page, "gm");
}

/** Takes one full-page picture once the page is still: fonts loaded, no hover, no focus ring. */
async function snap(page: Page, name: string) {
  await page.mouse.move(0, 0);
  const fontsReady = await page.evaluate(async () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    await document.fonts.ready;
    const loaded = (family: string) => [...document.fonts].some(f => f.family.includes(family) && f.status === "loaded");
    return loaded("Cinzel") && loaded("Inter");
  });
  expect(fontsReady, "Google fonts loaded").toBe(true);
  await expect(page).toHaveScreenshot(`${name}.webp`, { fullPage: true, animations: "disabled", caret: "hide", timeout: 20_000 });
}

for (const style of STYLES) {
  for (const lang of LANGUAGES) {
    test.describe(`${style} ${lang}`, () => {
      const id = (name: string) => `${name}-${style}-${lang}`;
      test.beforeEach(async ({ page }) => prepare(page, style, lang));

      test("character list", async ({ page }) => {
        await snap(page, id("list"));
      });

      test("type selection", async ({ page }) => {
        await page.locator("#btn-add-character-header").click();
        await expect(page.locator("#type-select-student")).toBeVisible();
        await snap(page, id("type-select"));
      });

      for (const type of ["student", "adult-wizard"] as const) {
        test(`creation form, ${type}`, async ({ page }) => {
          await page.locator("#btn-add-character-header").click();
          await page.locator(`#type-select-${type}`).click();
          await expect(page.locator("#character-form-container")).toBeVisible();
          const tabs = ["perfil", "aspectos", ...(type === "student" ? ["afiliacion"] : []), "habilidades", "estres"];
          for (const tab of tabs) {
            await page.locator(`#btn-form-tab-${tab}`).click();
            await snap(page, id(`form-${type}-${tab}`));
          }
        });
      }

      for (const [label, name] of [["student", "Luna de Bruma"], ["adult-wizard", "Profesor Silvio Niebla"]] as const) {
        test(`character sheet, ${label}`, async ({ page }) => {
          await openCharacter(page, name);
          for (const editing of [false, true]) {
            await setEditMode(page, editing);
            for (const tab of SHEET_TABS) {
              await openTab(page, tab);
              await snap(page, id(`sheet-${label}-${tab}-${editing ? "edit" : "view"}`));
            }
          }
        });
      }

      test("familiar sheet", async ({ page }) => {
        await openFamiliar(page, "Ámbar");
        for (const tab of ["perfil", "notas", "galeria"]) {
          await page.locator(`#familiar-tab-${tab}`).click();
          await snap(page, id(`familiar-${tab}`));
        }
        await page.locator("#familiar-tab-perfil").click();
        await page.locator("#btn-familiar-quick-edit").click();
        await snap(page, id("familiar-perfil-quick-edit"));
      });

      test("familiar editor, existing familiar", async ({ page }) => {
        await openFamiliar(page, "Ámbar");
        await page.locator("#btn-familiar-full-editor").click();
        await expect(page.locator("#btn-save-familiar")).toBeVisible();
        await snap(page, id("familiar-editor-existing"));
      });

      test("familiar editor, new familiar", async ({ page }) => {
        await page.locator("#btn-add-character-header").click();
        await page.locator("#type-select-familiar-editor").click();
        await expect(page.locator("#btn-save-familiar")).toBeVisible();
        await snap(page, id("familiar-editor-new"));
      });

      test("settings", async ({ page }) => {
        await page.locator("#btn-settings").click();
        await expect(page.locator("#settings-card-account")).toContainText("demo_gm");
        await snap(page, id("settings"));
      });
    });
  }
}
