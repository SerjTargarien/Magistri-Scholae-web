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
| R4 Admin essentials | Owner runs the group without API calls or the shell | M | R3.5 |
| R5 Data carry-over (**dropped 8 Nov 2026**) | Not needed: the old-format records are test data only | — | — |
| R6 Accounts launch | Account-backed app live at `magistrischolae.fyi` | S | R2–R4 |
| R7 After launch | Offline viewing, then offline editing with sync; privacy editor, transfers, GM library, cleanup | M–L | R6 |

**Critical path:** R0 → R3 → R4 → R6, then R7.1–R7.2 (offline) immediately after launch. R4 can overlap the end of R3. **R3 is the long pole.**

**Working order chosen by the owner (7–8 November 2026):** one release at a time, R3 → R4 → R6 → R7. Each step is explained before it is carried out. R0, R1, S and R2 are done.

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
- Academy and classic styles; English and Spanish.
- The mobile profile banner.
- Local mode only, until R3.6 retires it: backup export and import (full, selected, familiar-only) and the typed-phrase reset. Account export/import returns in R7.4.

The existing screens must also keep their look, apart from changes the owner approved.

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
- **Every existing screen keeps its current look** whenever reasonable. A change needs a reason and the owner's approval: the owner checks it by looking, in the demo (`npm run dev:demo`) or on staging; the agent describes the change and adds pictures when they help. (Screenshot tests enforced this from R3.1 until the owner retired them on 8 November 2026.) New screens (sign-in, campaign selection) follow the existing academy and classic styles.
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
  - **Visible changes decided by the owner** (8 November 2026), each approved by the owner by looking (demo or staging) when its screen moves:
    - destiny points: three gems by default, + adds up to 10;
    - experience: up to 1,000,000, typeable in edit mode;
    - consequences: a description plus a severity (mild, moderate, severe);
    - subjects taught: a list like aspects;
    - the form's motto box goes (the motto is the house's);
    - age as a number; Magia intuitiva hidden above 14 and for adult wizards;
    - the new skill categories and the esoteric knowledge level;
    - counters and clear warnings near every limit;
    - images from a web address are downloaded and uploaded, never stored as links; familiar gallery images are compressed;
    - a blank name is never saved; generated journal titles are shown, not stored.
- **R3.5 App shell.**
  - Login, invitation registration, reset-code redemption, campaign selection, personal notes with promotion, and GM notes, in the academy and classic styles.
  - Lists show and filter by each character's **table** (decision 9), so the two stories stay easy to tell apart.
  - Text goes through `localization.ts`. No `window.confirm`.
- **R3.6 Retire the old app.**
  - Remove the code of local mode (it stops working at the R3.4 switch), the Dexie code, the old backup import/export, the typed-phrase reset and the stopgap generic forms.
  - Keep the service worker, which since milestone 3 caches only the app's own files and never `/api` or `/media`. Give its cache a new name so browsers that had the old app drop its cached files after launch.
  - The smoke suite runs against the mock and against a real backend in CI.

**Exit criteria:**

- The feature checklist passes in mock mode for all three roles and in remote mode on staging.
- The existing screens keep their look, apart from changes the owner approved.
- The smoke suite runs in CI against the mock and a real backend.
- All existing tests pass.

**Owner actions:** review each step, and approve or reject each proposed visible change. AI Studio is paused until launch (decision 6).

**Rollback:** revert the step's pull request. The live site is unaffected until R6.

## R4 — Admin essentials (M)

**Goal:** the owner runs the group without API calls or the Django shell, and the GM manages his campaign through clear, visual screens.

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
  - Issue reset codes.
  - Enable and disable accounts.
  - Manage members and roles.
- **GM screens:** members, table names, a sheet's table, assignment, archive and restore, and GM notes, in the app's academy and classic styles with large, clearly labelled controls. Lists must stay readable with 7–12 players.
- **Permanent delete (GM, owner decision 8 November 2026):** only for an archived character or familiar, after a confirmation, to free space. A small server endpoint plus its button; backups keep the deleted data for their 30 days.
- **Skill catalogue editor (GM, owner decision 8 November 2026):** add and rename categories, mark a category as esoteric, add default skills, move skills between categories and reorder them. Changes apply to every character in the campaign ([field-rules.md](field-rules.md)).

The visibility editor and read-only sharing wait until R7. That is safe because the default audience is `assigned`: each player sees only their own sheets, the GM sees all of them, and nothing is hidden from an assigned player. The UI therefore promises no field privacy it cannot show ([design.md](design.md) section 16).

**Exit criteria:** on staging, after `createsuperuser`, the owner does everything else in the UI without becoming a GM: a campaign, GM and player invitations, registration, members, a reset code and disabling an account. A fictional GM account sets up two tables and moves a character between them. The owner, as a player, never sees another player's sheet.

**Rollback:** revert.

## R5 — Data carry-over (dropped)

**Dropped on 8 November 2026.** The owner confirmed that the only records in the old local format are their own test data, so nothing is carried over and no importer for the old backup format is built. A test character worth keeping is quicker to retype on staging. Separate character and familiar export/import for accounts remains planned (R7.4).

## R6 — Accounts launch (S)

**Goal:** `magistrischolae.fyi` runs the account-backed app.

**Work:**

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
5. The GM library, independent copies and selective one-way sync ([design.md](design.md) section 11).
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
| 12 | How much of the UI may change in R3? | R3 | **Decided 8 November 2026:** every existing screen keeps its current look whenever reasonable. A change needs a reason and the owner's approval, checked by looking (the R3.1 screenshot tests were retired the same day). New screens follow the existing styles. |
| 13 | Field rules and game data? | R3.2 | **Decided 8 November 2026:** the rules in [field-rules.md](field-rules.md). Destiny 0–10 (default 3), XP 0–1,000,000, consequences with a severity, subjects taught as a list, no stored motto (it belongs to the house), age as a number, 50 gallery images per sheet with backups storing images once, generous limits with clear warnings, and new skill categories in a campaign-wide catalogue the GM can edit. |

## Former milestones

Older documents refer to milestones 4–6. They map to releases as follows:

| Former milestone | Now |
|---|---|
| 4 — GM library and selective sync | R7.5 |
| 5 — Legacy transfer and offline viewing | Legacy import dropped with R5 (8 November 2026); R7.1 (offline viewing), R7.2 (offline editing), R7.4 (separate transfers). Static-only service-worker caching already shipped in milestone 3. |
| 6 — Staging, deployment and cutover | R1 (hosting and DNS), R2 (backend staging and backups), R6 (launch) |
