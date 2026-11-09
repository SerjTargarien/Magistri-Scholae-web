# Roadmap to launch on Contabo

Adopted 7 November 2026, replacing the milestone 4–6 order. The goal is a working account-backed Magistri Scholae on Contabo at `magistrischolae.fyi` as soon as possible, without losing current features or code quality. [design.md](design.md) defines the target, [project-state.md](project-state.md) records what is actually implemented, and [audit-2026-11-07.md](audit-2026-11-07.md) explains why the order changed.

## Execution rules

- Work one release (or one release step) at a time. A request for a release authorizes routine edits and checks inside it, not the next release.
- Each release or step lands as its own pull request with CI green. Keep the app working after every step: local mode until R3.6 removes it, the mock and staging throughout. Do not bump or rename `MagistriScholaeDB` while it exists.
- Deployments, DNS, Vercel settings and VPS changes happen only in the release that names them, and only when the owner asks for that action.
- Never turn a partial projection into a whole-record remote save. A new stored field needs a registry entry, a fixture and a test, not only a new input.
- Prefer splitting large files to growing them. Add a dependency only when a release needs it.
- Reproduce a defect before fixing it. Record unrelated issues instead of widening the release.
- After each release, update `project-state.md` with what changed, the exact checks run and what remains.

## Done so far

Milestones 1–3 are implemented and verified locally (re-verified 7 November 2026; commit `3b60075`):

1. Local storage boundary and isolated mock mode.
2. Django/PostgreSQL API with accounts, campaigns, field projection, path patches, bonds and notes.
3. Remote editing with a save queue, retries, private images and note promotion.

Remote mode still uses a stopgap generic form UI. See [project-state.md](project-state.md).

## Summary

| Release | Goal | Size | Depends on |
|---|---|---|---|
| R0 Safety net (**done**) | Work pushed, CI and UI smoke tests running, Vercel frozen as rollback | S | Owner decision 1 |
| R1 Same app, new home (**done 7 Nov 2026**) | Current app served from Contabo at `magistrischolae.fyi`; DNS at Porkbun | S–M | R0, SSH access |
| S Server security (**done 7 Nov 2026**) | Key-only SSH (owner's devices and the agent), with the VNC console as fallback | S | R1 |
| R2 Backend on staging (**done 7 Nov 2026**) | Django + PostgreSQL behind HTTPS on staging, backed up to Backblaze B2 and restorable | M | R1 |
| R3 Real UI on accounts | Existing screens on the server's data model, against staging and a mock server, keeping their look; old local mode retired | L | R0 |
| R4 Admin essentials and roles | Owner runs the group without API calls or the shell; sheet activation, active/inactive, GM deletion and assignment, GM-created campaigns | M–L | R6 (approved order) |
| R4.5 Sheet types (**added 9 Nov 2026**) | «Menor» / «Adulto» with «Mago» and «Alumno» switches, «Criatura mágica», non-magical characters, a redesigned «Identificación» | M | R4 |
| R5 Biblioteca del Máster (**added 9 Nov 2026**; the number of the dropped data carry-over is reused) | The GM's first screen per campaign: characters, institutions (with branches and schools), skills | L, several steps | R4.5 |
| R6 Own backend for the testers (was «Accounts launch») | The public site's data moves from the staging backend to its own production backend | S–M | R3.6 (approved order: before R4) |
| R7 After launch | Offline viewing, then offline editing with sync; privacy editor, transfers, GM library, cleanup | M–L | R5 (approved order: offline after the model settles) |

**Critical path** (revised order, approved 9 November 2026): the rest of R3 → R6 → R4 → R4.5 → R5, then offline (R7.1–R7.2) once the data model has settled.

**Working order chosen by the owner (7–8 November 2026):** one release at a time, R3 → R4 → R6 → R7. Each step is explained before it is carried out. R0, R1, S and R2 are done.

**9 November 2026:** the owner's target design ([product-design.md](product-design.md)) adds R4.5 (sheet types) and R5 (Biblioteca del Máster) and extends R4. Order decided by the owner the same morning: the rest of R3 → R4 → R4.5 → R5 → R6 → R7. **Revised the same day** after the owner's new workflow (publish only at milestones): see [Order and reasons](#order-and-reasons-approved-by-the-owner-9-november-2026) below.

## Order and reasons (approved by the owner, 9 November 2026)

**Why revise:** since 8 November the testers use the public site on the **staging** backend, so the testers' only database is also the development database. Since 9 November nothing is published until a milestone (owner's workflow). R4, R4.5 and R5 all change the database schema; each change would reach the testers' data before their screens are published, and could break the live site between milestones. Some items also had no place in the order (the image viewer), duplicated another release (R3.5's texts and confirmations repeat the polish pass), or depended on a later release (R3.5's «partida» filter needs R4's table labels).

**Principles, in priority order:**

1. **Protect the testers' data.** No server change touches the testers' database while it is also the development database.
2. **Shared pieces before the screens that use them.** One style and the shared controls come before any new screen, so nothing is built twice.
3. **Operations the agent does by hand come before new game features.** Invitations and reset codes still need the agent and the server shell.
4. **Settle the data model before storing it on devices.** Offline copies and unsent changes must not have to survive later migrations.
5. **Small, app-only fixes for what testers meet now go first.** They need no server change and no backup.

Publishing happens only at the milestones marked ◆; between them, changes merge into `main` and reach staging.magistrischolae.fyi only when the owner asks.

