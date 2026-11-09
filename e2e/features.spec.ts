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
  await page.getByPlaceholder("Nuevo aspecto").fill("Curious to a fault");
  await page.getByPlaceholder("Nuevo aspecto").press("Enter");
  await page.getByPlaceholder("Nueva complicación").fill("Owes a debt");
  await page.getByPlaceholder("Nueva complicación").press("Enter");
  await page.getByPlaceholder("Nombre del Atributo").last().fill("Patronus");
  await page.getByPlaceholder("Valor", { exact: true }).last().fill("Heron");
  await page.getByRole("button", { name: "Añadir campo" }).click();
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
  // Three gems by default; each point above three adds one, up to 10.
  const gems = page.locator("#destiny-gems-container button");
  await expect(gems).toHaveCount(3);
  for (let i = 0; i < 9; i++) await page.locator("#btn-dest-plus").click();
  await expect(gems).toHaveCount(10);
  await page.getByRole("button", { name: "Puntos de Destino: 7" }).click();
  await expect(gems).toHaveCount(7);
  await page.locator("#btn-exp-plus").click();
  await page.locator("#btn-exp-plus").click();
  await expect(page.locator("#input-exp")).toHaveCount(0); // typed only in edit mode
  await page.locator("#stress-phys-box-2").click();
  await page.locator("#stress-mental-box-1").click();
  await page.locator("#input-session-new-temp-aspect").fill("Turned into a toad");
  await page.locator("#btn-session-add-temp-aspect").click();
  // A new consequence starts as «Leve»; another severity is one tap.
  await page.locator("#input-session-new-phys-consequence").fill("Numb arm");
  await page.locator("#btn-session-add-phys-consequence").click();
  await page.locator("#btn-session-severity-social-grave").click();
  await page.locator("#input-session-new-social-consequence").fill("Whispers behind me");
  await page.locator("#btn-session-add-social-consequence").click();
  await expect(page.locator("#btn-session-severity-social-leve")).toHaveAttribute("aria-checked", "true");

  await reloadApp(page);
  await openCharacter(page, "Session Student");
  await openTab(page, "sesion");
  await expect(page.locator("#detail-tab-sesion")).toContainText("Numb arm");
  let stored = await storedSheet(page, "Session Student");
  expect(stored).toMatchObject({ puntosDestino: 7, pxs: 2, estresFisico: 2, estresMental: 1 });
  expect(stored!.aspectoTemporal.map((a: { value: string }) => a.value)).toEqual(["Turned into a toad"]);
  expect(stored!.consecuenciasFisicas).toEqual([expect.objectContaining({ descripcion: "Numb arm", gravedad: "leve" })]);
  expect(stored!.consecuenciasSociales).toEqual([expect.objectContaining({ descripcion: "Whispers behind me", gravedad: "grave" })]);

  // The severity tag changes outside edit mode; experience is typed in edit mode.
  const arm = stored!.consecuenciasFisicas[0].id;
  // Severity changes from its tag: a menu drawn by the app, never a browser selector.
  await expect(page.locator("#detail-tab-sesion select")).toHaveCount(0);
  const armTag = page.locator(`#tag-severity-${arm}`);
  await expect(armTag).toContainText("Leve");
  await armTag.click();
  await expect(page.locator(`#tag-severity-${arm}-menu`)).toBeVisible();
  await page.keyboard.press("Escape"); // closes without a change and gives the tag its focus back
  await expect(page.locator(`#tag-severity-${arm}-menu`)).toHaveCount(0);
  await expect(armTag).toBeFocused();
  await armTag.click();
  await page.locator(`#tag-severity-${arm}-option-moderada`).click();
  await expect(armTag).toContainText("Moderada");
  await setEditMode(page, true);
  await openTab(page, "sesion");
  await page.locator("#input-exp").fill("250000");
  await page.locator("#input-exp").press("Enter");
  await page.locator("#input-exp").fill("");
  await page.locator("#input-exp").blur(); // an emptied box changes nothing
  await setEditMode(page, false);
  await expect(page.locator("#value-exp")).toHaveText("250000");
  await reloadApp(page);
  stored = await storedSheet(page, "Session Student");
  expect(stored).toMatchObject({ pxs: 250000 });
  await expect(characterCard(page, "Session Student").first()).toContainText("250 mil"); // short on the card
  expect(stored!.consecuenciasFisicas[0]).toMatchObject({ id: arm, gravedad: "moderada" });
});

