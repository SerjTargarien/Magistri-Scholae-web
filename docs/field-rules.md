# Field rules (draft, 8 November 2026)

Every stored field of a character and a familiar, screen by screen: what the app does today, and the rule the server will enforce from R3.2. The server stores what the app sends, so these rules are the only protection against values the screens cannot show. Source: a read of `CharacterForm.tsx`, `CharacterDetail.tsx`, `FamiliarDetail.tsx`, `FamiliarEditor.tsx` and `CharacterList.tsx` at `b97d96a`, and the owner's answers of 8 November 2026.

**Status:** all owner decisions recorded (8 November 2026). **Server:** the rules, the new and removed fields and the conversion of stored records are implemented (R3.2; `backend/domain/fields.py`, migration `0003_field_rules`), and so is the skill catalogue (`backend/domain/catalogue.py`, migration `0004_skill_catalogue`; read by members at `GET /api/v1/campaigns/<id>/skill-catalogue`; the GM editor comes in R4). Changes marked **visible** follow the screenshot approval step when the screen moves to the new model (R3.4).

## Planned changes (owner's target design, 9 November 2026)

Not enforced yet; each gets its rule here and in the backend registry when its release builds it ([product-design.md](product-design.md), [implementation-plan.md](implementation-plan.md)).

| Field | Change | Release |
|---|---|---|
| `characterType` | Replaced by an age group («Menor» / «Adulto») and two switches, «Mago» and «Alumno de Escuela de Magia»; `student` → Menor, Mago, Alumno; `adult_wizard` → Adulto, Mago. | R4.5 |
| `edad` | Whole number 0–1,000,000, or «desconocida». | R4.5 |
| `estresFisicoMax`, `estresMentalMax`, `estresSocialMax` | Whole number 1–5 (today 1–10; no stored value is above 5). Calculated (owner, 14 November 2026): physical from «Físico», mental from «Voluntad», social from «Empatía»; skill 0 → 2, 1–2 → 3, 3–4 → 4, 5 or more → 5; no skill → 2. Changing the skill recalculates; a value set by hand on the sheet stays until then. No longer typed in the creation form. | R4.5 |
| `consecuencias*/gravedad` | Already stored (leve, moderada, grave); the game's levels minor, major and severe with their durations (product-design.md, Stress and consequences). | R3.4 / R4.5 |
| «Criatura mágica» | A character type with everything an adult wizard has, plus «Especie», a general «Descripción» and «Pactos» (a list like the journal, each entry linked to another character). | R4.5 |
| Skills in the catalogue | «Sólo magos» flag; categories added, renamed and reordered by the GM. | R5 |
| `casa`, `adultWizardProfile/institution`, `curso`, `adultWizardProfile/teachingSubjects`, `clubesList` | Links to the campaign's institutions, branches and school records, with free text kept as a fallback. | R5 |
| Sheet status | Draft (private to the player, invisible to the GM) → proposed → confirmed as the player's character or a GM NPC; and, for campaign sheets, active / inactive set by the GM. Existing sheets count as confirmed and active. | R4 |
| `tarjetasPersonalizadas` (new) | Named cards of custom fields on Perfil: each card a title and its fields, a name and a text value (proposed: up to 20 cards, title required, text 60; up to 50 fields per card, name required, text 60, value text 500). `camposPersonalizados` stays as the first card. | Custom cards (after R4) |
| Sheet type changes | The GM changes a sheet's type later (Menor → Adulto, any → «Criatura mágica»); values the new type does not show are kept. | R4.5 |

## How to read the rules

- **Text N:** at most N characters. The input box gets the same limit, and the app trims spaces at both ends before saving.
- **Required:** must not be empty after trimming.
- **Whole number a–b:** an integer in that range; decimals are rejected.
- **Choice:** one of a fixed list. **List ≤ N:** at most N entries; each entry has a permanent ID and a position, so it can be reordered.
- **Warnings (owner decision):** limits are set well above normal use, and the app warns clearly before one is reached: a counter appears on a text box or list once it passes 90% of its limit, and a save over the limit explains which limit was hit. **Done 9 November 2026:** every text box carries its field's limit; while typing, a counter appears under the box past 90% of the text limit, or of the list it adds to («28 / 30 entradas»), and says «límite alcanzado» at the limit; the galleries show their counter in place («46 / 50 imágenes»). A refused list addition still shows its rule in the save panel (plain words: R3.5).
- Before R3.2 no input had a length limit, and the server allowed 64,000 characters per text, any number up to a trillion, and 500 entries per list.

## Character list (cards)