| # | Step | Size | Touches | Why here |
|---|---|---|---|---|
| 1 | **R3.4 Lists and limits:** subjects taught as a list, a name box that can be emptied while retyping, counters near limits | S | App | Fixes inputs testers meet today. The server already enforces these rules (subjects are stored as a list; limits refuse a save); only the screens lag behind (principle 5). |
| 2 | **R3.4 Polish pass**, several pull requests in this order: (a) remove Classic; (b) the shared controls; (c) no cut words; (d) the remaining inconsistencies, including R3.5's «every text in the translations file» and «no `window.confirm`», which are the same work | M | App | (a) halves the styling every later screen needs; (b) every later screen (notes, administration, Biblioteca) is built from the controls, so they come first (principle 2); (c) and (d) touch the same screens, while they are open. |
| 3 | **R3.4 Image viewer** (designed first): tapping a portrait or gallery image opens it at full size | S | App | Flagged important by the owner but had no place. It reuses the dialog shell of the controls' picker, so it follows step 2. |
| 4 | **R3.5 App shell:** personal notes with promotion and GM notes return; the save-status panel speaks plainly | M | App | Personal and GM notes are the only feature testers lost at the switch (8 November); their server side already exists. The «partida» filter moves to R4, which creates the table labels it filters by. |
| 5 | **R3.6 Retire the old app:** local mode, Dexie, old backups and stopgap forms deleted; the service worker's cache renamed | S | App | Pure deletion. Done before the milestone, the testers' browsers drop the old cached files once, and every later step reads less code. |
| 6 ◆ | **R6 Own backend for the testers** (moved from after R5), published with steps 1–5 as **milestone 1** | S–M | Server | Must come before R4's first migration (principle 1). The testers' data moves to a production backend; staging becomes the development copy, so later migrations are rehearsed there first and reach testers only at a milestone, with their screens. Includes backups that store each image once and the launch checklist. One change event for testers: the finished R3 screens and their own backend together. |
| 7 ◆ | **R4 Administration and roles**, in this order: (a) administrator screens for invitations, reset codes and users; (b) table labels and the «partida» filter; (c) sheet statuses: drafts and active / inactive; (d) assignment, campaign creation and renaming, deleting archived sheets; (e) administrator access with the GM's permission (privacy design first). **Milestone 2.** | M–L | Server and app | (a) first because the agent still issues them by hand (the testers' invitations expire on 15 November) (principle 3). The whole release settles who may see and change each sheet, so the new data of R4.5 and R5 follows those rules from the start. |
| 8 ◆ | **R4.5 Sheet types.** **Milestone 3.** The stress rules (its step 6) wait for the GM's answers (Q9–Q11) and may ship later. | M | Server and app | Before R5 because the Biblioteca's character view, filters and institutions (teachers, students) are built on the sheet types; building them on today's `characterType` would mean doing them twice (principle 2). |
| 9 ◆ | **R5 Biblioteca del Máster,** steps 0–5; a milestone after each step the owner chooses. The main list's filter bar (Controls, D2) comes with step 3 (Personajes), which needs the same filtering. | L | Server and app | The largest release; it needs the final roles (R4) and sheet types (R4.5). |
| 10 | **Images from a web address** (moved from R3.4): the server downloads the image | S–M | Server | The boxes are hidden, so nobody misses it, and the server-side download needs its own security review. It fits once production releases are routine. |
| 11 | **Temporary sheet versions** (designed first) | M | Server and app | After R5, as decided; its exact place is confirmed when R5 ends. It changes the sheet model, so it comes before offline (principle 4). |
| 12 ◆ | **R7.1–R7.2 Offline viewing, then offline editing** | M–L | App | After the model settles (principle 4): sheets and unsent changes kept on devices would otherwise have to survive the sheet-type and Biblioteca migrations. This moves offline from "right after launch" (decision 2, when launch was R6) to after R5 (owner, 9 November 2026). |
| 13 | **Printable sheets** (added by the owner, 9 November 2026; designed first): a print-friendly version of each character and familiar sheet, from the sheet itself | S–M | App | The print layout follows the sheet's final shape: after the sheet types (R4.5), the Biblioteca's links (R5) and sheet versions, so it is designed once. It needs no server change. |
| 14 | **R7.3–R7.6:** visibility editor and sharing; character and familiar export / import; the multiverse collection (far backlog); clean-up | M–L | Both | Unchanged. |

**Approved by the owner (decision 15, 9 November 2026):** R6 before R4 (step 6); offline after R5 instead of right after R6 (step 12); images from a web address after R5 (step 10); printable sheets added as step 13. Everything else only places items that had no position, removes duplicates, or follows from these.

## Feature checklist

Every release that changes the UI must pass this list, in each mode it affects, on desktop and mobile widths. R0 automates as much of it as possible.

- Students and adult wizards: create, edit, delete, and the archetype tabs.
- Familiars: create, edit, delete, including standalone familiars.
- Bonds in both directions, including clean-up when either side is deleted.
- Session tracking: stress tracks and maximums, consequences, destiny points, XP.
- Skills, spells, potions, clubs, equipment, custom fields, aspects and complications.
- Journals.
- Portraits and gallery images, with cropping.
- House crests and ornaments.
- The Academia style (the only one since 9 November 2026); Spanish (English kept for later).
- The mobile profile banner.
- Local mode only, until R3.6 retires it: backup export and import (full, selected, familiar-only) and the typed-phrase reset. Account export/import returns in R7.4.

No aesthetic change is made without a reason.

## R0 — Safety net (S)

**Goal:** the work is on GitHub, checked automatically, and `main` can move without touching the live site.

**Work:**

1. Push `codex/milestone-3-remote` and open a draft pull request to `main` (once decision 1 is made).
2. Add a GitHub Actions workflow:
   - Frontend: `npm ci`, `lint`, `test`, all three builds, and `test:baseline` (needs `fetch-depth: 0`).
   - Backend: a `postgres:18` service, then `check`, `makemigrations --check`, `export_api_contract --check` and the test suite.
3. Add Playwright smoke tests of the current UI in mock mode, at desktop and mobile widths, covering the feature checklist. Run them in CI. They are the safety net for R3, which rewrites a 3,800-line screen.
4. Check local mode in a browser, then merge to `main`.

