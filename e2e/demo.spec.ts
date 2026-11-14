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

// «Administración» (R4 a): the site administrator's accounts, campaigns, invitations
// and recovery links, on the mock server's copy of the server's rules.
test("administrator: campaigns, members, invitations, recovery links and accounts from «Administración»", async ({ page }) => {
  await openApp(page);
  await page.locator("#btn-settings").click();
  await expect(page.locator("#settings-card-admin")).toHaveCount(0); // a player has no «Administración»
  await viewAs(page, "admin");
  await expect(page.locator('[id^="character-card-"]')).toHaveCount(0); // the administrator sees no one else's sheet
  await page.locator("#btn-settings").click();
  await page.locator("#btn-settings-admin").click();
  await expect(page.locator("#admin-screen")).toContainText("Universo de demostración");

  // A new campaign, an existing account added to it and made its Máster.
  await page.locator("#input-new-campaign").fill("Campaña de prueba");
  await page.locator("#btn-create-campaign").click();
  const campaign = page.locator("section", { has: page.getByRole("heading", { name: "Campaña de prueba" }) });
  await expect(campaign).toContainText("Sin miembros todavía.");
  await campaign.getByRole("button", { name: "Añadir usuario" }).click();
  await page.locator("#admin-add-member").getByText("Jugadora (demo)").click();
  await expect(campaign).toContainText("@demo_player");
  await campaign.locator('[id$="-demo_player"][id^="tag-role-"]').click();
  await page.getByRole("menuitemradio", { name: /Máster/ }).click();
  await expect(campaign.locator('[id$="-demo_player"][id^="tag-role-"]')).toContainText("Máster");

  // An invitation: its link is shown once, then it is listed as pending until cancelled.
  await campaign.getByRole("button", { name: "Invitar jugador" }).click();
  await expect(page.locator("#admin-issued-link")).toContainText("/#invitacion=");
  await expect(campaign).toContainText(/Jugador · caduca el/);
  await page.locator("#btn-admin-issued-close").click();
  await campaign.locator('[id^="btn-cancel-invitation-"]').click();
  await page.locator("#btn-admin-cancel-invitation-confirm").click();
  await expect(campaign).toContainText("Ninguna.");

  // A recovery link, and an account disabled after a warning, then enabled again.
  await page.locator("#btn-recovery-demo_reader").click();
  await expect(page.locator("#admin-issued-link")).toContainText("/#recuperacion=");
  await expect(page.locator("#admin-issued")).toContainText("anula el enlace anterior");
  await page.locator("#switch-active-demo_reader").click();
  await page.locator("#btn-admin-disable-confirm").click();
  await expect(page.locator("#admin-user-demo_reader")).toContainText("Desactivada");
  await expect(page.locator("#switch-active-demo_admin")).toHaveCount(0); // never one's own account
  await page.locator("#switch-active-demo_reader").click();
  await expect(page.locator("#admin-user-demo_reader")).not.toContainText("Desactivada");

  // Back on the main list, the administrator's own campaign is still the one open.
  await page.locator("#btn-admin-back").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
});