The cards show: portrait, house crest, archetype, `curso` (badge, not clipped), `nombre` (one line), `concepto` (two lines), destiny points, XP, `jugador` (one line). Familiar cards: image, `nombre`, `especie`, `descripcion` (two lines), bonded student. These displays set the practical text lengths below.

## Type selection

`characterType`: **choice** student / adult wizard; not changeable afterwards.

## Identity (form tab Perfil; sheet banner and tab Perfil)

| Field | Today | Rule |
|---|---|---|
| `nombre` | Required in the form; the sheet saves it on every keystroke, even blank. Banner heading not clipped. | **Required, text 80.** The sheet keeps the last valid name instead of saving a blank one (R3.4). |
| `concepto` | Free; the character's personal motto ("like their personal motto", owner). Banner wraps; cards show two lines. | **Text 200** |
| `jugador` | Free label, never ownership. | **Text 80** |
| `edad` | Free text ("11 años"). | **Whole number 0–999 (owner decision, visible):** years, shown as "11 años" / "11 years". Needed for the Magia intuitiva rule below. |
| `curso` (students) | Free text ("1º"). | **Text 20** |
| `puestoClase` (students) | Free. | **Text 80** |
| `linaje`, `economia`, `varitaSintonia` | Free. `varitaSintonia` is the one «Varita / Foco mágico» field for students and adult wizards (owner decision, 8 November 2026; schema version 4). | **Text 200** each |
| `avatarImage`, `avatarFit` | Cropper 3:4, JPEG ≤900 px, 0.75; a web address works only if the site allows it. | Uploaded image (4 MB, 16 MP); cover/contain. Web address: downloaded in the browser and uploaded, or a clear message to save and upload the file (R3.4). |

**Adult wizard profile** (`adultWizardProfile`):

| Field | Today | Rule |
|---|---|---|
| `role`, `institution`, `reputation` | Free. (`magicalFocus` was removed in schema version 4: migration 0006 merged it into `varitaSintonia`, keeping both texts when they differ, or moving the focus to a custom field «Foco mágico» when both do not fit in 200 characters.) | **Text 120** each |
| `formerHouse` | Free text; the house filter matches it by substring. | **Text 80** |
| `isTeacher` | Checkbox. | Yes/no |
| `teachingSubjects` | One comma-separated box; a trailing comma or space vanishes while typing. | **List like aspects (owner decision, visible):** add/remove entries; **list ≤ 30**, each **required, text 120** **Done 9 November 2026** (form and sheet). |

## House (form tab Afiliación, students; sheet tab Institución)

| Field | Today | Rule |
|---|---|---|
| `casa` | Five houses; an unknown value shows mismatched colours and crest. | **Choice** of the five houses, or empty for adult wizards |
| `lema` | Overwritten with the house motto in the interface language of the moment; a typed motto is never displayed. | **Removed (owner decision).** The motto always belongs to the house (or, after 1.0, the organization) and is shown from the house's own data. The form's motto box goes (visible). |
| `escudoText` | Copy of the house key, never displayed. | **Removed** |

Organizations (with their own mottos) get a builder and editor after 1.0.

## Aspects (form tab Aspectos; sheet Perfil)

| Field | Today | Rule |
|---|---|---|
| `aspectosPersonales` | Add/remove. | **List ≤ 30**, each **required, text 300** |
| `complicaciones` | Add/remove. | **List ≤ 30**, each **required, text 300** |
| `camposPersonalizados` | Add name + value; the name can be blanked when edited. On the sheet they read like the other values, label above value, without boxes (owner decision, 8 November 2026). | **List ≤ 100**; name **required, text 60**; value **text 500** |

## Session (sheet tab Sesión; form tab Estrés for the maximums)

| Field | Today | Rule |
|---|---|---|
| `puntosDestino` | Five gems, 0–5, default 3. | **Whole number 0–10, default 3 (owner decision).** Per-session points: normally spent, can grow during a session. **Visible:** three gems by default; the + button adds points up to 10, with a gem appearing for each point above 3 (five a row). **Done 9 November 2026.** |
| `pxs` (experience) | −/+ only, silently stops at 99. | **Whole number 0–1,000,000 (owner decision).** XP is also spent. **Visible:** in edit mode the number can also be typed (saved on Enter or leaving the box; an emptied box changes nothing); cards show it exact up to 99,999 and short above («250 mil», «1 M»). **Done 9 November 2026.** |
| `estresFisicoMax`, `estresMentalMax`, `estresSocialMax` | 1–10; default 3 (students), 5 (adults). | **Whole number 1–10** |
| `estresFisico`, `estresMental`, `estresSocial` | 0..maximum (sheet only). | **Whole number 0–10, not above its maximum** |
| `aspectoTemporal` | Add/remove. | **List ≤ 30**, each **required, text 300** |
| `consecuenciasFisicas`, `consecuenciasMentales`, `consecuenciasSociales` | Free text lists. | **Owner decision (visible):** each consequence is a **description** (required, **text 1,000**: the important part for role-play) plus a **severity**: **choice** mild / moderate / severe (*leve / moderada / grave*). **List ≤ 30** per track. **Done 9 November 2026:** a new consequence starts as «Leve» (owner); its coloured tag changes outside edit mode for whoever may edit it; one saved without a severity shows no tag until one is picked. |

