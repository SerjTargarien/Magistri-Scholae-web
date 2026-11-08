// The feature checklist (docs/implementation-plan.md) on the account app,
// against the in-browser mock server with fictional data (demo build, R3.4).
// Runs at desktop and phone widths as the demo's assigned player; GM steps
// switch viewer. Results are read back from the mock server's stored copy.
import {
  characterCard, createCharacter, createFamiliar, expect, familiarCard, flushWrites, isMobile, openApp, openCharacter,
  openFamiliar, openTab, pngFile, reloadApp, setEditMode, storedSheet, test, viewAs, visibleOf,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  // The demo's test panel stays out of the way of the screens under test.
  await page.addInitScript(() => localStorage.setItem("magistri_demo_panel", "off"));
  await openApp(page);
});

test("demo banner and the player's fictional records; the GM's own character stays hidden", async ({ page }) => {
  await expect(page.locator("#mock-mode-banner")).toBeVisible();
  for (const name of ["Luna de Bruma", "Diego Marés"]) await expect(characterCard(page, name)).toBeVisible();
  for (const name of ["Ámbar", "Chispa"]) await expect(familiarCard(page, name)).toBeVisible();
  await expect(characterCard(page, "Profesor Silvio Niebla")).toHaveCount(0);
});

test("student: identity, house, aspects, complications and custom fields persist", async ({ page }) => {
  await createCharacter(page, "Smoke Student", {
    fill: async () => {
      await page.locator("#input-concepto").fill("Alchemist with a secret");
      await page.locator("#input-jugador").fill("Tester");
      await page.locator("#btn-form-tab-afiliacion").click();
      await expect(page.locator("#house-btn-URANIA svg").first()).toBeVisible(); // house crest artwork
      await page.locator("#house-btn-URANIA").click();
    },
  });
  await setEditMode(page, true);
  await page.getByPlaceholder("Añadir nuevo aspecto...").fill("Curious to a fault");
  await page.getByPlaceholder("Añadir nuevo aspecto...").press("Enter");
  await page.getByPlaceholder("Añadir complicación...").fill("Owes a debt");
  await page.getByPlaceholder("Añadir complicación...").press("Enter");
  await page.getByPlaceholder("Nombre del Atributo").last().fill("Patronus");
  await page.getByPlaceholder("Valor", { exact: true }).last().fill("Heron");
  await page.getByRole("button", { name: "Añadir Atributo Personalizado" }).click();
  await setEditMode(page, false);

  await reloadApp(page);
  await expect(characterCard(page, "Smoke Student")).toContainText("Tester");
  await openCharacter(page, "Smoke Student");
  await expect(page.locator("#detail-panel-aspectos")).toContainText("Curious to a fault");
  await expect(page.locator("#detail-panel-complicaciones")).toContainText("Owes a debt");
  await expect(page.locator("#detail-panel-custom-fields")).toContainText("Heron");
  const stored = await storedSheet(page, "Smoke Student");
  expect(stored).toMatchObject({ concepto: "Alchemist with a secret", jugador: "Tester", casa: "URANIA" });
  expect(stored!.aspectosPersonales.map((a: { value: string }) => a.value)).toEqual(["Curious to a fault"]);
  expect(stored!.complicaciones.map((a: { value: string }) => a.value)).toEqual(["Owes a debt"]);
  expect(stored!.camposPersonalizados).toEqual([expect.objectContaining({ nombre: "Patronus", valor: "Heron" })]);
  expect(stored).not.toHaveProperty("lema");
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
  const stored = await storedSheet(page, "Session Student");
  expect(stored).toMatchObject({ puntosDestino: 5, pxs: 2, estresFisico: 2, estresMental: 1 });
  expect(stored!.aspectoTemporal.map((a: { value: string }) => a.value)).toEqual(["Turned into a toad"]);
  expect(stored!.consecuenciasFisicas).toEqual([expect.objectContaining({ descripcion: "Numb arm" })]);
  expect(stored!.consecuenciasSociales).toEqual([expect.objectContaining({ descripcion: "Whispers behind me" })]);
});

