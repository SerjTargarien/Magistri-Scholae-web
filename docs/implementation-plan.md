# Roadmap to launch on Contabo

Adopted 7 November 2026, replacing the milestone 4–6 order. The goal is a working account-backed Magistri Scholae on Contabo at `magistrischolae.fyi` as soon as possible, without losing current features or code quality. [design.md](design.md) defines the target, [project-state.md](project-state.md) records what is actually implemented, and [audit-2026-11-07.md](audit-2026-11-07.md) explains why the order changed.

## Execution rules

- Work one release (or one release step) at a time. A request for a release authorizes routine edits and checks inside it, not the next release.
- Each release or step lands as its own pull request with CI green. Keep local mode working throughout. Do not bump or rename `MagistriScholaeDB`.
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
| R2 Backend on staging | Django + PostgreSQL behind HTTPS on staging, backed up and restorable | M | R1 |
| R3 Real UI on accounts | Existing screens run in local, mock and remote mode | L | R0 |
| R4 Admin essentials | Owner runs the group without API calls or the shell | M | R3c |
| R5 Data carry-over | Existing records reach the server without loss | S–M | R3a, R4 |
| R6 Accounts launch | Account-backed app live at `magistrischolae.fyi` | S | R2–R5 |
| R7 After launch | Offline viewing, privacy editor, transfers, GM library, cleanup | M–L | R6 |

**Critical path:** R0 → R3 → R5 → R6. R1 and R2 form an infrastructure track that touches different files (`deploy/`, `backend/config/`). It can run in a parallel session while R3 is in progress. R4 overlaps the end of R3. **R1 is the quick win**: days after SSH access, with no feature change. **R3 is the long pole.**

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
- Local mode only: backup export and import (full, selected, familiar-only) and the typed-phrase reset.

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

**Status: done on 7 November 2026.** The site is served from Contabo with DNS at Porkbun, and Vercel no longer serves anything. DNS also moved off Vercel, so the optional R7.5 DNS move is already done. Only removing the domain from the Vercel project remains, after 48 hours. Details are in [project-state.md](project-state.md).

**Goal:** `magistrischolae.fyi` is served from Contabo, with the same app and features. Browser data is reachable only by code served from the same origin, and the origin stays `https://magistrischolae.fyi`. So every player's existing records stay readable, and the account release can later read them in place (see R5).

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
5. **Backups.** Nightly encrypted `pg_dump` plus a media copy off the VPS, keeping 7 daily and 4 weekly copies. Do one restore drill on a clean environment.
6. **Staging data.** Staging runs the remote build with fictional accounts only. The stopgap UI is acceptable here.

**Exit criteria:**

- HTTPS smoke checks pass: login, edit, image upload and view, note promotion, logout.
- Rate limits see real client IPs.
- A deliberately triggered error appears in the logs.
- The restore drill succeeds.
- `check --deploy` is clean apart from the documented HSTS-preload warning.

**Owner actions:** choose the off-VPS backup destination (decision 5) and keep a copy of the backup encryption key off the VPS.

**Rollback:** staging only; tear it down.

## R3 — Real UI on accounts (L; critical path)

**Entry:** the R0 smoke tests run in CI.

**Goal:** the existing screens run in local, mock and remote mode through one sheet interface. Each step below is a separate pull request, and local mode behaves the same after each.

- **R3a Stable list IDs.**
  - UI state uses items with IDs for string lists, custom fields, skills and the gallery.
  - The local adapter converts Dexie records to and from the registry v1 shape without loss. Unknown fields are kept, and round-trip tests run over the fixtures.
  - Replace the nine index-based list edits in `CharacterDetail` with ID-based ones.
  - The Dexie schema and stored data are unchanged. This step can ship to the R1 site on its own.
- **R3b Sheet session.** The ~60 existing `saveStateToDB(clone)` call sites hand their edited draft to a session. The session diffs the draft against the last projection and sends only path patches. Guards, each with a unit test:
  - Diff registered paths only; ignore `id`, `tempId`, `createdAt`, `updatedAt` and `familiarId`.
  - Never send a removal or a blank for a path that was absent from the projection.
  - Compare list items by ID.
  - Send new image data URLs to the asset upload endpoint, and bond changes to the bond endpoint.
  - Show server rejections as errors; never retry as a whole-record save.

  The remote adapter is the existing `SaveQueue`. The local adapter keeps saving whole records, which is safe because local data has no hidden fields. Shared readers get a read-only sheet. Fields missing from the writable paths are disabled. Do not show the conflict screen when the refreshed projection is unchanged (M3).
- **R3c App shell.** Login, invitation registration, reset-code redemption, campaign selection, personal notes with promotion, and GM notes, in the academy and classic styles. Text goes through `localization.ts`. No `window.confirm`.
- **R3d Projected mock.** Fixtures in the server shape, with a visible role switcher (GM, assigned player, shared reader). It simulates hidden fields, conflicts, offline state and failed saves, and keeps the DEMO banner. AI Studio develops against this from then on.
- **R3e Clean-up.** Remove the stopgap generic forms (or keep them behind a developer flag). Split `CharacterDetail` into per-tab files, which also fixes the bundle-size warning.

**Exit criteria:**

- The feature checklist passes in local mode, in mock mode for all three roles, and in remote mode on staging.
- The smoke suite also runs in remote mode against a CI backend.
- All existing tests pass.

**Owner actions:** until R3d lands, limit AI Studio to presentation-only changes (decision 6).