test("a text box shows a counter near its limit and stops at it", async ({ page }) => {
  await createCharacter(page, "Counted Student", {
    fill: async () => {
      const concept = page.locator("#input-concepto");
      await expect(concept).toHaveAttribute("maxlength", "200");
      await concept.fill("x".repeat(150));
      await expect(page.locator("#limit-hint")).toHaveCount(0); // quiet below 90%
      await concept.fill("x".repeat(185));
      await expect(page.locator("#limit-hint")).toHaveText("185 / 200");
      await concept.fill("y".repeat(250)); // a paste over the limit stops at it
      await expect(concept).toHaveValue("y".repeat(200));
      await expect(page.locator("#limit-hint")).toContainText("200 / 200 · límite alcanzado");
    },
  });
  expect((await storedSheet(page, "Counted Student"))!.concepto).toBe("y".repeat(200));
  await expect(page.locator("#limit-hint")).toHaveCount(0); // gone once the box is left
});

test("the house changes from its tag on the sheet, in a menu drawn by the app", async ({ page }) => {
  await createCharacter(page, "House Student");
  await setEditMode(page, true);
  await expect(page.locator("#detail-tab-perfil select")).toHaveCount(0);
  await page.locator("#tag-house").click();
  await page.locator("#tag-house-option-URANIA").click();
  await expect(page.locator("#tag-house")).toContainText("Urania");
  await setEditMode(page, false);
  await reloadApp(page);
  expect(await storedSheet(page, "House Student")).toMatchObject({ casa: "URANIA" });
});

test("a name can be emptied while retyping; an empty name is never saved", async ({ page }) => {
  await createCharacter(page, "Retyped Student");
  await setEditMode(page, true);
  const name = page.locator("#input-sheet-nombre");
  await name.fill("");
  await expect(page.locator("#input-sheet-nombre-hint")).toBeVisible();
  await flushWrites(page);
  expect(await storedSheet(page, "Retyped Student")).toMatchObject({ nombre: "Retyped Student" });
  await name.fill("Renamed Student");
  await expect(page.locator("#input-sheet-nombre-hint")).toHaveCount(0);
  await name.fill("");
  await name.blur(); // leaving it empty brings the saved name back
  await expect(name).toHaveValue("Renamed Student");
  await setEditMode(page, false);
  await reloadApp(page);
  expect(await storedSheet(page, "Renamed Student")).toMatchObject({ nombre: "Renamed Student" });

  // The same for a familiar's name and species.
  await openFamiliar(page, "Chispa");
  await page.locator("#btn-familiar-edit").click();
  await page.locator("#input-familiar-especie").fill("");
  await expect(page.locator("#input-familiar-especie-hint")).toBeVisible();
  await page.locator("#input-familiar-especie").blur();
  await expect(page.locator("#input-familiar-especie")).toHaveValue("Zorro");
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
  await page.locator("#skill-list-fisicas-item-sigilo").click(); // and pick it again
  await page.locator("#skill-list-fisicas-done").click();
  await expect(page.locator("#btn-open-skill-list-fisicas")).toHaveCount(0);
  await openTab(page, "hechizos");
  await page.locator("#input-spell-name").fill("Revelio");
  await page.locator("#select-spell-val-plus").click(); // difficulty: a stepper, 1 → 3
  await page.locator("#select-spell-val-plus").click();
  await expect(page.locator("#select-spell-val")).toHaveText("3");
  await page.locator("#checkbox-spell-spec").click(); // «Especializado»: a switch
  await page.locator("#btn-add-spell").click();
  await page.locator("#input-potion-name").fill("Draught of Calm");
  await page.locator("#btn-add-potion").click();
  await openTab(page, "notas");
  await page.locator("#input-new-club").fill("Duelling Club");
  await page.locator("#btn-add-club").click();
  await page.locator("#input-new-item").fill("Pewter cauldron");
  await page.locator("#input-new-item-qty").fill("12"); // a typed quantity, no browser spinner
  await page.locator("#input-new-item-qty").press("Enter");
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
  expect(stored!.conjuros).toEqual([expect.objectContaining({ nombre: "Revelio", specialized: true, valor: 3 })]);
  expect(stored!.pociones).toEqual([expect.objectContaining({ nombre: "Draught of Calm" })]);
  expect(stored!.clubesList).toEqual([expect.objectContaining({ nombre: "Duelling Club" })]);
  expect(stored!.equipoList).toEqual([expect.objectContaining({ nombre: "Pewter cauldron", cantidad: 12 })]);
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
  await expect(page.locator("#skill-list-fisicas-item-escalada")).toBeVisible();
});

