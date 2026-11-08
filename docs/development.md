# Development and AI Studio workflow

## Current application

The repository root is the React/Vite frontend. Milestone 1 provides local and isolated mock storage. Milestone 2 adds the Django/PostgreSQL API under `backend/`; milestone 3 connects explicit remote mode, login, projected editing, protected media and personal-note promotion. See [storage-contract.md](storage-contract.md), [backend setup](../backend/README.md), [API contract](api-v1.md), [project-state.md](project-state.md) and [implementation-plan.md](implementation-plan.md).

Use npm with the checked-in `package-lock.json`. This implementation was verified with Node **26.8.1** (pinned in `.node-version`) and npm **11.19.0** (`packageManager`). The package declares Node >=22.12.0 for dependency compatibility; other versions have not been exercised here.

```bash
npm ci
npm run dev
```

The dev scripts bind Vite to `0.0.0.0` on port `3000`; their exposure depends on the development environment. For loopback-only development, append `-- --host 127.0.0.1`. No backend or credentials are required for either mode.

Current verification commands:

```bash
npm run lint
npm test
npm run build
npm run build:mock
npm run test:baseline
```

`npm run test:e2e` runs the Playwright browser smoke tests in `e2e/` (feature checklist from [implementation-plan.md](implementation-plan.md)): mock mode at desktop and mobile widths, plus local-mode backups and reset. It starts its own Vite servers on loopback ports 4310 (mock) and 4311 (local); every test uses a fresh browser context, never a real profile. First-time setup: `npx playwright install chromium`. Set `E2E_LOCAL_URL` (for example `http://127.0.0.1:8088` or the staging URL) to run the local-mode tests against a deployed build instead of a dev server; this also enables the offline-reload test. Server deployment is described in [deploy/README.md](../deploy/README.md). GitHub Actions (`.github/workflows/ci.yml`) runs these, the checks below and the backend suite on every pull request.

`lint` means `tsc --noEmit`, not ESLint. `npm test` uses Node's test runner through `tsx` and `fake-indexeddb` for isolated databases and boundary checks. `test:baseline` reproduces the pre-refactor handler defects from the original Git commit; it requires that commit to remain available locally. A production build outputs `dist/`. `npm run preview` serves the most recent build. `build:mock` writes a demo build to the same `dist/`; run `npm run build` again to return it to local mode.

The existing `clean` script uses Unix `rm` and removes `dist` and `server.js`; it is not needed for the first refactor and is not a portable Windows setup prerequisite.

The original template README asked for `GEMINI_API_KEY`; the prepared README now points here for configuration. The inspected application source did not show an active Gemini integration. Verify actual use rather than requiring or copying a real key for a storage/mock task. Server credentials must never enter browser bundles, fixtures, or source control.

## Preserve the current UI

Use both English and Spanish. Exercise academy and classic styles, desktop and mobile layouts, student and adult-wizard forms, familiar detail/editor flows, image cropping, journals, and character/familiar links. Reuse `src/models/characterRegistry.ts` rather than introducing a competing archetype definition.

Keep the existing `DISABLE_HMR` handling in `vite.config.ts` unless a task specifically requires changing it. Do not restructure the frontend root merely to add a backend folder.

## Local and mock modes

`VITE_STORAGE_MODE=local|mock|remote` selects the application boundary. An unset/empty flag defaults to local. Unsupported values fail without falling back. `.env.mock` selects the isolated demo; `.env.remote` selects account storage. Explicit process environment variables take precedence over env files. The local/mock factory deliberately rejects remote: the entry point selects the separate projection-aware remote adapter instead.

```bash
# Existing browser data, default
npm run dev

# Fictional, persistent isolated preview for AI Studio
npm run dev:mock

# Both simultaneously, loopback only
npm run dev -- --host 127.0.0.1
npm run dev:mock -- --host 127.0.0.1 --port 3001
```

The two simultaneous commands run in separate terminals. If configuring AI Studio's start command, use `npm run dev:mock`, or explicitly set its public `VITE_STORAGE_MODE` to `mock`. Mock fixtures seed only on first creation of `MagistriScholaeMockDB`. Mock reset clears that preview; reload does not reseed it. Browser IndexedDB is origin-specific: changing host/port changes which records you see. Both modes share ordinary local preferences when run at the same origin.

| Mode | Purpose | Status |
|---|---|---|
| Local | Existing `MagistriScholaeDB` records and editing. | Implemented; default. |
| Mock | Fictional complete sheets in `MagistriScholaeMockDB`, demo indicator and a separate sample projection contract. | Implemented; explicit opt-in. Full role/privacy UI is future work. |
| Remote | Django API, projected online editing and private media; no local fallback or offline mutation queue. | Implemented in milestone 3. A new offline mode (viewing, then editing with sync) is planned for R7.1–R7.2. |

Mock writes must never touch `MagistriScholaeDB`. Show a demo banner in mock mode. Do not turn a network error into an implicit mode switch. Browser-exposed `VITE_` values are public configuration, not a place for backend passwords or administrator tokens.

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

## Remote mode — milestone 3

Start PostgreSQL and Django using [backend setup](../backend/README.md), then:

```bash
npm run dev:remote
# Builds the account UI; does not deploy it
npm run build:remote
```

The frontend runs at `http://127.0.0.1:3002/`; its development `/api` proxy forwards to `127.0.0.1:8000`. No backend secrets or API credentials belong in frontend variables. The backend guide includes an explicit fictional PostgreSQL preview, separate from development data. Production requires a same-origin API reverse proxy; Vite preview alone does not supply one.

Remote forms render only visible or explicitly writable registry paths. Complete local editors and partial remote forms use separate adapters. Empty controls for absent writable fields do not become writes until edited. Lists use stable item IDs. The online sheet queue debounces typing, serializes saves, retains exact uncertain operations for retry and shows saving/saved/error/offline/conflict states. A conflict fetches the current projection, removes newly forbidden draft paths and requires discard or explicit visible reapply. Unsent drafts exist only in memory and are lost on a full tab close; the app warns before leaving a dirty sheet. Reconnecting does not automatically transmit an offline draft. Personal/GM notes use explicit Save and independent revisions.

Focus/visibility return revalidates visible sheets/lists. Logout and account changes clear in-memory data across tabs. A failed/offline logout stores only a revocation marker, and the next authenticated workflow must finish server logout first. There are no account offline snapshots yet. Local/mock persistence and confirmed legacy backups/reset remain available only in their own modes. Separate transfers remain milestone 5.

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
