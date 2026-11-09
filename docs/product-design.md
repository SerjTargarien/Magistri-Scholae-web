# Product design

The place to design a change before building it (owner request, 8 November 2026): what each screen shows, what each role can do, and the rules behind it. A change starts here; the code follows. Interface terms are the app's Spanish ones.

**Status:** each section describes the app as it is on 9 November 2026 (`main` at `d912a99`, mapped from the code) and then, under **Target**, the owner's intended design (his parallel document of 9 November 2026), with the release that builds it ([implementation-plan.md](implementation-plan.md)). Points still to settle are marked **Q** and listed in [Open questions](#open-questions). Field limits are in [field-rules.md](field-rules.md).

## Principles

- **Spanish only** for the first version; the English texts stay in the code (`LANGUAGE_CHOICE` in `src/App.tsx`). No one is asked for words in the other language; all interface texts live in `src/localization.ts`.
- **No aesthetic change without a reason**; new screens follow the academy and classic styles.
- **One way to edit a sheet:** «Editar» / «Finalizar Edición», and each field saves as it is typed (no «Guardar» on a sheet). Character and familiar sheets behave alike.
- **Touch first:** nothing depends on hover; testers use phones.
- **Hidden is not deleted:** a field a viewer may not see is not drawn, and hiding something (Magia intuitiva above 14, a switch turned off) keeps its stored value.
- **Better safe than sorry:** removing something asks for confirmation (target, R3.4 polish pass).
- **Words:** a **campaña** is the GM's universe; its **partidas** (the tables, decision 9) are labels on sheets.

## Roles

**Today:**

