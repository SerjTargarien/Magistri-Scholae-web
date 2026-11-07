# Project state and implementation handoff

## Preparation baseline — 18 October 2026

- Local repository: `C:\Users\xergy\Documents\GitHub\Magistri-Scholae-web`.
- Git remote: `https://github.com/SerjTargarien/Magistri-Scholae-web.git`.
- Inspected HEAD: `2518abd50809c3f59fab3dbb4e412ac6cc50a911` (`feat: redesign mobile character profile banner`).
- Initial local branch/status: `main...origin/main`, with the owner's `docs/` directory untracked. No tracked application-file changes were shown before preparing these documents. This is local tracking information, not a fresh remote fetch or proof of the deployed commit.
- Owner reports recent AI Studio changes were force-pushed into this repository. This repository is now the shared working source for agents and AI Studio. The old two-repository comparison is historical and no longer controls implementation.
- This preparation task changes documentation only. No application refactor, dependency installation, schema migration, history rewrite, commit, push, or deployment is included.

## Current source facts

| Area | Observed implementation |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind; frontend project remains at repository root. |
| Backend | `backend/`: Django 5.2.18 + PostgreSQL 18.6 development API with sessions, campaigns, projected entities, path mutations, visibility preview/apply, bonds and separate private/GM notes. No frontend remote adapter yet. |
| Database | `src/db.ts` declares `MagistriScholaeDB`, version 1 plus version 2. Current tables are `characters` and `familiars`. |
| IDs | Characters use auto-increment numeric IDs. Familiars use string IDs; `Familiar.studentId` is currently typed `number | string`. |
| Relationships | `Character.familiarId` and `Familiar.studentId`; transactional bond/unbond/reassignment and opposite-link deletion cleanup now live in services. |
| Persistence boundary | `src/storage/` owns repositories, bonds, backups and reset. App/UI no longer import Dexie or entity tables. See [storage-contract.md](storage-contract.md). |
| Archetypes | `src/models/characterRegistry.ts` describes students, adult wizards, and familiars. Familiars are a separate stored entity, not another `CharacterType` value. |
| Visual work to retain | Academy/classic modes, ornaments, house crests, character/familiar portraits, and the updated responsive mobile banner. |
| Preferences | `magistri_scholae_lang`, `magistri_scholae_style`, and `fate_wizardry_custom_default_skills` are local preferences, separate from the character database. |
| Backups | Format `1.0`, optional familiars and embedded images remain supported. Selected/single exports include linked familiars; full exports permit familiar-only data. Imports remap both relationships and destination collisions. |
| Service worker | Milestone 2 bypasses `/api` and `/media` entirely and respects `no-store`/`private`. Full static allowlisting/account snapshot lifecycle remains milestone 5. |
| Commands | Local `npm run dev`; mock `npm run dev:mock`; TypeScript `npm run lint`; regression suite `npm test`; `npm run build`, `npm run build:mock`, `npm run preview`, `npm run test:baseline`. |
| Dependencies | Milestone 1 installed dependencies, added `package-lock.json` and exact dev dependency `fake-indexeddb@6.2.6`. Verified Node 26.8.1/npm 11.19.0; runtime expectations are recorded in `.node-version`, engines and packageManager. |
| Gemini integration | The original template README mentioned a key, but the inspected source search found no active Gemini SDK/key references. The prepared README points to the development guide instead. Verify actual use before making secrets a prerequisite for a UI/mock task. |
| AI Studio artifacts | `.aistudio/artifacts/` contains a prior mobile-banner plan. Preserve it as history; it is not the account/storage migration plan. |

## Baseline integrity gaps and disposition

1. **Reproduced and repaired:** Original add import rekeys character 41 but leaves its familiar backlink at 41, with no character at that ID. Import now remaps through actual inserted IDs, preserves standalone records, copies colliding familiar IDs without overwriting destinations, and rolls back contradictory imports.
2. **Source-characterized and repaired:** Original selected/single exports omit familiars; settings blocks full export without characters. Services now include linked familiar media/journals and permit familiar-only/empty full backups. Fixture round trips verify the replacements; a browser familiar-only download also succeeded.
3. **Reproduced and repaired:** Original character-side reassignment leaves two character links to one familiar. Both directions now use one transaction. Regression tests cover reassignment, unbond, deletion cleanup, legacy numeric-string backlinks and injected rollback failures. Familiar editor deletion now also cleans opposite links.
4. The current public deployment commit, Vercel production branch, and exact deployed schema remain unverified. Source HEAD is not proof of the deployed version.
5. Milestone 2 now implements backend accounts, author-only notes, revision-checked path writes and server-enforced projections. The current React editor still consumes complete local/mock records; remote UI, media, library synchronization, transfer redesign and account offline behavior remain later work. Nothing is deployed.

