# Development and AI Studio workflow

## Current application

The repository root is the React/Vite frontend: since the R3.4 switch, the account app, whose real screens run on the Django/PostgreSQL API under `backend/` through the sheet store (or, in demo builds, on an in-browser mock server). The old browser-only mode ended at the switch; its storage code (`src/storage/`, `MagistriScholaeDB`) remains until R3.6 deletes it. See [storage-contract.md](storage-contract.md), [backend setup](../backend/README.md), [API contract](api-v1.md), [project-state.md](project-state.md) and [implementation-plan.md](implementation-plan.md).

Use npm with the checked-in `package-lock.json`. This implementation was verified with Node **26.8.1** (pinned in `.node-version`) and npm **11.19.0** (`packageManager`). The package declares Node >=22.12.0 for dependency compatibility; other versions have not been exercised here.

```bash
npm ci
npm run dev
```

The dev scripts bind Vite to `0.0.0.0` on port `3000`; their exposure depends on the development environment. For loopback-only development, append `-- --host 127.0.0.1`. `npm run dev` needs a backend at `/api`; `npm run dev:demo` needs none (see below).

Current verification commands:

```bash
npm run lint
npm test
npm run build
npm run build:demo
npm run test:baseline
```

`npm run test:e2e` runs the Playwright browser tests in `e2e/` against the demo build (the account app with the in-browser mock server, see below): the feature checklist from [implementation-plan.md](implementation-plan.md) at desktop and phone widths (`features.spec.ts`), and the sheet store's behaviour in the real screens (`demo.spec.ts`: roles and hidden fields, refused edits, merging, offline edits, conflicts, retries). It starts its own Vite server on loopback port 4312; every test uses a fresh browser context, never a real profile. First-time setup: `npx playwright install chromium`. Server deployment is described in [deploy/README.md](../deploy/README.md). GitHub Actions (`.github/workflows/ci.yml`) runs these, the checks below and the backend suite on every pull request.

`lint` means `tsc --noEmit`, not ESLint. `npm test` uses Node's test runner through `tsx` and `fake-indexeddb` for isolated databases and boundary checks. `test:baseline` reproduces the pre-refactor handler defects from the original Git commit; it requires that commit to remain available locally. A production build outputs `dist/` (the account app; `build:remote` is the same build, used by `deploy/release.sh --target staging`). `npm run preview` serves the most recent build. `build:demo` writes the demo build to the same `dist/`.

The existing `clean` script uses Unix `rm` and removes `dist` and `server.js`; it is not needed for the first refactor and is not a portable Windows setup prerequisite.

The original template README asked for `GEMINI_API_KEY`; the prepared README now points here for configuration. The inspected application source did not show an active Gemini integration. Verify actual use rather than requiring or copying a real key for a storage/mock task. Server credentials must never enter browser bundles, fixtures, or source control.

## Preserve the current UI

Use both English and Spanish. Exercise academy and classic styles, desktop and mobile layouts, student and adult-wizard forms, familiar detail/editor flows, image cropping, journals, and character/familiar links. Reuse `src/models/characterRegistry.ts` rather than introducing a competing archetype definition.

### The account data model

`src/model/` is the app's model of a character and a familiar as the server stores them (R3.2), derived from the server's field list (`src/contracts/fieldRegistry.generated.ts`, written by `backend/manage.py export_api_contract`):

- `sheet.ts`: the named types (`CharacterSheet`, `SkillEntry`, `ConsequenceEntry`…) and `newItemId()`.
- `rules.ts`: each field's rule (`ruleAt`), how full a text or list is (`usage`, `nearLimit` at 90%), and `checkSheet`, which reports what the server would refuse.
- `catalogue.ts`: the campaign skill catalogue: names, categories, order, and whether a skill applies to a character (Magia intuitiva up to 14).
- `defaults.ts`: blank new sheets and the per-device skill preset (`magistri_skill_preset`).

The old hand-written types in `src/types.ts` stay until each screen moves (R3.4); game data (houses, character types, the old default skills) is in `src/data/gameData.ts`.

### The sheet store

`src/store/sheetStore.ts` is the one path through which screens read and save a sheet (R3.3). It checks each edit against the viewer's permissions and the field rules before queueing it (a refused edit returns its problems), sends only changed paths with the revision and an operation ID, retries a save of unknown outcome with the same ID, merges automatically when someone else changed other fields, lists same-field collisions in `conflicts` for the viewer to settle (`resolve`), holds a change the server refused while the rest keep saving, and keeps edits during a connection drop. Unsent changes live in memory; a `PendingSlot` (device storage) comes with R7.2. The stopgap account screens use it; the old screens move to it in R3.4.

### The demo: account app with a mock server

`npm run dev:demo` (port 3003) and `npm run build:demo` run the account app against an in-browser mock server (`src/mock/`, R3.3) instead of Django. It answers the same API: each viewer's projection with hidden fields absent, capabilities, revisions, the field rules and the skill catalogue, operation receipts, images, bonds and GM notes (note promotion is not simulated). Demo data is the screenshot fixture's fictional characters in the server's model, kept in this browser's storage; "Restablecer datos" restores it.

- A DEMO banner is always shown. The test panel switches the viewer (GM, assigned player, shared reader) and simulates a connection drop, slow replies, a lost save, a server error, a lost reply, and someone else changing the name or concept of the open sheet.
- It is a development simulation, never authorization. The mock code exists only in demo builds: `main.tsx` and `RemoteApp.tsx` load it behind `VITE_MOCK_SERVER`, which Vite replaces at build time, so `build:remote` contains none of it.
- `e2e/demo.spec.ts` runs the account app against it in CI (project `demo-desktop`).