## Skills (form tab Habilidades; sheet tab Habilidades)

**New categories (owner decision, visible).** "Asignaturas troncales" and "Asignaturas optativas" are replaced by three categories. Physical, mental and social skills stay as they are, except that Espiritismo moves to esoteric magic and Empatía moves to social skills (owner decision after the staging test, 8 November 2026; the GM can move it back with the catalogue editor in R4).

| Category | Default skills |
|---|---|
| Físicas | Atletismo, Físico, Deportes, Sigilo, Prestidigitación, Duelo, Supervivencia |
| Mentales | Investigar, Percepción, Voluntad |
| Sociales | Contactos, Provocar, Carisma, Engaño, Empatía |
| Habilidades y conocimientos mágicos | Magia intuitiva (hidden automatically when the character is older than 14, and never shown for adult wizards; the stored value is kept, so correcting the age brings it back), Historia de la magia (was "Historia del mundo mágico"), Herbología, Seres mágicos, Astronomía, Conocimiento de varitas, Leyes y costumbres del mundo mágico, Cultura de casa; **classified by eye, confirmed by the owner:** Trivium, Quadrivium, Arte, Conocimiento muggle |
| Magia elemental | Hermética, Transmutación, Pociones |
| Magia esotérica | Magia druídica, Oráculos y adivinación (was "Oráculo"), Creación de objetos mágicos, Espiritismo, Simpática, Quimerismo, Oniromancia, Musología, Numerología, Sanación, Cábala, Climática, Entropía, Cronomancia, Espejismo, Oclumancia, Legeremancia, Nigromancia |

