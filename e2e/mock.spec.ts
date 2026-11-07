// Feature-checklist smoke tests in mock mode (fictional data, isolated
// MagistriScholaeMockDB). Runs at desktop and mobile widths. Text assertions
// use the default Spanish UI unless a test switches language.
import {
  characterCard, createCharacter, createFamiliar, expect, exportOpenCharacter, familiarCard, isMobile,
  openApp, openCharacter, openFamiliar, openTab, pngFile, reloadApp, setEditMode, test, visibleOf,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("mock mode shows the demo banner and the fictional records", async ({ page }) => {
  await expect(page.locator("#mock-mode-banner")).toBeVisible();
  for (const name of ["Luna de Bruma", "Profesor Silvio Niebla"]) await expect(characterCard(page, name)).toBeVisible();
  for (const name of ["Ámbar", "Chispa"]) await expect(familiarCard(page, name)).toBeVisible();
});

test("student: identity, house, aspects, complications and custom fields persist", async ({ page }) => {
  await createCharacter(page, "Smoke Student", {
    fill: async () => {
      await page.locator("#input-concepto").fill("Alchemist with a secret");
      await page.locator("#input-jugador").fill("Tester");
      await page.locator("#btn-form-tab-afiliacion").click();
      await expect(page.locator("#house-btn-URANIA svg").first()).toBeVisible(); // house crest artwork
      await page.locator("#house-btn-URANIA").click();
      await page.locator("#input-form-lema").fill("Per aspera");
    },
  });
  await setEditMode(page, true);
  await page.getByPlaceholder("Añadir nuevo aspecto...").fill("Curious to a fault");
  await page.getByPlaceholder("Añadir nuevo aspecto...").press("Enter");
  await page.getByPlaceholder("Añadir complicación...").fill("Owes a debt");
  await page.getByPlaceholder("Añadir complicación...").press("Enter");
  await page.getByPlaceholder("Nombre del Atributo").fill("Patronus");
  await page.getByPlaceholder("Valor", { exact: true }).fill("Heron");
  await page.getByRole("button", { name: "Añadir Atributo Personalizado" }).click();
  await setEditMode(page, false);

  await reloadApp(page);
  await expect(characterCard(page, "Smoke Student")).toContainText("Tester");
  await openCharacter(page, "Smoke Student");
  await expect(page.locator("#detail-panel-aspectos")).toContainText("Curious to a fault");
  await expect(page.locator("#detail-panel-complicaciones")).toContainText("Owes a debt");
  await expect(page.locator("#detail-panel-custom-fields")).toContainText("Heron");
  const { character } = await exportOpenCharacter(page);
  expect(character).toMatchObject({
    nombre: "Smoke Student", concepto: "Alchemist with a secret", jugador: "Tester", casa: "URANIA", lema: "Per aspera",
    aspectosPersonales: ["Curious to a fault"], complicaciones: ["Owes a debt"],
    camposPersonalizados: [{ nombre: "Patronus", valor: "Heron" }],
  });
});

test("session tracking: destiny, XP, stress, temporary aspects and consequences persist", async ({ page }) => {
  await createCharacter(page, "Session Student");
  await openTab(page, "sesion");
  await page.getByRole("button", { name: "Puntos de Destino: 5" }).click();
  await page.locator("#btn-exp-plus").click();
  await page.locator("#btn-exp-plus").click();
  await page.locator("#stress-phys-box-2").click();
  await page.locator("#stress-mental-box-1").click();
  await page.locator("#input-session-new-temp-aspect").fill("Turned into a toad");
  await page.locator("#btn-session-add-temp-aspect").click();
  await page.locator("#input-session-new-phys-consequence").fill("Numb arm");
  await page.locator("#btn-session-add-phys-consequence").click();
  await page.locator("#input-session-new-social-consequence").fill("Whispers behind me");
  await page.locator("#btn-session-add-social-consequence").click();

  await reloadApp(page);
  await openCharacter(page, "Session Student");
  await openTab(page, "sesion");
  await expect(page.locator("#detail-tab-sesion")).toContainText("Numb arm");
  const { character } = await exportOpenCharacter(page);
  expect(character).toMatchObject({
    puntosDestino: 5, pxs: 2, estresFisico: 2, estresMental: 1,
    aspectoTemporal: ["Turned into a toad"], consecuenciasFisicas: ["Numb arm"], consecuenciasSociales: ["Whispers behind me"],
  });
});

test("skills, spells, potions, clubs, equipment and journal entries persist", async ({ page }) => {
  await createCharacter(page, "Studious Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator("#btn-skill-Atletismo-plus").click();
  await page.locator("#input-new-skill-name-Físicas").fill("Escalada");
  await page.locator("#btn-add-skill-Físicas").click();
  await openTab(page, "hechizos");
  await page.locator("#input-spell-name").fill("Revelio");
  await page.locator("#btn-add-spell").click();
  await page.locator("#input-potion-name").fill("Draught of Calm");
  await page.locator("#btn-add-potion").click();
  await openTab(page, "notas");
  await page.locator("#input-new-club").fill("Duelling Club");
  await page.locator("#btn-add-club").click();
  await page.locator("#input-new-item").fill("Pewter cauldron");
  await page.locator("#btn-add-inventory-item").click();
  await page.locator("#input-new-note-title").fill("Suspicions");
  await page.locator("#input-new-note-content").fill("The alchemy teacher hides something.");
  await page.locator("#btn-add-note").click();
  await setEditMode(page, false);

  await reloadApp(page);
  await openCharacter(page, "Studious Student");
  await openTab(page, "hechizos");
  await expect(page.locator("#detail-tab-hechizos")).toContainText("Revelio");
  await openTab(page, "notas");
  await expect(page.locator("#detail-tab-notas")).toContainText("Suspicions");
  const { character } = await exportOpenCharacter(page);
  const skill = (name: string) => character.habilidades.find((s: { nombre: string }) => s.nombre === name);
  expect(skill("Atletismo").valor).toBe(1);
  expect(skill("Escalada")).toMatchObject({ categoria: "Físicas" });
  expect(character.conjuros).toEqual([expect.objectContaining({ nombre: "Revelio" })]);
  expect(character.pociones).toEqual([expect.objectContaining({ nombre: "Draught of Calm" })]);
  expect(character.clubesList).toEqual([expect.objectContaining({ nombre: "Duelling Club" })]);
  expect(character.equipoList).toEqual([expect.objectContaining({ nombre: "Pewter cauldron" })]);
  expect(character.notasList).toEqual([expect.objectContaining({ titulo: "Suspicions", contenido: "The alchemy teacher hides something." })]);
});

test("adult wizard: profile fields and archetype tabs persist", async ({ page }) => {
  await createCharacter(page, "Smoke Professor", {
    type: "adult-wizard",
    fill: async () => {
      await page.locator("#input-aw-role").fill("Potions master");
      await page.locator("#input-aw-institution").fill("Academy");
      await page.locator("#checkbox-aw-is-teacher").check();
    },
  });
  for (const tab of ["perfil", "sesion", "habilidades", "hechizos", "notas", "galeria"]) await expect(page.locator(`#tab-button-${tab}`)).toBeVisible();
  await reloadApp(page);
  await page.locator("#filter-badge-adult-wizard").click();
  await expect(characterCard(page, "Smoke Professor")).toBeVisible();
  await expect(characterCard(page, "Luna de Bruma")).toHaveCount(0);
  await openCharacter(page, "Smoke Professor");
  await expect(page.locator("#character-detail-screen")).toContainText("Potions master");
  const { character } = await exportOpenCharacter(page);
  expect(character).toMatchObject({
    characterType: "adult_wizard",
    adultWizardProfile: expect.objectContaining({ role: "Potions master", institution: "Academy", isTeacher: true }),
  });
});

test("familiar: create standalone, edit in the editor and delete", async ({ page }) => {
  await createFamiliar(page, "Smoke Toad", "Toad");
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Toad");
  await openFamiliar(page, "Smoke Toad");
  await page.locator("#btn-familiar-full-editor").click();
  await page.locator("#input-familiar-especie").fill("Giant toad");
  await page.locator("#btn-save-familiar").click();
  await page.locator("#btn-familiar-back").click();
  await expect(page.locator("#familiar-detail-container")).toContainText("Giant toad");

  await reloadApp(page);
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Giant toad");
  await openFamiliar(page, "Smoke Toad");
  await page.locator("#btn-familiar-delete").click();
  await page.getByRole("button", { name: "Sí, Eliminar Familiar" }).click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await expect(familiarCard(page, "Smoke Toad")).toHaveCount(0);
  await reloadApp(page);
  await expect(familiarCard(page, "Smoke Toad")).toHaveCount(0);
});

test("bonds: link from the character, navigate both ways, deletion clears the familiar's link", async ({ page }) => {
  await createCharacter(page, "Bonded Student");
  await setEditMode(page, true);
  await visibleOf(page, "header-familiar-bond-btn", "header-familiar-bond-btn-mobile").click();
  await page.getByRole("button", { name: /Chispa/ }).last().click();
  await setEditMode(page, false);

  await reloadApp(page);
  await expect(familiarCard(page, "Chispa")).toContainText("Bonded Student");
  await openCharacter(page, "Bonded Student");
  await visibleOf(page, "header-familiar-card", "header-familiar-card-mobile").click();
  await expect(page.locator("#familiar-detail-container")).toContainText("Chispa");
  await expect(page.locator("#familiar-bond-card")).toContainText("Bonded Student");
  await page.locator("#btn-navigate-to-master").click();
  await expect(page.locator("#character-detail-screen")).toContainText("Bonded Student");

  await page.locator("#btn-detail-delete").click();
  await page.locator("#checkbox-confirm-student-delete").check();
  await page.locator("#btn-confirm-delete-student-action").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await expect(characterCard(page, "Bonded Student")).toHaveCount(0);
  await expect(familiarCard(page, "Chispa")).not.toContainText("Bonded Student");
  await reloadApp(page);
  await expect(familiarCard(page, "Chispa")).not.toContainText("Bonded Student");
});

test("portrait upload with crop and a gallery image persist", async ({ page }) => {
  await createCharacter(page, "Portrait Student", {
    fill: async () => {
      await page.locator("#avatar-file-input").setInputFiles(pngFile());
      await expect(page.locator("#crop-avatar-modal")).toBeVisible();
      await page.getByRole("button", { name: "Confirmar Recorte" }).click();
      await expect(page.locator("#crop-avatar-modal")).toHaveCount(0);
      await expect(page.locator("#avatar-edit-preview")).toHaveAttribute("src", /^data:image\//);
    },
  });
  await setEditMode(page, true);
  await openTab(page, "galeria");
  await page.locator("#input-gallery-picker").setInputFiles(pngFile("gallery.png"));
  await expect(page.locator("#gallery-item-0")).toBeVisible();
  await setEditMode(page, false);

  await reloadApp(page);
  await openCharacter(page, "Portrait Student");
  await openTab(page, "galeria");
  await expect(page.locator("#gallery-item-0")).toBeVisible();
  const { character } = await exportOpenCharacter(page);
  expect(character.avatarImage).toMatch(/^data:image\//);
  expect(character.galleryImages).toHaveLength(1);
});

test("visual style and language switch and persist", async ({ page }, testInfo) => {
  const root = page.locator("#academy-app-root");
  const addButton = page.locator("#btn-add-character-header");
  await expect(root).toHaveAttribute("data-style", "academy");
  await expect(addButton).toContainText("Nuevo Personaje");
  await testInfo.attach("list-academy", { body: await page.screenshot(), contentType: "image/png" });
  await page.locator("#btn-settings").click();
  await page.locator("#btn-style-classic").click();
  await expect(root).toHaveAttribute("data-style", "classic");
  await page.locator("#settings-language-dropdown").selectOption("en");
  await page.locator("#btn-settings-back").click();
  await expect(addButton).toContainText("Add Character");

  await reloadApp(page);
  await expect(root).toHaveAttribute("data-style", "classic");
  await expect(addButton).toContainText("Add Character");
  await openCharacter(page, "Luna de Bruma");
  await testInfo.attach("detail-classic-en", { body: await page.screenshot(), contentType: "image/png" });
});

test("profile banner shows the bonded familiar for the current width, without horizontal scrolling", async ({ page }, testInfo) => {
  const noHorizontalScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await noHorizontalScroll()).toBe(true);
  await openCharacter(page, "Luna de Bruma");
  const mobile = page.locator("#header-familiar-card-mobile");
  const desktop = page.locator("#header-familiar-card");
  if (isMobile(page)) {
    await expect(mobile).toBeVisible();
    await expect(mobile).toContainText("Ámbar");
    await expect(desktop).toBeHidden();
  } else {
    await expect(desktop).toBeVisible();
    await expect(desktop).toContainText("Ámbar");
    await expect(mobile).toBeHidden();
  }
  expect(await noHorizontalScroll()).toBe(true);
  await testInfo.attach("detail-banner", { body: await page.screenshot(), contentType: "image/png" });
});