### Checking the look

No aesthetic changes without a reason; any step that has a reason for a visible change may make it (owner decision, 8 November 2026, replacing the stricter rule of the transition and the R3.1 screenshot tests). See [implementation-plan.md](implementation-plan.md), decision 12. The R3.1 screenshot tests (336 reference pictures compared in a CI job) were retired the same day: each visible change cost a long CI run and a manual approval of pictures. The pictures and the test remain in Git history.

Keep the existing `DISABLE_HMR` handling in `vite.config.ts` unless a task specifically requires changing it. Do not restructure the frontend root merely to add a backend folder.

## Running the app (since the R3.4 switch)

The app is the account app: it signs in, picks the campaign (automatically when there is only one), lists the campaign's sheets newest first, and opens each sheet through a sheet store (`src/App.tsx`). The old browser-only mode (`MagistriScholaeDB`) ended at the R3.4 switch (owner decision, 8 November 2026); its code is removed in R3.6.

```bash
# Against a local Django backend (see "Backend development"); /api is proxied to 127.0.0.1:8000
npm run dev:remote          # http://127.0.0.1:3002/

# Against the in-browser mock server: no backend, fictional data, DEMO banner and test panel
npm run dev:demo            # http://127.0.0.1:3003/
```

Browser-exposed `VITE_` values are public configuration, never a place for backend passwords or administrator tokens. A failed request never falls back to other data. In demo builds, `localStorage.magistri_demo_panel = "off"` hides the test panel (the browser tests do this).

## Backend development

Follow [backend/README.md](../backend/README.md) for initial virtual environment, local `.env`, PostgreSQL Compose service, migrations and operator-account setup. Python 3.14.7 and pinned dependencies are recorded under `backend/`; its secrets/configuration are entirely separate from public `VITE_` variables. No production credentials or infrastructure access are required.

After setup, from the repository root in PowerShell:

```powershell
docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait
backend/.venv/Scripts/python.exe backend/manage.py migrate
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

In another terminal, backend verification is:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test domain.tests --settings=config.test_settings --noinput
backend/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
backend/.venv/Scripts/python.exe backend/manage.py export_api_contract --check
```

Tests use an isolated PostgreSQL test database, not the development database or browser IndexedDB. The API requires sessions/CSRF and does not permit cross-origin frontend calls. Local/mock React previews remain independent of it. The generated field registry is checked against server and existing frontend fields/archetypes; it does not contain private records.

The owner clarified that character/familiar transfers should be separate. That transfer change is deferred until after the backend foundation; current local legacy combined backups remain supported. Familiars have independent account ownership/shares; bonds grant no access.

## Account behaviour in the app

- **Saving:** every change is a single-path edit through the sheet store (`src/store/sheetStore.ts`); see "The sheet store" above. Images go to the upload endpoint (`src/remote/assets.ts` shows them); a new gallery image first creates its entry, then uploads into it. Bonds use the bond endpoint.
- **Status:** `src/account/SaveStatus.tsx` appears only when there is something to know: offline with changes waiting, a same-field conflict (keep mine or theirs), a refused change, or drafts discarded after losing access.
- **Archive, no delete:** the GM archives (archived sheets leave the list); players see no delete. The GM's permanent delete of archived sheets and restoring arrive with R4.
- **Not in the app yet:** sign-in, campaign choice and status keep a simple look until R3.5, which also brings back personal notes, GM notes and note promotion (the owner accepted losing them on staging until then). Export, import and reset return with account export/import (R7.4).
- Focus and visibility return refresh the lists and open sheets. Logout disposes every sheet store; a failed or offline logout stores a revocation marker that the next start completes.

## Shared repository workflow

1. Start with the latest intended branch of `SerjTargarien/Magistri-Scholae-web`. Verify remotes and working-tree changes.
2. Keep one canonical repository. The user's consolidation is complete for workflow purposes; do not re-force-push or maintain a second mirror.
3. Use a development branch/worktree for implementation. Vercel is no longer connected; the site is deployed only through `deploy/release.sh` on the server ([deploy/README.md](../deploy/README.md)).
4. In AI Studio, import/sync this same repository and select mock mode explicitly. Preserve the previous app as reference if its conversation history matters.
5. Avoid simultaneous Codex and AI Studio edits to the same files/branch. Save/sync one set of work and refresh the other tool before continuing.
6. If AI Studio cannot target the intended development branch, export its changes and apply/review them in the development checkout. Do not assume every app has identical Git integration controls.
7. Review contract/privacy changes and run type/build checks plus relevant tests. Publish/deploy only through the separately requested release workflow.

AI Studio may not honor `AGENTS.md` automatically. Include the relevant guidance from this document and the active milestone in its prompt. UI mock role filtering is not a replacement for Django authorization tests.

## Before real accounts go live

Verify server-side redaction and patch authorization, private media, session/CSRF handling, note privacy, service-worker exclusions, account cache cleanup, import integrity, and restoration from an off-VPS backup. These are release requirements, not all tasks to implement during the initial local adapter refactor.

## Line endings

Use normal UTF-8 Markdown and preserve localized characters. LF files are valid on Windows. A Git UI notice about LF-to-CRLF conversion is informational. Keep documentation changes localized; do not change global Git configuration or renormalize all source files just to remove the notice. A repository-wide line-ending policy, if needed, is a separate deliberate change.