That makes 48 default skills (Oniromancia appeared twice in the owner's list and is counted once). English names are added for the new ones (for example Wand Lore, House Culture, Occlumency, Legilimency, Necromancy) and for the three new categories (Magical Skills and Knowledge, Elemental Magic, Esoteric Magic).

**Esoteric knowledge (owner decision):** each esoteric skill also records its knowledge, independent of its level: basic (alteration), medium (destruction), advanced (creation). **One level per skill (owner decision):** none, basic, medium or advanced; each level includes the ones below it.

**Categories become data (owner decision).** The GM can add categories, move skills between categories and reorder them. So categories stop being fixed text in the code: each campaign has a **skill catalogue** (categories with a name, a position and whether they use esoteric knowledge; default skills with their category and position). The six categories above are the starting catalogue. **A GM change applies to the whole campaign (owner decision):** each character's default skills are linked to the catalogue, so moving or reordering a skill there moves it on every sheet. Skills a player invents stay on that character, filed under a catalogue category and placed after the catalogue's skills in that category. The GM screens to edit the catalogue come with R4; R3.2 builds the data model.

| Field | Today | Rule |
|---|---|---|
| `habilidades[].nombre` | **Owner decision, 8 November 2026:** only the GM creates, renames, moves or removes own (non-catalogue) skills; players pick catalogue skills with «+ Añadir de la lista», remove catalogue skills (and pick them again), and change any value. The server refuses anything else with `gm_only_skill` (403), on saves and on creation. Which skills new characters start with is the GM's campaign setting («inicial» in «Habilidades de la campaña»); the per-device preset is gone. A skill the GM types joins the campaign's list. Duplicates rejected. | **Required, text 60**; no duplicate names within a character |
| `habilidades[].valor` | 0–5. | **Whole number 0–5** |
| `habilidades[].categoria` | One of five fixed texts; others are invisible. | **A category of the campaign's catalogue** (by ID); default skills also keep a link to their catalogue entry |
| `habilidades[].conocimiento` | Set in the form and on the sheet (edit mode) for skills in «Magia esotérica», by whoever can edit the sheet; shown as a tag when reading. «Sin conocimiento» removes the field. | **Choice** none / basic / medium / advanced; only for skills in a category marked esoteric |
| position | List order; no reordering. | Taken from the catalogue for linked skills; invented skills follow in creation order |
| `habilidades` | 39 defaults. | **List ≤ 200** |

## Spells and potions (sheet tab Hechizos)

| Field | Today | Rule |
|---|---|---|
| `conjuros[]`, `pociones[]` `.nombre` | Add/remove; names wrap. | **Required, text 100** |
| `.valor` | I–V, stored 1–5. | **Whole number 1–5** |
| `.specialized` | Checkbox. | Yes/no |
| lists | | **List ≤ 200** each |

## Clubs, equipment and journal (sheet tabs Institución, Magia y equipo and Bitácora)

| Field | Today | Rule |
|---|---|---|
| `clubesList[].nombre` | Add/remove. | **Required, text 100**; **list ≤ 50** |
| `equipoList[].nombre` | Add/remove. | **Required, text 100**; **list ≤ 500** |
| `equipoList[].cantidad` | At least 1, no maximum. | **Whole number 1–9,999** |
| `notasList[].titulo` | Since 9 November 2026 an entry without a title stores none, and the sheet shows «Entrada del …» from the entry's date (characters and familiars; entries saved earlier keep their stored title). | **Text 200**; an empty title is stored empty and the generated title is only shown (R3.4, done) |
| `notasList[].contenido` | Required, multi-line. | **Required, text 50,000** |
| `notasList[].fecha` | Set by the player's device at creation; for an entry moved from a private note, the date chosen in the move dialog (by default when the note was written). | **Whole number**, a real date |
| `notasList` | Newest first. | **List ≤ 5,000** (owner: higher limits with clear warnings) |

## Gallery (sheet tab Galería)

| Field | Today | Rule |
|---|---|---|
| `galleryImages` | Compressed to 1,600 px, JPEG 0.75; removed by position. | Uploaded images only; **list ≤ 50 (owner decision)** |

## Partidas (the Máster's «Partidas de la campaña»; R4 b)

Campaign records, not sheet fields; only the campaign's Máster sees and changes them (owner, 14 November 2026: players never see which partida a sheet belongs to).

| Field | Today | Rule |
|---|---|---|
| Partida name | Added, renamed and removed on «Partidas de la campaña». | **Required, text 60**, unique in the campaign ignoring case; **at most 12** per campaign |
| A character's partida | Set by the Máster on the sheet's top bar in edit mode (tag menu). Removing a partida leaves its characters without one. | One of the campaign's partidas, or none; **characters only** (a familiar follows the character it is bonded to) |

## Familiar sheet and editor

| Field | Today | Rule |
|---|---|---|
| `nombre` | Required in the editor. | **Required, text 80** |
| `especie` | Required in the editor, not on the server. | **Required, text 60** |
| `descripcion` | Multi-line. | **Text 5,000** |
| `imagen`, `imageFit` | Same cropper as the portrait. | As `avatarImage` / `avatarFit` |
| `notasList` | Needs a title or content. | As the character journal, but content may be empty if there is a title |
| `galleryImages` | Up to 2.5 MB stored **uncompressed**, or a **web link** stored as is. | Uploaded and compressed like the character gallery; web addresses as for portraits; **list ≤ 50** |
| bond | One familiar per student. | Unchanged: a separate bond operation |

## Private notes (not part of the sheet)

Private notes are their own records, never sheet fields: only their author reads or changes them (product-design.md, Notes). Rules enforced by the server (`backend/domain/notes.py`); a refused value names its field (`title`, `content`, `label`).

| Field | Rule |
|---|---|
| `title` | **Text 200, may be empty** (the app shows «Nota del 12 nov» from `createdAt`; since 12 November 2026) |
| `content` | **Text 64,000, may be empty** while it is written. Moving it to a journal needs it to fit the journal's rules (character: required, 50,000; familiar: a title or content), checked already in the move's preview |
| `label` | **Text 120, may be empty**; not shown by the app for now |
| `createdAt` | **Set by the server** when the note is created; never changed by edits; the list's order, newest first (owner, 12 November 2026) |
| `sheetId` | Optional: a sheet the author can open; the list can be filtered by it |

There is no GM-note record: the owner dropped GM notes on 12 November 2026, and R3.6 removed the server's record and endpoint.

## Whole sheet and storage

- **Total size: 5 MB of text** per character or familiar (images are separate files), with the 90% warning. A weekly 2,000-character journal entry adds about 100 KB a year. If a journal ever approaches the limit, journals can move into their own records later without changing the screens.
- **Removed fields:** `lema`, `escudoText`, and the four old-app fields `notas`, `clubes`, `equipo`, `estresMentalConsecuencia`. A removed field is also removed from stored records in the same release, or players could no longer save.
- **Set by the server, not the app:** IDs, creation and update times, owner, campaign, table.
- **Backups store each image once (owner decision).** Each night the database is backed up as now, but images are uploaded only when new, so the 30-day history no longer multiplies image storage. Done on 13 November 2026 (R6 step 5; [deploy/README.md](../deploy/README.md) section 7).