// Partidas (R4 b): the Máster's own table management; players never see them.
test("Máster: names partidas, places a character in one, filters the list; players see none of it", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#btn-campaign-partidas")).toHaveCount(0);
  await expect(page.locator("[data-partida]")).toHaveCount(0);
  await page.locator("#list-filter-open").click();
  await expect(page.locator('[id^="list-filter-sheet-partida-"]')).toHaveCount(0); // no partida section for players
  await page.locator("#list-filter-sheet-close").click();

  await viewAs(page, "gm");
  await page.locator("#btn-campaign-partidas").click();
  await page.locator("#input-new-partida").fill("Mesa del domingo");
  await page.locator("#btn-add-partida").click();
  const domingo = page.locator('[id^="input-partida-name-"]').last();
  await expect(domingo).toHaveValue("Mesa del domingo");
  await domingo.fill("Los domingos");
  await domingo.press("Enter");
  await page.locator("#input-new-partida").fill("mesa del JUEVES");
  await page.locator("#btn-add-partida").click();
  await expect(page.locator("#app-global-toast")).toContainText("Ya hay una partida con ese nombre.");
  await page.locator("#btn-campaign-partidas-back").click();

  // Diego moves from Saturday's table to Sunday's; the filter follows.
  await openCharacter(page, "Diego Marés");
  await setEditMode(page, true);
  await expect(page.locator("#tag-partida")).toContainText("Mesa del sábado");
  await page.locator("#tag-partida").click();
  await page.getByRole("menuitemradio", { name: /Los domingos/ }).click();
  await expect(page.locator("#tag-partida")).toContainText("Los domingos");
  await setEditMode(page, false);
  await page.locator("#btn-detail-back").click();
  const filterBy = async (option: RegExp | string) => {
    await page.locator("#list-filter-open").click();
    await page.locator('[id^="list-filter-sheet-partida-"]', { hasText: option }).click();
    await page.locator("#list-filter-sheet-apply").click();
  };
  await filterBy("Los domingos");
  await expect(page.locator('[id^="character-card-"]')).toHaveCount(1);
  await expect(page.locator('[id^="character-card-"]')).toContainText("Diego Marés");
  await page.locator('[id^="list-filter-unset-partida-"]').click(); // the chip's «×»
  await expect(page.locator('[id^="character-card-"]')).toHaveCount(3);

  // A familiar follows its character: Ámbar is at Luna's table.
  await filterBy("Mesa del jueves");
  await expect(page.locator('[id^="familiar-card-"]')).toContainText("Ámbar");
  await expect(page.locator("#list-filter-summary")).toContainText("3 de 5");
  await page.locator('[id^="list-filter-unset-partida-"]').click();

  // Removing a partida keeps its character, «sin partida».
  await page.locator("#btn-campaign-partidas").click();
  await page.locator('[id^="btn-remove-partida-"]').last().click();
  await expect(page.locator("#modal-remove-partida")).toContainText("Sus personajes (1 personaje)");
  await page.locator("#btn-remove-partida-confirm").click();
  await expect(page.locator('[id^="input-partida-name-"]')).toHaveCount(2);
  await page.locator("#btn-campaign-partidas-back").click();
  await filterBy("Sin partida");
  await expect(page.locator('[id^="character-card-"]')).toContainText("Diego Marés");
});

test("filter bar: where to search, sort order and the filters sheet", async ({ page }) => {
  await openApp(page);
  await page.locator("#list-filter-search").fill("niebla");
  await expect(page.locator('[id^="character-card-"]')).toHaveCount(1); // Luna's concept
  await page.locator("#list-filter-field").click();
  await page.locator("#list-filter-field-option-nombre").click();
  await expect(page.locator('[id^="character-card-"]')).toHaveCount(0); // nobody is named that
  await page.locator("#list-filter-search").fill("");
  await page.locator("#list-filter-open").click();
  await page.locator("#list-filter-sheet-sortpage").click();
  await page.locator("#list-filter-sheet-sort-search").fill("expe");
  await page.locator("#list-filter-sheet-sort-xp").click();
  await expect(page.locator("#list-filter-sheet-dir-desc")).toHaveAttribute("aria-checked", "true"); // numbers start from the highest
  await page.locator("#list-filter-sheet-casa-IRATI").click();
  await expect(page.locator("#list-filter-sheet-apply")).toHaveText("Ver 2 resultados"); // Luna, and Ámbar following her
  await page.locator("#list-filter-sheet-apply").click();
  await expect(page.locator("#list-filter-summary")).toContainText("por experiencia, descendente");
  await expect(page.locator("#list-filter-open")).toContainText("1");
  await page.locator("#list-filter-open").click();
  await page.locator("#list-filter-sheet-clear").click();
  await page.locator("#list-filter-sheet-apply").click();
  await expect(page.locator("#list-filter-chips")).toHaveCount(0);
  await expect(page.locator("#list-filter-summary")).toContainText("por nombre, ascendente");
});