test("the GM's campaign skill list: starting skills, names and new skills", async ({ page }) => {
  await viewAs(page, "gm");
  await page.locator("#btn-settings").click();
  await page.locator("#btn-settings-campaign-skills").click();
  await expect(page.locator("#campaign-skills-screen")).toBeVisible();
  await page.locator("#chk-initial-sigilo").click(); // a switch, drawn by the app
  await expect(page.locator("#chk-initial-sigilo")).toHaveAttribute("aria-checked", "false");
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
  await page.locator("#skill-list-fisicas-item-sigilo").click();
  await page.locator("#skill-list-fisicas-done").click();
  await expect(page.locator("#btn-open-skill-list-fisicas")).toHaveCount(0);
});

test("esoteric skills keep a knowledge level, set in the form and on the sheet", async ({ page }) => {
  await createCharacter(page, "Esoteric Student", {
    fill: async () => {
      await page.locator("#btn-form-tab-habilidades").click();
      // The form always offers the level: an empty tag («Ninguno») opens the menu.
      const tag = page.locator('[id^="btn-knowledge-"]').first();
      await expect(tag).toContainText("Ninguno");
      await tag.click();
      await page.locator('[role="menu"] [id$="-option-basico"]').click();
    },
  });
  let stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.filter((s: { conocimiento?: string }) => s.conocimiento)).toEqual([expect.objectContaining({ conocimiento: "basico" })]);
  const cabala = stored!.habilidades.find((s: { catalogo?: string }) => s.catalogo === "cabala");

  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await page.locator(`#btn-skill-Cábala-plus`).click();
  await page.locator(`#btn-knowledge-${cabala.id}`).click();
  await page.locator(`#btn-knowledge-${cabala.id}-option-medio`).click();
  await setEditMode(page, false);
  await reloadApp(page);
  await openCharacter(page, "Esoteric Student");
  await openTab(page, "habilidades");
  await expect(page.locator(`#tag-knowledge-${cabala.id}`)).toContainText("Medio");
  await expect(page.locator(`#tag-knowledge-${cabala.id}`)).not.toContainText("Destrucción"); // the explanation is only in the menu
  await expect(page.locator('[id^="btn-knowledge-"]')).toHaveCount(0); // only in edit mode
  stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.find((s: { id: string }) => s.id === cabala.id)).toMatchObject({ catalogo: "cabala", valor: 1, conocimiento: "medio" });

  await setEditMode(page, true);
  await page.locator(`#btn-knowledge-${cabala.id}`).click();
  await page.locator(`#btn-knowledge-${cabala.id}-option-none`).click();
  await setEditMode(page, false);
  await reloadApp(page);
  stored = await storedSheet(page, "Esoteric Student");
  expect(stored!.habilidades.find((s: { id: string }) => s.id === cabala.id)).toEqual({ id: cabala.id, catalogo: "cabala", valor: 1 });
  // Only esoteric skills have a level.
  await openCharacter(page, "Esoteric Student");
  await setEditMode(page, true);
  await openTab(page, "habilidades");
  await expect(page.locator('#skill-block-fisicas [id^="btn-knowledge-"]')).toHaveCount(0);
});

test("journal entries without a title store none and show one from their date", async ({ page }) => {
  await createCharacter(page, "Diary Student");
  await openTab(page, "notas");
  await page.locator("#input-new-note-content").fill("Untitled thoughts");
  await page.locator("#btn-add-note").click();
  await expect(page.locator("#detail-tab-notas")).toContainText("Entrada del");
  await reloadApp(page);
  const stored = await storedSheet(page, "Diary Student");
  expect(stored!.notasList).toEqual([expect.objectContaining({ contenido: "Untitled thoughts" })]);
  expect(stored!.notasList[0]).not.toHaveProperty("titulo");

  await openFamiliar(page, "Chispa");
  await page.locator("#familiar-tab-notas").click();
  await page.locator("#input-familiar-note-content").fill("Chased a moth");
  await page.locator("#btn-familiar-add-note").click();
  await expect(page.locator("#familiar-detail-container")).toContainText("Entrada del");
  await reloadApp(page);
  const familiar = await storedSheet(page, "Chispa");
  const note = familiar!.notasList.find((n: { contenido?: string }) => n.contenido === "Chased a moth");
  expect(note).not.toHaveProperty("titulo");
});