`npm run test:baseline` executes original import/reassignment handler bodies from inspected commit `2518abd50809c3f59fab3dbb4e412ac6cc50a911` against fake IndexedDB and checks the old export source paths. Only those original behaviors are characterized by that command. The new regression suite verifies the replacements. No real player records are used.

## Confirmed product decisions

- Django + PostgreSQL, keeping React/Vite and agent-friendly mock frontend development.
- Invite-only username/password accounts, no required email, short-lived administrator reset codes.
- Campaign-scoped roles and explicit read-only sharing.
- Familiars have independent assignment, field policies and read-only shares. Bonds grant no access and transfer no ownership or notes (confirmed by the owner before milestone 2 implementation).
- Characters and familiars should have separate import/export operations. This change is deferred until after the backend foundation; legacy local combined backups remain compatible meanwhile.
- GM field restrictions, player restrictions for other players, per-character/default policies, and server-side projection.
- Personal notes hidden from the GM application account; VPS operator trusted; no client-side encryption.
- Private GM library with independent copies and optional manual one-way field-selected updates.
- Final system: offline viewing, online editing, account-aware snapshots cleared on logout.
- Target full-stack Contabo deployment, separate database/media volumes, and off-VPS backups; old Vercel site stays separate until a deliberate cutover.

See [design.md](design.md) for detail and proposed defaults that were not separately confirmed.

## Hosting facts and remaining discovery

- Registrar, DNS, Vercel project and Contabo VPS details are recorded in the git-ignored `docs/infrastructure.local.md` on the owner's machine, not in Git. In short: the public site is served through Vercel from this repository, and the VPS inventory is incomplete.
- Still needed before launch: repeatable SSH/deployment access, OS/Compose/resource inventory, production commit/branch, proxy/TLS/cutover plan, real backup examples, an off-VPS destination, and a successful restore exercise.

None of those infrastructure details blocks a local storage-interface refactor.

## Implementation status