**Rollback:** revert the step's pull request; the smoke tests guard local mode.

## R4 — Admin essentials (M)

**Goal:** the owner runs the group without API calls or the Django shell.

**Work:**

- Backend: an administrator-only, paginated `GET api/v1/admin/users`.
- Screens to:
  - Create campaigns.
  - Issue GM and player invitations (the token is shown once, with a copy button).
  - List users.
  - Issue reset codes.
  - Enable and disable accounts.
  - Manage members and roles.
  - Assign sheets.
  - Archive and restore sheets.

The visibility editor and read-only sharing wait until R7. That is safe because the default audience is `assigned`: each player sees only their own sheets, the GM sees all of them, and nothing is hidden from an assigned player. The UI therefore promises no field privacy it cannot show ([design.md](design.md) section 16).

**Exit criteria:** on staging, after `createsuperuser`, the owner does everything else in the UI: a campaign, GM and player invitations, registration, assignment, a reset code and disabling an account.

**Rollback:** revert.

## R5 — Data carry-over (S–M)

**Decision first:** whose data exists? [design.md](design.md) records that nobody else uses the hosted site (decision 3).

- **Option A, only your data:** import a backup file in the account UI; the GM imports and assigns the sheets.
- **Option B, players have data:** a migration screen in the remote build at the production origin.
  - It reads the old `MagistriScholaeDB` read-only and shows a dry run: counts, images, bonds, journals, warnings and oversized images.
  - It then creates the records through the existing endpoints with operation IDs, uploads images and links bonds.
  - It keeps a local map from old to new IDs so a rerun creates no duplicates.
  - It never changes or deletes the old database, and it can also export a backup file.

Both options use the R3a converter. Old journal entries become ordinary journal entries the GM can see ([design.md](design.md) section 13).

**Exit criteria:** copies of real backups import on staging with images, bonds and journals intact; a rerun creates no duplicates; the result checks out in a second browser.

**Owner actions:** collect backup files from anyone with data, even with option B.

**Rollback:** delete the imported staging sheets; the source data is untouched.

## R6 — Accounts launch (S)

**Goal:** `magistrischolae.fyi` runs the account-backed app.

**Work:**

- Run the production stack on the VPS, with its database and media separate from staging.
- Generate production secrets and bootstrap the administrator.
- Switch the apex frontend from the local build to the remote build (including the migrator under option B).
- Run the first production backup and check it restores.
- Tag the release.

**Launch checklist:**

- H1–H5 resolved.
- CI green.
- Backups verified.
- The feature checklist passes on production.
- Logs are visible.
- `check --deploy` is clean.

**Known regression:** the current app works offline. The account app allows online editing only, by product decision. Offline viewing is a confirmed requirement that arrives in R7.1 unless decision 2 pulls it before launch.

**Owner actions:** invite the players and hand out their invitations.

**Rollback:** redeploy the local build at the apex. Players' browser data is untouched because R5 only reads it; server data is kept for a retry.

## R7 — After launch (in order)

1. Read-only offline snapshots per account, cleared on logout ([design.md](design.md) section 12).
2. The visibility editor (GM defaults and overrides, player restrictions) and read-only sharing.
3. Separate character and familiar export/import for accounts (the owner's decision).
4. The GM library, independent copies and selective one-way sync ([design.md](design.md) section 11).
5. Clean-up:
   - Remove unused dependencies (L1).
   - Fix the skill-preset key (L3).
   - Reduce list query counts (M2).
   - Reclaim orphaned media.
   - Trim the docs.
   - Retire the Vercel project once it is no longer needed (DNS already moved to the registrar in R1).

## Owner decisions

| # | Decision | Needed by | Recommendation |
|---|---|---|---|
| 1 | Publish `docs/` in the public repository? | R0 | **Decided 7 November 2026:** publish; VPS, registrar and DNS specifics live only in the git-ignored `docs/infrastructure.local.md`. |
| 2 | Offline viewing before or after launch? | R6 | Right after launch (R7.1), given no current users. |
| 3 | Whose data needs carrying over? | R5 | Confirm. If only yours, use option A. |
| 4 | Fate of the existing containers on the VPS (listed in `docs/infrastructure.local.md`) | R1 | **Decided 7 November 2026:** keep the two existing services running with automatic restart; the broken auto-updater was removed. |
| 5 | Off-VPS backup destination | R2 | Any provider with encryption at rest, plus restic. |
| 6 | AI Studio limited to presentation work until R3d? | R3 | Yes. |
| 7 | Agent SSH access to the VPS, or owner-run scripts? | R1 | **Decided 7 November 2026:** a dedicated `deploy` user with the agent's own key. Server hardening (SSH passwords, firewall, sudo scope) is deferred to a separate security step. |
| 8 | Hosting providers after R1? | R1 | **Decided 7 November 2026:** only Porkbun (registrar and DNS) and Contabo; no Vercel dependency. |

## Former milestones

Older documents refer to milestones 4–6. They map to releases as follows:

| Former milestone | Now |
|---|---|
| 4 — GM library and selective sync | R7.4 |
| 5 — Legacy transfer and offline viewing | R5 (legacy import), R7.1 (offline snapshots), R7.3 (separate transfers). Static-only service-worker caching already shipped in milestone 3. |
| 6 — Staging, deployment and cutover | R1 (hosting and DNS), R2 (backend staging and backups), R6 (launch) |