test("adult wizard: profile fields and archetype tabs persist", async ({ page }) => {
  await createCharacter(page, "Smoke Professor", {
    type: "adult-wizard",
    fill: async () => {
      await page.locator("#input-aw-role").fill("Potions master");
      await page.locator("#input-aw-institution").fill("Academy");
      await page.locator("#input-varita-sintonia").fill("Elder staff");
      await page.locator("#checkbox-aw-is-teacher").click(); // a switch, drawn by the app
      await expect(page.locator("#checkbox-aw-is-teacher")).toHaveAttribute("aria-checked", "true");
      // Subjects are a list: one per entry, a comma is just part of a name.
      await page.locator("#form-subjects-input").fill("Runas, antiguas");
      await page.locator("#form-subjects-add").click();
      await page.locator("#form-subjects-input").fill("Pociones");
      await page.locator("#form-subjects-input").press("Enter");
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
  expect(stored!.adultWizardProfile.teachingSubjects.map((s: { value: string }) => s.value)).toEqual(["Runas, antiguas", "Pociones"]);

  // On the sheet: one added and one removed in edit mode, by entry.
  await setEditMode(page, true);
  await page.locator("#sheet-subjects-input").fill("Alquimia");
  await page.locator("#sheet-subjects-add").click();
  const pociones = stored!.adultWizardProfile.teachingSubjects[1].id;
  await page.locator(`#sheet-subjects-remove-${pociones}`).click();
  await setEditMode(page, false);
  await expect(page.locator("#sheet-subjects-read")).toContainText("Alquimia");
  await reloadApp(page);
  const after = await storedSheet(page, "Smoke Professor");
  expect(after!.adultWizardProfile.teachingSubjects.map((s: { value: string }) => s.value)).toEqual(["Runas, antiguas", "Alquimia"]);
});

test("familiar sheet: one edit mode like a character's (fields, portrait by tapping, gallery); only the GM can archive it", async ({ page }) => {
  await createFamiliar(page, "Smoke Toad", "Toad");
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Toad");
  await openFamiliar(page, "Smoke Toad");
  await expect(page.locator("#btn-familiar-delete")).toHaveCount(0);
  await expect(page.locator("#btn-familiar-full-editor")).toHaveCount(0); // one edit mode only
  await expect(page.locator("#input-familiar-especie")).toHaveCount(0); // reading mode
  await page.locator("#btn-familiar-edit").click();
  await page.locator("#input-familiar-especie").fill("Giant toad"); // saved as typed
  // The portrait changes by tapping it: no hover, so phones can do it too.
  const chooser = page.waitForEvent("filechooser");
  await page.locator("#familiar-portrait").click();
  await (await chooser).setFiles(pngFile());
  await page.getByRole("button", { name: "Confirmar Recorte" }).click();
  await expect(page.locator("#familiar-portrait img")).toBeVisible();
  await page.locator("#btn-familiar-fit-contain").click();
  await page.locator("#familiar-tab-galeria").click();
  await page.locator("#input-familiar-gallery-picker").setInputFiles(pngFile("gallery.png"));
  await expect(page.locator("#btn-familiar-del-gal-pic-0")).toBeVisible();
  await page.locator("#btn-familiar-edit").click(); // «Finalizar Edición»
  await expect(page.locator("#input-familiar-gallery-picker")).toHaveCount(0);
  await expect(page.locator("#btn-familiar-del-gal-pic-0")).toHaveCount(0);
  await expect(page.locator("#familiar-detail-container")).toContainText("Giant toad");

  await reloadApp(page);
  await expect(familiarCard(page, "Smoke Toad")).toContainText("Giant toad");
  const asset = /^[0-9a-f-]{36}$/;
  expect(await storedSheet(page, "Smoke Toad")).toMatchObject({ especie: "Giant toad", imageFit: "contain", imagen: expect.stringMatching(asset),
    galleryImages: [{ id: expect.any(String), value: expect.stringMatching(asset) }] });
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
  await page.locator("#checkbox-confirm-student-delete").click(); // a check, drawn by the app
  await expect(page.locator("#checkbox-confirm-student-delete")).toHaveAttribute("aria-checked", "true");
  await page.locator("#btn-confirm-delete-student-action").click();
  await expect(page.locator("#character-list-container")).toBeVisible();
  await expect(characterCard(page, "Bonded Student")).toHaveCount(0);
  await expect(familiarCard(page, "Chispa")).not.toContainText("Bonded Student");
});

test("a familiar made in the creation form is created only with its character", async ({ page }) => {
  const confirmFamiliar = async (name: string) => {
    await page.locator("#btn-form-open-familiar-editor-nav").click();
    await page.locator("#input-familiar-nombre").fill(name);
    await page.locator("#input-familiar-especie").fill("Raven");
    await page.locator("#btn-save-familiar").click(); // «Confirmar familiar»: kept in the form
    await expect(page.locator("#modal-familiar-editor")).toHaveCount(0);
    await expect(page.locator("#btn-form-open-familiar-editor-nav")).toContainText(name);
  };
  // Cancelled: nothing is created.
  await page.locator("#btn-add-character-header").click();
  await page.locator("#type-select-student").click();
  await page.locator("#input-nombre").fill("Cancelled Student");
  await confirmFamiliar("Ghost Raven");
  await page.locator("#btn-form-open-familiar-editor-nav").click(); // reopened, the values are still there
  await expect(page.locator("#input-familiar-nombre")).toHaveValue("Ghost Raven");
  await page.locator("#btn-save-familiar").click();
  await page.locator("#btn-form-cancel").click();
  await page.locator("#btn-discard-draft-confirm").click();
  expect(await storedSheet(page, "Ghost Raven")).toBeUndefined();

  // Saved: the familiar is created and linked to its character.
  await createCharacter(page, "Raven Keeper", { fill: async () => { await confirmFamiliar("Real Raven"); } });
  await reloadApp(page);
  await expect(familiarCard(page, "Real Raven")).toContainText("Raven Keeper");
});

test("player: a familiar created from the character sheet is linked to that character", async ({ page }) => {
  const createFromSheet = async (name: string) => {
    await setEditMode(page, true);
    await visibleOf(page, "header-familiar-bond-btn", "header-familiar-bond-btn-mobile").click();
    await page.getByRole("button", { name: /Create Familiar|Crear Familiar/ }).click();
    await page.locator("#input-familiar-nombre").fill(name);
    await page.locator("#input-familiar-especie").fill("Owl");
    await page.locator("#btn-save-familiar").click(); // back to the character's sheet, already linked
    await expect(page.locator("#character-detail-screen")).toContainText("Sheet Owner");
    await expect(visibleOf(page, "header-familiar-card", "header-familiar-card-mobile")).toContainText(name);
  };
  await createCharacter(page, "Sheet Owner");
  await createFromSheet("Sheet Owl");
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

test("one visual style (Academia) and a Spanish-only interface", async ({ page }) => {
  const root = page.locator("#academy-app-root");
  const addButton = page.locator("#btn-add-character-header");
  await expect(root).toHaveAttribute("data-style", "academy");
  await expect(addButton).toContainText("Nuevo Personaje");
  await page.locator("#btn-settings").click();
  await expect(page.locator("#settings-card-lang")).toHaveCount(0); // owner decision: Spanish only for now
  await expect(page.locator("#settings-card-style")).toHaveCount(0); // owner decision: Academia only for now
  await page.locator("#btn-settings-back").click();

  // A Classic style or an English language saved before either choice was removed is ignored.
  await page.evaluate(() => { localStorage.setItem("magistri_scholae_style", "classic"); localStorage.setItem("magistri_scholae_lang", "en"); });
  await reloadApp(page);
  await expect(root).toHaveAttribute("data-style", "academy");
  await expect(addButton).toContainText("Nuevo Personaje");
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
  await page.locator("#input-sign-in-username").fill("Demo_Player "); // a phone's capital and trailing space
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
