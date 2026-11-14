# Product design

The place to design a change before building it (owner request, 8 November 2026): what each screen shows, what each role can do, and the rules behind it. A change starts here; the code follows. Interface terms are the app's Spanish ones.

**Status:** each section describes the app as it is on 9 November 2026 (`main` at `d912a99`, mapped from the code) and then, under **Target**, the owner's intended design (his parallel document of 9 November 2026), with the release that builds it ([implementation-plan.md](implementation-plan.md)). The owner answered the first open questions on 9 November 2026 (recorded below); points still to settle are listed in [Open questions](#open-questions). Field limits are in [field-rules.md](field-rules.md).

## Principles

- **Spanish only** for the first version; the English texts stay in the code (`LANGUAGE_CHOICE` in `src/App.tsx`). No one is asked for words in the other language; all interface texts live in `src/localization.ts`.
- **No aesthetic change without a reason**; new screens follow the Academia style.
- **One visual style for now** (owner, 9 November 2026): Academia stays; Classic and its selector in settings were removed (R3.4 polish pass, **done 9 November 2026**). Later styles may be made from Academia by changing the design tokens, not the components.
- **One way to edit a sheet:** «Editar» / «Finalizar Edición», and each field saves as it is typed (no «Guardar» on a sheet). Character and familiar sheets behave alike.
- **Touch first:** nothing depends on hover; testers use phones.
- **No cut words** (owner, 9 November 2026): text wraps rather than ending in «…»; the ground rules and every place they change are in [Text that does not fit](#text-that-does-not-fit).
- **One control per situation:** choices use the shared controls and rules in [Controls](#controls), never browser-drawn selectors.
- **Hidden is not deleted:** a field a viewer may not see is not drawn, and hiding something (Magia intuitiva above 14, a switch turned off) keeps its stored value.
- **Better safe than sorry:** removing something asks for confirmation (target, R3.4 polish pass).
- **One name for each thing:** every screen, collection and role has one Spanish name, used the same way in titles, buttons, hints and messages; see [Words](#words).

## Words

Owner decisions of 13 November 2026. Each thing the interface shows has **one** Spanish name; titles, buttons, hints, messages and confirmations all use it. A new text uses these words; a new kind of thing gets its word here first.

| Thing | Word | Not |
|---|---|---|
| The GM's universe | **campaña** | «universo» |
| Each table within it (decision 9; labels on sheets from R4) | **partida** | «mesa» |
| The person who runs the campaign | **Máster** (as in «Biblioteca del Máster») | «GM» |
| The setting's school and what belongs to it | **escuela** («Escudo de la escuela», «Profesor de la escuela») | «academia» (the GM's preferred word) |
| Any character, whatever its type | **personaje** | «Mago» or «alumno» for characters in general |
| The character types | today **alumno** (student) and **mago adulto** (adult wizard), only when the type is meant; from R4.5 the answers **Menor** / **Adulto**, **Mago**, **Alumno**, **Personal de escuela** («Administración», «Profesor»), **Criatura mágica** | «Niño» |
| Where a character belongs | **Escuela** (a school) or **Organización** (any other); both are **instituciones** in the Biblioteca (R5) | |
| A character's or familiar's record | **ficha** | «hoja» |
| The site administrator's screen | **Administración** (opened from «Ajustes» and the campaign chooser) | «Admin», «Panel de control» |
| What a person signs in with | **cuenta**; its name **usuario**; turning it off **desactivar la cuenta** | «perfil» |
| Joining and recovering an account | **enlace de invitación**, **enlace de recuperación** (each with its **código**); cancelling an unused invitation **anular** | «token», «código de reseteo» |
| A person's part in a campaign | **Máster** or **Jugador** («Papel en la campaña») | «rol» for this |
| The shared journal on a sheet | **Bitácora** (characters: «Bitácora Celestial»; familiars: «**Bitácora del Familiar**») | «Bitácora» for anything else; «diario»; «Notas del Familiar» |
| One item of the Bitácora | **entrada** (the form «Nueva entrada» with its button «Añadir entrada»; «¿Eliminar esta entrada?», «Texto de la entrada», «Entrada del…») | «nota» |
| Private notes | **Notas privadas** (about one sheet, on that sheet) and **Mis notas** (all of yours, from the main list); one of them is a **nota** | «notas personales» |
| Moving a private note into the journal | **Mover a la bitácora** | «Mover al diario» |
| The spells list | **Grimorio** («Grimorio de Conjuros») | «grimorio» for the app or any other list |
| One spell | **conjuro** (the form «Nuevo conjuro» with its button «Añadir») | «hechizo» |
| Equipment | **equipo**; one item is an **objeto** | «inventario», «posesiones» |
| The sheet tab with the Bitácora and private notes | **Bitácora** | «Inventario y Notas», «Equipo y Bitácora» |
| The sheet tab with spells, potions and equipment | **Magia y equipo** | «Conjuros y Pociones» |
| The sheet tab with the school and the house | **Institución**: the cards **Escuela** (its list is **Clubes**) and **Casa y Heráldica** (an adult's **Antigua casa**) | «Clubes Escolares» |
| The creation form's tabs | today «Identificación», **Aspectos y equipo**, «Casa», «Habilidades», «Estrés»; from R4.5 the sheet's names: **Perfil**, **Institución**, **Habilidades**, **Magia y equipo** | «Aspectos y posesiones» |
| A player's unconfirmed sheet (R4) | **borrador**; once proposed, a **propuesta** («Proponer al Máster», «Retirar propuesta»; the Máster's «Confirmar» or «Devolver») | «borrador» for unsaved changes |
| What a confirmed proposal becomes | **Personaje del jugador (PJ)** or **Personaje no jugador (PNJ)** | |
| The administrator's way in, granted by the Máster | **Acceso de administración** («Dar acceso a la administración», «Retirar acceso», «Marcar como resuelto») | «soporte» |
| Who a sheet belongs to | **Jugador asignado**: a player, **Yo (PNJ)** for the Máster, or **Sin asignar** | «dueño» |
| Bringing an archived sheet back; removing it for good | **Restaurar**; **Eliminar definitivamente** | «borrar» |
| A sheet in play or set aside | **activa** / **inactiva** («Ficha activa»), by the Máster | «archivada» for this |
| Leaving the new-sheet form without saving | **Descartar cambios** | «Descartar Borrador» |
| Adding an item to a list on a sheet | **Añadir** X | «Registrar» X |
| Creating a sheet or a note, and the title of a form that adds an item | **Nuevo** X / **Nueva** X | |
| A sheet's images | **Galería** (familiars: «Galería de Recuerdos») | |

**Elsewhere:**

- The main list with no characters says «Aún no hay personajes», not «Bitácora Vacía».
- The loading text is «Consultando el libro de matrículas…» (owner, 13 November 2026); it names no collection.
- The new-character form and an edited sheet each have their own hint for the concept box (`placeholderConcepto`, `placeholderConceptoEdit`); both write the same stored «concepto».

## Roles

**Today:**

- **GM:** sees and edits every character and familiar in the campaign, whoever created them and whenever they registered (except players' drafts, R4 c). Owns the campaign's skill list («Habilidades de la campaña»). **Since R4 (d), 14 November 2026:** archives, restores and deletes archived sheets for good; assigns sheets to players; invites players from «Jugadores»; renames his campaign and creates new ones.
- **Player:** sees and edits only the sheets they created (assigned to them). Picks skills from the campaign's list. **Since R4 (c), 14 November 2026:** a new sheet is a borrador only they see, until they propose it and the Máster confirms it (details in the target below, now built).
- **Shared reader:** read-only access to a sheet shared with them; there is no screen to share yet.
- **Administrator** (the owner's separate account): «Administración» (R4 a, 14 November 2026): campaigns, their members and roles, invitations, recovery links and accounts. It shows usernames and roles only, never sheet content.

**Target** (owner, 9 November 2026):

- **Player's drafts (borradores):** a new player sheet starts as a draft in the player's **private vault**: a scratchpad to learn the tools or imagine characters, possibly to propose to the GM as new NPCs. **The GM does not see drafts at all.** The player proposes a draft once and the GM confirms it, choosing whether it becomes **the player's character or an NPC** of his own; from then on it is a campaign sheet (R4).
- **GM** (R4):
  - sees and edits every character and familiar that is **not a draft**;
  - marks campaign sheets **active or inactive** (dead, travelling…), a separate status: inactive sheets leave the main list («grimorio») without being archived;
  - archives, and can **delete only an archived sheet**, after several confirmation steps;
  - creates sheets and **assigns them to players**, and creates new sheets **based on an existing one**, changing what he wants (R5);
  - **changes a sheet's type**: to an adult when the character ages, or to a «Criatura mágica» if something changes the character's nature (R4.5);
  - creates campaigns and sees the campaign chooser; players join a campaign by invitation;
  - chooses which fields a shared reader sees (the visibility editor, R7.3).
- **Player:** sees and edits the sheets they created or that the GM assigned to them, and their own drafts.
- **Shared reader:** sees the fields the GM chose for that sheet.
- **Administrator:** as today, and can see and change **the whole campaign's data** only while the GM allows it: the GM grants access for an issue, and it ends after **24 hours**, when the GM withdraws it, or when the administrator marks the issue as solved, whichever comes first. Personal notes stay excluded. Admin screens in R4. **Built in R4 (e), 14 November 2026:** in «Ajustes» → «Campaña», «Acceso de administración»: the Máster describes the problem and taps «Dar acceso a la administración»; while it lasts he sees the issue, the end time and «Retirar acceso» (asks first), and afterwards how it ended; below, a log of what the administration opened or changed («Luna de Bruma · abierta 2 veces», «cambiada 1 vez, la última el…»). In «Administración» the campaign shows the access with «Abrir campaña» and «Marcar como resuelto». Inside, a banner on every screen says until when, with «Marcar como resuelto» and «Salir» (both send pending changes first). The administrator sees and changes what the Máster does, **players' drafts included** (owner), but takes none of his decisions and has none of his tools. The draft panel tells players that only the administration could see a draft, during an access the Máster grants.

## Controls

How a person chooses something, everywhere in the app (study requested by the owner, 9 November 2026). The look stays coherent with the Academia style; what a control can do comes first.

**Status: adopted 9 November 2026.** The owner tried every control in an interactive demo ([Magistri Scholae controls](https://claude.ai/artifact/6aTMfP3K42R2z1rzGUHRtJ), a private claude.ai page) and recorded a verdict on each: 16 of 20 approved as proposed; the pips, the filter bar and the styles rule were approved after one round of changes; the tag menu was changed twice after his notes, and the second change waits for his look. The text below includes those changes.

### Why

- The browser draws a native selector's open list itself (on Android, a white system sheet in the system font), outside the app's styles. The app had seven native selectors (house in sheet edit mode, spell and potion difficulty, campaign and language in settings, knowledge level, consequence severity; the last two became tag menus in PR #41), six native checkboxes and five native number boxes with spinners (quantities, and stress maxima in the form).
- The house filter chips on the main list show every option at once. That is fine for five houses but does not grow: R4 adds active/inactive sheets, R5 adds institutions and their branches, and the GM's Personajes view filters and sorts by any stored value. Chips also take a lot of room on a phone before the first card.
- So no single control fits every case; each situation gets one control, always the same one.

### The controls

Each one is a single shared component, drawn with the design system's tokens in both styles (docs/design-system).

| # | Control | Looks like | Use it for | Limits |
|---|---|---|---|---|
| 1 | **Stepper** | «−» value «+» | An ordered number where the exact value matters: skill, spell and potion values, quantities, stress maximum, experience. | In edit mode the value becomes a box when the range is above 20 (experience). |
| 2 | **Pips** | A row of boxes or gems, tap to set | A small ordered range read at a glance during play: stress, destiny. | Up to 10. Tapping the current one does nothing (owner); stress clears with «0», destiny with «−». |
| 3 | **Switch** | A sliding toggle beside its label; the whole row is tappable | One on/off property that takes effect at once: specialized, «inicial», «Es profesor», and later Mago, Alumno, active. | Never for a choice between two named options (that is a segmented control). |
| 4 | **Check** | A drawn check box | Acknowledging something («Entiendo que…») and multiple choice inside a picker. | Not for settings that take effect at once (switch). |
| 5 | **Segmented control** | One fixed row of 2–4 joined buttons, the chosen one lit | A mode of the whole sheet or screen, always visible: Menor / Adulto, image fit, a sort direction, and the language when it returns. | 2–4 short labels that fit one row at 320 px; otherwise a tag menu. |
| 6 | **Option chips** | Round chips under an input | Choosing a value **while adding a new item**: a consequence's severity. | 2–5 short options, at most two rows; never for filters or for a value already on a row. |
| 7 | **Tag menu** | The value as a coloured tag; tapping it opens a small menu in the app's style next to it (a bottom sheet on phones) | **Changing a value already on a row**, where there is no room for chips: severity, knowledge level, house in sheet edit mode, a skill's category (R4). | 2–8 options; includes «none» where empty is allowed. Tags take their natural width; a value too long for the row wraps, never cut. The tag shows the value's word, its explanation only in the menu. An empty tag looks like the others, same height, type and padding, only with a dashed border and quieter colours: «Elegir», «Ninguno» (owner). Readers see the plain tag. |
| 8 | **Option cards** | Large cards with a picture or explanation | A choice made once, at a setup step, that needs explaining: sheet type, house in the creation form, the GM's «PJ o PNJ» when confirming a draft (R4), a type change (R4.5). | 2–6 options. Never in a row or during play. |
| 9 | **Picker** | A dialog (a full-height sheet on phones) with a list of rows, each with picture or crest, name and a second line; search on top when there are more than 8 | **Choosing an entity or one of many**, or a list that grows: the bonded familiar, the campaign, a skill from the campaign's list, a player to assign (R4), the other side of a pact (R4.5), an institution, branch, course, subjects and clubs (R5). | Single choice closes on tap; multiple choice uses checks and «Hecho». |
| 10 | **Text with suggestions** | A text box whose suggestions appear in the app's own list as you type | Free text that may link to a known item, with free text kept as a fallback (R5: institution, house, course). | Suggestions never come from the browser (no `datalist`). |
| 11 | **Filter bar** | Search box whose magnifier chooses where to search (everything by default: name, player, concept, house, course, type), plus a «Filtros» button with the number of active filters; active ones show as small removable chips under the search | **Filtering and sorting a list**: the main list, the Biblioteca (R5). The button opens a sheet with one section per filter (houses as crest medallions, type, player, active / inactive, archived, each a list with checks) and the sort order: any number of fields, chosen from a searchable list, with a direction (owner). | Takes one row however many filters exist. |
| 12 | **Date and time** (added with R3.5, 12 November 2026; `DateTimeField.tsx`) | A button with the day that opens a month calendar drawn by the app, and the hour and minutes as steppers | A date that matters to the story: a journal entry's date when a note moves to the Bitácora. | Never the browser's date picker; Monday first; month and weekday names in the interface's language. |

### Which one to use

1. **On or off?** Switch; to acknowledge something, a check.
2. **A number?** Up to 10 and read during play: pips. Otherwise: a stepper, with a typed box in edit mode when the range is above 20.
3. **One of a fixed set?**
   - chosen once at setup and needing a picture or explanation: **option cards**;
   - 2–4 short options that set a mode of the sheet or screen: **segmented control**;
   - while adding a new item, up to 5 options: **option chips**;
   - changing a value already on a row, up to 8 options: **tag menu**;
   - more than 8, entities (characters, familiars, players, campaigns, skills, institutions), or a set that can grow: **picker**.
4. **Several of a set?** A picker with checks; up to 6 fixed options may be a column of switches instead.
5. **Free text that may link to something known?** Text with suggestions.
6. **Narrowing or ordering a list?** Filter bar.

### Rules for every control

- **No browser-drawn controls:** no native `select`, checkbox, radio, number spinner, date box or `datalist`. Text boxes and text areas styled with the tokens stay; a slider (the cropper's zoom) is allowed only fully restyled, since the browser then draws nothing outside the page. The system file chooser stays, as the only way to pick a file.
- **The current value is always visible** without opening anything, and **never cut with «…»** where it can wrap.
- **Touch:** the tappable area is at least 40 px, even when the visible tag or pip is smaller. Where items sit closer (destiny gems, a tag beside its «×»), the spacing or size grows when the control is built. Nothing depends on hover.
- **Closing:** menus, pickers and sheets close on a choice (single choice), a tap outside, Escape, and Android's back button; focus returns to what opened them.
- **Keyboard and screen readers:** reachable with Tab; arrows move inside a group or list; Enter or Space chooses; each control has its role (switch, radiogroup, menu or listbox, dialog) and a label.
- **Readers** see the value as plain text, never a disabled control.
- **Saving** is unchanged: a choice on a sheet saves its one path at once; session controls keep working outside edit mode.
- **One style, from tokens:** each control is one shared component drawn with the design system's tokens; no control has its own colours except value colours (severity, knowledge level, houses), which are listed in the design system. A later style changes tokens, not components.

### Every choice, today and planned

| Where | Today | Control | When |
|---|---|---|---|
| Main list: houses, adults, familiars, partidas | Chip strip | Filter bar (11) | Done (R4 b, 14 November 2026) |
| Main list: search | Text box | Inside the filter bar, with where to search | Done (R4 b) |
| A character's partida (Máster) | — | Tag menu (7) on the sheet's top bar | Done (R4 b) |
| New sheet type | Option cards | Stays (8) | — |
| House, creation form | Option cards | Stays (8) | — |
| House, sheet edit mode | Native selector | Tag menu with crests (7) | Done (9 November 2026) |
| Visual style, settings | Option cards | Removed with Classic (owner) | Done (9 November 2026) |
| Campaign, settings | Native selector | Picker (9) | Done (9 November 2026) |
| Language (hidden) | Native selector | Segmented (5) | When it returns |
| Image fit | Two buttons | Segmented (5) | Done (9 November 2026) |
| Values, quantities, stress maximum | Steppers; native number boxes when adding equipment and in the form | Stepper (1) | Done (9 November 2026) |
| Experience | Stepper, typed in edit mode | Stays (1) | Done (PR #41) |
| Stress, destiny | Pips | Stay (2) | — |
| Spell and potion difficulty when adding | Native selector | Stepper (1), like the value on existing rows | Done (9 November 2026) |
| Specialized, «Es profesor», «inicial» | Native checkboxes | Switch (3) | Done (9 November 2026) |
| «Entiendo que…» before deleting | Native checkbox | Check (4) | Done (9 November 2026) |
| Severity when adding | Option chips | Stays (6) | Done (PR #41) |
| Severity on a consequence | Native selector as a tag | Tag menu (7) | Done (PR #41) |
| Knowledge level, sheet and form | Native selector | Tag menu (7) | Done (PR #41) |
| Skill from the campaign's list | Inline list of chips | Picker with search (9) | Done (9 November 2026) |
| Bonded familiar | Dialog with a list | Picker (9), the same component | Done (9 November 2026) |
| Draft status; «PJ o PNJ» when confirming | — | Actions; option cards (8) | Done (R4 c) |
| Active / inactive | — | Switch (3), GM only | Done (R4 c) |
| Assigned player | — | Picker (9) | Done (R4 d) |
| A skill's category | — | Tag menu (7) | R4 |
| Age group; Mago, Alumno | — | Segmented (5); switches (3) | R4.5 |
| Type change by the GM | — | Option cards in a dialog (8) | R4.5 |
| A pact's other character | — | Picker with search (9) | R4.5 |
| Institution, branch, course | — | Text with suggestions (10), or picker (9) | R5 design step |
| Subjects, clubs | — | Picker with checks (9) | R5 |
| Biblioteca lists, GM's Personajes | — | Filter bar with sorting (11) | R5 |

### Decisions for the owner

- **D1. Adopted** (9 November 2026) with the owner's four changes; recorded in AGENTS.md.
- **D4. Done:** the interactive demo above.
- **D2. Done** (14 November 2026): the main list's filter bar came with R4 (b), when the partidas needed a filter (owner: «the filters need to be reworked with the format discussed»).
- **D3. Done:** the tag menu was built first, in PR #41, for severity and knowledge level, so no new native selector goes live; the rest in the polish pass, one component at a time.

## Text that does not fit

The ground rules for «no cut words» (owner, 9 November 2026). **Status: adopted 9 November 2026** (rule 1 is the owner's own; rules 2–11 as proposed, with D2 and D3 as recommended). They apply to every screen and to every new one.

### Rules

1. **Say it shorter first** (owner, 9 November 2026). A text from the translations file that is longer than it needs to be is replaced by a shorter way to say the same («Buscar por nombre, jugador o concepto...» → «Buscar»). Only text still cut afterwards gets the layout rules below. Done for 71 texts on 9 November 2026 (PR #59).
2. **Wrap by default.** Text that does not fit continues on the next line, breaking between words. A single word longer than its space (a long username, a name without spaces) breaks inside the word rather than spilling out of its box.
3. **Never cut:**
   - names: characters, familiars, players, accounts, skills, campaigns, institutions;
   - the app's own words: buttons, tabs, labels, menu items;
   - messages: errors, warnings, confirmations, empty-list sentences;
   - anything the viewer typed, on the sheet, in the form or in a list row.
4. **The only cut allowed: a summary with the full text one tap away.** On the list cards a character's concept and a familiar's description keep their two lines and end in «…»; the sheet shows the whole text. No other place cuts, and no new one may without being added here with its reason.
5. **Make room before anything else.** When a row is too narrow, its parts stack (as the custom fields do on phones) instead of squeezing a box until its text disappears. Boxes that hold a name get a minimum width.
6. **Our own words are written to fit.** A label for a narrow place is short by design (as «Recortar» / «Completa»). If it still does not fit at 320 px, it wraps or the control changes (Controls, segmented control → tag menu); it is never cut.
7. **A row of controls that cannot wrap scrolls instead.** Tab bars scroll sideways; an item at the edge may be partly hidden by the scroll, which shows there is more, but each item's own text is whole.
8. **No fixed heights around text.** Where text can wrap, its container grows; cards in the same row of a grid grow together, so the grid stays even.
9. **Text is not shrunk to fit.** No text smaller than 9 px; the few at 7–8 px today go to 9 px, and their space is made instead.
10. **A hover title is not a substitute.** Phones have no hover, so `title` holding the full text does not count as showing it.
11. **Short tokens may stay on one line** (`whitespace-nowrap`): numbers, «+2», «3/5», a stepper, a tag's single word. Never a sentence or a name.

### Every place that cuts today

Measured on 9 November 2026 after the wording pass (rule 1), on every screen at phone and desktop widths, with the demo's data and with long names (a 48-character character name, a 36-character familiar name). «Cut now» marks where text was lost before the rules were applied. **All applied on 9 November 2026:** measured again with the same long names, the only text still cut is the cards' two-line summaries (rule 4).

| Where | Text | Cut now? | Rule | Becomes |
|---|---|---|---|---|
| List card, character | Name | Yes, long names | 3 | Wraps; the row's cards grow together |
| List card, character | Concept (two lines) | — | 4 | Stays: two lines and «…» |
| List card, character | Player | Yes, long names | 3 | Wraps |
| List card, familiar | Name | Yes, long names | 3 | Wraps |
| List card, familiar | Description (two lines) | — | 4 | Stays: two lines and «…» |
| List card, familiar | Species, bonded character | Yes, long species | 3 | Wraps |
| Familiar sheet | Title (the familiar's name) | Yes, long names | 3 | Wraps |
| Character sheet banner | Linked familiar's name (8 px on phones, 11 px on desktop) | Long names would | 3, 9 | Wraps, at least 9 px |
| Character sheet banner | «Vincular» on the empty familiar slot (7 px) | No (shortened) | 9 | 9 px |
| Character sheet, edit mode | «Desvincular» (twice) | No | 3 | The cut is removed; it wraps if ever needed |
| Creation form | Tab labels | No (shortened: «Aspectos», «Casa») | 7 | The cut is removed; the tab bar scrolls |
| Creation form | «Familiar» tab | No | 7 | The cut is removed |
| Creation form, equipment list | Item name (full name only on hover) | Long names would | 3, 10 | Wraps |
| Creation form, familiar editor | Image error message | No (shortened) | 3 | The cut is removed; it wraps |
| Familiar sheet | Bonded character's concept | Long concepts would | 4 | Two lines and «…» (D2): the full text is on the character's sheet |
| Familiar sheet, «elegir mago» dialog | Character names | Long names would | 3 | Wraps; the dialog becomes the shared picker (missed in polish pass (b)) |
| Settings, account card | Display name, username | Long ones would | 2, 3 | Wraps; a username breaks inside the word if needed |
| Campaign skills | Age limit note (one line) | Long ages would | 11 | Wraps (a sentence) |

### Decisions

- **D1. Adopted:** rules 2–11 (rule 1 is the owner's and applied).
- **D2. Decided:** the bonded character's concept on the familiar sheet keeps two lines and «…», a summary like the cards.
- **D3. Decided:** no text smaller than 9 px (rule 9).

## Notes

Adopted by the owner on 12 November 2026 after trying an interactive demo (claude.ai artifact «Magistri Scholae notes», with his verdicts). R3.5 builds it.

1. **Two kinds, two names and looks:** the sheet's shared journal keeps its name (characters: «Bitácora Celestial»; familiars: «Notas del Familiar»); private notes are «Notas privadas», always with a lock, a violet edge and «Solo tú las ves. Ni el GM puede leerlas.» (for the GM: «La jugadora no puede leerlas.»). Each says who reads it. **No separate GM notes** (owner): the GM keeps private notes like everyone; shared GM notes can return with R4 if a second GM joins.
2. **Where private notes live:** on each sheet, in the notes tab, below the Bitácora: your private notes about that sheet. And «Mis notas», a button on the main list, with all your private notes, newest first, grouped by sheet, including notes about no sheet.
3. **Who:** anyone who can open a sheet can keep private notes about it (a player on their character, a reader of a shared sheet, the GM). Nobody else reads them, not the GM and not the administrator in the app. They stay yours if the sheet is reassigned or archived.
4. **Writing and dates:** an optional title (without one: «Nota del 12 nov») and a text, saved as you type, always editable by their author (not part of the sheet, so no edit mode). Each note keeps **when it was written, date and time** (owner: proper diaries), shown on it and used for its order, newest first; editing it later does not change that date. The server's «etiqueta» is not shown for now.
5. **«Mover a la bitácora»:** on a note about a sheet you can edit. The dialog names the Bitácora and who will read it there; offers the entry's **date and time, suggested from when the note was written, which you can change** (a calendar and hour and minute steps drawn by the app, never the browser's picker); shows the text; and warns that the private note disappears. The entry takes its place in the Bitácora by that date. A note about no sheet first asks which sheet. No «copy instead» for now.
6. **When the GM moves a note,** the assigned player reads it, and the dialog says so by name («Ana podrá leerla: es una forma de revelarle algo»). An entry hidden from the player waits for the visibility editor (R7.3).
7. **A note that does not fit is stopped first:** an empty note, or one longer than the Bitácora allows (50,000 characters), cannot be moved; the dialog says why before anything happens.
8. **Deleting asks first** ([Confirmations](#confirmations)).
9. **Familiars too:** the same two kinds on their «Notas del Familiar» tab.

## Image viewer

Adopted by the owner on 12 November 2026 after trying an interactive demo (claude.ai artifact «Magistri Scholae image viewer», with his verdicts). One viewer, `src/components/ImageViewer.tsx`, for portraits and galleries on both sheets.

1. **What opens it:** any gallery image, on both sheets, in reading and edit mode; the character's portrait on its sheet and the familiar's portrait on its profile, in reading mode. In edit mode a portrait tap still changes the portrait. List cards, the familiar card on the character banner and the photos in pickers keep their action.
2. **One viewer, never cropped:** the image is whole and as large as the screen allows; one smaller than the screen is shown at its own size, not stretched.
3. **Out of the way (owner):** the image has the whole screen and everything else floats over it. On a computer the ×, magnifier and ‹ › buttons are invisible until the mouse comes within about 120 px of one, or the keyboard reaches it. On a phone there are no buttons, only gestures.
4. **Moving:** computer: ‹ › and the arrow keys; phone: swipe left or right. It stops at the first and last image. A portrait opens alone.
5. **Zoom:** computer: the magnifier, double-click, the wheel, + and −; phone: pinch and double-tap (2.5× at that point, again to go back). Up to 4×; drag to move while zoomed. What is left of a pinch when one finger lifts never drags, swipes or closes.
6. **Closing:** computer: the ×, a click anywhere, Escape; phone: a tap anywhere or a swipe down. On both, the back button closes the viewer instead of leaving the sheet.
7. **Only for looking:** no delete, edit or download inside it; removing stays on the gallery grid, with its confirmation.
8. **Portraits are the saved crop** (3:4); the original before cropping is not kept.
9. **The gesture hint shows once** per device, for 3.5 seconds.
10. **The name and counter** («2 / 5», or «Retrato») show for about 2 seconds on opening and on each change, then fade; on a computer they come back while the mouse is near the top.

## Confirmations

Adopted by the owner on 9 November 2026 (known inconsistency 3: «in most cases confirmation is preferred»). One dialog for all of them, `src/components/ConfirmDialog.tsx`: a title, the question, «Cancelar» and the action button; Escape or a tap outside cancels.

1. **A saved sheet asks before removing anything:** character and familiar sheets, in edit mode and in the session tab (aspects, complications, custom fields, skills, subjects, temporary aspects, consequences, spells, potions, clubs, equipment, notes, gallery images, portraits). The question names the kind of thing («¿Eliminar este aspecto?»); the button says «Eliminar», or «Quitar» for a skill, subject or portrait.
2. **The creation form does not ask** when removing inside it: nothing is saved yet, and «Cancelar» already asks before discarding the draft.
3. **Discarding typed values asks:** the creation form's «Cancelar» and the familiar editor's «Volver», only when something changed.
4. **Archiving** a character or a familiar uses the same dialog with a tick box («Entiendo que…»); the button works only once it is ticked.
5. **Unlinking** a familiar from its character does not ask (owner): relinking is easy.
6. **Changing a value is not a removal** and never asks (a knowledge level, a severity, «Sin conocimiento»).

## Screens

### 1. App frame

- Every screen sits in the same frame: the Academia background (the only style since 9 November 2026), crest and title on the entry screens.
- **Start:** the session is restored; with no session, the sign-in screen. The campaign is the one used last, or the only one; with several and none chosen, the campaign chooser.
- **Loading:** «Abriendo grimorio de la escuela...».
- **Messages (toasts):** bottom right, green or red, close by themselves after 4 seconds or with «×». An expired session or a failed load: «No se pudieron cargar los datos. Recarga para volver a intentarlo.»
- **Save status** (bottom left, on character and familiar sheets): hidden while saving works (owner, 12 November 2026: only problems are shown, no «Guardando… / Guardado»). It appears for working offline, someone else changing the same field («Mantener el mío» / «Mantener el suyo»), a change not saved and why, and changes discarded because the field became read-only («Entendido» clears them). Since R3.5 step 1 it speaks plainly: the field as the sheet names it («Campos Personalizados (nombre)»), what is wrong («no puede quedar vacío») and what to do («Corrígelo y se guardará solo»); «Reintentar ahora» appears only for a lost connection or a server error.
- Coming back to the tab re-reads the lists and open sheets; leaving the page while a save is pending asks first.
- Demo builds only: the «DEMO» banner and the test panel.

**Target:** the save-status panel speaks plainly, without field names (R3.5; **done 12 November 2026**). **For a GM, the first screen after opening a campaign is the Biblioteca del Máster** (R5); the grimorio opens from there.

### 2. Sign-in («Iniciar sesión» / «Aceptar invitación» / «Restablecer contraseña»)

- Three tabs in a card. **Iniciar sesión:** «Usuario», «Contraseña». **Aceptar invitación:** «Usuario», «Código de invitación», «Contraseña», «Repite la contraseña» (at least 12 characters). **Restablecer contraseña:** «Código de recuperación», the new password twice.
- **Links:** `https://magistrischolae.fyi/#invitacion=CÓDIGO` and `#recuperacion=CÓDIGO` open the right tab with the code filled in; the code is never sent to the server in the address and is removed from the address bar.
- The username and code ignore surrounding spaces; usernames are stored in lowercase, and the name as typed becomes the display name.
- Errors are plain messages.
- **Campaign chooser** («Elige una campaña»): one button per campaign the viewer belongs to, «Cerrar sesión», and for the site administrator «Administración». Shown when the viewer belongs to more than one campaign, or to none (an administrator outside every campaign).

**Target:** the GM also sees the chooser and **creates new campaigns** there; players join new campaigns by invitation (R4).

### 3. Character list (the grimorio)

- Header: crest, «Magistri Scholae», «Mis notas», for the Máster «Habilidades de la campaña» and «Partidas», «Ajustes», «Nuevo Personaje».
- **The filter bar** (Controls, control 11; built with R4 b, 14 November 2026, as approved in the controls demo): the magnifier chooses where to search («Todo»: name, player, concept, house, year and type; or one of them); «Filtros» with the number of filters on opens the sheet: «Ordenar por» (one field from a searchable list: name, experience, year, house, destiny points, player, type, age; with a direction; numbers start from the highest) and the sections «Partida» (Máster only), «Casa» (the five houses with their medallions) and «Tipo» (Alumno, Mago adulto, Familiar), each a list with checks; «Quitar filtros», «Ver N resultados». Active filters show as removable chips under the search, and a line says how many sheets show and how they are sorted. Options in one section add up; sections narrow each other. A familiar follows the character it is bonded to (house and partida); an adult wizard's house is the one their «Antigua casa» names. The choice stays while moving between screens and resets when the campaign changes. It replaces the house chips.
- **Character card:** portrait or house crest, year or «Adulto», name, concept, «Destino», «Exp», «Jugador»; for the Máster, the partida as a small tag. **Familiar card:** picture, name, description, «Especie», «Vínculo»; for the Máster, its character's partida.
- By name unless another order is chosen (was: newest first); characters, then familiars. Archived sheets never appear.
- **Estado** (R4 c) in the filter bar: «Activa», «Inactiva», and «Borrador» / «Propuesta» when the viewer has any; inactive sheets are left out by default (the results line says so) and show again when chosen. Cards say «Borrador», «Propuesta» or «Inactiva» as a corner tag.

**Target:** inactive sheets leave this list, and «Estado» joins the filters (R4); the filters follow the new sheet types and the campaign's institutions (R4.5, R5). The GM's complete view with filters and sorting by any value lives in the Biblioteca (R5), with the same filter bar.

### 4. New sheet type («Elegir Sendero Mágico»)

- Today: «Alumno», «Mago adulto» (both open the creation form) and «Familiar» (familiar creation); «Volver».

**Target** (R4.5; revised by the owner on 13 November 2026):

Two short steps instead of a branching list.

1. **«¿A quién registramos hoy?»**, three option cards:
   - «**Personaje**»;
   - «**Criatura mágica**»: a personaje with the creature box ticked. It keeps its own card for lore reasons, though it is a box that combines with either age. It adds «**Especie**», a general «**Descripción**» (as familiars have) and a «**Pactos**» tab, whose entries each link to another character. A player can own one, from character creation on;
   - «**Familiar**»: the familiar form, as today.
2. **«¿Quién es?»** (personaje and criatura), one screen with defaults, so a typical student takes two taps:
   - **Edad:** «**Menor**» | «**Adulto**» (segmented);
   - **«Mago»:** a switch, on by default;
   - **Escuela:** for a menor, an «**Alumno**» switch, on by default; for an adulto, «**Personal de escuela**» as two switches, «**Administración**» and «**Profesor**», both possible (a director who still teaches);
   - a line under the rows says what the sheet will have (e.g. «Tendrá: Casa, Escuela, Magia y equipo»); «Continuar» opens the creation form, whose tabs follow the answers.
- **What the Máster lets players create** (per campaign): the Máster chooses which of these options players may pick (the three cards, each age, a non-magical character, «Alumno», «Administración», «Profesor»); every option by default. A specific player can get a different set. Options a player may not pick are not shown, and a step with a single possible answer is skipped. The server enforces it on creation (and on drafts, R4); the Máster's own sheets and later type changes are not limited; tightening it changes no existing sheet. It is a campaign setting, opened next to «Habilidades de la campaña» until the Biblioteca (R5).
- **The «Escuela» card on «Institución» becomes the character's institution** (R5 designs institutions: schools and other organizations): «**Escuela**» for students and school staff (year, class rank, clubs; post and subjects), «**Organización**» for anyone else who belongs to one (its name, the character's «Rol / Título», the section in R5), and **no card** for a character without one. In edit mode such a character shows «+ Añadir escuela u organización». Until R5 the institution is the free text there is today; R5 links it to the campaign's institutions.
- Existing sheets carry over without losing data: today's «Alumno» becomes a Menor, Mago, Alumno; «Mago adulto» an Adulto, Mago, «Profesor» if its teacher switch is on.
- The GM can later change any of these answers (a minor grows up; a character becomes a «Criatura mágica»); values the new answers do not show are hidden, not deleted.
- **Open:** whether a character can belong to more than one institution (R5 now says one, or none).

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

- **The tabs follow the sheet** (owner, 14 November 2026; R4.5 step 2): each form tab takes the sheet tab's name and its cards in the same order, with only the values that make sense at creation; Bitácora and Galería stay out of the form.
  1. **Perfil:** «Retrato y nombre» (portrait with crop, fit and «Quitar retrato»; «Nombre del Personaje»; «Concepto», which **stays next to the name**, as in the sheet's top bar); «Datos Personales» (Jugador, Edad, Linaje, Economía, Varita; adults: Reputación); «Aspectos Personales» and «Complicaciones» in one card; «Campos personalizados». On wide screens in the sheet's two columns.
  2. **Institución** (everyone; replaces «Casa»): «Escuela» (students: Curso académico, Puesto en la clase; adults: Institución, Rol / Título, «Profesor de la escuela», Asignaturas; everyone: **Clubes**, new in the form) and «Casa y Heráldica» (students: the house picker with its lore) or «Antigua casa» (adults: the text box). The «Perfil de Mago Adulto» block disappears: its values go to Institución, and Reputación to Datos Personales.
  3. **Habilidades:** as today.
  4. **Magia y equipo:** «Equipo» (moved from «Aspectos y equipo»); whether «Conjuros» and «Pociones» are chosen at creation is decided in the design step.
  5. **No «Estrés» tab:** the maxima are calculated from the skills ([Stress and consequences](#stress-and-consequences-owner-9-november-2026)).
- **Identificación** carefully redesigned for minors, adults and magical creatures, with fitting values for each, without losing current data (R4.5): it becomes the «¿Quién es?» step (section 4) and the tabs above. «Edad»: up to 1,000,000, or «desconocida» (R4.5).
- **Concepto stays next to the name** (owner, 14 November 2026; replaces the earlier plan to move it to «Aspectos y Posesiones»).
- **Institución** takes its content from the campaign's institutions, or free text (R5).
- **Familiar:** for every magical human character, **adults included** (owner, 14 November 2026; today students only); the dialog has no save button: it keeps the values, and the familiar is created and linked only when the character is saved (R3.4 polish pass).
- **«Cancelar»** asks before discarding any change (polish pass).
- Portrait fit buttons in Spanish everywhere (polish pass).

### 6. Character sheet

**Banner:** portrait, name, concept, house crest, the linked familiar, «Volver», «Editar» / «Finalizar Edición», «Archivar» for the GM (with a box to tick). **Edit mode:** name and concept boxes; tap the portrait to change it, fit and «Quitar retrato» below; the familiar card opens the link picker («Sin Mago Asignado (Familiar Libre)», the familiars, «+ Crear Familiar»).

Tabs:

- **Perfil:** «Datos Personales»; «Aspectos Personales» and «Complicaciones» in one card; «Campos Personalizados».
- **Institución:** «Escuela» (crest and name; year and class rank for students; institution, role, teacher and subjects for adults; the clubs) and «Casa y Heráldica» (students) or «Antigua casa» (adults).
- **Sesión** (usable outside edit mode, on purpose: convenience during play): destiny gems (three, plus one per point above three, up to 10), experience (− +, typed in edit mode), «Aspecto Temporal», three stress tracks, three consequence lists, each consequence with a severity tag (Leve, Moderada, Grave).
- **Habilidades:** values, removal, «+ Añadir de la lista», knowledge levels, GM-only typed box.
- **Magia y equipo:** «Grimorio de Conjuros» and «Catálogo de Pociones» (add and remove in edit mode; entries not editable), «Equipo» (quantity ± at any time).
- **Bitácora:** the journal (add and edit at any time, remove in edit mode) and, below it, the viewer's «Notas privadas» about the sheet.

- **Galería:** tap to enlarge; add and remove in edit mode.

**Layout (owner, 13 November 2026):** clubs and equipment left the journal's tab: equipment joined spells and potions, as what the character carries and uses in play; clubs joined the school. A non-magical character (R4.5) keeps the «Magia y equipo» tab for its equipment, under the name «Equipo». The Máster opens «Habilidades de la campaña» from the main list (until the Biblioteca, R5), no longer from «Ajustes».

**Institución (owner, 13 November 2026):** the school and the house have their own tab, second after Perfil, side by side on wide screens and one above the other on a phone. «Escuela» is laid out like the house card: the school's crest and name on the left, the character's place on the right (a student's «Curso académico» and «Puesto en la clase»; an adult's «Rol / Título» and «Profesor de la escuela»), then the subjects taught and the clubs. Until R5 the crest is the app's, a student's school is «Magistri Scholae» and an adult's is the «Institución» text; R5 gives each institution its own name and crest. An adult's card beside it is «Antigua casa»: the house's heraldry when the text names one of the houses, the name alone otherwise, no card when empty. Perfil keeps «Datos Personales» on the left, «Aspectos Personales» and «Complicaciones» in one card on the right, and «Campos Personalizados» below. Only where things are shown changed.

**Target:**

- Session tab: destiny gems up to 10, typeable experience, consequence severity (R3.4, **done 9 November 2026**); stress tracks and consequences designed around the game's rules ([Stress and consequences](#stress-and-consequences-owner-9-november-2026)), without overcomplicating them.
- **Custom cards** (owner, 13 November 2026; after R4): players and the GM add their own named cards of text-only fields on Perfil («+ Nueva tarjeta»), after «Campos personalizados»; a whole card can be hidden; no moving of fields between cards; campaign-wide cards wait for the Biblioteca (R5).
- Perfil follows the sheet type and switches (R4.5); house and institution come from the campaign's institutions (R5); a non-magical character hides the magic fields (R4.5).
- Removing anything asks first (polish pass); generated journal titles are shown, not stored (**done**).
- Drafts, proposal and confirmation, and active/inactive status (**done**, R4 c): under the top bar a panel says where the sheet stands: «Borrador» (only you see it; «Proponer al Máster»), «Propuesta enviada» (read-only; «Retirar propuesta»), for the Máster «Propuesta de un jugador» («Devolver», after asking, or «Confirmar», which opens two option cards: «Personaje del jugador (PJ)» / «Personaje no jugador (PNJ)»), and «Ficha inactiva»; in edit mode the Máster has the «Ficha activa» switch. The same panel on familiar sheets.

### 7. Familiar sheet

- **Header:** the character sheet's top bar: «Volver a Personajes» («Volver» on phones), «Editar» / «Finalizar Edición», «Archivar» for the GM.
- **Perfil y Vínculo:** two cards (owner, 14 November 2026): «Datos y retrato» (the portrait, then name and species side by side, then the description) and «Vínculo Mágico», side by side on wide screens, one above the other on a phone.
- **Notas del Familiar**, **Galería de Recuerdos**.

**Target** (R3.4 polish pass):

- The header keeps only «Volver a Personajes», «Editar» / «Finalizar Edición» and «Archivar»: species, character and name go (they are on the profile). **Done 9 November 2026.**
- The journal tab is called «**Notas del Familiar**», and its box suggestions fit a familiar. **Done 9 November 2026** («p. ej. Encontró una llave en el jardín»; empty: «Sin notas.»).
- The crop dialog gets a zoom slider like the others.
- The link picker says «Seleccionar un personaje para vincular a este familiar».

### 8. Familiar creation

- Today «Registro y Editor de Familiares», creation only; from a character's link picker it links the new familiar (replacing a previous link), otherwise it opens the familiar's sheet.

**Target:** the title is «**Registro de Familiares**» (polish pass). Familiars belong to magical human characters only (R4.5).

### 9. Settings («Ajustes»)

- «Información de Almacenamiento», «Cuenta», «Acerca de Magistri Scholae»; Máster only: «Campaña» (R4 d: the campaign's name with «Guardar nombre», and «Nueva campaña» with «Crear», of which he will be the Máster); site administrator only: «Administración» → «Abrir administración» (R4 a). «Habilidades de la campaña» opens from the main list (Máster only, 13 November 2026). Language card hidden.

«Estilo Visual» went with the Classic style (owner, 9 November 2026; done in the R3.4 polish pass). **Target:** The campaign skills move to the Biblioteca del Máster (R5).

### 9b. Administración (site administrator; R4 a, 14 November 2026)

Opened from a card in «Ajustes» and from the campaign chooser, so it works for an administrator who belongs to no campaign. The app's frame and Academia style; nothing on it shows sheet content.

- **Campañas:** one card per campaign.
  - **Miembros:** name and @usuario; the part in the campaign as a tag menu («Máster» / «Jugador»; a campaign keeps at least one Máster); «×» removes from the campaign, after asking (the sheets are kept).
  - **«Añadir usuario»:** a picker of active accounts not yet in the campaign; they join as «Jugador».
  - **«Invitar jugador» / «Invitar Máster»:** the invitation link (`/#invitacion=CÓDIGO`) and its code, shown once with «Copiar enlace» and the expiry (7 days).
  - **Invitaciones pendientes:** role, expiry and who created it; «×» cancels it after asking («Anular»).
  - **Nueva campaña:** a name and «Crear».
- **Usuarios:** every account with its tags («Administración», «Desactivada») and its campaigns («Jugador en …»).
  - **«Enlace de recuperación»:** the recovery link (`/#recuperacion=CÓDIGO`) and its code, shown once with «Copiar enlace»; it lasts 24 hours (owner, 14 November 2026), works once and cancels the previous one.
  - **«Cuenta activa»:** a switch; turning it off asks first (sessions end; sheets and notes are kept). Never on one's own account.
- The app's own lists and chooser show only campaigns the viewer belongs to; the others are reached here.

### 10c. Jugadores de la campaña (Máster only; R4 d, 14 November 2026)

- Opened from «Jugadores» on the main list.
- The campaign's members with «Máster» or «Jugador» tags; «×» removes a player after asking (their sheets are kept).
- «Invitar jugador»: the invitation link shown once, with «Copiar enlace», the bare code and the expiry (7 days), as in «Administración».
- «Invitaciones pendientes» with «×» to cancel a player invitation («Anular»); GM invitations show but stay with the administrator.

**Assignment, archive and delete (R4 d):** on a confirmed sheet in edit mode, the Máster's panel under the top bar has «Jugador asignado», a picker with «Yo (PNJ)», the campaign's members and «Sin asignar» (only he sees it); taking a sheet from a player asks first, and the player's private notes about it stay theirs. The creation form has the same choice beside «Guardar» (the default is «Yo (PNJ)»). An archived sheet stays in the Máster's list, hidden unless «Estado» shows «Archivada»; opened, it says «Ficha archivada» with «Restaurar» and «Eliminar definitivamente», which asks for a tick («Entiendo que se borra para siempre») and the sheet's name typed in full. A familiar's card does not name an archived character as its bond.

### 10b. Partidas de la campaña (Máster only; R4 b, 14 November 2026)

The campaign's tables (decision 9; the word is **partida**). Only the Máster sees them: players never learn which partida a sheet belongs to (owner).

- Opened from «Partidas» on the main list (until the Biblioteca, R5).
- Each partida: its name in a box (saved when leaving the box or pressing Enter) and how many characters it holds; «×» removes it after asking (its characters stay, without a partida).
- «Nueva partida» and «Añadir»; names are unique in the campaign ignoring case, at most 12 partidas.
- A character's partida is chosen on its sheet: in edit mode the top bar shows «Partida» as a tag menu (the partidas and «Sin partida»); when reading, the Máster sees it as a tag under the concept. A familiar follows the character it is bonded to.
- The main list shows each sheet's partida as a small tag on its card, and filters by partida in the filter bar.

### 10. Campaign skills («Habilidades de la campaña», GM only)

- Today: every category with its skills: «Inicial», the name, «hasta N años». Add a skill per category. Draft with «Guardar cambios» / «Descartar»; blank or repeated names cannot be saved; reloads if changed meanwhile.

**Target** (R5, inside the Biblioteca):

- «**Sólo magos**» per skill: left off non-magical characters, unless added to one by hand (by the GM).
- New categories; rename current ones.
- Reorder everything (categories and skills).

### 11. Biblioteca del Máster (new, R5)

The GM's first screen after opening a campaign; the grimorio opens from it. Per campaign (universe). Three sections:

- **Personajes:** every character in the campaign and the GM's own characters; at a glance which player each is assigned to; easy, complete filters and sorting by any stored value (school, house, player, age, magical or not…).
- **Instituciones:** academies, ministries, guilds… each with a crest, colours, a description and a member list. An institution can have **branches** with their own values: called «**Casas**» in schools and «**Secciones**» in other organizations by default, and the GM can rename the word; today's houses are «Casas» of Magistri Scholae. A character belongs to a branch, to an institution without a branch, or to none (free characters). A character's institution can also be free text instead of one from the list. The GM creates any number of branches.
  - **Schools** are institutions with their own values:
    - «**cursos**» (e.g. 3º): students of the same level, who move up together each school year unless they repeat; matches «Curso Académico» on the sheet;
    - «**asignaturas**» (e.g. Pociones): with their teachers and the skill they improve; «troncal» (every student of the year) or «optativa» (students choose a fixed number from a larger set, per year);
    - «**clubes**» (e.g. Duelo): students practising an activity together in a place in the school;
    - «**clases**» (e.g. Pociones 3º): part of a year group and a teacher meeting in a classroom, linking the teacher and each student.
- **Habilidades:** section 10, moved here.

## Known inconsistencies

Found while mapping the screens on 9 November 2026, with the owner's decisions. They are fixed in the **R3.4 polish pass** unless noted.

1. **Familiar created in the creation form survives a cancelled character.** Decision: the dialog loses its save button and gets a confirm one that keeps the values; the familiar is created only when the character is saved. **Done 9 November 2026.**
2. **Discard-draft check misses fields.** Decision: «Cancelar» asks before discarding any change. **Done 9 November 2026.**
3. **Different confirmations.** Decision: consistent rules; in most cases confirmation is preferred (better safe than sorry). **Done 9 November 2026:** [Confirmations](#confirmations).
4. **Crop dialog without zoom on the familiar sheet.** Decision: add the zoom slider. **Done 9 November 2026:** one crop dialog everywhere (form, both sheets, familiar editor).
5. **Texts outside the translations file or in English** ("Cover" / "Contain", "Delete picture", archive texts, the unlinked-familiar sentence, "Subir Imagen Local"). Decision: every player-facing text moves to the translations file; the fit buttons read in Spanish everywhere (they may go if nothing is lost). **Done 9 November 2026:** every screen's text is in `src/localization.ts` (the old per-screen tables live there as named tables); only the demo's test panel keeps its own, as a development tool.
6. **Wrong wording.** Decision: «Seleccionar un personaje para vincular a este familiar»; «Registro de Familiares». **Done 9 November 2026** with shorter wording (rule 1 of «Text that does not fit»): the picker «Vincular personaje» says «Elige un personaje.»; «Registro de Familiares».
7. **Journal titles stored.** Decision: shown, not stored. **Done** (9 November 2026): characters and familiars.
8. **Edit-mode gaps** in the session tab, equipment quantities and journal. Decision: kept on purpose, for convenience during play.
9. **Known limits already planned:** destiny, experience and severity (**done 9 November 2026**), subjects as a list, the name box, the save-status panel (phase 3 and R3.5).

## Design notes

### Stress and consequences (owner, 9 November 2026)

A homebrew of the FATE stress rules with wider values. Each track (physical, mental, social) has a **maximum M from 1 to 5** (usually 3 to 5): how strong the character is there, set by the skills «Físico», «Voluntad» and «Empatía».

- Damage **below M** only marks pips.
- Damage of **M or more** is absorbed in whole steps of M, each step raising the consequence one level, and the rest marks pips. With M = 3:
  - 5 damage: 3 absorbed, a **leve** consequence (minor; it can go away during the session if the story allows), 2 pips marked;
  - 7 damage: 6 absorbed, a **moderada** consequence (major; it goes away after the session, roughly a month of story), 1 pip marked;
  - 10 damage: 9 absorbed, a **grave** consequence (severe; it never goes away unless measures are taken), 1 pip marked. With a grave consequence, 2 more damage (filling the pips) and the character is lost: dies, becomes an NPC… the GM decides from the story. To be avoided at all costs.
- The levels match the severities the server already stores: leve, moderada, grave.
- **The maximum is calculated** (owner, 14 November 2026; answers Q9), for every character, from one skill per track:

  | Track | Skill |
  |---|---|
  | Estrés físico | «Físico» |
  | Estrés mental | «Voluntad» |
  | Estrés social | «Empatía» |

  | Skill value | Maximum |
  |---|---|
  | 0 | 2 |
  | 1–2 | 3 |
  | 3–4 | 4 |
  | 5 or more | 5 |

  - A character without the skill has maximum 2.
  - Changing the skill moves the maximum up or down at once.
  - For edge cases, the maximum can then be set by hand on the sheet in edit mode (1–5); that value stays until the skill changes again, which recalculates it.
  - The creation form has no «Estrés» tab any more: the maxima follow the skills chosen in «Habilidades».
- **Design intent:** the stress tracks and consequences show this clearly without overcomplicating (R3.4 session tab for severity; the tracks in R4.5). Details still open are in [Open questions](#open-questions).

### Non-magical characters (owner, 8–9 November 2026; R4.5)

- The **same sheet** as a magical one, with a «Mago» switch; off, the sheet hides the magic fields: «Varita / Foco mágico», the categories «Habilidades y conocimientos mágicos», «Magia elemental» and «Magia esotérica» (with knowledge levels), the «Conjuros y Pociones» tab (to confirm field by field in R4.5).
- **Hidden, not deleted:** values stay stored and come back when the switch is turned on.
- **Decided (9 November):**
  - the player sets the switch at creation; afterwards only the GM changes it;
  - it applies to any human character, chosen when starting character creation;
  - a non-magical character starts without the magic skills; the GM can add some to a specific character («Sólo magos» skills included);
  - non-magical characters cannot have familiars.
- Data: one new field on the character (absent meaning magical, so existing sheets need no change), with its rule in field-rules.md.

### Sheet versions (owner, 9 November 2026; after R5, designed first)

- **Temporary versions:** a version of a character sheet can temporarily take the place of a player's character, for example in a parallel universe where they are a different person, or themselves but not quite. When it ends, the original sheet is back exactly as it was.
- To design: who creates and ends a version (the GM), what the player sees and edits meanwhile, whether journal entries and experience gained in the version carry over, and how lists show it.
- Related, simpler, in R5: the GM creates a new sheet **based on an existing one** and changes what he wants (an independent copy).

### Recorded for later

- **Far backlog: a multiverse collection.** A collection of everything created in the magical multiverse, with an archaic Spanish or Latin name, opened from a button near the notes. It copies characters between campaigns, either as an independent copy or as a **linked representation that updates with changes on both sides**. This reverses today's "no automatic two-way sync" rule (design.md section 11) and will need its own design for edits on both sides. It replaces the older private "GM library" idea (R7.5).

- **Full-screen image viewer** for portraits; the galleries already enlarge a picture on tap.
- **The GM renames the campaign** name he sees (R4).
- **Recovery and invitation links** created from the admin screens (**done**, R4 a: a recovery link lasts 24 hours).
- **Images from a web address** (downloaded by the server; its own security review).
- **Testing on a real phone** before each release: a short checklist.
- **A development copy of the testers' data:** staging now holds their real data, so development needs a separate copy (before or with R6).

## Open questions

Q1–Q8 and Q12–Q14 were answered on 9 November 2026 and folded in above (drafts, deletion of archived sheets only, administrator access, «Criatura mágica», stress maxima, «Casas» / «Secciones», R6 after R5, the multiverse collection in the far backlog). Still open, **waiting for the GM's full explanation of the stress rules** (owner, 9 November 2026): Q10 and Q11.

- **Q10 — Repeated damage.** What happens when pips would overflow without reaching a new step, or when the character already has a consequence of the level a new hit gives (does it move up to the next free level?), and how many consequences of each level a track holds.
- **Q11 — The app's role in damage.** Should the sheet only record stress and consequences (the GM applies the rules), or offer a «Recibir daño» box that applies them?

**Q9** was answered on 14 November 2026 (the table in [Stress and consequences](#stress-and-consequences-owner-9-november-2026)). Answered later on 9 November: **Q12** the GM chooses when confirming whether a draft becomes the player's character or his NPC; **Q13** a player can own a «Criatura mágica» from creation, the GM can change a sheet's type later, and temporary versions and sheets based on another were added (Sheet versions); **Q14** personal notes stay excluded from administrator access. Whether a «Criatura mágica» can have a familiar is decided in R4.5's design step.