- **GM:** sees and edits every character and familiar in the campaign, whoever created them and whenever they registered. Owns the campaign's skill list («Habilidades de la campaña»). Archives sheets (no one deletes).
- **Player:** sees and edits only the sheets they created (assigned to them). Picks skills from the campaign's list.
- **Shared reader:** read-only access to a sheet shared with them; there is no screen to share yet.
- **Administrator** (the owner's separate account): creates campaigns, invitations and recovery codes on the server; no admin screens yet.

**Target** (owner, 9 November 2026):

- **GM** (R4):
  - sees and edits every character and familiar **once it is active**: the player activates a sheet once, and the GM confirms it (**Q1**);
  - marks sheets **active or inactive** (dead, travelling…): inactive sheets leave the main list («grimorio») without being archived;
  - archives, and can **delete** a sheet after several confirmation steps (**Q2**);
  - creates sheets and **assigns them to players**;
  - creates campaigns and sees the campaign chooser; players join a campaign by invitation;
  - chooses which fields a shared reader sees (the visibility editor, R7.3).
- **Player:** sees and edits the sheets they created or that the GM assigned to them.
- **Shared reader:** sees the fields the GM chose for that sheet.
- **Administrator:** as today, and can see and change campaign data **only with the GM's explicit permission** (**Q3**). Admin screens in R4.

## Screens

### 1. App frame

- Every screen sits in the same frame: academy or classic background (the viewer's choice, kept in this browser), crest and title on the entry screens.
- **Start:** the session is restored; with no session, the sign-in screen. The campaign is the one used last, or the only one; with several and none chosen, the campaign chooser.
- **Loading:** «Abriendo grimorio de la escuela...».
- **Messages (toasts):** bottom right, green or red, close by themselves after 4 seconds or with «×». An expired session or a failed load: «No se pudieron cargar los datos. Recarga para volver a intentarlo.»
- **Save status** (bottom left, on character and familiar sheets): hidden while everything is saved. It appears for working offline, someone else changing the same field («Mantener el mío» / «Mantener el suyo»), a refused save («No se pudo guardar … Reintentar») and a value not accepted («No aceptado: …», with raw field names).
- Coming back to the tab re-reads the lists and open sheets; leaving the page while a save is pending asks first.
- Demo builds only: the «DEMO» banner and the test panel.

**Target:** the save-status panel speaks plainly, without field names (R3.5). **For a GM, the first screen after opening a campaign is the Biblioteca del Máster** (R5); the grimorio opens from there.

### 2. Sign-in («Iniciar sesión» / «Aceptar invitación» / «Restablecer contraseña»)

- Three tabs in a card. **Iniciar sesión:** «Usuario», «Contraseña». **Aceptar invitación:** «Usuario», «Código de invitación», «Contraseña», «Repite la contraseña» (at least 12 characters). **Restablecer contraseña:** «Código de recuperación», the new password twice.
- **Links:** `https://magistrischolae.fyi/#invitacion=CÓDIGO` and `#recuperacion=CÓDIGO` open the right tab with the code filled in; the code is never sent to the server in the address and is removed from the address bar.
- The username and code ignore surrounding spaces; usernames are stored in lowercase, and the name as typed becomes the display name.
- Errors are plain messages.
- **Campaign chooser** («Elige una campaña»): one button per campaign, «Cerrar sesión». Only the administrator sees it today.

**Target:** the GM also sees the chooser and **creates new campaigns** there; players join new campaigns by invitation (R4).

### 3. Character list (the grimorio)

- Header: crest, «Magistri Scholae», «Ajustes», «Nuevo Personaje».
- **Search** «Buscar por nombre, jugador o concepto...»; **filters** «Todas las Casas», the five houses, «Magos Adultos», «Familiares».
- **Character card:** portrait or house crest, year or «Adulto», name, concept, «Destino», «Exp», «Jugador». **Familiar card:** picture, name, description, «Especie», «Vínculo».
- Newest first; characters, then familiars. Archived sheets never appear.

**Target:** inactive sheets leave this list (R4); filters follow the new sheet types and the campaign's institutions (R4.5, R5). The GM's complete view with filters and sorting by any value lives in the Biblioteca (R5).

### 4. New sheet type («Elegir Sendero Mágico»)

- Today: «Alumno», «Mago adulto» (both open the creation form) and «Familiar» (familiar creation); «Volver».

**Target** (R4.5):

- «**Menor**», with «Mago» and «Alumno de Escuela de Magia» ticked by default; unticking hides the related values.
- «**Adulto**», with «Mago» ticked by default; unticking hides the related values.
- «**Criatura mágica**»: its own sheet type, between a familiar and an adult (**Q4**).
- «**Familiar**»: as today.
- Existing sheets carry over without losing data: today's «Alumno» becomes a Menor, Mago, Alumno; «Mago adulto» an Adulto, Mago.

### 5. Character creation form («Registro de Personaje» / «Registro de Mago Adulto»)

Today, side tabs with «Cancelar» and «Guardar» at the top and bottom; nothing is saved until «Guardar».

- **Identificación:** portrait (crop 3:4 with zoom, fit, «Quitar retrato»), «Nombre del Personaje» (required), «Concepto», «Jugador», «Edad» (up to 999), «Linaje Familiar», «Economía», «Varita / Foco mágico». Students: «Curso Académico», «Puesto en la Clase». Adults: «Perfil de Mago Adulto» (role, institution, former house, reputation, teacher, subjects as a comma list).
- **Aspectos y Posesiones:** aspects, complications, equipment, custom fields.
- **Casa y Lema** (students): the five houses; Irati by default.
- **Habilidades:** the campaign's list; starting skills marked «Inicial»; «+ Añadir de la lista»; knowledge levels; GM-only typed box.
- **Estrés:** the three maxima, 1–10.
- **Familiar** (students): a dialog that saves the familiar at once; linked when the character is saved.
- Saving opens the sheet; «Cancelar» asks only for some fields.

**Target:**

- **Identificación** carefully redesigned for minors, adults and magical creatures, with fitting values for each, without losing current data (R4.5). «Edad»: up to 1,000,000, or «desconocida» (R4.5).
- **Concepto** moves to «Aspectos y Posesiones» (R4.5).
- **Casa y Lema** and a new **Institución y Rol** tab (adults) take their content from the campaign's institutions, or free text (R5).
- **Estrés:** maxima 1–5 (R4.5; **Q5**).
- **Familiar:** only for magical human characters; the dialog has no save button: it keeps the values, and the familiar is created and linked only when the character is saved (R3.4 polish pass).
- **«Cancelar»** asks before discarding any change (polish pass).
- Portrait fit buttons in Spanish everywhere (polish pass).

### 6. Character sheet

**Banner:** portrait, name, concept, house crest, the linked familiar, «Volver», «Editar» / «Finalizar Edición», «Archivar» for the GM (with a box to tick). **Edit mode:** name and concept boxes; tap the portrait to change it, fit and «Quitar retrato» below; the familiar card opens the link picker («Sin Mago Asignado (Familiar Libre)», the familiars, «+ Crear Familiar»).

Tabs:

- **Perfil:** «Datos Personales», «Filiación de la Casa y Heráldica» (students), «Aspectos Personales», «Complicaciones», «Campos Personalizados».
- **Sesión** (usable outside edit mode, on purpose: convenience during play): destiny gems, experience (− +), «Aspecto Temporal», three stress tracks, three consequence lists.
- **Habilidades:** values, removal, «+ Añadir de la lista», knowledge levels, GM-only typed box.
- **Conjuros y Pociones:** add and remove in edit mode; entries not editable.
- **Inventario y Notas:** clubs, equipment (quantity ± at any time), journal (add and edit at any time, remove in edit mode).
- **Galería:** tap to enlarge; add and remove in edit mode.

**Target:**

- Session tab: destiny gems up to 10, typeable experience, consequence severity (R3.4, phase 3).
- Perfil follows the sheet type and switches (R4.5); house and institution come from the campaign's institutions (R5); a non-magical character hides the magic fields (R4.5).
- Removing anything asks first (polish pass); generated journal titles are shown, not stored (phase 3, **before the next publish**).
- Activation and active/inactive status (R4).

### 7. Familiar sheet

- **Header:** «Volver a Personajes», species and character, name, «Editar» / «Finalizar Edición», «Archivar» for the GM.
- **Perfil y Vínculo:** portrait, name, species, description, «Vínculo Mágico».
- **Diario del Familiar**, **Galería de Recuerdos**.

**Target** (R3.4 polish pass):

- The header keeps only «Volver a Personajes», «Editar» / «Finalizar Edición» and «Archivar»: species, character and name go (they are on the profile).
- The journal tab is called «**Notas del Familiar**», and its box suggestions fit a familiar.
- The crop dialog gets a zoom slider like the others.
- The link picker says «Seleccionar un personaje para vincular a este familiar».

### 8. Familiar creation

- Today «Registro y Editor de Familiares», creation only; from a character's link picker it links the new familiar (replacing a previous link), otherwise it opens the familiar's sheet.

**Target:** the title is «**Registro de Familiares**» (polish pass). Familiars belong to magical human characters only (R4.5).

### 9. Settings («Ajustes»)

- «Estilo Visual», «Información de Almacenamiento», «Cuenta», «Acerca de Magistri Scholae»; GM only: «Habilidades de la campaña» → «Abrir la lista». Language card hidden.

**Target:** the campaign skills move to the Biblioteca del Máster (R5).

### 10. Campaign skills («Habilidades de la campaña», GM only)

- Today: every category with its skills: «Inicial», the name, «hasta N años». Add a skill per category. Draft with «Guardar cambios» / «Descartar»; blank or repeated names cannot be saved; reloads if changed meanwhile.

**Target** (R5, inside the Biblioteca):

- «**Sólo magos**» per skill: left off non-magical characters, unless added to one by hand (by the GM).
- New categories; rename current ones.
- Reorder everything (categories and skills).

### 11. Biblioteca del Máster (new, R5)

The GM's first screen after opening a campaign; the grimorio opens from it. Per campaign (universe). Three sections:

- **Personajes:** every character in the campaign and the GM's own characters; at a glance which player each is assigned to; easy, complete filters and sorting by any stored value (school, house, player, age, magical or not…).
- **Instituciones:** academies, ministries, guilds… each with a crest, colours, a description and a member list. An institution can have **branches** (name to choose: chapter, faction, division… **Q6**) with their own values; today's houses are branches of Magistri Scholae. A character belongs to a branch, to an institution without a branch, or to none (free characters). A character's institution can also be free text instead of one from the list. The GM creates any number of houses, and the word «Casa» can be renamed per school.
  - **Schools** are institutions with their own values:
    - «**cursos**» (e.g. 3º): students of the same level, who move up together each school year unless they repeat; matches «Curso Académico» on the sheet;
    - «**asignaturas**» (e.g. Pociones): with their teachers and the skill they improve; «troncal» (every student of the year) or «optativa» (students choose a fixed number from a larger set, per year);
    - «**clubes**» (e.g. Duelo): students practising an activity together in a place in the school;
    - «**clases**» (e.g. Pociones 3º): part of a year group and a teacher meeting in a classroom, linking the teacher and each student.
- **Habilidades:** section 10, moved here.

## Known inconsistencies

Found while mapping the screens on 9 November 2026, with the owner's decisions. They are fixed in the **R3.4 polish pass** unless noted.

1. **Familiar created in the creation form survives a cancelled character.** Decision: the dialog loses its save button and gets a confirm one that keeps the values; the familiar is created only when the character is saved.
2. **Discard-draft check misses fields.** Decision: «Cancelar» asks before discarding any change.
3. **Different confirmations.** Decision: consistent rules; in most cases confirmation is preferred (better safe than sorry).
4. **Crop dialog without zoom on the familiar sheet.** Decision: add the zoom slider.
5. **Texts outside the translations file or in English** ("Cover" / "Contain", "Delete picture", archive texts, the unlinked-familiar sentence, "Subir Imagen Local"). Decision: every player-facing text moves to the translations file; the fit buttons read in Spanish everywhere (they may go if nothing is lost).
6. **Wrong wording.** Decision: «Seleccionar un personaje para vincular a este familiar»; «Registro de Familiares».
7. **Journal titles stored.** Decision: shown, not stored; **fix before the next publish** (phase 3).
8. **Edit-mode gaps** in the session tab, equipment quantities and journal. Decision: kept on purpose, for convenience during play.
9. **Known limits already planned:** destiny, experience, severity, subjects as a list, the name box, the save-status panel (phase 3 and R3.5).

## Design notes

### Non-magical characters (owner, 8–9 November 2026; R4.5)

- The **same sheet** as a magical one, with a «Mago» switch; off, the sheet hides the magic fields: «Varita / Foco mágico», the categories «Habilidades y conocimientos mágicos», «Magia elemental» and «Magia esotérica» (with knowledge levels), the «Conjuros y Pociones» tab (to confirm field by field in R4.5).
- **Hidden, not deleted:** values stay stored and come back when the switch is turned on.
- **Decided (9 November):**
  - the player sets the switch at creation; afterwards only the GM changes it;
  - it applies to any human character, chosen when starting character creation;
  - a non-magical character starts without the magic skills; the GM can add some to a specific character («Sólo magos» skills included);
  - non-magical characters cannot have familiars.
- Data: one new field on the character (absent meaning magical, so existing sheets need no change), with its rule in field-rules.md.

### Recorded for later

- **Full-screen image viewer** for portraits; the galleries already enlarge a picture on tap.
- **The GM renames the campaign** name he sees (R4).
- **Recovery and invitation links** created from the admin screens (R4); decide how long a recovery code lasts (15 minutes today).
- **Images from a web address** (downloaded by the server; its own security review).
- **Testing on a real phone** before each release: a short checklist.
- **A development copy of the testers' data:** staging now holds their real data, so development needs a separate copy (before or with R6).

## Open questions

Asked on 9 November 2026; answers update this document and the plan.

- **Q1 — Activation.** Until the player activates a sheet and the GM confirms it, does the GM not see it at all, or see it marked as a draft? Is "active / inactive" (dead, travelling) the same status or a second one?
- **Q2 — Deletion.** Can the GM delete any sheet directly after several confirmations, or only an archived one (today's plan)?
- **Q3 — Administrator access.** With the GM's permission: read only, or also change? For the whole campaign or chosen sheets? Until the GM withdraws it, or for a time? Personal notes stay excluded?
- **Q4 — Criatura mágica.** Which parts of the sheet does it have (skills, stress, spells, gallery, journal…)? Can a player own one? Can it have a familiar or be one?
- **Q5 — Stress maxima 1–5.** Existing sheets with a maximum above 5 are capped at 5?
- **Q6 — Branches.** The word for an institution's branch, and whether a school's branches are always called «Casas» by default.
- **Q7 — Order.** Where the production backend (R6) goes: before the big redesigns (R4.5, R5), so testers' data leaves staging sooner, or after.
- **Q8 — The older "GM library".** The design also has a private GM library of templates and NPCs copied into campaigns, with one-way sync (R7.5, design.md section 11). Is it part of the Biblioteca del Máster, kept separately for later, or dropped?