| Milestone | Status |
|---|---|
| Documentation and local source inspection | Prepared; documentation validation recorded at delivery. |
| 1. Local/mock storage boundary for characters and familiars | Implemented and verified locally; see checkpoint below. |
| 2. Django/PostgreSQL API, accounts and privacy foundation | Implemented and verified locally; see checkpoint below. |
| 3. Remote editing, private media and note promotion | Implemented and verified locally; see checkpoint below. |
| Releases R0–R7 (roadmap adopted 7 November 2026; replaces milestones 4–6) | R0 complete (merged as PR #1). R1 repository work done and tested locally; server steps await SSH access. See [implementation-plan.md](implementation-plan.md) and the checkpoints below. |

Documentation preparation validation: all eight Markdown files passed relative-file link checks, balanced-code-fence checks, and scans for replacement/zero-width characters. Installed copies matched staged SHA-256 hashes. Git status showed only the README edit plus new `AGENTS.md` and `docs/`; `git diff --check` passed for the tracked README change. Git emitted an informational LF-to-CRLF notice. No Git configuration was changed.

Application checks were not run during preparation. Actual milestone 1 checks follow.

## Milestone 1 checkpoint — 18 October 2026

### Context and changes

- Development branch: `codex/milestone-1-storage`, based on inspected HEAD `2518abd50809c3f59fab3dbb4e412ac6cc50a911`. The owner's modified README and untracked AGENTS/docs were retained; relevant prepared docs were updated in place. No commit, push or deployment was performed.
- Added typed repositories/services, separate future projection/mutation envelopes, fictional fixtures, explicit `VITE_STORAGE_MODE`, example configuration and localized DEMO banner. Default local storage retains `MagistriScholaeDB`, unchanged declared versions 1 and 2 and existing IDs/content. Startup neither seeds nor rewrites local records.
- Moved every current entity-table operation out of App/UI. Preferences remain in localStorage. Multi-record bonds, deletes, import and reset are transactional; complete editor saves preserve current bonds instead of overwriting them from stale drafts.
- Mock data lives in `MagistriScholaeMockDB`, seeded only on first creation. Actual factory save/import/reset isolation is tested. Unsupported modes fail without fallback. Full role/privacy screens remain out of scope.
- Narrow integrity repairs address the demonstrated gaps above. Incomplete legacy backup references are detached with structured warnings and a localized warning count. Contradictory source bonds fail atomically. Existing inconsistent records are not repaired automatically.
- Actual contracts and commands are in [storage-contract.md](storage-contract.md) and [development.md](development.md).

### Verification

| Check | Actual result |
|---|---|
| Original-source baseline | A temporary isolated Git archive of inspected HEAD passed TypeScript and build with the installed dependency resolution. It already emitted the >500 kB chunk warning. Temporary files were removed. |
| `npm run test:baseline` | Passed: original import/reassignment handler executions reproduce both defects; source assertions characterize export omissions and the familiar-only gate. |
| `npm test` | 18 passed. Fake IndexedDB checks v2 reads/reopen, data/media/journals, both entity CRUD paths, create-with-bond, reassignment/unbond/delete cleanup, stale-bond protection, failure rollback, full/selected/legacy/familiar-only backup round trips, collisions, invalid imports, atomic reset, explicit modes and actual mock isolation. Boundary/type checks keep UI away from tables and projected envelopes separate from complete entities. |
| `npm run lint` | Passed (`tsc --noEmit`). |
| `npm run build` and `npm run build:mock` | Both passed, with the existing >500 kB chunk warning. Final `dist/` rebuilt in default local mode. |
| Browser: local | Fresh loopback origin: adult-wizard creation with role field, familiar creation, reload for both, bonding, navigation to the character backlink, character deletion clearing its familiar backlink, familiar-only backup download and familiar deletion passed. The downloaded fixture was loaded through the file chooser, the add/replace dialog appeared, add import restored it, and the existing typed-phrase reset cleared it. Reload confirmed the list returned to empty. Only fictional test records were affected. |
| Browser: mock | DEMO banner, student/familiar edits surviving reload, journal display/addition, English/Spanish and classic/academy switches passed. Desktop 1440 px and mobile 390 px inspected; mobile page width stayed within viewport. Temporary viewport override reset afterward. |
| Source/docs | UI entity-table scan, Markdown relative links/fences and whitespace checked. Frontend root, archetype registry and `vite.config.ts` retained. |

Sandbox networking initially blocked dependency installation and loopback access; both succeeded with local tool escalation. Intermediate checks caught old `db` imports during extraction and test-harness reopen/cleanup assumptions; those were corrected before the passing final runs.

### Limitations and remaining baseline issues

- No real player backup was supplied. Round trips use generated legacy-format fixtures with embedded images, journals, nontrivial IDs and both archetypes. Real browser records were not migrated or inspected; fake IndexedDB does not establish every vendor's quota/durability behavior.
- Browser image-upload/crop gestures, the replace-import action and exhaustive stress/skill/spell interactions were not exercised. Service tests verify replacement rollback and image byte preservation. Familiar-only download/add import and typed-phrase reset were exercised in the browser; no real user backup restoration is claimed. The browser file chooser completed slowly but successfully.
- Ordinary fields retain the existing full-record local autosave concurrency/error-feedback limitations. Remote queues, revisions, authentication, path authorization and offline account snapshots remain later work. Mock capabilities are a contract example, not security enforcement.
- At milestone 1 delivery the service worker broadly cached successful GET responses. Milestone 2 now excludes API/private media and respects response cache directives; full account-cache work remains later.
- The detail-screen skill-preset action writes `magistri_default_skills_preset`, while the factory/form use `fate_wizardry_custom_default_skills`. This source-observed preference inconsistency remains outside the refactor.
- Existing inconsistent bonds are preserved at startup. Incomplete backups cannot recover familiar content omitted by older exports; warnings report detached references. Conflicting source bonds need correction before import.
- Production/VPS state and real backup restoration remain unverified and out of scope. No infrastructure was accessed.

Milestone 1 ended with milestone 2 next. The owner subsequently authorized that backend work and confirmed independent familiar ownership/shares; its current checkpoint follows.

## Milestone 2 checkpoint — 18 October 2026

### Context, decisions and scope

- Working branch: `codex/milestone-2-backend`, created while preserving all uncommitted milestone 1 work and the owner's preparation changes. HEAD remains `2518abd50809c3f59fab3dbb4e412ac6cc50a911`; no commit, push, history rewrite or deployment was performed.
- The owner explicitly authorized milestone 2 and clarified separate character/familiar transfer operations. Transfer changes remain deferred to milestone 5; existing local combined backups were not changed. The owner confirmed that familiars have independent assigned players and shares and that bonds grant no access.
- Local Docker Desktop was started. `compose.dev.yaml` creates only the named `magistri-development` PostgreSQL service/volume, bound to `127.0.0.1:55432`. Initial migrations were applied to this new development database; no IndexedDB/user-record migration or VPS/infrastructure access occurred.
- Tested runtimes: Python 3.14.7, Django 5.2.18, psycopg 3.3.6, PostgreSQL 18.6, Docker Engine 29.8.2 and Compose 5.6.0. Python dependencies are pinned, and backend `.env`/virtual environment are ignored. Public example credentials are development-only; non-development startup rejects the example signing key.

### Implemented behavior

- Invitation-only normalized username/password accounts, optional email, seven-day single-use invitations, administrator-only GM invitations, administrator-issued hashed 15-minute reset codes, supersession and database-backed attempt limits. Sessions use HttpOnly cookies/CSRF; reset/change and disable/re-enable revoke old sessions. The operational account is not implicitly a campaign GM. An interactive `createsuperuser`/`changepassword` workflow is documented; no real account/password was created automatically.
- Campaign-scoped GM/player memberships, explicit read-only shares and GM assignment/archive/restore operations. Membership/role changes and sheet writes serialize on the campaign row; one-to-one bonds are validated transactionally within a campaign. Players must edit both linked/displaced entities; GMs manage cross-owner bonds. Bond IDs are absent unless the viewer independently has access to both endpoints.
- A discriminated common `Sheet` table stores separate character/familiar records and kind-specific data; sharing, assignment and policies belong to each record independently. UUID backend IDs are separate from untouched local numeric/string IDs.
- A registered version 1 server schema covers existing frontend fields/archetypes. Repeated values have stable IDs, including former string-only collections. Server projection omits hidden/unknown player fields, list leaves and hidden type values. List queries are bounded and reject hidden-value search/sorting. There are no raw generic serializers or Django admin data views.
- Mutations accept only allowlisted changed paths and viewer-bound revision tokens. Stale writes fail without returning hidden/latest raw content. Whole-record PUT is absent; parent replacements cannot erase hidden descendants. GM campaign/entity defaults and field exceptions, plus player-only shared-reader restrictions, require signed expiring preview/apply flows. Explicit parents dominate children; ordinary data stays visible to the GM.
- Personal notes are separate author-only records with independent revisions, surviving reassignment/removal without restoring sheet access. Their titles/content never enter GM/entity responses or ordinary audit metadata. Separate GM-note endpoints are forbidden to players. Note promotion remains milestone 3; no bypass endpoint exists.
- `src/contracts/fieldRegistry.generated.ts` is generated from the server registry; TypeScript projection/mutation contracts are in `src/contracts/api-v1.ts`. Tests check generated drift, local field coverage and archetype choices. The React remote adapter is still unimplemented and `remote` selection still fails explicitly.
- API responses use `no-store, private`; the service worker bypasses API/private-media routes and honors cache directives. Existing local/mock entity data, images, localization, styles, archetype registry, frontend root and `DISABLE_HMR` handling were retained.

### Actual verification

| Check | Result |
|---|---|
| Initial migrations | Applied successfully to the new local PostgreSQL development database. |
| Backend tests | **74 passed** on PostgreSQL. Covers invitation expiry/reuse/role forgery, password/reset/session behavior, CSRF/origin/cookie flags, database rate limits, campaign isolation, read-only shares, GM-hidden fields, player restrictions, hidden list preservation, stable IDs, policy precedence/previews/expiry/tampering, hidden policy metadata/token omission, invalid database text, private notes, independent familiars, bonds/rollback, unknown fields and forbidden raw routes. |
| Real database concurrency | Tests assert PostgreSQL and race invitation consumption, reset consumption, revision-checked mutations and rate counters. No SQLite substitute. |
| Live HTTP | Test runs a real loopback server/cookie jar against the isolated test database: CSRF acquisition, login, session read, familiar creation/patch, missing-CSRF denial, logout and denied reuse all pass. |
| Schema checks | Django `check` passed. `makemigrations --check --dry-run` reports no changes. Generated API contract check, Python compile and `pip check` passed. Projection query-count regression passes with 100 stable collection items. |
| Frontend | `npm test`: **21 passed** (18 retained persistence/boundary checks plus 3 service-worker checks). `npm run lint`, `npm run build:mock` and final `npm run build` passed. Existing >500 kB bundle warning remains. |
| Non-development security settings | `check --deploy` with a generated ephemeral key and DEBUG false reports only intentional HSTS preload warning `security.W021`; no domain preload/cutover is authorized. Local DEBUG settings intentionally warn about development HTTP/cookies. |
| Repository/configuration | Backend `.env` and `.venv` are ignored; no production secrets added. Compose configuration validates without printing secret-bearing configuration. Git whitespace and documentation link/fence checks recorded at delivery. |

Intermediate setup checks encountered sandbox temp/socket restrictions; authorized local escalations enabled dependency/database tests. The first live-server test needed test-only static/media URL settings; an HTTPS cookie test initially omitted the required same-origin header and was correctly rejected by CSRF. Both test-harness issues were corrected without weakening application protection before the final passing run.

Final review tightened player policy metadata: GET/preview responses and readable signed tokens omit retained restrictions on paths now hidden by a GM, while apply preserves those hidden restrictions internally. A regression test verifies both non-disclosure and preservation. Database-invalid NUL/unencodable text is rejected before private text can reach a database-error path. Development database verification reports PostgreSQL 18.6, default `pbkdf2_sha256`, and zero users, entities or personal notes after the tests.

### Limits and next milestone

- This is a local backend foundation, not a deployed full account-backed product. The current React UI has no login or remote editing and continues using local/mock data. Backend API behavior was tested through HTTP/clients, not a new browser login screen. Windows/Python 3.14.7 is the tested backend host; Linux/production/TLS deployment has not been exercised.
- Remote media slots reject nonempty values until protected media is implemented. Note promotion, operation IDs/retries, remote save queues and frontend reconciliation remain milestone 3. GM library/copy/sync remains milestone 4. Separate character/familiar imports/exports, real legacy migration and account-aware offline viewing remain milestone 5. No remote import/export or shared-database wipe endpoint exists.
- Policy/capability UI is not implemented. Capabilities enumerate existing projected leaves; the future remote forms must consult registry/permissions for absent fields and must never fill hidden fields with defaults and send whole-record saves.
- Full account cache lifecycle/static allowlisting, real-user backup restoration, off-VPS backups and production/VPS discovery remain release prerequisites. The existing local skill-preset key inconsistency remains unchanged. Real player data has not been moved into the new database.
- The local development PostgreSQL role has test database creation privileges; it is intentionally not production least privilege. The operator bootstrap remains an explicit interactive user action.

Milestone 2 ended with milestone 3 next. The owner subsequently authorized milestone 3; its current checkpoint follows the historical pause record below. Deployment remains separate.

## Session paused — 18 October 2026

- Development paused at the owner's request after the milestone 2 checkpoint. Milestone 3 has not started and requires separate authorization after review.
- Current branch is `codex/milestone-2-backend`. All implementation and prior owner changes remain saved and uncommitted; no reset, stash, commit, push or deployment was performed for the pause.
- Gracefully stopped `magistri-development-db-1` with Compose, then stopped Docker Desktop. The named PostgreSQL volume `magistri-development_magistri_dev_postgres` is preserved. Docker Desktop/backend processes were absent afterward; ports 3000, 3001, 8000 and 55432 had no listeners. No repository Vite/Django server process was found.
- The last application verification remains the milestone 2 results above: 74 PostgreSQL backend tests, 21 frontend tests, TypeScript and local/mock production builds passed. Only handoff/whitespace checks were needed for this pause; application checks were not rerun.
- Resume by reading this checkpoint, [api-v1.md](api-v1.md) and [the backend guide](../backend/README.md), then reviewing milestone 2 before further development. When database access is needed, start Docker Desktop and run `docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait` from the repository root. Existing development data stays in its retained volume.

## Milestone 3 checkpoint — 18 October 2026

### Implemented behavior

- Owner-authorized branch `codex/milestone-3-remote` preserves all prior uncommitted implementation/preparation changes. HEAD remains `2518abd50809c3f59fab3dbb4e412ac6cc50a911`. No reset, stash, commit, push, deployment or infrastructure access occurred.
- Added explicit `npm run dev:remote` / `build:remote`, `.env.remote`, same-origin development API proxy and projection-aware `src/remote/` adapter. Local remains default; the entry point imports only the selected application. Remote constructs no Dexie adapter and never falls back after failure. Local/mock schemas, IDs, records, backup/reset behavior and AI Studio/HMR handling remain preserved.
- Remote forms support login, invitation registration, reset-code redemption, campaign/entity selection, student/adult/familiar registry fields, stable-ID collections, journals, crop/upload/gallery, bonds/linked navigation, archive/restore, author-only notes and separate GM notes. English/Spanish and academy/classic preferences remain available. Partial forms are separate from legacy whole-record editors; full administration/disclosure screens remain ahead.
- In-memory per-sheet queues debounce and serialize changed paths with revisions. Newer edits survive earlier responses. Unknown outcomes retry exact operation IDs/bodies, including HTTP 500. Conflicts/reconnection require a fresh projection and explicit discard/reapply; newly forbidden draft paths are removed. Failed focus revalidation retains the unsent draft and disables editing. Offline edits are refused; there is no persisted offline mutation queue. Notes use explicit Save and independent revision/comparison controls.
- Additive migration `0002_mediaasset_processedoperation` was applied to development and isolated preview databases. Atomic receipts store actor-scoped IDs, keyed fingerprints and outcome references, never private response bodies. Duplicate requests re-project under current permissions; changed request reuse is rejected. Legacy v1 requests without IDs remain compatible without deduplication guarantees.
- Protected PNG/JPEG/WebP uploads enforce byte/decoded-image limits, strip metadata and produce PNG. UUID assets belong to one sheet/path; downloads check current access, field visibility and attachment. Foreign/stale/forbidden references are rejected. Local embedded images are unchanged and never uploaded automatically.
- Personal-note promotion previews destination/audiences with a five-minute signed token, then atomically creates a journal item and deletes the private source. Author, note/sheet/policy revisions and permissions are rechecked; failure preserves the source and retries cannot publish twice.
- Service-worker caching now permits only same-origin static shell/assets, removing the old broad namespace. API/media stay network-only. Logout/account changes clear in-memory views/drafts across tabs; failed/offline logout leaves only a revocation marker and must finish server logout before another authenticated workflow.
- Focused baseline repairs: promotion demonstrated the old numeric bound rejected modern millisecond journal dates; only journal dates now use JavaScript Date's range. Installing real React types exposed an invalid lightbox referrer policy and missing familiar alt-text translation key; those were corrected narrowly. The unrelated skill-preset key mismatch remains unchanged.

### Actual verification

| Check | Result |
|---|---|
| PostgreSQL backend | **89 tests passed**, including 5 database concurrency checks. Covers retry races/current re-projection/revocation, hidden sibling preservation, stable item paths, familiar bonds, promotion authorization/rollback/expiry/tampering/stale revisions, image access/limits/foreign references/detach/rollback and GM-note retries. |
| Live HTTP | Real loopback cookie/CSRF test additionally uploads/downloads/retries a private image and previews/applies promotion in the isolated test database. |
| Frontend | **34 tests passed**, retaining local/mock/backup checks plus queue ordering, exact retries, conflict/reconnection, failed-refresh draft retention, hidden-path removal, logout disposal, stable items, HTTP CSRF and static-cache boundaries. TypeScript passed with real React definitions. |
| Builds | Mock, remote and default production builds passed; final `dist/` is local mode. Existing local/mock >500 kB chunk warning remains. |
| Browser | Separate fictional `magistri_preview`: login/session reload, selection, character/familiar autosave/server persistence, hidden reputation omission, note creation/audience preview/promotion, file chooser/crop/upload/image rendering, bond creation/navigation both ways, English/Spanish and academy/classic switches, shared-reader controls, logout and second-tab clearing passed. |
| Tooling | Django check, migration drift with database access, generated contract drift and `pip check` passed. Pillow 13.0.0/React types pinned; npm install reported zero vulnerabilities. Documentation links/fences and Git whitespace checked at delivery. |

Intermediate checks caught browser fetch binding, sign-in busy-state handling, StrictMode restoration and failed-refresh draft retention; these were corrected before final checks. Browser work used only generated fictional content/image fixtures. No real player backups, credentials or IndexedDB records were read or migrated. Development database counts remained zero for users, sheets, personal notes, assets and receipts after verification. Eleven Markdown files passed link/fence/Unicode checks, preserving intentional Markdown hard breaks; new source/configuration files passed Unicode/whitespace checks. Sandbox dependency/socket restrictions were resolved using local tool escalation.

### Limits, running state and next milestone

- At milestone 3 delivery, PostgreSQL and the fictional preview ran on backend loopback 8000 and remote Vite 3002. They were subsequently stopped at the owner's request; see the pause checkpoint below. `magistri_preview` and ignored `backend/.tmp/preview-media/` retain fictional data for review. The explicit preview preparation command preserves existing data. See [backend setup](../backend/README.md) and [development.md](development.md) for normal/fictional startup.
- The browser tool offered no viewport override; milestone 3 mobile layouts were not independently exercised. Live browser conflict/disconnect injection, registration/reset dialogs and GM-note comparison were not exhaustively exercised; focused client/server tests verify the underlying boundaries. Linux/production/TLS and real-user backup/media restoration remain unverified.
- Drafts are memory-only and cannot survive a full tab close; dirty sheet navigation warns. Notes require explicit Save. Selectors currently load at most 100 campaigns/bond candidates; entity/personal-note lists paginate. Full administration/disclosure UI and comprehensive mock role/error simulation remain ahead.
- Detached files and operation receipts are retained. A file/database commit failure can leave an unreferenced file, which has no authorized download route. Reclamation, quotas, receipt retention, production media serving/backups and restore verification require operational hardening before release.
- Separate character/familiar transfers and account-aware offline snapshots remain milestone 5. No remote transfer/wipe or automatic local-record migration was introduced.

**Next unfinished milestone (as of 18 October; superseded on 7 November):** milestone 4, GM library, independent copies, sharing and manual selective updates. The roadmap adopted on 7 November moves milestone 4 to R7.4; see [implementation-plan.md](implementation-plan.md).

## Session paused after milestone 3 — 18 October 2026

- Stopped development at the owner's explicit request. Branch `codex/milestone-3-remote` and all prior/implementation changes remain saved and uncommitted. No reset, stash, commit, push or deployment was performed.
- Stopped the repository's Vite remote and Django fictional-preview processes using their existing terminal sessions, then gracefully stopped `magistri-development-db-1` and Docker Desktop. No repository Vite/Django processes or listeners on ports 3000, 3001, 3002, 8000 or 55432 remained. The remote preview browser tab was closed; the owner's original local tab was retained.
- Preserved named volume `magistri-development_magistri_dev_postgres`, both development/fictional databases, ignored preview media, verification artifacts and local configuration. No volumes, records or working files were removed.
- Last application verification remains 89 PostgreSQL backend tests, 34 frontend tests, TypeScript and local/mock/remote builds passing. Application checks were not rerun for this shutdown; handoff links/fences/whitespace were checked.
- Follow-up discussion identified a recommended integration task before further AI Studio frontend iteration: shared account-aware presentation components, projected mock scenarios exercising the remote contract, and CI-enforced compatibility checks. These are proposals, not completed or newly authorized work. The current mock preview still uses complete local-style records; remote forms are separate. The generated field registry does not generate the entire API contract, and no GitHub Actions workflow currently enforces checks.
- Resume by reading this checkpoint, [the API contract](api-v1.md), [development workflow](development.md) and [backend setup](../backend/README.md). Review/save a Git checkpoint before any separately authorized branch publication or AI Studio synchronization. Milestone 4 has not started. A future session should establish whether the proposed frontend integration task or milestone 4 is the next authorized scope.
- To resume the same fictional preview, start Docker Desktop, run `docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait`, then run `backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000 --settings=config.preview_settings` and `npm run dev:remote` in separate terminals. Existing preview data is retained; preparation/seeding need not be repeated.

## Re-verification and audit — 7 November 2026

- Read-only audit of the working tree; see [audit-2026-11-07.md](audit-2026-11-07.md) for findings and the recommended order of remaining work. No application code changed. Nothing committed, pushed or deployed.
- Working tree still uncommitted on `codex/milestone-3-remote`; all local milestone branches and `origin/main` point to `2518abd`. The GitHub repository is public.
- Re-run checks: `npm test` 34 passed; `npm run lint` passed; `build`, `build:mock` and `build:remote` passed (final `dist/` is local mode; 502.6 kB chunk warning); `test:baseline` reproduced the original defects; 89 PostgreSQL backend tests passed; Django `check`, `makemigrations --check --dry-run`, `export_api_contract --check` and `pip check` passed. Browser flows were not re-run.
- Docker Desktop was started for the backend tests; the development database container was stopped afterwards with its volume retained.
- The working tree was committed locally as `3b60075` on `codex/milestone-3-remote`, at the owner's request. Nothing was pushed.
- The owner asked for the audit's proposal to become the roadmap. [implementation-plan.md](implementation-plan.md) now orders the work as releases R0–R7, aiming at the earliest working version on Contabo at `magistrischolae.fyi`. **Next: R0** (push, CI, UI smoke tests, freezing Vercel deploys). No release has started, and R0 still needs owner decision 1 (publishing `docs/`).

## R0 checkpoint — 7 November 2026

- **Done locally:** Playwright `@playwright/test` 1.64.1 (exact pin; 1.65.0 was two days old) with Chromium. `e2e/mock.spec.ts` has 10 tests (mock mode, desktop 1440 px and Pixel 7 widths). `e2e/local.spec.ts` has 4 tests (local mode). Between them they cover the feature checklist: student/adult-wizard profile, house, aspects, complications, custom fields; session tracking; skills, spells, potions, clubs, equipment and journals; familiars; bonds and delete cleanup; portrait crop and gallery; style and language persistence; the mobile/desktop familiar banner with no horizontal scroll; full, selected and familiar-only backups, add/replace import and reset. Tests assert persistence after reload through the app's own JSON export, and fail on any uncaught page error. `.github/workflows/ci.yml` runs frontend checks, all builds, baseline, e2e and the PostgreSQL backend suite.
- **Checks run:** `npm run lint` passed; `npm test` 34 passed; `npm run test:e2e` 24 passed, then 72/72 with `--repeat-each=3`; `build:mock`, `build:remote` and `build` passed (final `dist/` local); backend `check`, `export_api_contract --check` and `makemigrations --check` passed with `config.test_settings` (database stopped; backend tests last ran earlier today, 89 passed). The branch was pushed as draft PR #1; its first GitHub Actions run passed (frontend and backend jobs), and Vercel built a preview deployment only.
- **Finding while writing tests:** a first bond test reloaded the page before an asynchronous IndexedDB delete committed. This was a test-harness race, not an app defect; the database was verified correct at every step. `e2e/helpers.ts` `flushWrites` now waits for pending writes before each reload.
- **Decision 1 made:** `docs/` is published without VPS specifics. Registrar, DNS, Vercel project and VPS details moved to the git-ignored `docs/infrastructure.local.md` on the owner's machine. The three unpushed commits were rewritten so no commit contains them; the pre-rewrite state is kept locally on branch `backup/pre-trim-2026-11-07`, which must never be pushed.
- **Still open for R0:** push and draft pull request, freezing Vercel auto-deploys, your own live-site backup, requiring CI on `main`, then merge.
- Commit rule added to `AGENTS.md` at the owner's request: commits in the owner's name with no attribution trailers.

## R0 completion and R1 checkpoint — 7 November 2026

- **R0 complete.** PR #1 passed CI (frontend and backend jobs) and was merged by fast-forwarding `main` to `e84892f`, keeping every commit as authored. The owner removed the GitHub connection from the Vercel project, so pushes to `main` no longer deploy; the live site stays as it was. The owner's own live-site backup is still recommended before R1's cutover.
- **R1 repository work (branch `r1/contabo-hosting`):** `deploy/compose.yaml` (Caddy 2.10.2, opts out of auto-updaters, optional `BIND_ADDRESS`), `deploy/caddy/Caddyfile` (HTTPS, compression, security headers, `no-cache` for the shell and service worker, one-year immutable cache for hashed assets, 404 for missing assets, single-page-app fallback), `deploy/release.sh` (builds a Git ref with `git archive` in `node:<.node-version>-alpine`, writes `version.txt`, switches a relative `current` symlink atomically, keeps five releases, `--list` and `--activate` for rollback) and the runbook [deploy/README.md](../deploy/README.md). `.gitattributes` keeps `*.sh` LF. `E2E_LOCAL_URL` points the local-mode browser tests at a deployed build; a new offline-reload test runs only then.
- **Checks run (WSL Ubuntu 24.04 with Docker 29.9.1, loopback-only ports):** release builds took about 18 s; header and routing checks passed after fixing two defects found by them (missing assets returned the app shell with an immutable cache header; deep links lacked `no-cache`); rollback switched the live release without a restart and refused an invalid release name; a Caddyfile replaced as `git pull` would replace it reloaded cleanly after moving to a directory mount (a single-file mount broke); `E2E_LOCAL_URL=http://127.0.0.1:8088` local-desktop project 5 passed, including offline reload; against the dev server 4 passed, 1 skipped; `tsc --noEmit` passed. Not yet exercised: real HTTPS certificates, the VPS itself, DNS changes.
- An early test published ports on all interfaces and Windows Firewall prompted for Docker; the owner blocked it. Local tests now bind to 127.0.0.1. No security settings were changed.
- **Server and staging (7 November 2026):** agent SSH access set up (decision 7: dedicated key and `deploy` user). Read-only inventory done. With the owner's approval: swap file added, pending updates installed, the server rebooted, the two existing services set to restart automatically, and the broken auto-updater removed (decision 4). The owner deferred SSH password and firewall hardening to a later security step. The owner added the `staging` DNS record in Vercel DNS; the domain's registrar delegates DNS to Vercel. The app was cloned to the server from `r1/contabo-hosting`; the first release was built there and Caddy started. **`https://staging.magistrischolae.fyi` is live**: Let's Encrypt certificate on the first attempt, HTTPS redirect, cache and 404 rules and `version.txt` verified from outside, and `E2E_LOCAL_URL=https://staging.magistrischolae.fyi` local-desktop browser tests 5/5 passed, including offline reload. The live site on Vercel is unchanged. Server specifics are only in `docs/infrastructure.local.md`.
- **Next for R1:** owner's backup of the live site, merge PR #2 and switch the server checkout to `main`, then the apex cutover ([deploy/README.md](../deploy/README.md) section 5) when the owner chooses.

## Updating this handoff

After a milestone, record the commit/working-tree context, changes, exact checks and outcomes, unresolved defects, and next milestone. Replace stale status rather than accumulating contradictory completion claims. Never record secrets or actual player-note content here.
