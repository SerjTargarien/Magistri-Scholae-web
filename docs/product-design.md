# Product design

The place to design a change before building it (owner request, 8 November 2026): what each screen shows, what each role can do, and the rules behind it. A change starts here; the code follows. Interface terms are the app's Spanish ones.

**Status:** the screens below describe the app as it is on 9 November 2026 (`main` at `d912a99`), mapped from the code. [Known inconsistencies](#known-inconsistencies) lists what the mapping found; [Design notes](#design-notes) holds decisions and ideas not built yet. Field limits are in [field-rules.md](field-rules.md); the release plan in [implementation-plan.md](implementation-plan.md).

## Principles

- **Spanish only** for the first version; the English texts stay in the code (`LANGUAGE_CHOICE` in `src/App.tsx`). No one is asked for words in the other language; all interface texts live in `src/localization.ts`.
- **No aesthetic change without a reason**; new screens follow the academy and classic styles.
- **One way to edit a sheet:** «Editar» / «Finalizar Edición», and each field saves as it is typed (no «Guardar» on a sheet). Character and familiar sheets behave alike.
- **Touch first:** nothing depends on hover; testers use phones.
- **Hidden is not deleted:** a field a viewer may not see is not drawn, and hiding something (Magia intuitiva above 14) keeps its stored value.

## Roles (today)

- **GM:** sees and edits every character and familiar in the campaign, whoever created them and whenever they registered. Owns the campaign's skill list («Habilidades de la campaña»). Archives sheets (no one deletes).
- **Player:** sees and edits only the sheets they created (assigned to them). Picks skills from the campaign's list.
- **Shared reader:** read-only access to a sheet shared with them; there is no screen to share yet.
- **Administrator** (the owner's separate account): creates campaigns, invitations and recovery codes on the server; no admin screens yet (R4).
- The campaign is the GM's universe; its tables (mesas) are labels on sheets (decision 9, R4). The full permission system (sharing, GM restrictions, personal notes) comes later.

## Screens

### 1. App frame

- Every screen sits in the same frame: academy or classic background (the viewer's choice, kept in this browser), crest and title on the entry screens.
- **Start:** the session is restored; with no session, the sign-in screen. The campaign is the one used last, or the only one; with several and none chosen, the campaign chooser.
- **Loading:** «Abriendo grimorio de la escuela...».
- **Messages (toasts):** bottom right, green or red, close by themselves after 4 seconds or with «×». An expired session or a failed load: «No se pudieron cargar los datos. Recarga para volver a intentarlo.»
- **Save status** (bottom left, on character and familiar sheets): hidden while everything is saved. It appears for:
  - working offline: «Sin conexión: tus cambios se guardan aquí y se enviarán al volver la conexión.»;
  - someone else changing the same field: «Mantener el mío» / «Mantener el suyo»;
  - a refused save: «No se pudo guardar … Reintentar»;
  - a value not accepted: «No aceptado: …» (raw field names: R3.5 redesigns this panel).
- Coming back to the tab re-reads the lists and open sheets; leaving the page while a save is pending asks first.
- Demo builds only: the «DEMO» banner and the test panel («Ver como» GM, player, reader; connection and failure simulations).

### 2. Sign-in («Iniciar sesión» / «Aceptar invitación» / «Restablecer contraseña»)

- Three tabs in a card. **Iniciar sesión:** «Usuario», «Contraseña». **Aceptar invitación:** «Usuario», «Código de invitación», «Contraseña», «Repite la contraseña» (at least 12 characters). **Restablecer contraseña:** «Código de recuperación», the new password twice.
- **Links:** `https://magistrischolae.fyi/#invitacion=CÓDIGO` and `#recuperacion=CÓDIGO` open the right tab with the code filled in; the code is never sent to the server in the address and is removed from the address bar.
- The username and code ignore surrounding spaces; usernames are stored in lowercase, and the name as typed becomes the display name.
- Errors are plain messages (wrong username or password, used or expired code, username taken, weak password, too many attempts, disabled account, no connection, passwords that do not match).
- **Campaign chooser** («Elige una campaña»): one button per campaign, «Cerrar sesión». Only the administrator sees it today.

### 3. Character list (home)

- Header: crest, «Magistri Scholae», «Ajustes», «Nuevo Personaje».
- **Search** «Buscar por nombre, jugador o concepto...»: characters by name, player, concept, adult role or institution; familiars by name, species, description or their character's name.
- **Filters:** «Todas las Casas», the five houses (Irati, Urania, Al-Khwarizmi, Calantes, Aleixis; adults by former house), «Magos Adultos», «Familiares».
- **Character card:** portrait or house crest, year («1º») or «Adulto», name, concept, «Destino», «Exp», «Jugador». **Familiar card:** picture, name, description, «Especie», «Vínculo» (its character, or «Sin asignar»).
- Newest first; characters, then familiars. Archived sheets never appear. GM and player see the same screen with different sheets.
- Empty: «Bóveda Vacía», with «Nuevo Personaje».

### 4. New sheet type («Elegir Sendero Mágico»)

- «Alumno», «Mago adulto» (both open the creation form) and «Familiar» (opens familiar creation). «Volver» returns to the list.

### 5. Character creation form («Registro de Personaje» / «Registro de Mago Adulto»)

Side tabs; «Cancelar» and «Guardar» at the top and bottom. Nothing is saved until «Guardar».

- **Identificación:** portrait (file, then crop 3:4 with zoom; fit «Recortar / Llenar» or «Ajustar / Lienzo Completo»; «Quitar retrato»), «Nombre del Personaje» (required), «Concepto», «Jugador», «Edad» (digits, up to 999), «Linaje Familiar», «Economía», «Varita / Foco mágico».
  - Students also: «Curso Académico» (default «1º»), «Puesto en la Clase».
  - Adults also, «Perfil de Mago Adulto»: «Rol / Título», «Institución», «Antigua casa», «Reputación / Estatus», «Profesor de la Academia», and when ticked «Asignaturas que imparte» (comma-separated).
- **Aspectos y Posesiones:** «Aspectos Personales», «Complicaciones», «Equipamiento» (with quantity), «Campos Personalizados» (name and value). Add with the button or Enter.
- **Casa y Lema** (students): five house cards with their origin, colours, element, totem and motto; Irati by default.
- **Habilidades:** one block per category of the campaign's list, values 0–5. New characters start with the skills marked «Inicial» (Magia intuitiva only up to age 14, never for adults). «+ Añadir de la lista» adds missing ones; any skill can be removed. «Magia esotérica» skills have a knowledge level. **GM only:** a box to type a new skill, which joins the campaign's list.
- **Estrés:** the three maxima, 1–10 (3 for students, 5 for adults).
- **Familiar** (students): creates a familiar in a dialog; it is linked to the character when the character is saved.
- Saving opens the new character's sheet. «Cancelar» asks to discard a draft with a name, concept, player, portrait, aspects, complications, equipment or custom fields.
- Not in the form (only on the sheet): destiny, experience, current stress, consequences, temporary aspects, spells, potions, clubs, journal, gallery.

### 6. Character sheet

**Banner:** portrait, name, concept, house crest, the linked familiar (card, or a «Vincular Familiar» slot in edit mode), «Volver», «Editar» / «Finalizar Edición» (for anyone who can change something), and «Archivar» for the GM (with a confirmation box to tick).

**Edit mode:** name and concept become boxes; tapping the portrait changes it («Cambiar foto», crop, upload), with fit and «Quitar retrato» below; the familiar card opens the link picker («Sin Mago Asignado (Familiar Libre)», the familiars, «+ Crear Familiar»).

Tabs:

- **Perfil:** «Datos Personales» (students: player, age, year, class post, lineage, economy, wand; adults: player, age, lineage, economy, role, institution, former house, wand, reputation, teacher and subjects), «Filiación de la Casa y Heráldica» (students; house chosen in edit mode), «Aspectos Personales», «Complicaciones», «Campos Personalizados».
- **Sesión** (usable outside edit mode by whoever may write): «Puntos de Destino» (gems), «Experiencia Acumulada» (− and +), «Aspecto Temporal», the three stress tracks (tap a box; maxima in edit mode), «Consecuencias» physical, mental and social (text only).
- **Habilidades:** values 0–5 and removal in edit mode; «+ Añadir de la lista»; knowledge level for esoteric skills; GM-only typed box; players cannot remove or rename skills that are not on the campaign's list.
- **Conjuros y Pociones:** «Grimorio de Conjuros» and «Catálogo de Pociones» (difficulty I–V, «Especialista»); add and remove in edit mode; entries cannot be edited.
- **Inventario y Notas:** «Clubes Escolares», «Equipamiento» (quantity ± at any time), «Bitácora Celestial» (journal: add and edit at any time, remove in edit mode).
- **Galería:** tap a picture to enlarge; add and remove in edit mode.

A viewer who may not change anything has no «Editar» and sees only what they may read.

### 7. Familiar sheet

- **Header:** «Volver a Personajes», species and character, name, «Editar» / «Finalizar Edición», «Archivar» for the GM.
- **Perfil y Vínculo:** portrait (tap in edit mode to change; fit and «Quitar retrato» below), «Nombre del Familiar», «Especie / Criatura», «Descripción» (boxes in edit mode, saved as typed), and «Vínculo Mágico» (the character with «Ver Ficha del Mago»; «Cambiar Vínculo» or «Vincular a Alumno o Mago» and unlinking in edit mode).
- **Diario del Familiar:** add and edit entries at any time, remove in edit mode.
- **Galería de Recuerdos:** tap to enlarge; add and remove in edit mode.

### 8. Familiar creation («Registro y Editor de Familiares»)

- Creation only: portrait (file, crop with zoom, fit), «Nombre del Familiar» and «Especie / Criatura» (required), «Descripción», «Guardar Familiar».
- From a character's link picker: saving links the familiar to that character (replacing the link it had, if any) and returns to the character's sheet. From «Nuevo Personaje»: saving opens the familiar's sheet.

### 9. Settings («Ajustes»)

- «Estilo Visual» («Academia Mágica» or «Clásico», kept in this browser), «Información de Almacenamiento», «Cuenta» (name, username, campaign choice if several, «Cerrar sesión»), «Acerca de Magistri Scholae».
- GM only: «Habilidades de la campaña» → «Abrir la lista».
- The language card is hidden (Spanish only).

### 10. Campaign skills («Habilidades de la campaña», GM only)

- Every category with its skills: «Inicial» (new characters start with it), the name, and «hasta N años» where a skill has an age limit. Add a skill per category.
- Changes are kept as a draft: «Guardar cambios» or «Descartar» in a bar at the bottom; leaving with unsaved changes is held back. Blank or repeated names cannot be saved; if someone else changed the list meanwhile, it reloads.
- Not here yet: deleting, archiving, moving or reordering skills, new categories (R4).

## Known inconsistencies

Found while mapping the screens on 9 November 2026; to fix when their screen is next worked on, or together in a small pass.

1. **Familiar created in the creation form survives a cancelled character:** the dialog saves the familiar at once; cancelling the character leaves it on the list, unlinked. The dialog also gives no confirmation message, and only the last familiar created there is linked.
2. **Discard-draft check misses fields:** changing only skills, stress, house, age, year, lineage, economy, wand or the adult profile lets «Cancelar» leave without asking.
3. **Different confirmations:** archiving a character needs a ticked box, a familiar does not; spells, potions, gallery pictures, clubs, items and journal entries ask before removal, while aspects, complications, consequences, custom fields, skills and familiar journal entries are removed at once.
4. **Crop dialog:** the familiar sheet's crop has no zoom slider; the character sheet's and the creation screens' have one.
5. **Texts outside the translations file or in English:** the character portrait fit buttons read "Cover" / "Contain"; the gallery's delete tooltip is "Delete picture"; the archive texts, the unlinked-familiar sentence and the familiar gallery's "Subir Imagen Local" are written in the code.
6. **Wrong wording:** the familiar's link picker says «Seleccionar un familiar para vincular a este personaje» (it lists characters); the familiar creation title says «Registro y Editor de Familiares» although it only creates.
7. **Journal titles:** an untitled character entry stores «Entrada del …» with the date, an untitled familiar entry stores «Sin Nombre» (to be shown, not stored: remaining phase 3).
8. **Edit-mode gaps:** the session tab, equipment quantities and journal entries change outside edit mode, unlike the rest of the sheet (a deliberate convenience during play, or to align: to decide).
9. **Known limits already planned:** destiny shows 5 gems and stops at 5 (the server allows 10); experience only with − and +; consequences without severity; subjects as a comma box; the name box cannot be emptied while retyping; the save-status panel shows raw field names.

## Design notes

Recorded decisions and ideas that are not designed in detail or built yet.

### The GM's tools: characters, institutions and skills (owner, 8 November 2026)

For now the GM needs three things, each **per campaign (universe)**, and not much more:

- **Characters:** the GM's view of every character in the campaign, and the GM's own (non-player) characters.
- **Institutions:** a campaign list of institutions (academies, ministries, guilds…). Today «Institución» is free text on the adult wizard profile, and a house or organization motto is planned for after 1.0. To decide:
  - what an institution holds (name, description, motto, crest?);
  - whether characters pick their institution from the list, as players pick skills;
  - how institutions relate to the houses.
- **Skills:** the campaign's skill list. Started in C2 («Habilidades de la campaña»: rename, «Inicial», add); moving skills between categories, reordering and new categories are R4.

Everything else in the GM screens of the plan (members, tables, assignment, archive and restore, GM notes) waits unless the owner brings it forward.

### Non-magical characters (owner, 8 November 2026)

- A non-magical character uses **the same sheet** as a magical one, with a switch saying whether the character has magical abilities.
- **Switch off:** the sheet hides the fields related to magic. Candidates, to be confirmed field by field:
  - «Varita / Foco mágico»;
  - the skill categories «Habilidades y conocimientos mágicos», «Magia elemental» and «Magia esotérica» (with the knowledge levels);
  - the «Conjuros y Pociones» tab.
- **Hidden, not deleted:** the values stay stored, as Magia intuitiva does above age 14, and turning the switch back on shows them again.
- **To decide:**
  - who can change the switch (the player at creation, the GM afterwards?);
  - whether it is chosen in the type selection or is a switch on any character, and whether it applies to students;
  - whether a non-magical character's starting skills leave out the magic categories;
  - whether non-magical characters can have familiars.
- Data: one new boolean field on the character (absent meaning magical, so existing sheets need no change), with its rule in field-rules.md.

### Recorded for later

- **Full-screen image viewer** for portraits; the character and familiar galleries already enlarge a picture on tap.
- **The GM renames the campaign** name he sees (R4).
- **Recovery and invitation links** created from the admin screens (R4); decide how long a recovery code lasts (15 minutes today).
- **Remaining phase 3** (implementation-plan.md, R3.4):
  - destiny gems up to 10;
  - typeable experience;
  - consequence severity;
  - taught subjects as a list;
  - generated journal titles shown, not stored;
  - a name box that can be emptied while typing;
  - counters near limits;
  - images from a web address (downloaded by the server; needs its own security review).
- **Testing on a real phone** before each release: a short checklist, since some bugs only appear with a real keyboard or without hover.
- **A development copy of the testers' data:** staging now holds their real data (the public site uses the staging backend), so development needs a separate copy.