test("skills, spells, potions, clubs, equipment and journal entries persist", async ({ page }) => {
  await createCharacter(page, "Studious Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator("#btn-skill-Atletismo-plus").click();
  // Players pick from the campaign's list; only the GM types new skills.
  await expect(page.locator("#input-new-skill-name-fisicas")).toHaveCount(0);
  await expect(page.locator("#btn-open-skill-list-fisicas")).toHaveCount(0); // every physical skill is already there
  await page.locator("#skill-row-Sigilo button").first().click(); // remove it
  await page.locator("#btn-open-skill-list-fisicas").click();
  await page.locator("#btn-pick-skill-sigilo").click(); // and pick it again
  await expect(page.locator("#btn-open-skill-list-fisicas")).toHaveCount(0);
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
  const stored = await storedSheet(page, "Studious Student");
  expect(stored!.habilidades.find((s: { catalogo?: string }) => s.catalogo === "atletismo").valor).toBe(1);
  expect(stored!.habilidades.filter((s: { catalogo?: string }) => s.catalogo === "sigilo")).toEqual([expect.objectContaining({ valor: 0 })]);
  expect(stored!.habilidades.filter((s: { catalogo?: string }) => !s.catalogo)).toEqual([]);
  expect(stored!.conjuros).toEqual([expect.objectContaining({ nombre: "Revelio" })]);
  expect(stored!.pociones).toEqual([expect.objectContaining({ nombre: "Draught of Calm" })]);
  expect(stored!.clubesList).toEqual([expect.objectContaining({ nombre: "Duelling Club" })]);
  expect(stored!.equipoList).toEqual([expect.objectContaining({ nombre: "Pewter cauldron" })]);
  expect(stored!.notasList).toEqual([expect.objectContaining({ titulo: "Suspicions", contenido: "The alchemy teacher hides something." })]);
});

test("a skill the GM types joins the campaign's list; players then pick it", async ({ page }) => {
  await createCharacter(page, "Skilled Student");
  await viewAs(page, "gm");
  await openCharacter(page, "Skilled Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator("#input-new-skill-name-fisicas").fill("Escalada");
  await page.locator("#btn-add-skill-fisicas").click();
  await expect(page.locator("#skill-row-Escalada")).toBeVisible();
  await setEditMode(page, false);
  await flushWrites(page);

  await viewAs(page, "player");
  await openCharacter(page, "Skilled Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator("#btn-skill-Escalada-plus").click();
  await setEditMode(page, false);
  await reloadApp(page);
  const stored = await storedSheet(page, "Skilled Student");
  expect(stored!.habilidades).toContainEqual(expect.objectContaining({ catalogo: "escalada", valor: 1 }));

  // Not «inicial»: a new character does not start with it, but can pick it.
  await page.locator("#btn-add-character-header").click();
  await page.locator("#type-select-student").click();
  await page.locator("#btn-form-tab-habilidades").click();
  await page.locator("#btn-open-skill-list-fisicas").click();
  await expect(page.locator("#btn-pick-skill-escalada")).toBeVisible();
});

test("the GM's campaign skill list: starting skills, names and new skills", async ({ page }) => {
  await viewAs(page, "gm");
  await page.locator("#btn-settings").click();
  await page.locator("#btn-settings-campaign-skills").click();
  await expect(page.locator("#campaign-skills-screen")).toBeVisible();
  await page.locator("#chk-initial-sigilo").uncheck();
  await page.locator("#input-skill-name-duelo").fill("Duelo mágico");
  await page.locator("#input-new-catalogue-skill-fisicas").fill("Cetrería");
  await page.locator("#btn-add-catalogue-skill-fisicas").click();
  await page.locator("#input-skill-name-cetreria").fill("Empatía"); // a name already in use
  await expect(page.locator("#btn-campaign-skills-save")).toBeDisabled();
  await page.locator("#input-skill-name-cetreria").fill("Cetrería");
  await page.locator("#btn-campaign-skills-save").click();
  await expect(page.locator("#campaign-skills-bar")).toHaveCount(0);

  await viewAs(page, "player");
  await createCharacter(page, "Fresh Student");
  const stored = await storedSheet(page, "Fresh Student");
  const linked = stored!.habilidades.map((s: { catalogo?: string }) => s.catalogo);
  expect(linked).not.toContain("sigilo");
  expect(linked).toContain("cetreria"); // new skills start on unless the GM unticks them
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await expect(page.locator('[id="skill-row-Duelo mágico"]')).toBeVisible(); // linked skills show the list's name
  await page.locator("#btn-open-skill-list-fisicas").click();
  await page.locator("#btn-pick-skill-sigilo").click();
  await expect(page.locator("#btn-open-skill-list-fisicas")).toHaveCount(0);
});

test("esoteric skills keep a knowledge level, set in the form and on the sheet", async ({ page }) => {
  await createCharacter(page, "Esoteric Student", {
    fill: async () => {
      await page.locator("#btn-form-tab-habilidades").click();
      await page.locator('[id^="select-knowledge-"]').first().selectOption("basico"); // the form always shows the selector
    },
  });
  let stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.filter((s: { conocimiento?: string }) => s.conocimiento)).toEqual([expect.objectContaining({ conocimiento: "basico" })]);
  const cabala = stored!.habilidades.find((s: { catalogo?: string }) => s.catalogo === "cabala");

  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator(`#btn-skill-Cábala-plus`).click();
  await page.locator(`#select-knowledge-${cabala.id}`).selectOption("medio");
  await setEditMode(page, false);
  await reloadApp(page);
  await openCharacter(page, "Esoteric Student");
  await openTab(page, "habilidades");
  await expect(page.locator(`#tag-knowledge-${cabala.id}`)).toContainText("Medio");
  await expect(page.locator('[id^="select-knowledge-"]')).toHaveCount(0); // only in edit mode
  stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.find((s: { id: string }) => s.id === cabala.id)).toMatchObject({ catalogo: "cabala", valor: 1, conocimiento: "medio" });

  await setEditMode(page, true);
  await page.locator(`#select-knowledge-${cabala.id}`).selectOption("");
  await setEditMode(page, false);
  await reloadApp(page);
  stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.find((s: { id: string }) => s.id === cabala.id)).toEqual({ id: cabala.id, catalogo: "cabala", valor: 1 });
  // Only esoteric skills have a level.
  await openCharacter(page, "Esoteric Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await expect(page.locator('#skill-block-fisicas [id^="select-knowledge-"]')).toHaveCount(0);
});

test("adult wizard: profile fields and archetype tabs persist", async ({ page }) => {
  await createCharacter(page, "Smoke Professor", {
    type: "adult-wizard",
    fill: async () => {
      await page.locator("#input-aw-role").fill("Potions master");
      await page.locator("#input-aw-institution").fill("Academy");
      await page.locator("#input-varita-sintonia").fill("Elder staff");
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
  await expect(page.locator("#character-detail-screen")).toContainText("Elder staff"); // one «Varita / Foco mágico» field
  const stored = await storedSheet(page, "Smoke Professor");
  expect(stored).toMatchObject({
    characterType: "adult_wizard", varitaSintonia: "Elder staff",
    adultWizardProfile: expect.objectContaining({ role: "Potions master", institution: "Academy", isTeacher: true }),
  });
  expect(stored!.adultWizardProfile).not.toHaveProperty("magicalFocus");
});

test("familiar: create standalone and edit in the editor; only the GM can archive it", async ({ page }) => {
  await createFamiliar(page, "Smoke Toad", "Toad");
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Toad");
  await openFamiliar(page, "Smoke Toad");
  await expect(page.locator("#btn-familiar-delete")).toHaveCount(0);
  await page.locator("#btn-familiar-full-editor").click();
  await page.locator("#input-familiar-especie").fill("Giant toad");
  await page.locator("#btn-save-familiar").click();
  await page.locator("#btn-familiar-back").click();
  await expect(page.locator("#familiar-detail-container")).toContainText("Giant toad");

  await reloadApp(page);
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Giant toad");
  await viewAs(page, "gm");
  await openFamiliar(page, "Smoke Toad");
  await page.locator("#btn-familiar-delete").click();
  await page.getByRole("button", { name: "Sí, Archivar Familiar" }).click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await expect(familiarCard(page, "Smoke Toad")).toHaveCount(0);
  await reloadApp(page);
  await expect(familiarCard(page, "Smoke Toad")).toHaveCount(0);
  expect(await storedSheet(page, "Smoke Toad")).toMatchObject({ especie: "Giant toad" }); // archived, not deleted
});

test("bonds: link from the character, navigate both ways; archiving the character takes it off the list", async ({ page }) => {
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
  await expect(page.locator("#btn-detail-delete")).toHaveCount(0);

  await viewAs(page, "gm");
  await openCharacter(page, "Bonded Student");
  await page.locator("#btn-detail-delete").click();
  await page.locator("#checkbox-confirm-student-delete").check();
  await page.locator("#btn-confirm-delete-student-action").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await expect(characterCard(page, "Bonded Student")).toHaveCount(0);
  await expect(familiarCard(page, "Chispa")).not.toContainText("Bonded Student");
});

test("player: create a familiar from the character sheet, then bond it there", async ({ page }) => {
  await createCharacter(page, "Sheet Owner");
  await setEditMode(page, true);
  await visibleOf(page, "header-familiar-bond-btn", "header-familiar-bond-btn-mobile").click();
  await page.getByRole("button", { name: /Create Familiar|Crear Familiar/ }).click();
  await page.locator("#input-familiar-nombre").fill("Sheet Owl");
  await page.locator("#input-familiar-especie").fill("Owl");
  await page.locator("#input-familiar-descripcion").fill("Sheet Owl description");
  await page.locator("#btn-save-familiar").click();
  await page.locator("#btn-familiar-back").click();
  await expect(page.locator("#character-detail-screen")).toContainText("Sheet Owner");
  await setEditMode(page, true); // the sheet reopens in reading mode, as before the switch
  await visibleOf(page, "header-familiar-bond-btn", "header-familiar-bond-btn-mobile").click();
  await page.getByRole("button", { name: /Sheet Owl/ }).last().click();
  await setEditMode(page, false);

  await reloadApp(page);
  await expect(familiarCard(page, "Sheet Owl")).toContainText("Sheet Owner");
  await expect(page.getByText(/Could not load your data|No se pudieron cargar los datos/)).toHaveCount(0);
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
  await expect(page.locator("#detail-tab-galeria img").first()).toBeVisible();
  await setEditMode(page, false);

  await reloadApp(page);
  await openCharacter(page, "Portrait Student");
  await openTab(page, "galeria");
  await expect(page.locator("#detail-tab-galeria img").first()).toBeVisible();
  const stored = await storedSheet(page, "Portrait Student");
  const asset = /^[0-9a-f-]{36}$/;
  expect(stored!.avatarImage).toMatch(asset);  // an uploaded image, never an embedded data URL
  expect(stored!.galleryImages).toEqual([{ id: expect.any(String), value: expect.stringMatching(asset) }]);
});

test("visual style switches and persists; the interface is Spanish only", async ({ page }, testInfo) => {
  const root = page.locator("#academy-app-root");
  const addButton = page.locator("#btn-add-character-header");
  await expect(root).toHaveAttribute("data-style", "academy");
  await expect(addButton).toContainText("Nuevo Personaje");
  await testInfo.attach("list-academy", { body: await page.screenshot(), contentType: "image/png" });
  await page.locator("#btn-settings").click();
  await expect(page.locator("#settings-card-lang")).toHaveCount(0); // owner decision: Spanish only for now
  await page.locator("#btn-style-classic").click();
  await expect(root).toHaveAttribute("data-style", "classic");
  await page.locator("#btn-settings-back").click();

  // An English choice saved before the selector was hidden is ignored.
  await page.evaluate(() => localStorage.setItem("magistri_scholae_lang", "en"));
  await reloadApp(page);
  await expect(root).toHaveAttribute("data-style", "classic");
  await expect(addButton).toContainText("Nuevo Personaje");
  await openCharacter(page, "Luna de Bruma");
  await testInfo.attach("detail-classic", { body: await page.screenshot(), contentType: "image/png" });
});

test("settings: account card with sign-out; signing out shows the sign-in screen", async ({ page }) => {
  await page.locator("#btn-settings").click();
  await expect(page.locator("#settings-card-account")).toContainText("demo_player");
  for (const removed of ["#settings-card-backup", "#settings-card-reset"]) await expect(page.locator(removed)).toHaveCount(0);
  await page.locator("#btn-settings-logout").click();
  // The sign-in screen is drawn in the app's own frame and style.
  await expect(page.locator("#academy-app-root #sign-in-card")).toBeVisible();
  await page.locator("#input-sign-in-username").fill("nobody");
  await page.locator("#input-sign-in-password").fill("whatever");
  await page.locator("#btn-sign-in-submit").click();
  await expect(page.getByRole("alert")).toContainText("Usuario o contraseña incorrectos.");
  await page.waitForTimeout(500); // the expired-session message, when wrongly shown, comes a moment later
  await expect(page.getByText("No se pudieron cargar los datos")).toHaveCount(0); // not an expired session
  await page.locator("#input-sign-in-username").fill("demo_player");
  await page.locator("#input-sign-in-password").fill("whatever");
  await page.locator("#btn-sign-in-submit").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
});

test("an invitation link opens «Aceptar invitación» with the code filled in, and leaves the address bar", async ({ page }) => {
  await page.locator("#btn-settings").click();
  await page.locator("#btn-settings-logout").click();
  await expect(page.locator("#sign-in-card")).toBeVisible();
  await page.goto("/#invitacion=AbC_12-x");
  await expect(page.locator("#btn-sign-in-mode-register")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#input-sign-in-code")).toHaveValue("AbC_12-x");
  expect(await page.evaluate(() => location.hash)).toBe("");
  await page.goto("/#recuperacion=zZ9");
  await expect(page.locator("#btn-sign-in-mode-reset")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#input-sign-in-code")).toHaveValue("zZ9");
  // Opened fresh in a new tab, as from a text message.
  const fresh = await page.context().newPage();
  await fresh.goto("/#invitacion=Fresh-1");
  await expect(fresh.locator("#input-sign-in-code")).toHaveValue("Fresh-1");
  expect(await fresh.evaluate(() => location.hash)).toBe("");
});

test("a new password is typed twice when accepting an invitation or resetting", async ({ page }) => {
  await page.locator("#btn-settings").click();
  await page.locator("#btn-settings-logout").click();
  await page.goto("/#invitacion=AbC_12-x");
  await page.locator("#input-sign-in-username").fill("nueva_jugadora");
  await page.locator("#input-sign-in-password").fill("una-contraseña-larga-1");
  await page.locator("#input-sign-in-password-repeat").fill("una-contraseña-larga-2");
  await page.locator("#btn-sign-in-submit").click();
  await expect(page.getByRole("alert")).toContainText("no coinciden");
  await expect(page.locator("#input-sign-in-password")).toHaveValue("");
  await expect(page.locator("#input-sign-in-password-repeat")).toHaveValue("");
  await page.locator("#input-sign-in-password").fill("una-contraseña-larga-1");
  await page.locator("#input-sign-in-password-repeat").fill("una-contraseña-larga-1");
  await page.locator("#btn-sign-in-submit").click();
  await expect(page.getByRole("alert")).toContainText("código de invitación no es válido"); // reached the server
  await page.locator("#btn-sign-in-mode-reset").click();
  await expect(page.locator("#input-sign-in-password-repeat")).toBeVisible();
  await page.locator("#btn-sign-in-mode-login").click();
  await expect(page.locator("#input-sign-in-password-repeat")).toHaveCount(0); // signing in needs it once
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