**Exit criteria:** CI is green on `main`, the smoke tests cover the checklist, and the live Vercel site is unchanged.

**Owner actions:**

- Make decision 1 (whether `docs/` is published).
- In Vercel, turn off automatic deployments from Git so today's site stays frozen as a rollback copy.
- Export your own backup from the live site.
- Require CI to pass before merging to `main`.

**Rollback:** nothing user-visible changes.

## R1 — Same app, new home (S–M)

**Status: done on 7 November 2026.** The site is served from Contabo with DNS at Porkbun, and Vercel no longer serves anything. DNS also moved off Vercel, so the optional DNS move once planned for after launch is already done. Only removing the domain from the Vercel project remains, after 48 hours. Details are in [project-state.md](project-state.md).

**Goal:** `magistrischolae.fyi` is served from Contabo, with the same app and features. Browser data is reachable only by code served from the same origin, and the origin stays `https://magistrischolae.fyi`. So every player's existing records stay readable. (Reading them into accounts later turned out to be unnecessary; see R5.)

**Work:**

1. **Inventory (read-only).** Use the commands in [design.md](design.md) section 15. Record the OS, Docker version, ports, disk and memory. Note any existing containers; an auto-updating container manager must never manage the database container (decision 4; details in `docs/infrastructure.local.md`).
2. **Hardening.** Create a non-root deploy user with key-only SSH. Allow only ports 22, 80 and 443 through the firewall, and enable automatic security updates. Only Caddy publishes ports; Docker otherwise bypasses the firewall.
3. **`deploy/` folder** (implemented; runbook in [deploy/README.md](../deploy/README.md)). A Compose file with Caddy serving the local-mode build, and a release script that builds a Git tag on the VPS. Caddy settings:
   - Single-page-app fallback to `index.html`.
   - `index.html` and `sw.js` served `no-cache`.
   - `/assets/*` cached as immutable.
4. **Staging first.** Add a `staging` A record in Vercel DNS (the nameservers are Vercel's). Verify the HTTPS certificate, the smoke tests and an offline reload.
5. **Apex cutover.** Lower the record TTL a day ahead. Point the apex record (and `www` if it is used) at Contabo; Vercel may require removing the domain from the project first. Wait for the certificate, then check your own browser still shows its records.

**Exit criteria:**

- The apex is served over HTTPS from Contabo.
- The smoke tests pass against it.
- Your existing records are visible after cutover.
- The frozen Vercel copy remains reachable at its `vercel.app` address.

**Owner actions:**

- Provide SSH access, or run the documented commands yourself (decision 7).
- Make the DNS edits.
- Decide what to do with the old containers.

**Rollback:** point the apex record back to Vercel. Browser data is untouched either way.

## R2 — Backend on staging (M; parallel with R3)

**Status: done on 7 November 2026.** All exit criteria are met; see [project-state.md](project-state.md). Backups use a GnuPG passphrase kept on the server (with an owner-held paper copy) instead of age with an off-server key, by the owner's choice. The Backblaze key is the web console's "Write Only" key, which can also delete files and change lifecycle rules; the owner accepted that trade-off.

**Goal:** Django and PostgreSQL run behind Caddy on the staging hostname with fictional accounts, backed up and restorable.

**Work:**

1. **Settings fixes from the audit.** These must land before any production secret or account exists:
   - Trust the HTTPS proxy header from Caddy only (H1).
   - Take the client IP for rate limits from the trusted proxy (H2).
   - Log `django.request` and app errors to stdout (H3).
   - Use a separate HMAC key for invitation, reset-code, revision and receipt hashes (M4).
2. **Packaging (H4).**
   - Pin gunicorn and add a backend Dockerfile.
   - Write a production Compose file with Caddy, Django, a pinned `postgres:18.x`, a media volume and a private network. Caddy routes `/api` to Django and serves everything else as static files.
   - Run migrations as a deliberate deploy step.
   - Keep secrets in a server-only env file.
3. **Maintenance (M5).** A scheduled command that runs `clearsessions`, purges expired invitations, reset codes, rate buckets and old receipts, and reports orphaned media.
4. **Read locks (M1).** Remove write locks from the image and GM-note GET routes.
5. **Backups to Backblaze B2** (decision 5):
   - Each night, archive a `pg_dump` and the media volume, and encrypt the archive with [age](https://github.com/FiloSottile/age) to a public key. The private key is never on the server; it lives in the owner's password manager. A compromised server therefore cannot read past backups.
   - Upload with rclone using a B2 application key restricted to the backup bucket **without the `deleteFiles` capability**, so the server can add backups but cannot destroy history.
   - Retention comes from a bucket lifecycle rule (for example, 30 daily archives kept), not from the server.
   - Keep the last few archives on the VPS as well, for quick restores.
   - Restore drill: download an archive, decrypt it on the owner's PC, and restore it into a throwaway database and media folder. Record the steps in `deploy/README.md`.
6. **Staging data.** Staging switches from the local-mode app to the remote build, with fictional accounts only; the stopgap UI is acceptable here. Model the data as one universe campaign with two tables (decision 9).

**Exit criteria:**

- HTTPS smoke checks pass: login, edit, image upload and view, note promotion, logout.
- Rate limits see real client IPs.
- A deliberately triggered error appears in the logs.
- The restore drill succeeds.
- `check --deploy` is clean apart from the documented HSTS-preload warning.

**Owner actions:**

- Create a Backblaze account (choose the **EU** data region at sign-up; it cannot be changed later), a private bucket, and the restricted application key. The agent guides each step.
- Store the backup decryption key and the B2 credentials in a password manager.

**Rollback:** staging only; tear it down.

## R3 — Real UI on accounts (L; critical path)

**Owner decisions, 7–8 November 2026:**

- **Do it right: no translation layer** between the screens and the server. The screens use the server's data model directly.
- **No old data to keep.** The only records in the old local format are the owner's test data. So there is no converter, no data carry-over (R5 is dropped), and the old local mode is retired at the end of R3. The live site stays frozen on its current release until launch (R6).
- **No aesthetic changes without a reason;** any step that has a reason for a visible change may make it (owner decision, 8 November 2026; until then every change needed the owner's approval of before-and-after screenshots, enforced by the R3.1 screenshot tests). New screens (sign-in, campaign selection) follow the existing academy and classic styles.
- **Offline comes right after launch** as a new offline mode built on the server's model (R7.1 and R7.2). R3 builds the sheet store so that offline plugs in without changing the screens.
- Rejected: a translation layer, rewriting the server to store position-based lists (which would lose per-item updates and per-item privacy), and keeping the old local mode alive alongside the new one.

**Goal:** the existing screens run on the server's data model, against staging and an in-browser mock server, with every existing screen looking as it does today.

**Entry:** the R0 smoke tests run in CI.

Each step below is its own pull request. It keeps the app working under the browser tests (extended as screens change) and is explained to the owner before it starts.

- **R3.1 Look baseline** (**done 8 November 2026**: 336 pictures; **retired the same day** by the owner after the R3.4 switch, as slow and better checked by looking; the pictures remain in Git history).
  - Screenshot tests of every existing screen: the character list and its cards, the type selection, the creation form, the character sheet (every tab, and the phone profile banner), the familiar sheet and editor, and settings. Each at desktop and phone widths, in the academy and classic styles, in English and Spanish.
  - Taken from today's app before any screen code changes. CI (Linux) holds the reference images; a difference fails the check.
  - A justified change follows the approval step above. Parts that R3.6 removes (local backups and the typed reset in settings) leave the baseline then, with the owner's approval.
- **R3.2 One data model and its field rules** (**done 8 November 2026** in three pull requests: server rules, skill catalogue, app model; see [project-state.md](project-state.md)). [field-rules.md](field-rules.md) holds the owner's decisions.
  - **Server:** every field gets the rule from field-rules.md: text lengths, whole-number ranges, choices, list sizes and a 5 MB limit per sheet. New fields: a severity for each consequence, an esoteric knowledge level per skill, age as a number. Removed fields: `lema`, `escudoText`, `notas`, `clubes`, `equipo`, `estresMentalConsecuencia`, also removed from stored staging records in the same change. `teachingSubjects` stays a list.
  - **Skill catalogue:** each campaign gets a catalogue of skill categories and default skills (name, position, esoteric or not), starting with the six categories and 48 skills in field-rules.md. A character's default skills link to it, so a GM change applies campaign-wide. The GM screens to edit it come with R4.
  - **App types:** named types for characters, familiars, list items and the catalogue, generated from the server's field list, including the limits (so input boxes can use them). They are added **alongside** the old hand-written types, which stay until each screen moves (R3.4) and are deleted in R3.6; replacing them earlier would break the screens.
  - **Defaults:** blank new sheets in the new model (destiny 3, stress maximum 3 for students and 5 for adults, the 48 default skills), each list item with a permanent ID. The custom skill preset reads the key the sheet's button writes (fixing the mismatch found on 8 November).
  - Static game data (houses, categories, default skills) moves out of `src/types.ts` into its own file.
  - A new stored field is declared once, in the backend registry, with its rule, a fixture and a test.
- **R3.3 Sheet store and mock server** (owner decisions, 8 November 2026: edits to different fields merge automatically; edits continue during short connection drops, kept in memory). **Done 8 November 2026** in two pull requests: the store (`src/store/`) and the in-browser mock server (`src/mock/`, `npm run dev:demo`).
  - One store per open sheet holds the server's copy (only what the viewer may see), the unsent changes by path, the revision they are based on, and the save state. Screens read and write only through it.
  - It grows out of today's `SaveQueue`. Unsent changes live in the page's memory; R7.2 moves them to device storage without changing the screens.
  - Two adapters: the existing remote client, and an in-browser mock server with the same projection, permission and error behaviour. The mock has a visible role switcher (GM, assigned player, shared reader) and the DEMO banner. It simulates hidden fields, conflicts, failed saves and connection drops.
  - Guards, each with a unit test:
    - Send registered paths only, never the sheet's own `id` or timestamps.
    - Never send a removal or a blank for a path that was absent from the server's copy.
    - Compare list items by ID.
    - Send new images to the asset upload endpoint, and bond changes to the bond endpoint.
    - Show server rejections as errors; never retry as a whole-record save.
    - Do not show the conflict screen when the refreshed copy is unchanged (M3).
- **R3.4 Screens on the store** (order approved by the owner, 8 November 2026):
  1. **Split, with no visible change:** the character sheet, the creation form and the familiar sheet into a state hook and one file per tab (done); the screenshots prove nothing moved.
  2. **The switch, one pull request** (**done 8 November 2026**; differences approved by the owner): the app runs on the account side (the stopgap sign-in and campaign selection until R3.5), the real screens replace the stopgap forms on the new model and the sheet store, images through one helper and the upload endpoint, bonds through the bond endpoint; the screenshot tests move onto the demo mock (same fictional data, same DEMO banner). Unavoidable visible changes (the six skill categories, age as a number) are approved with pictures. The old browser-only mode ends here (owner decision); R3.6 only deletes its code. Staging gets the real screens.
  3. **The decided visible changes,** one small pull request each (listed below).
  - Account mode has no delete: the GM archives and restores; players see no delete button (owner decision). Export, import and the typed reset are hidden until account export/import (R7.4); settings keeps language and style (owner decision).
  - `CharacterDetail` is split into per-tab files as each tab moves; the screenshot tests confirmed the look was unchanged. This also fixes the bundle-size warning.
  - Edits work by item ID, not by position. The list, the creation form and the familiar screens move too.
  - One image helper shows server assets and newly picked images.
  - Shared readers get a read-only sheet; fields outside the writable paths are disabled.
  - **Visible changes decided by the owner** (8 November 2026), made when their screen moves:
    - destiny points: three gems by default, + adds up to 10;
    - experience: up to 1,000,000, typeable in edit mode;
    - consequences: a description plus a severity (mild, moderate, severe);
    - subjects taught: a list like aspects;
    - the form's motto box goes (the motto is the house's);
    - age as a number; Magia intuitiva hidden above 14 and for adult wizards;
    - the new skill categories and the esoteric knowledge level (**done**: PR 3 of the remaining changes);
    - counters and clear warnings near every limit;
    - images from a web address are downloaded and uploaded, never stored as links (the boxes are hidden until the server downloads them: `IMAGE_FROM_URL` in `src/components/imageFromUrl.ts`); familiar gallery images are compressed;
    - a blank name is never saved; generated journal titles are shown, not stored.
  - **Decided after the owner's staging test** (8 November 2026):
    - Empatía moves to social skills; custom fields read like the other values (no boxes) (**done**);
    - one «Varita / Foco mágico» field for students and adult wizards (`magicalFocus` merges into `varitaSintonia`, keeping both values when they differ), without the star-line separator, so both profile cards stay balanced (**done**, schema version 4);
    - only the GM creates new skills and saves default skills; players add skills from the campaign's list with a + button. Design approved by the owner (8 November 2026), in two pull requests:
      - **C1** (**done**): the server refuses own skills from players (create, rename, move, remove: `gm_only_skill`) and stops offering those controls; players get «+ Añadir de la lista» (catalogue skills they lack, applicable by age) in the form and on the sheet, and may remove catalogue skills; the GM keeps the typed box; the per-device preset is removed; the campaign list tells the viewer their role;
      - **C2** (**done**): a GM-only catalogue write endpoint (validated, raises the revision, archive never delete) with an «inicial» flag per skill (all 48 on to begin with); new characters start from the flagged skills; a GM-only «Habilidades de la campaña» screen in settings (add, rename, tick «inicial»), in the GM's interface language only (a name in either language passes; automatic translation may come later); a skill the GM types on a sheet or in the form joins the campaign list without «inicial» (others pick it with +). The list belongs to the campaign, which is the GM's universe (decision 9), so both tables share it. Moving between categories, reordering, archiving from the screen and new categories stay in R4.
  - **Later, its own design step:** clicking any portrait or gallery image that does nothing today opens a floating window with the image at full size (owner: important).
  - **Remaining, in order** (owner's target design, 9 November 2026; one pull request each):
    1. **Journal titles shown, not stored** (character «Entrada del …», familiar «Sin Nombre»): before the next publish (owner). **Done 9 November 2026.**
    2. **Session tab:** destiny gems up to 10; typeable experience; consequence severity. **Done 9 November 2026.**
    3. **Lists and limits:** subjects taught as a list; a name box that can be emptied while retyping; counters near limits. **Done 9 November 2026.**
    4. **Polish pass** (product-design.md, Known inconsistencies):
       - the familiar dialog in the creation form keeps its values and the familiar is created and linked only when the character is saved (**done 9 November 2026**);
       - «Cancelar» on the form asks before discarding any change (**done 9 November 2026**);
       - consistent removal confirmations (confirm in most cases);
       - zoom slider on the familiar sheet's crop dialog;
       - every player-facing text in the translations file; portrait fit buttons in Spanish everywhere (**done 9 November 2026**: «Recortar» / «Completa»);
       - wording: «Seleccionar un personaje para vincular a este familiar», «Registro de Familiares»;
       - familiar sheet: header keeps only «Volver a Personajes», «Editar» / «Finalizar Edición» and «Archivar»; the journal tab becomes «Notas del Familiar» with suggestions that fit a familiar;
       - **one visual style** (owner, 9 November 2026): remove the Classic style, its CSS and the «Estilo Visual» card in settings; Academia stays, and a saved Classic choice falls back to it (**done 9 November 2026**);
       - **the controls** ([product-design.md, Controls](product-design.md#controls), adopted 9 November 2026): the shared components replace the remaining native selectors, checkboxes and number boxes, one component at a time; no browser-drawn selectors (**done 9 November 2026**: switch, check, stepper, segmented control, slider, house tag menu and picker; only the hidden language selector remains, to become a segmented control when the language choice returns);
       - **no cut words** (owner, 9 November 2026): about 50 places cut text with «…» (`truncate`, `line-clamp`) across the list, form, sheet, familiar and settings screens; each wraps instead, or stays cut only where one line is essential, with the reason noted (the skill rows and tags were done on 9 November). **Done 9 November 2026:** shorter wording first (71 texts), then the rules in product-design.md, «Text that does not fit»; only the cards' two-line summaries cut.
    5. **Image viewer** (designed first): tapping a portrait or gallery image opens it at full size (owner: important; placed by the revised order).
    - **Images from a web address,** downloaded by the server (its own security review): **moved after R5** by the revised order.
- **R3.5 App shell.**
  - Login, invitation registration, reset-code redemption, campaign selection (done early: R3.4 follow-ups), personal notes with promotion, and GM notes, in the Academia style.
  - The save-status panel speaks plainly, without field names.
  - ~~Lists show and filter by each character's **partida**~~: moved to R4, which creates the table labels (revised order).
  - ~~Text goes through `localization.ts`. No `window.confirm`.~~ Folded into the R3.4 polish pass, which does the same work (revised order).
- **R3.6 Retire the old app.**
  - Remove the code of local mode (it stops working at the R3.4 switch), the Dexie code, the old backup import/export, the typed-phrase reset and the stopgap generic forms.
  - Keep the service worker, which since milestone 3 caches only the app's own files and never `/api` or `/media`. Give its cache a new name so browsers that had the old app drop its cached files after launch.
  - The smoke suite runs against the mock and against a real backend in CI.

**Exit criteria:**

- The feature checklist passes in mock mode for all three roles and in remote mode on staging.
- No aesthetic change was made without a reason.
- The smoke suite runs in CI against the mock and a real backend.
- All existing tests pass.

**Owner actions:** review each step and check the result on staging. AI Studio is paused until launch (decision 6).

**Rollback:** revert the step's pull request. The live site is unaffected until R6.

## R4 — Admin essentials and roles (M–L)

**Goal:** the owner runs the group without API calls or the Django shell, and the GM manages his campaign through clear, visual screens. Extended on 9 November 2026 with the roles of the owner's target design (product-design.md, Roles).

**Who does what (decision 10):** the owner is the site administrator and a player at one table, not a GM. One GM runs both tables, with 7–12 players in total. The GM prefers simple, visual screens, and the owner handles setup when a screen is unclear. Administrator tasks therefore must never require the GM role, which would expose every sheet to the owner as a player.

**Work:**

- **Backend:**
  - An administrator-only, paginated `GET api/v1/admin/users`.
  - Administrator access to a campaign's member list (usernames and roles only, no sheet content). Today only GMs can list members.
  - A per-campaign list of table names, and a GM-managed table label on each sheet (decision 9), validated server-side.
- **Administrator screens:**
  - Create the campaign.
  - Issue the GM invitation and player invitations (the token is shown once, with a copy button).
  - List users.
  - Issue reset codes, shown as a link to send by text message (`https://magistrischolae.fyi/#recuperacion=CODE`, already understood by the sign-in screen) as well as the bare code; invitations likewise (`#invitacion=CODE`). Owner (8 November 2026): the GM will forget his password, so recovery by link must be easy. Decide the validity: reset codes last 15 minutes today, which may be too short for a text message.
  - Enable and disable accounts.
  - Manage members and roles.
- **GM screens:** members, table names, a sheet's table, assignment, archive and restore, and GM notes, in the app's Academia style with large, clearly labelled controls. Lists must stay readable with 7–12 players.
- **Permanent delete (GM, owner decision 8 November 2026):** only for an archived character or familiar, after a confirmation, to free space. A small server endpoint plus its button; backups keep the deleted data for their 30 days. **9 November:** still only archived sheets (owner), after several confirmation steps.
- **Skill catalogue editor:** moved to R5 (the Biblioteca del Máster).
- **Roles of the target design (owner, 9 November 2026):**
  - **Player drafts (borradores):** a new player sheet starts as a draft in the player's private vault, which **the GM does not see at all** (a scratchpad, or ideas to propose as NPCs). The player proposes it once and the GM confirms it; it then becomes a campaign sheet: the GM chooses when confirming whether it is the player's character or his own NPC. A server status on each sheet, enforced in lists, projections and every endpoint (the GM's campaign-wide access excludes drafts), with its migration: existing sheets count as confirmed.
  - **Active / inactive** (dead, travelling…), a separate status the GM sets on campaign sheets; inactive sheets leave the grimorio without being archived.
  - **The GM creates sheets and assigns them to players** (the assignment the plan already lists, from the sheet and the creation form).
  - **The GM creates campaigns** and sees the campaign chooser; players join by invitation. Today only the administrator creates campaigns.
  - **The GM renames the campaign** he sees.
  - **Administrator access to campaign data with the GM's explicit permission:** a privacy change (design.md, permissions), designed first. The GM grants access to the whole campaign for an issue; it ends after 24 hours, when the GM withdraws it, or when the administrator marks the issue as solved; read and change; every access audited; personal notes excluded (owner, 9 November).

The visibility editor and read-only sharing wait until R7. That is safe because the default audience is `assigned`: each player sees only their own sheets, the GM sees all of them, and nothing is hidden from an assigned player. The UI therefore promises no field privacy it cannot show ([design.md](design.md) section 16).

**Exit criteria:** on staging, after `createsuperuser`, the owner does everything else in the UI without becoming a GM: a campaign, GM and player invitations, registration, members, a reset code and disabling an account. A fictional GM account sets up two tables and moves a character between them. The owner, as a player, never sees another player's sheet.

**Rollback:** revert.

## R4.5 — Sheet types (M; added 9 November 2026)

**Goal:** the sheet types of the owner's target design (product-design.md, sections 4–6 and Non-magical characters), without losing any stored data.

**Work** (designed in detail in product-design.md first, then one pull request per step):

1. **Data:** the character gets an age group («Menor» / «Adulto») and two switches, «Mago» and «Alumno de Escuela de Magia», replacing `characterType` (`student` → Menor, Mago, Alumno; `adult_wizard` → Adulto, Mago). A migration with a backup first; field-rules.md and the registry get the new rules. Age up to 1,000,000 or «desconocida»; stress maxima 1–5 (no current sheet is above 5).
2. **Type selection and creation form:** «Menor», «Adulto», «Criatura mágica», «Familiar»; the switches; «Concepto» moves to «Aspectos y Posesiones»; «Identificación» redesigned for each type.
3. **Non-magical characters:** the «Mago» switch hides the magic fields (hidden, not deleted); the player sets it at creation and only the GM changes it afterwards; no magic starting skills (the GM may add some by hand); no familiars.
4. **Criatura mágica:** everything an adult wizard has (it can even be a teacher), plus «Especie», a general «Descripción» and a «Pactos» tab whose entries each link to another character. Built as a character type with those extra fields rather than a separate kind of record, unless the design step finds a reason not to. A player can own one from character creation; whether it can have a familiar is decided in this release's design.
5. **The GM changes a sheet's type** later (a minor grows up; a character becomes a «Criatura mágica»), keeping every value (hidden, not deleted).
6. **Stress tracks and consequences** around the game's rules (product-design.md, Stress and consequences): maxima from «Físico», «Voluntad» and «Empatía» (formula: Q9), pips, the three consequence levels with their durations, and a clear warning when a grave consequence and full pips would lose the character; repeated damage and whether the app applies damage are Q10 and Q11. Kept simple.

**Risks:** every screen that reads `characterType` (list filters, cards, forms, sheet, Magia intuitiva rule, banner themes) changes at once; the demo data and tests move with it.

**Exit criteria:** existing sheets show exactly as before under their new type; each type and switch combination can be created, edited and reloaded on desktop and phone.

## R5 — Biblioteca del Máster (L; added 9 November 2026)

The number of the dropped data carry-over (old R5, not needed: the old-format records were test data only) is reused. Separate character and familiar export/import for accounts remains planned (R7.4).

**Goal:** the GM's first screen after opening a campaign, with three sections: characters, institutions and skills (product-design.md, section 11). The owner flagged it as much more work than a simple step: it adds new kinds of campaign data (institutions, branches, schools and their year groups, subjects, clubs and classes) and turns several free-text sheet fields into links, so it is designed and built in steps.

**Steps** (one or more pull requests each; server steps back up the testers' data first):

0. **Design** in product-design.md: every screen of the Biblioteca; the data model of institutions, branches («Casas» in schools, «Secciones» elsewhere, renamable) and schools; how sheets link to them (house, «Curso Académico», «Institución», subjects taught, clubs) with free text kept as a fallback.
1. **The library shell:** the GM's first screen per campaign, opening the grimorio; the campaign skills move here from «Ajustes».
2. **Habilidades:** new categories and renaming, reordering categories and skills, «Sólo magos» per skill (the skill catalogue editor that R4 used to list).
3. **Personajes:** the GM's view of every character and his own, the assigned player at a glance, filters and sorting by any stored value; «create from this sheet»: a new independent sheet based on an existing one.
4. **Instituciones and branches:** campaign data with crest, colours, description and members; free characters; today's five houses become «Casas» of Magistri Scholae, keeping their crests and data; the sheet's house becomes a link; branches are «Casas» in schools and «Secciones» in other organizations, and the GM can rename the word; the GM creates any number of branches.
5. **Schools:** «cursos» (promotion each year, repeating), «asignaturas» (troncal / optativa, teachers, linked skill), «clubes», «clases»; links from sheets (year, subjects taught, clubs).

**Risks:** data migrations of live testers' data (backups and restore drills before each); keeping houses' artwork and filters working; permissions for the new data (GM-owned, readable by players where it shows on their sheets).

**Exit criteria (per step):** the step works on staging with the testers' data intact; no sheet loses a value; the GM's existing workflow keeps working.

**After R5, designed first: temporary sheet versions** (product-design.md, Sheet versions): a version of a character that temporarily takes the place of a player's character (a parallel universe, an altered self), with the original restored exactly afterwards. Its place in the order is decided when R5 ends.

## R6 — Own backend for the testers (S–M; before R4 since 9 November 2026)

**Goal:** `magistrischolae.fyi` runs the account-backed app.

**Work:**

- Since 8 November 2026 the public site already serves the account app on the staging backend (owner decision): this release gives it its own production backend and moves the testers' data there from the latest staging backup, then points the public site's `/api` at it (deploy/README.md section 9). Staging then gets a development copy of that data.
- Run the production stack on the VPS, with its database and media separate from staging.
- Generate production secrets and bootstrap the administrator.
- Create the universe campaign and its two tables. The owner invites the GM, then the players (or the GM does it, if the screens suit him).
- Switch the apex frontend from the old local-mode app to the account app. Check in a browser that had the old app that its service worker hands over to the new one.
- Before launch, backups store each image once (owner decision, 8 November 2026): the database is dumped nightly as now, but images are uploaded to Backblaze only when new, so the 30-day history does not multiply image storage. The restore drill covers it.
- Run the first production backup and check it restores.
- Tag the release.

**Launch checklist:**

- H1–H5 resolved.
- CI green.
- Backups verified.
- The feature checklist passes on production.
- Logs are visible.
- `check --deploy` is clean.

**Known regression:** the old app worked offline, but nobody relies on it. The account app edits online only at launch; the new offline mode follows immediately (R7.1 and R7.2, decision 2).

**Owner actions:** invite the players and hand out their invitations.

**Rollback:** reactivate the previous local-mode release at the apex (`release.sh --activate`). Server data is kept for a retry.

## R7 — After launch (in order)

1. **Offline viewing (the new offline mode, part 1).**
   - The app opens without internet: the service worker caches an allowlist of the app's own files, never account data.
   - Sheets the viewer has opened are kept on the device in a new, account-scoped database (not `MagistriScholaeDB`), exactly as the server sent them, with their permitted images. GMs choose which extra campaign sheets to download.
   - Offline screens say so and show when each sheet was last updated. When back online, access is rechecked before cached sheets are shown, and revoked sheets are removed.
   - Logging out clears the account's device data in every tab ([design.md](design.md) section 12).
2. **Offline editing (part 2).**
   - The sheet store's unsent changes move to device storage, so they survive closing the browser or restarting the phone. Each change keeps its path, value, base revision and operation ID.
   - On reconnect, changes are sent in order. If the sheet changed meanwhile, the app compares the base copy, the latest copy and the unsent changes: changes to different fields are re-sent on top of the latest version; changes to the same field ask the viewer which value to keep. No server change is needed for this.
   - The server re-checks permissions. A rejected change is shown to the viewer, never silently dropped.
   - Logging out with unsent changes warns first. Changes never carry over to another account.
   - Scope is decided at the start of this step. Starting suggestion: sheet fields, journal entries and personal notes offline; administration, invitations, sharing, bonds, note promotion and new characters online only.
3. The visibility editor (GM defaults and overrides, player restrictions) and read-only sharing.
4. Separate character and familiar export/import for accounts (the owner's decision).
5. **Far backlog (owner, 9 November 2026):** a multiverse collection (an archaic Spanish or Latin name; a button near the GM notes) that copies characters between campaigns as independent copies or as linked representations updating on both sides. It replaces the private GM library with one-way sync ([design.md](design.md) section 11) and reverses its "no two-way sync" rule, so it needs its own design. Only one campaign is in use for now.
6. Clean-up:
   - Remove unused dependencies (L1).
   - ~~Fix the skill-preset key (L3)~~: done in R3.2.
   - Reduce list query counts (M2).
   - Reclaim orphaned media.
   - Trim the docs.
   - Retire the Vercel project once it is no longer needed (DNS already moved to the registrar in R1).
7. Watch item: Porkbun's DNS runs on Cloudflare's network, and some Spanish ISPs (including the owner's) block Cloudflare addresses during football matches. If the domain ever fails to resolve during a match while working on mobile data, move DNS to a non-Cloudflare provider.

## Owner decisions

| # | Decision | Needed by | Recommendation |
|---|---|---|---|
| 1 | Publish `docs/` in the public repository? | R0 | **Decided 7 November 2026:** publish; VPS, registrar and DNS specifics live only in the git-ignored `docs/infrastructure.local.md`. |
| 2 | Offline viewing before or after launch? | R6 | **Revised 8 November 2026:** a new offline mode built on the server's data model, right after launch: offline viewing (R7.1), then offline editing that syncs on reconnect (R7.2). This reverses the earlier "no offline edits" rule in [design.md](design.md) section 10. |
| 3 | Whose data needs carrying over? | R5 | **Superseded 8 November 2026:** none. The old-format records are the owner's test data only, so R5 is dropped. |
| 4 | Fate of the existing containers on the VPS (listed in `docs/infrastructure.local.md`) | R1 | **Decided 7 November 2026:** keep the two existing services running with automatic restart; the broken auto-updater was removed. |
| 5 | Off-VPS backup destination | R2 | **Decided 7 November 2026:** Backblaze B2 (free tier, EU region), age-encrypted, uploaded with a key that cannot delete. Cloudflare R2 was rejected because the owner's internet provider blocks Cloudflare during football matches. A phone copy via Syncthing-Fork remains an optional second copy. |
| 6 | AI Studio limited to presentation work until the mock server (R3.3)? | R3 | **Decided 7 November 2026:** AI Studio is paused until launch; all changes go through this workflow. |
| 7 | Agent SSH access to the VPS, or owner-run scripts? | R1 | **Decided 7 November 2026:** a dedicated `deploy` user with the agent's own key. Server hardening (SSH passwords, firewall, sudo scope) is deferred to a separate security step. |
| 8 | Hosting providers after R1? | R1 | **Decided 7 November 2026:** only Porkbun (registrar and DNS) and Contabo; no Vercel dependency. Backblaze B2 holds backups. |
| 9 | How to model the GM's two crossing-over campaigns? | R2 | **Decided 7 November 2026:** one universe campaign in the app, with two tables labelled per character (option A). Player characters cross over by sharing or reassignment within the same campaign. Players remain separated by default. Rejected: two campaigns with moving (B), or characters in two campaigns at once (C). |
| 10 | Roles and audience at launch? | R4 | **Recorded 7 November 2026:** the owner is site administrator and a player at one table, not a GM. One GM runs both tables, with 7–12 players. The GM is comfortable with clear, visual screens, and the owner does setup otherwise. |
| 11 | What happens to the old local mode? | R3 | **Decided 8 November 2026:** retired in R3.6, with no converter and no migration. The screens use the server's model directly (no translation layer). The live site stays on its current release until launch. |
| 12 | How much of the UI may change in R3? | R3 | **Decided 8 November 2026:** first, every screen kept its look unless the owner approved before-and-after screenshots (R3.1 screenshot tests). **Relaxed the same day,** with the transition nearly complete: no aesthetic changes without a reason; any step that has a reason for a visible change may make it. |
| 13 | Field rules and game data? | R3.2 | **Decided 8 November 2026:** the rules in [field-rules.md](field-rules.md). Destiny 0–10 (default 3), XP 0–1,000,000, consequences with a severity, subjects taught as a list, no stored motto (it belongs to the house), age as a number, 50 gallery images per sheet with backups storing images once, generous limits with clear warnings, and new skill categories in a campaign-wide catalogue the GM can edit. |
| 14 | The owner's target design (9 November 2026) | R3.4–R5 | **Recorded 9 November 2026** in product-design.md: a polish pass ends R3.4; R4 adds private player drafts (invisible to the GM until confirmed), active/inactive sheets, deletion of archived sheets, assignment, GM-created campaigns and time-limited administrator access granted by the GM; R4.5 adds sheet types, «Criatura mágica», non-magical characters and the stress rules; R5 is the Biblioteca del Máster («Casas» / «Secciones»); R6 after R5; the multiverse collection goes to the far backlog. Follow-up answers the same day: the GM chooses NPC or player character when confirming a draft; players can own a «Criatura mágica»; the GM changes sheet types; sheets based on another (R5) and temporary versions (after R5). Q9–Q11 (stress) still open. |
| 15 | Revised order (9 November 2026) | Now | **Approved 9 November 2026,** with printable sheets added as step 13: see [Order and reasons](#order-and-reasons-approved-by-the-owner-9-november-2026): R6 before R4, offline after R5, images from a web address after R5. |

## Former milestones

Older documents refer to milestones 4–6. They map to releases as follows:

| Former milestone | Now |
|---|---|
| 4 — GM library and selective sync | R7.5 |
| 5 — Legacy transfer and offline viewing | Legacy import dropped with R5 (8 November 2026); R7.1 (offline viewing), R7.2 (offline editing), R7.4 (separate transfers). Static-only service-worker caching already shipped in milestone 3. |
| 6 — Staging, deployment and cutover | R1 (hosting and DNS), R2 (backend staging and backups), R6 (launch) |
