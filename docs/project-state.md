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
- Target full-stack Contabo deployment, separate database/media volumes, and off-VPS backups. The static site moved from Vercel to Contabo on 7 November 2026 (R1); DNS is at Porkbun.

See [design.md](design.md) for detail and proposed defaults that were not separately confirmed.

## Hosting facts and remaining discovery

- Registrar, DNS, Vercel project and Contabo VPS details are recorded in the git-ignored `docs/infrastructure.local.md` on the owner's machine, not in Git. In short: since 7 November 2026 the public site is served from the Contabo VPS (release R1) and DNS is hosted at Porkbun, the registrar; Vercel no longer serves anything.
- Still needed before the account launch: real backup examples, an off-VPS backup destination and a successful restore exercise (R2), and the deferred server security step. SSH access, the server inventory and the proxy/TLS cutover were completed in R1.

None of those infrastructure details blocks a local storage-interface refactor.

## Implementation status

| Milestone | Status |
|---|---|
| Documentation and local source inspection | Prepared; documentation validation recorded at delivery. |
| 1. Local/mock storage boundary for characters and familiars | Implemented and verified locally; see checkpoint below. |
| 2. Django/PostgreSQL API, accounts and privacy foundation | Implemented and verified locally; see checkpoint below. |
| 3. Remote editing, private media and note promotion | Implemented and verified locally; see checkpoint below. |
| Releases R0–R7 (roadmap adopted 7 November 2026; replaces milestones 4–6) | R0 complete (PR #1). **R1 complete on 7 November 2026** (PRs #2 and #3): `magistrischolae.fyi` served from Contabo, DNS at Porkbun; only removing the domain from the Vercel project remains (after 48 hours). Server security step S done the same day. Next: R2, then R3–R6, one at a time. See [implementation-plan.md](implementation-plan.md) and the checkpoints below. |

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

**Next unfinished milestone (as of 18 October; superseded on 7 November):** milestone 4, GM library, independent copies, sharing and manual selective updates. The roadmap adopted on 7 November moves milestone 4 to R7.5 (renumbered on 8 November); see [implementation-plan.md](implementation-plan.md).

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
## R1 cutover — 7 November 2026

- **Before:** the owner exported a full backup from the live Vercel site. PR #2 was merged (fast-forward), and the server checkout was switched to `main`. The server clone's stale local `main` was checked out first, which removed `deploy/` and detached the running Caddy container's config mount; it was fast-forwarded and the container restarted with approval (about 2 s of staging downtime, certificate reused). The runbook now warns against this. A release built from `main` was activated without downtime, and the staging browser tests passed 5/5.
- **Owner decision:** no Vercel dependency at all; keep only Porkbun (registrar and DNS) and Contabo. PR #3 added a permanent `www` → main-domain redirect in Caddy and the two-phase runbook (tested in a throwaway loopback Caddy on the VPS).
- **Phase 1 (DNS still at Vercel):** the owner added a `www` record and changed the main-domain record to the VPS. For each, a watcher waited until both Vercel nameservers returned exactly the VPS, then added the name to Caddy's address list. Let's Encrypt certificates were issued about 8 s later in both cases, with no mixed answers from Vercel's managed records. Verified: HTTPS, the HTTP and `www` redirects, deep links, `version.txt` from `main`, and local-desktop browser tests 5/5 against `https://magistrischolae.fyi`, including offline reload. **The owner confirmed all their existing records appear in their usual browser.** Their home router cached old DNS answers well beyond the 60 s TTL for several minutes (harmless: both paths worked).
- **Phase 2 (DNS to Porkbun):** DNSSEC was off. The owner recreated the main-domain, `www` and `staging` records and a Let's Encrypt-only CAA record in Porkbun DNS, then switched the nameservers with Porkbun's "update my domain" button. The `.fyi` registry delegated to Porkbun about 9 minutes later; the site answered from the VPS through every resolver checked. Porkbun's form needs CAA as one line, `0 issue "letsencrypt.org"`; a first entry was saved but not published until re-entered in that format.
- **Remaining:** after 48 hours, remove the domain from the Vercel project (and optionally the project). Deferred to a later security step at the owner's request: SSH password logins, the firewall and the `deploy` user's passwordless sudo. Next releases: R2 (backend on staging) and R3 (real UI on accounts).

## Server security step S and plan decisions — 7 November 2026

- **Why:** the server's SSH log showed hundreds of automated password guesses per hour (most against `root`), and no foreign successful login.
- **Done:** the owner's Windows PC and Android phone (Termius) each have their own Ed25519 key in root's allowed keys, labelled per device. Each device and the VNC console fallback were tested first. Then SSH password and keyboard-interactive logins were disabled and root was limited to keys. The settings file must sort before the provider's cloud-init file, so the effective settings were verified with `sshd -T`. A login banner reminds the owner of key-only access. Verified: fresh key logins work, and a password login is refused (`Permission denied (publickey)`).
- **Unaffected:** the two existing apps (web ports, used by devices such as the owner's MiSTer FPGA over HTTP) and the website. Before the change, no SSH login by any other user or device appears in the server's history.
- **Deferred by owner choice:** firewall and narrowing the `deploy` user's sudo (low value now). Undo, add-device and remove-device procedures are in `docs/infrastructure.local.md`.
- **Plan decisions recorded in [implementation-plan.md](implementation-plan.md):**
  - Only the owner's data is carried over.
  - Backups go to Backblaze B2: age-encrypted, with an upload key that cannot delete.
  - Offline viewing comes shortly after launch.
  - AI Studio is paused until launch.
  - The GM's two crossing-over campaigns become one universe campaign with two tables.
  - The owner is administrator and a player at one table, not a GM; one GM; 7–12 players; GM screens must be visual and simple.
- **Next:** R2, backend on staging, step by step.

## R2 progress

- **R2.1 (code, branch `r2/backend-proxy-fixes`):**
  - H1/H2: `TrustedProxyMiddleware` trusts `X-Forwarded-Proto/For` only from `DJANGO_TRUSTED_PROXIES` and strips them otherwise; HTTPS detection, CSRF origin checks and rate limits then use the real scheme and visitor address.
  - H3: `LOGGING` sends server errors and security warnings to stdout with `DEBUG` off.
  - M4: a separate `DJANGO_HMAC_KEY` for keyed fingerprints, required and distinct from the secret key without `DEBUG`.
  - M1: image and GM-note reads take no row locks.
  - M5: a `maintenance` command removes expired bookkeeping and only reports media.
  - Locally: compile, `check` (test and development settings), contract check, startup refusal without a valid HMAC key, and `check --deploy` (only the intentional HSTS-preload warning plus one caused by the deliberately simple test key). The 103 backend tests (14 new) run in CI on PostgreSQL.
- **R2.1 merged** (PR #6). CI ran the full backend suite: 103 tests passed. One new test first failed because its simulated requests lacked a `Host` header, which browsers always send and Caddy forwards; the test was corrected, not the code.
- **R2.2 (branch `r2/packaging`):**
  - `backend/Dockerfile`: Python 3.14.7, non-root uid 10001, gunicorn 26.2.0, `DJANGO_MEDIA_ROOT`.
  - Compose: `db-staging` (PostgreSQL 18.6, internal-only network) and `api-staging` behind the opt-in `staging-backend` profile; Caddy's network has a fixed subnet that Django trusts.
  - Caddyfile: the public and staging sites share one snippet; staging serves the account build and forwards `/api`.
  - `release.sh --target staging|production`.
  - A CI job builds the image and validates the compose file and Caddyfile.
  - Runbook section 6 covers the R2.3 server steps.
  - **Tested on the VPS in throwaway containers on a private network:** image built (38 s, 305 MB, non-root); migrations applied to a fresh PostgreSQL 18.6; `check --deploy` showed only the intentional HSTS-preload warning; through a peer on the trusted network, HTTPS gave 200 with a Secure cookie, plain HTTP gave a 301 to HTTPS, and an unknown Host gave 400; the maintenance dry run worked; compose and Caddyfile were valid. Live containers were untouched, and no test containers, networks, images or folders remained. The `postgres:18.6` image stays on the server for R2.3.
- **R2.2 merged** (PR #7).
- **R2.3 done (server):**
  - Staging secrets were generated on the server and never displayed.
  - The staging account build (release from `c33a563`) is live.
  - Backend and database: PostgreSQL 18.6 on an internal-only network, with no published ports; migrations applied; `check --deploy` shows only the HSTS-preload warning.
  - Caddy was switched to two sites: about 2 s of downtime, certificates reused, the public site, `www` and the owner's other apps unchanged.
  - Gunicorn 26's unused control socket logged a permission error and was disabled (PR #8).
  - The owner created the staging administrator interactively and logged in from their browser.
  - A failed login was counted under the owner's real IP, not Caddy's.
  - Nightly `maintenance` is scheduled.
  - Gotcha for scripts: `docker compose run` without `-T </dev/null` swallows the rest of an SSH heredoc.
  - Details are in `docs/infrastructure.local.md`.
- **R2.4 (branch `r2/backups`):**
  - Decisions: backups use a GnuPG passphrase kept on the server, with a paper copy kept by the owner (option B; the owner uses no password manager).
  - Backblaze account in EU Central; private bucket with Backblaze encryption and a 30+30-day lifecycle (verified through the API).
  - The web console's "Write Only" key turned out to allow deleting files and changing lifecycle rules. The owner chose to keep it rather than create a stricter key through the API.
  - Scripts: `backup.sh`, `b2_upload.py` and `restore-check.sh`.
  - **Tested on the VPS from the branch:** the first real backup was encrypted, verified and uploaded with a matching SHA-1. The restore drill matched all 22 tables row for row with live staging. No leftovers.
  - Limitation: media was tested with zero files; repeat once staging has an image (R2.5).
- **R2.4 merged** (PR #9). The nightly backup is scheduled at 03:30 server time; a run identical to the scheduled one uploaded a verified backup.
- **R2.5 exit checks (all met):**
  - **HTTPS smoke session** through the public staging URL as a fictional player: 13/13 steps (login with a Secure session cookie, campaign, create and edit a character, portrait upload and download, personal note, promotion preview and apply, private source removed, logout, then 401).
  - **Rate limits** count the real visitor address (R2.3).
  - **Logging:** a deliberately triggered error (staging database stopped for 7 seconds) returned a clean JSON 500 and was logged with its traceback. The submitted password was not in the log, and staging recovered.
  - **Restore drill** with one image: 22/22 tables and 1/1 media file matched.
  - **`check --deploy`** shows only the intentional HSTS-preload warning.
  - Fictional accounts (`test_gm`, `test_player`) and one fictional character were kept on staging on purpose, for the owner to explore; their passwords are only on the server.
- **R2 is complete.** Next: R3, the real UI on accounts. Its steps were re-planned on 8 November (see below). Each step is explained before it is carried out.

## Session paused — 7 November 2026 (evening)

**Where everything stands:**

- **Repository:** `main` at `bb0b1c0`; no open pull requests; CI (frontend, backend, deploy-config) is green. Commits are in the owner's name with no attribution trailers (rule in `AGENTS.md` and the owner's global instructions).
- **Live site:** `https://magistrischolae.fyi` serves the local-storage app from the Contabo VPS (release `0c8b943`); `www` redirects to it. DNS is at Porkbun. The owner confirmed their existing records survived the move.
- **Staging:** `https://staging.magistrischolae.fyi` serves the account version (release `c33a563`) with its own Django backend and PostgreSQL database (`main` code `3576268`+). It holds the owner's administrator account and fictional `test_gm`/`test_player` accounts with one fictional character.
- **Automation on the server:** an encrypted backup to Backblaze B2 nightly at 03:30 server time, and housekeeping at 04:17.
- **Security:** SSH is key-only (owner's PC and phone, plus the agent's `deploy` key); the VNC console is the fallback.
- **Server specifics** (addresses, keys' locations, container names, procedures): the git-ignored `docs/infrastructure.local.md` on the owner's PC.

**Open items, in order:**

1. ~~**Confirm the R3 approach**~~ — done on 8 November, with changes; see the next section.
2. **From about 9 November:** check that public resolvers report Porkbun's nameservers, then guide the owner through removing `magistrischolae.fyi` (and `www`/`staging`) from the Vercel project (step 8 of the cutover). Optionally delete the project afterwards.
3. **Optional housekeeping, not urgent:**
   - Delete merged local and remote branches (`codex/milestone-*`, `r1/*`, `r2/*`, `docs/*`).
   - Delete the local-only branch `backup/pre-trim-2026-11-07`, which holds pre-trim history with VPS details and must never be pushed.
   - Delete the WSL test clone `~/magistri-r1-test`.
   - Delete the PC's `.claude/launch.json` (git-ignored).
4. **Later, as planned:** firewall and `deploy` sudo narrowing (deferred by the owner), offline viewing after launch, and the privacy editor.

**How to resume:** read this section, the top of R3 in the roadmap, and `docs/infrastructure.local.md`. Server access is described in that local file. Work one step at a time; explain each step before carrying it out, and pause before anything with visible effects or a connection reset.

## Planning session — 8 November 2026

**Checks at the start (all read-only):**

- The live site still serves release `0c8b943`; `www` redirects to the apex. Staging serves release `c33a563`, and its API answers a signed-out request with 401.
- On the server, all five containers are running; disk and memory have ample room.
- The 03:30 backup was encrypted, verified and uploaded to Backblaze B2 (including the one staging image). The 04:17 maintenance run removed nothing.
- Cloudflare's, Google's and Quad9's public resolvers already report only Porkbun's nameservers.

**Owner decisions (recorded in the roadmap, design.md and AGENTS.md):**

- **No old data to keep.** The only records in the old local format are the owner's test data. There is no converter and no migration: R5 is dropped, and R3.6 retires local mode. The live site stays on its current release until launch.
- **Every existing screen keeps its current look** whenever reasonable, enforced by screenshot tests (R3.1). A change needs a reason and the owner's approval of before-and-after screenshots. New screens follow the existing styles.
- **Offline right after launch:** a new offline mode built on the server's model. First offline viewing (R7.1), then offline editing that syncs on reconnect (R7.2): non-overlapping changes are re-sent automatically, and same-field changes ask the viewer. This reverses the earlier "no offline write queue" rule in design.md section 10. R3 builds one sheet store per sheet, so offline plugs in without changing the screens.
- **New R3 steps:** R3.1 look baseline, R3.2 one data model (generated types), R3.3 sheet store and mock server, R3.4 screens on the store (`CharacterDetail` split per tab), R3.5 app shell, R3.6 retire the old app. The working order is R3 → R4 → R6 → R7.

**Finding:** the service worker already caches only the app's own files and never `/api` or `/media` (since milestone 3). It needs only a new cache name at launch.

**Plan merged** (PR #11). **Other websites on the VPS** (PR #12, owner-approved): Caddy now mounts `/opt/sites` read-only and imports each site's own Caddyfile, so another agent can add a site without editing this repository (runbook section 8). Applied on the server with about 2 seconds of downtime; certificates kept; both Magistri sites checked afterwards. Details are in `docs/infrastructure.local.md`.

**Next:** R3.1, below.

## R3.1 look baseline — 8 November 2026

- **What:** `e2e/visual.spec.ts` photographs every existing screen: the list, type selection, both creation forms (every tab), both character sheets (every tab, view and edit), the familiar sheet (every tab and quick edit), both familiar editors and settings. Each in academy and classic, Spanish and English, at desktop width and phone width (normal pixel density). That makes 336 reference pictures, lossless WebP, about 57 MB.
- **Data:** fixed fictional records in `e2e/visual-fixture.ts` (two students, one adult wizard, a bonded and an unbonded familiar, generated portraits and gallery images), richer than the mock demo data so lists, stress, skills and journals all show content.
- **Runs** only in the CI job `visual`, in the pinned Playwright container. Measured: 80 tests in about 3.4 minutes; a second run in the same container matched all 336 pictures exactly. On Windows, the same tests showed a few pixels of text-rendering variation, which is why references are Linux-only.
- **App change:** three `id` attributes on the familiar sheet's tab buttons (no visual effect).
- **Owner decisions:** the full matrix, stored in the repository (the alternatives were a separate branch or a reduced set). The size grows with each approved change (about 3 MB for one tab, about 33 MB for a change on every sheet).
- **Approval process:** see [development.md](development.md), "Screenshot tests".

## Field rules — 8 November 2026

Before R3.2, every stored field was reviewed screen by screen (the creation form, the sheet, the familiar screens and the list). Findings:

- The screens already limit most numbers (destiny 0–5, stress maximums 1–10, skills 0–5, spells 1–5), but the server enforces none of it, and no input has a text limit.
- Problems found in the current app: subjects taught cannot be typed normally; a typed motto is saved but never shown; the sheet saves a blank name while typing; XP silently stops at 99; familiar gallery images are stored uncompressed or as raw web links; generated journal titles are stored in the interface language; `escudoText` and the sheet's skill-preset slot are written but never used.

The owner decided every field ([field-rules.md](field-rules.md), roadmap decision 13): destiny 0–10 (three gems by default), XP up to 1,000,000, consequences with a severity, subjects taught as a list, no stored motto, age as a number with Magia intuitiva hidden above 14, 50 gallery images with backups storing images once, generous limits with clear warnings, and new skill categories (magical knowledge, elemental magic, esoteric magic with a knowledge level) in a campaign-wide catalogue the GM edits (R4). R3.2 builds the data model; the visible changes come with R3.4, each approved with pictures.

**Screenshot jitter (found on this pull request's checks):** the Linux container is not perfectly repeatable; text anti-aliasing differs slightly on about 2 of 80 tests per run (up to a few hundred pixels on the glowing name headings, invisible to the eye). Chromium flags for deterministic text did not help (three repeated runs). The comparison stays exact and failed screenshot tests are retried twice, so a real change still fails.

## R3.2 server field rules — 8 November 2026 (first pull request)

- `backend/domain/fields.py` is now registry version 2: every field carries its rule from [field-rules.md](field-rules.md) (text length, required, whole-number range, choice, list size), plus current stress not above its maximum and a 5 MB limit per sheet. Removed: `lema`, `escudoText`, `notas`, `clubes`, `equipo`, `estresMentalConsecuencia`. Age is a whole number; each consequence has a description and a severity (`leve`, `moderada`, `grave`). Skills keep an interim free category until the catalogue (second pull request).
- A rejected value returns its rule: `{"error": {"code", "path", "rule", "limit"}}`. When a stored sheet itself breaks a rule, a player's save gets `stored_sheet_invalid` without details, so no hidden path is named.
- Migration `0003_field_rules` converts stored sheets to schema version 2 with a frozen copy of the rules: removed fields dropped, "11 años" becomes 11, house names upper-cased, consequences get severity `leve`, out-of-range values brought within their rules, invalid entries dropped, and privacy settings for removed paths dropped. Not reversible: restore the pre-migration backup instead.
- The exported field list (`fieldRegistry.generated.ts`) now includes the limits. The stopgap account screens use them, and new list entries start valid.
- Existing privacy tests moved from the removed `notas` field to `linaje`. New tests: `test_field_rules.py`.
- Locally: compile, `check`, `makemigrations --check`, the contract check, `npm test` (34 passed), lint and the account build. The backend suite needs PostgreSQL and runs in CI.

## R3.2 skill catalogue — 8 November 2026 (second pull request)

- `backend/domain/catalogue.py`: the default catalogue (6 categories, 48 skills, Spanish and English names; Magia intuitiva has a maximum age of 14; only "Magia esotérica" is esoteric). Every campaign stores its own copy (`Campaign.skill_catalogue`, `catalogue_revision`); members read it at `GET /api/v1/campaigns/<id>/skill-catalogue`. The exported contract includes the default.
- Registry version 3: a skill entry is either a link to the catalogue (`catalogo` + value) or the player's own skill (`nombre` + catalogue `categoria`), with an optional knowledge level (`basico`, `medio`, `avanzado`) only in esoteric categories; no skill twice (an own skill may not reuse a catalogue name in either language). Catalogue checks run on the entries a save touches, so a later GM change to the catalogue never blocks saving untouched skills.
- Migration `0004_skill_catalogue` gives every campaign the default and converts stored skills: known names (also the old "Historia del mundo mágico" and "Oráculo") become links, others stay the player's own under the matching or fallback category; repeats keep their first entry. Not reversible: restore the pre-migration backup.
- Stopgap screens: a new skill is created as the player's own ("—" under magical knowledge) so it is valid.
- Decision for R4: when the GM adds a default skill, the editor offers to add it to existing characters (sheets store only the skills they have).
- Locally: compile, `check`, `makemigrations --check`, contract check, `npm test` (34), lint, account build. New tests: `test_skill_catalogue.py`.

**Staging updated (owner-approved), 8 November 2026:** a fresh encrypted backup first, then the server at `748ddaf`, both migrations applied, the backend restarted (a few seconds) and a new staging app release. The single stored sheet is on schema 3 and passes every rule; the campaign has the default catalogue. An end-to-end check as the fictional `test_player` stored a linked esoteric skill with a knowledge level and a consequence with a severity, saw invalid entries refused with their rule, and removed its test entries. The live site was not touched. Details are in `docs/infrastructure.local.md`.

## R3.2 app model — 8 November 2026 (third pull request)

- `src/model/`: named types derived from the server's field list; the rules lookup (`ruleAt`, `usage`, `nearLimit`, `checkSheet`); the skill catalogue helpers (names in both languages, catalogue order with the player's own skills last, Magia intuitiva hidden above 14 and for adult wizards); blank new sheets matching the old defaults minus the removed fields, with every applicable catalogue skill at 0 (48 for students, 47 for adults).
- Skill preset: one per-device preset in the new shape (`magistri_skill_preset`). The sheet's and the form's buttons move to it in R3.4; the old app's two preset keys are not read (test data only).
- Game data moved from `src/types.ts` to `src/data/gameData.ts` (imports updated; no visible change, guarded by the screenshot check). The old record types stay until R3.6.
- Tests: `tests/model.test.ts`. Locally: lint, `npm test` (42 passed), all three builds.
- **R3.2 is complete.**

## R3.3 sheet store — 8 November 2026 (first pull request)

- Owner decisions: someone else's change to a different field merges automatically (no conflict screen); a change to the same field waits for the viewer's choice; edits continue during a connection drop and are sent when it returns (memory only until R7.2).
- `src/store/sheetStore.ts` replaces `src/remote/saveQueue.ts`: local permission and rule checks before queueing (problems returned, nothing sent), path-only saves, exact retries of unknown outcomes with backoff, automatic merge on a stale revision, `conflicts` with `resolve(mine|theirs)`, drafts dropped when their path becomes read-only (`dropped`), server refusals held per path while other changes save, offline edits kept, a `PendingSlot` hook for R7.2. `src/store/paths.ts` holds the path helpers.
- The API client keeps refused-value details (`ApiFailure.details`).
- The stopgap account screens use the store, show refused edits with their rule, and offer "keep mine / keep theirs" for same-field conflicts.
- Tests: `tests/store.test.ts` (15) replaces the old queue tests; `tests/remote.test.ts` keeps the client tests plus error details. Locally: lint, `npm test` (48 passed), builds.

## R3.3 mock server — 8 November 2026 (second pull request)

- `src/mock/`: an in-browser mock of the API (`server.ts`) with the demo world (`fixtures.ts`: the screenshot fixture's characters in the server's model, three demo viewers, a GM-only field, player-restricted fields, a share), a PNG encoder for the demo images (`png.ts`, same pixels as the screenshot fixture) and the test panel (`panel.tsx`).
- The account app's API calls go through a replaceable transport (`apiTransport`), and images through `src/remote/assets.ts`; demo builds swap both. `checkSkills` (catalogue rules) was added to `src/model/catalogue.ts`.
- Fixed: the stopgap screens locked every field while offline, so the agreed offline editing was not reachable; now only a running action or an unknown outcome locks them. The contract type's schema version is 3.
- Tests: `e2e/demo.spec.ts` (7, project `demo-desktop`). Locally: lint, `npm test` (48), the demo tests (7 passed), and a check that `build:remote` contains no mock code.
- **R3.3 is complete.**

## R3.4 started — 8 November 2026

**Owner decisions:** the old browser-only mode ends at the R3.4 switch (not R3.6); account mode has no delete: the GM archives and restores, and may permanently delete an archived sheet after a confirmation (R4); export, import and the typed reset are hidden until R7.4; order: splits first, then one switch, then the decided visible changes one at a time.

**Split 1 (this pull request):** `CharacterDetail.tsx` (3,838 lines) split mechanically, text moved verbatim: `src/components/sheet/useCharacterSheet.tsx` holds the props, state and handlers (149 names) and returns them; `ProfileTab`, `SessionTab`, `SkillsTab`, `SpellsTab`, `NotesTab` and `GalleryTab` hold each tab's markup; `CharacterDetail.tsx` keeps the header, the tab switch and the dialogs (964 lines). Locally: type check, `npm test` (48), build, and the mock and local browser tests (24 passed). The screenshot check in CI confirms nothing visible changed.

**Split 2:** the same method for `CharacterForm.tsx` (1,926 lines → 357, plus `form/useCharacterForm.tsx` and five tab files) and `FamiliarDetail.tsx` (1,093 → 419, plus `familiar/useFamiliarDetail.tsx` and three tab files). Locally: type check, 48 unit tests, build, 24 mock and local browser tests; CI's screenshot check confirms nothing visible changed.

## R3.4 switch — 8 November 2026

The real screens now run on the account side (owner decisions: no "technical view" for the stopgap notes screens; personal notes, GM notes and note promotion return in R3.5):
- `src/App.tsx` is the account app: session restore, sign-in (`src/account/SignIn.tsx`, stopgap look until R3.5), campaign (automatic when only one), lists newest first (archived sheets hidden), one sheet store per sheet kept while signed in, uploads, bonds, archive, creation. `src/account/screens.ts` defines what each screen receives; `src/account/SaveStatus.tsx` shows offline/conflict/refused states.
- The character sheet, creation form, familiar sheet and editor, list and settings use the server's model directly: single-path edits by entry id (the 48 whole-record saves and 20 position-based edits are gone), images through the upload endpoint, the skill catalogue, permission gating (hidden fields not rendered, read-only viewers without editing controls). No one deletes: the GM archives. Export, import and reset are hidden until R7.4; settings gained an account card.
- Server: lists are ordered newest first (`created_at`), as players saw them in the old app.
- Retired: the old browser-only mode (code stays until R3.6), the stopgap account screens (`RemoteApp`, `RemoteFields`), `.env.mock`/`build:mock`, and the local-mode browser tests.
- Tests: the feature checklist moved onto the demo (`e2e/features.spec.ts`, 11 tests at desktop and phone widths); store behaviour in the real screens (`e2e/demo.spec.ts`, 7). Screenshots run on the demo as the GM; the owner approved every difference (see development.md, "Screenshot tests"), and 283 of 336 references were replaced from a CI run.
- Checked: type check, 48 unit tests, three builds, features (22) and demo (7) browser tests locally and in CI, backend suite, and a manual walk-through of the demo (lists, every sheet tab, edits, creation of a character and a familiar, settings).

Released to staging the same day (frontend release `20261108-140937-8c004a3`; backend rebuilt, no migrations).

## Staging fix: sheet lists — 8 November 2026

The owner's staging test as a player found that lists never loaded ("No se pudieron cargar los datos"), so new sheets seemed unsaved and a familiar created from the character sheet never appeared in its bond picker. Cause: the app asked for 200 sheets per list, while the server allows at most 100 per request (`backend/domain/views.py` `pagination`); the demo server did not enforce that limit. Saves themselves worked (checked on staging inside a rolled-back transaction).
- The app now reads lists in pages of 100; the demo server applies the server's paging rule, so a request the server would refuse also fails in tests.
- New feature test: as the player, create a familiar from the character sheet, bond it there, reload. It fails with the old limit and passes now.
- Checked: type check, unit tests, both builds, features (24) and demo (7) browser tests.
- Still open: which player actions should be GM-only (the owner is listing them).

Released to staging (`20261108-143610-176b36f`).

## Owner's staging test and first follow-up — 8 November 2026

- At the owner's request the four old staging test sheets (two characters, two familiars, one of them a duplicate made while lists failed) and their six images were deleted from the staging database; accounts, campaign and catalogue were kept.
- The owner then created a student, an adult wizard and a familiar (from the student's sheet, then bonded) by hand from three test sheets. What staging stored matched the entries; no new defect was found.
- Owner decisions from that test are recorded in field-rules.md and implementation-plan.md (R3.4): Empatía to social skills; custom fields without boxes; one «Varita / Foco mágico» field; GM-only skill creation and default skills, with a + button for players; a full-screen image viewer later, as its own design step.
- This pull request: Empatía moves to the end of social skills in the default catalogue, and migration `0005_empatia_social` moves it in every campaign whose catalogue still has it under Mentales (reversible; it raises the catalogue revision). Sheets store a link, so no sheet changes. Custom fields on the sheet read like the other values in reading mode; edit mode is unchanged.

## Screenshot tests retired, look rule relaxed — 8 November 2026

Owner decisions: the R3.1 screenshot tests are retired, and with the transition nearly complete the look rule is relaxed: **no aesthetic changes without a reason; any step that has a reason for a visible change may make it.** No before-and-after pictures or separate approval are needed. Removed: the CI job `visual`, `e2e/visual.spec.ts`, the 336 reference pictures (they remain in Git history) and the visual projects in `playwright.config.ts`. AGENTS.md, design.md, implementation-plan.md (decision 12) and development.md ("Checking the look") say so. The feature and demo browser tests are unchanged.

Merged and released to staging (backup first; migration 0005 applied; release `20261108-153827-dc3b2be`): Empatía is last in Sociales in the staging campaign, with sheet values kept.

## One wand field — 8 November 2026

- Server: `adultWizardProfile.magicalFocus` removed; `varitaSintonia` («Varita / Foco mágico», text 200) is the one field for every character. Schema version 4. Migration `0006_one_wand_field` merges each stored focus: empty focus, or a focus the wand already contains, changes nothing; an empty wand takes the focus; otherwise the wand becomes "wand · focus", or, beyond 200 characters, the focus goes to a custom field «Foco mágico». Whatever receives the focus gets at least the focus's restrictions (GM audience on the focus or the whole adult profile, from the sheet or the inherited campaign rule, and player restrictions); it is never opened up. Rules on the removed path are dropped. Not reversible: restore the pre-migration backup instead.
- App: the creation form has the one field in the basic data (the adult profile loses its focus box; reputation sits beside the former house). On the sheet the wand moved into the profile grid without the star-line separator: for adults it takes the focus's place beside the former house; for students it is a full-width last row. The demo professor has one wand.
- Tests: migration tests (merging, restrictions only ever tightened); the adult feature test checks the wand is stored and no focus remains. Checked: type check, unit tests, both builds, 31 browser tests, catalogue and migration tests, makemigrations --check, export_api_contract --check; looked at both cards in the demo, reading and edit mode.

Merged and released to staging (backup first; migration 0006 applied; release `20261108-155040-4544518`): Anselmo's identical focus was dropped, nothing else changed.

## GM-only skills, first part (C1) — 8 November 2026

Design approved by the owner (see implementation-plan.md, R3.4): C1 now, C2 next.
- Server: a player can no longer create, rename, move or remove own (non-catalogue) skills, on saves or on creation (`gm_only_skill`, 403; `catalogue.own_skills` compared before and after each save); values stay theirs. The projection stops offering those controls to players (own skills are not removable; skill names and categories are not writable). The campaign list now includes the viewer's own role.
- App: «+ Añadir de la lista» in each skill category (form and sheet) lists the catalogue skills the character lacks (Magia intuitiva only up to 14); picking one adds it at 0. Only the GM sees the typed box. The per-device skill preset («Guardar Plantilla de Habilidades» / «Fijar por Defecto», `magistri_skill_preset`) is removed; new characters start with every applicable catalogue skill until C2's «inicial» setting. The demo server mirrors the rules.
- Tests: backend tests for the rule, the projection and the campaign role (run in CI; no local PostgreSQL); unit tests for the + list and the own-skill comparison; feature tests for a player removing and picking a skill, and for a GM-typed skill the player cannot remove.

Merged and released to staging (release `20261108-161231-2e10532`; checked as test_player with rolled-back saves).

## GM-only skills, second part (C2) — 8 November 2026

The campaign's skill list is the universe's (decision 9: one campaign, two tables), so both tables share it.
- Server: `POST campaigns/{id}/skill-catalogue` (GM only; `expectedRevision`): the whole list, validated, with names unique across skills (a name in Spanish, English or both is enough), `inicial: false` to leave a skill off new characters (absent means on, so existing campaigns are unchanged and need no migration), and nothing removed (`catalogue_entry_removed`). It raises the revision and is audited. Own skills on the campaign's character sheets whose name now matches a list skill become links, keeping the value (the higher one if the sheet already links it).
- App: «Habilidades de la campaña» (Settings, GM only): rename, tick «Inicial» and add skills, always in the GM's interface language (owner decision: never ask for the other language; a name in either passes; for now assume everyone uses Spanish); one save, or discard; a stale revision reloads the list with a message. New characters start with the «inicial» skills. A skill the GM types on a sheet or in the form joins the list without «inicial» and is linked there. The demo server keeps an editable list.
- Tests: backend tests for the endpoint (GM only, revision, nothing removed, unique names, own skills becoming links) and the linking; unit tests for «inicial», ids, name clashes and linking; feature tests for the list screen and for a GM-typed skill that players then pick. Looked at the screen in the demo at desktop and phone widths.

- Owner decision (same day): the first version is **Spanish only**. `LANGUAGE_CHOICE = false` in `src/App.tsx` hides the language card in Settings and ignores a saved English choice (kept, so it returns if the switch is turned on). English texts stay in the code; automatic translation of skill names may come later.

Merged and released to staging (release `20261108-163813-9f44f37`; checked: the GM saves the list, a player is refused).

## Esoteric knowledge; staging ready for testers — 8 November 2026

The owner asked for a proper design document before further changes, and for staging to be ready for the GM and players to test now. Remaining phase 3 plan (four pull requests: session tab; lists, titles and limits; esoteric knowledge; images from a web address) was explained; only the esoteric knowledge part is done here.
- Esoteric knowledge: skills in «Magia esotérica» get a level (Sin conocimiento / Básico (alteración) / Medio (destrucción) / Avanzado (creación)) in the creation form and on the sheet in edit mode, set by whoever edits the sheet (owner's earlier recommendation accepted); reading mode shows a tag. Clearing rewrites the entry without the field.
- Images from a web address: the boxes in the creation form and the familiar editor are hidden (`IMAGE_FROM_URL = false`), because most sites block the browser from reading their images; they return when the server downloads images (remaining PR 4, its own security review).
- Checked: type check, 49 unit tests, both builds, 37 browser tests (new: the knowledge level in the form and on the sheet, set, shown, cleared); looked at both modes in the demo.

Merged and released to staging (release `20261108-165610-23673df`). Staging testers: a new empty campaign «Magistri Scholae, la Promoción del Caos» (the app picks it automatically; the GM cannot rename it yet), 1 GM and 8 player invitation codes (7 days) in the git-ignored `docs/staging-invitations.local.md`, and a Spanish testers' guide given to the owner.

## Sign-in screen in the app's style — 8 November 2026

- Visibility for now (owner): the GM sees every sheet in the campaign; a player sees the sheets they create (assigned to them) and none of the GM's. This is what the server already does; the full permissions system (sharing, GM restrictions) comes later.
- The sign-in screen and the campaign choice are drawn inside the app's frame in the academy or classic style (background, crest, title and tagline, a card with tabs for «Iniciar sesión», «Aceptar invitación» and «Restablecer contraseña»), instead of the stopgap page. Account errors have plain messages (wrong username or password, used or expired code, username taken, weak password, too many attempts, disabled account, no connection).
- Fixed: a refused sign-in (401) also showed «No se pudieron cargar los datos», as if a session had expired; sign-in requests now say a 401 is expected. The demo server answers a wrong sign-in with 401 like the server (it answered 400, which hid the bug) and refuses invitation and reset codes, since it has none.
- Checked: type check, 49 unit tests, both builds, 37 browser tests (the sign-out test now signs back in through the new screen, with a wrong attempt first); looked at both styles and a phone width in the demo.

Merged and released to staging (release `20261108-171229-f62bdeb`).

## Public site on the staging backend — 8 November 2026

Owner decision: testers must have one address. Instead of building the production backend now, the public site (magistrischolae.fyi, www redirects there) serves the account app and sends `/api` to the staging backend; later the production backend gets a copy of the staging data and the public site points to it (deploy/README.md section 9). The staging campaign «Magistri Scholae, la Promoción del Caos» and its invitation codes are the testers'.
- While this holds, the staging database holds real data: backend changes on staging need a backup and the owner's go-ahead; frontend trials on staging.magistrischolae.fyi do not affect testers; staging data is never wiped (AGENTS.md).
- Code: Caddyfile (public `/api/*` → `api-staging`), `release.sh` (production builds the account app). Server: public hosts added to `DJANGO_ALLOWED_HOSTS`, Caddy reloaded, production release.

Switched the same day (owner's go-ahead): staging backed up, public hosts added to `DJANGO_ALLOWED_HOSTS` (copy of the old file kept on the server), Caddy reloaded, production release `20261108-171942-47caff9` (rollback: `--activate 20261107-122823-0c8b943`, the old local-storage app). Checked: `/api` answers on the public address, www redirects, a CSRF-checked save through the public address works (rolled back), and the sign-in screen shows.

## Invitation links — 8 November 2026

- Owner request: invitations he can send as text messages. `https://magistrischolae.fyi/#invitacion=CODE` opens «Aceptar invitación» with the code filled in; `#recuperacion=CODE` does the same for «Restablecer contraseña». The code is in the fragment, which browsers never send to the server, and the app removes it from the address bar; a link followed while the sign-in screen is open also works.
- The owner's git-ignored codes file now lists a link per code (written locally without displaying the codes).
- Checked: type check, unit tests (new: reading links), browser tests (new: a link in the same tab and in a new tab, invitation and reset).

Released to the public site and staging (release `20261108-172928-c7ce656`); a link checked on the public site.

## Password typed twice — 8 November 2026

- Owner: accepting an invitation and resetting a password ask for the new password twice («Repite la contraseña»); a mismatch is caught before anything is sent, and both boxes are cleared. Signing in still asks once.
- Owner: the GM will forget his password. Recovery already works by link (`#recuperacion=CODE`) with an administrator-issued reset code (15 minutes); until the admin screens (R4) create them, the agent issues one on the server into a git-ignored file, like the invitations. R4 now lists reset and invitation links and the validity question.

Released to both sites (release `20261108-173809-a20cd0c`).

## Usernames from phones — 8 November 2026

The owner registered (`serj`, a player in the testers' campaign) but signing in said «Usuario o contraseña incorrectos». Usernames allow only letters, digits, `_` and `-` (compared in lowercase), and the server treats anything else as a wrong username, so a space a phone keyboard adds after the word blocks sign-in. The sign-in screen now trims the username and the code and turns off phone capitalisation and autocorrection in those boxes; the demo server compares usernames like the server, so the sign-out test (which signs back in as «Demo_Player ») would catch it.
- Display names keep capitals (owner): usernames are stored in lowercase, so registration now sends the name as typed as the display name, which the app shows. The owner's account got the display name «Serj» on the server (backup first).
- Recovery link tried for real: a reset code for `serj` was issued on the server into the git-ignored `docs/staging-recovery.local.md` as a `#recuperacion=` link (valid 15 minutes; the server's times are UTC).

## Familiar sheet like the character sheet — 8 November 2026

Owner, after testing on his phone: familiars had two ways to edit (quick edit and a full editor) and should behave like characters. Incoherencies found and fixed:
1. Two edit paths (quick edit on the sheet, «Editor Completo» on a separate screen): the sheet now has one edit mode, «Editar» / «Finalizar Edición», styled like the character sheet's; the full-editor button is gone.
2. The quick edit kept a draft and saved only on «Guardar» (blank name or species silently kept the old value): fields now save as they are typed, like characters.
3. The photo could only be changed by hovering over the portrait, which phones cannot do: in edit mode, tapping the portrait opens the picker and «Cambiar foto» is always shown over it.
4. The picture fit applied only on «Guardar», and there was no way to remove the picture: «Recortar / Ajustar» and «Quitar retrato» sit below the portrait and apply at once.
5. Linking a character, deleting journal entries and adding or removing gallery pictures were available outside edit mode, unlike characters: they now need edit mode, as on the character sheet (adding and editing journal entries stays available, as for characters).
6. Gallery pictures could only be enlarged or deleted by hovering: tapping a picture enlarges it, and the delete button is always visible in edit mode. The character gallery's delete button was hover-only too and is fixed the same way.
7. The familiar editor also edited existing familiars and listed every familiar with edit and archive buttons: it now only creates (familiars are listed on the main card view). After saving it returns to the character's sheet it was opened from, or opens the new familiar's sheet, as creating a character does.

Released to both sites (release `20261108-182351-4a11cca`), with #34 (usernames and codes trimmed; display names keep capitals).

- Owner decision (same day): a familiar created from a character's sheet is linked to that character on saving. **Corrected 9 November:** the link picker offers «Crear Familiar» also when the character already has a familiar, so the new link replaces the old one (the old familiar stays, unlinked), as picking another familiar there would; the earlier note said the opposite.

## Screen-by-screen design document — 9 November 2026

- `docs/product-design.md` now describes every screen as it is (mapped from the code), with principles, roles, a list of known inconsistencies and the design notes. Changes are designed there first.
- State checked the same morning: the GM (`faifolk`) registered on 8 November; seven player invitations stay open until 15 November 17:56 Spanish time; nightly backups and maintenance ran; no server errors.

## The owner's target design in the roadmap — 9 November 2026

The owner wrote a parallel version of the design document with his intended changes (`docs/product-design-owner.md`, kept locally, not committed). Folded into the plan:
- product-design.md: each section now has the current state and a **Target**; new section 11, the Biblioteca del Máster; the inconsistencies with the owner's decisions; non-magical characters decided; open questions Q1–Q8.
- implementation-plan.md: the rest of R3.4 in order (journal titles first, before the next publish; session tab; lists and limits; a polish pass; images from a web address); R4 extended with roles (activation, active/inactive, GM deletion and assignment, GM-created campaigns, administrator access with the GM's permission); new **R4.5 Sheet types** and **R5 Biblioteca del Máster** (the dropped R5 number reused; a design step and five build steps); R6 now moves the testers' data to its own production backend; decision 14.
- field-rules.md: planned changes table. design.md: the target roles and campaign data.

Owner's answers the same day (folded into product-design.md, the plan, field-rules, design.md and AGENTS.md): player drafts are a private vault the GM does not see at all until confirmed; only archived sheets can be deleted; administrator access covers the whole campaign for 24 hours or until the GM withdraws it or the issue is solved; «Criatura mágica» is an adult wizard plus «Especie», «Descripción» and «Pactos»; the stress rules (FATE homebrew, maxima 1–5 from «Físico», «Voluntad», «Empatía», leve / moderada / grave); branches are «Casas» in schools and «Secciones» elsewhere; R6 after R5; a multiverse collection with two-way links goes to the far backlog. Follow-up questions Q9–Q14 are in product-design.md.

Further answers: the GM chooses NPC or player character when confirming a draft; players can own a «Criatura mágica» from creation; the GM changes sheet types later (R4.5); sheets based on another (R5) and temporary versions (after R5, designed first); personal notes stay excluded from administrator access.

## Journal titles shown, not stored — 9 November 2026

- A journal entry without a title (character or familiar) stores none; the sheet shows «Entrada del …» from the entry's own date (`src/model/journal.ts`), also as the placeholder when editing. Emptying a title while editing brings the generated one back. Familiar entries no longer store «Sin Nombre». Entries saved earlier keep their stored titles.
- Tests: a unit test for the generated title; a feature test adding untitled entries to a character and a familiar (nothing stored in the title, «Entrada del» shown), on desktop and phone.
- Existing data: before the change, a read-only count on the staging backend (metadata only) found 5 sheets and no journal entries, so no stored generated titles needed cleaning.
- Merged as PR #39 (`1d16109`; GitHub did not start CI for the PR, so it was run by hand on the branch: frontend, backend and deploy config passed). Published on 9 November 2026: release `20261109-101827-1d16109` on the public site and staging; both serve the new build, `www` redirects to the main domain, and the API answers.

## Session tab: destiny, experience and severity — 9 November 2026

- **Destiny:** three gems by default and one more for each point above three, up to 10 (the server's rule); at most five a row, so ten show as two rows on a phone.
- **Experience:** in edit mode the number is a box (saved on Enter or leaving it; Escape restores it; an emptied box changes nothing), 0 to 1,000,000; − and + stay. Character cards show it exact up to 99,999 and short above («250 mil», «1 M»), the full number on hover, because 1,000,000 overflowed a card's third at 1024 px.
- **Consequences:** the add form has a «Leve / Moderada / Grave» choice, starting on «Leve» (owner); each consequence shows a coloured tag that whoever may edit it changes with a tap, also outside edit mode; readers see a plain tag. The one consequence on staging saved without a severity shows no tag until one is picked; no stored data changes. The three consequence lists share one component (`SessionTab.tsx`).
- Existing data (read-only count on staging, values only): destiny 2–3, experience up to 16, one consequence without a severity.
- **Tag menu** (product-design.md, Controls, adopted 9 November 2026): the severity on a consequence and an esoteric skill's knowledge level (sheet edit mode and creation form) no longer use browser selectors. Each is a coloured tag that opens a menu drawn by the app (`src/components/TagMenu.tsx`): beside the tag on wide screens, a sheet from the bottom below 640 px; arrows, Enter, Escape and a tap outside work, and focus returns to the tag. An empty tag looks like the others, only dashed and quieter («Elegir», «Ninguno»); readers see the plain tag. Severity options carry the game's durations as hints. The tags, the severity chips and the «×» get 40 px touch areas.
- Checks: type check; 51 unit tests; both builds; 43 browser tests (the session test now covers 3 → 10 gems, typed experience, an emptied box, severity on add and from the tag, and the short card number, at desktop and phone widths). Looked at in the demo build at 375, 1024 and 1280 px. With the tag menu: the session and esoteric tests open it, close it with Escape (focus back on the tag) and pick from it; the session tab has no browser selector left; checks rerun (type check, 51 unit tests, both builds, 43 browser tests).

## Controls study and the owner's verdicts — 9 November 2026

- The owner found the native selectors added this week (knowledge level; severity in PR #41) clash with the app's look, and the house filter chips do not grow. A study in [product-design.md](product-design.md#controls) proposes eleven shared controls, rules for which one fits each situation, and maps every choice in the app and the roadmap to one.
- An interactive demo of every control and rule ([Magistri Scholae controls](https://claude.ai/artifact/6aTMfP3K42R2z1rzGUHRtJ), a private claude.ai page with fictional data) recorded the owner's verdicts: 16 of 20 approved at once, the rest after changes: tapping the current pip does nothing; an empty tag looks like the others, only dashed and quieter, and tags keep their natural width up to a limit; the filter bar's magnifier chooses where to search and sorting takes any number of fields from a searchable list; and **only the Academia style stays** (Classic and its selector go in the R3.4 polish pass).
- Recorded in product-design.md (Controls, principles, settings), implementation-plan.md (polish pass) and AGENTS.md. Nothing in the app has changed yet. The tag menu is built first, inside PR #41 (D3). Open: D2 (the main list's filter bar now or with R5).

## Knowledge labels and no cut words — 9 November 2026

- After the tag menu went live, the owner found the demo better: the knowledge tag now shows only «Básico», «Medio» or «Avanzado»; «Alteración», «Destrucción» and «Creación» are a second line in its menu only. Tags never cut their value with «…»: a long one wraps. The skill rows on the sheet and in the form no longer cut skill names either (they wrap); the hover title that showed the full name is gone with the cut.
- New design rule (owner): no cut words wherever the layout allows; recorded in product-design.md, AGENTS.md and, for the remaining ~50 places, the polish pass.
- **Where the knowledge tag sits** (owner, after seeing it live): an esoteric skill with a level chosen shows two aligned lines, the name with its level tag, then the dots with the value. Other skills keep the name and dots beside a centred value; in edit mode an esoteric skill without a level offers «Ninguno» under its value. Tried beside the value first: on a phone in edit mode the name had too little room. The row's name area now takes the free width (the old 130/180 px limit is gone). Checked at 375 and 1280 px, in and out of edit mode; type check, 51 unit tests, both builds, 43 browser tests.

## Release and a faster workflow — 9 November 2026

- PRs #41–#44 merged and published: release `20261109-123631-206d290` on the public site and staging (both serve the new build; the API answers). The owner considers this version stable enough for testers.
- **Workflow from now on (owner):** one pull request per change, merged into `main` once its CI passes without a separate ask; nothing published to magistrischolae.fyi until an important milestone the owner approves; staging.magistrischolae.fyi gets a frontend release only when the owner asks to try something. Recorded in AGENTS.md.

## Roadmap order revised — 9 November 2026

- Approved by the owner (implementation-plan.md, «Order and reasons»; decision 15): lists and limits → polish pass (Classic removal, shared controls, no cut words, the rest) → image viewer → R3.5 notes and save messages → R3.6 → **R6 own backend for the testers, published with the finished R3 as milestone 1** → R4 (administration screens first) → R4.5 → R5 → images from a web address → temporary sheet versions → offline → **printable sheets** (added by the owner) → the rest of R7. Main reason: the testers' only database is the development database, and nothing is published between milestones.

## Lists and limits, part 1: subjects taught as a list — 9 November 2026

- An adult wizard's subjects taught are a list like the aspects (`src/components/SubjectList.tsx`), in the creation form and on the sheet: one entry per subject, added with a box and «+» (or Enter), removed with «×» in edit mode; readers see one row per subject, or «Sin asignaturas registradas». A comma is now just part of a name; the old comma-separated box lost commas and spaces while typing, so a second subject could not be typed in the form. Stored entries are unchanged.
- Checks: type check; 51 unit tests; both builds; 43 browser tests (the adult-wizard test adds two subjects in the form, one with a comma, then adds and removes one on the sheet by entry). Looked at in the demo build at phone width, in and out of edit mode.

## Lists and limits, part 2: required boxes can be emptied while retyping — 9 November 2026

- A character's name, and a familiar's name and species, on a saved sheet use `src/components/RequiredTextInput.tsx`: the box can be emptied while retyping, an empty value is never saved, a note says so («No puede quedar vacío: si lo dejas así, se mantiene el valor guardado.»), and leaving it empty brings the saved value back. Before, the empty edit was refused by the store's rule check and the box snapped back while typing.
- The demo test of a refused edit now empties a custom field's name (still refused with its rule in the save panel), since the name box no longer sends an empty name.
- Checks: type check; 51 unit tests; both builds; 45 browser tests (new: emptying and retyping a character's name, and a familiar's species).

## Lists and limits, part 3: counters near limits — 9 November 2026

- Every text box on the sheet, the creation form, the familiar sheet and the familiar editor carries its field's limit from the server's rules (`limitAttrs` / `maxLengthOf` in `src/components/LimitHint.tsx`); a paste over the limit stops at it. One `LimitHint` in the app watches the focused box: past 90% of its text limit, or of the list it adds to, a small counter appears under it («185 / 200», «28 / 30 entradas», «límite alcanzado» at the limit). The galleries, added to without a text box, show `ListCounter` in place («46 / 50 imágenes»).
- A unit test reads every `limitAttrs` / `maxLengthOf` use in `src/` and checks each field path resolves to a real limit, so a typo cannot leave a box unlimited.
- **R3.4 step 1, «Lists and limits», is complete** (PRs #47, #48 and this one).
- Checks: type check; 53 unit tests; both builds; 47 browser tests (new: the counter appears past 90%, a paste stops at 200, the counter disappears when the box is left). Looked at in the demo build at phone width.

## Polish pass (a): one visual style — 9 November 2026

- The Classic style is gone (owner decision): no «Estilo Visual» card in settings, no style choice in the app or its screen props, no Classic branches in the list cards, sheet, familiar screens, form or sign-in card. The app root keeps `data-style="academy"`, so the Academia CSS applies unchanged; a Classic or English choice saved earlier is ignored. `src/index.css` had no Classic-only rules (its base panel rules are refined by the academy ones), so only a comment changed. About 90 style choices and two whole Classic card layouts were removed.
- **No visible change in Academia, proved:** the HTML of every screen (list; every sheet tab, in and out of edit mode; the familiar's tabs and edit mode; the type selection; every creation-form tab for a student and an adult; the familiar editor), captured at desktop and phone widths before and after the change, is identical (new blank forms differ only in freshly generated ids). The capture test was temporary and is not committed.
- Checks: type check; 53 unit tests; both builds; 47 browser tests (the style test now checks there is no style card and that a saved Classic choice falls back to Academia).

## Polish pass (b), part 1: Switch and Check — 9 November 2026

- `src/components/Toggle.tsx`: `Switch` (a row with a toggle, the whole row tappable) and `Check` (a drawn box), as in the approved controls demo. They replace every native checkbox: «Especializado» when adding a spell or potion, «Es profesor» in the form and on the sheet, «Inicial» in the campaign skills, and «Entiendo que…» in the archive dialog. The app has no browser-drawn checkbox left.
- Checks: type check; 53 unit tests; both builds; 47 browser tests (the tests click the switches and check `aria-checked`; the spells test now also stores a specialized spell).

## Polish pass (b), part 2: the stepper — 9 November 2026

- `src/components/Stepper.tsx`: «−» value «+» (32 px buttons, disabled at the range's ends), with an optional typed box for ranges above 20 and an optional label beside it. It replaces the spell and potion difficulty selectors (1–5), the equipment quantity boxes on the sheet and in the form (typed, 1–9,999, no browser spinners) and the form's stress maxima (1–10). Limits come from the server's field rules. On the sheet the quantity and «Registrar Objeto de Inventario» are stacked, so the button keeps one line on phones.
- Checks: type check; 53 unit tests; both builds; 47 browser tests (the spells test raises a difficulty to 3 with «+» and types a quantity of 12). Looked at in the demo build at phone width.

## Polish pass (b), part 3: the segmented image fit — 9 November 2026

- `src/components/Segmented.tsx`: one row of 2–4 options, the chosen one lit gold; arrow keys move and choose. It replaces the four portrait fit button pairs (character sheet, familiar sheet, familiar editor, creation form), whose labels were English («Cover / Contain») on the sheet and long elsewhere («Ajustar / Lienzo Completo», cut on phones). All now read «Recortar» / «Completa», as in the approved demo. The sheet's portrait column is 144 px wide at every width (it was 112 px on desktop, too narrow for the two options).
- Checks: type check; 53 unit tests; both builds; 47 browser tests. Looked at in the demo build at 375 and 1280 px (no option cut or overflowing).

## Polish pass (b), part 4: the slider — 9 November 2026

- `src/components/Slider.tsx` with `.ms-slider` in `src/index.css`: the crop dialogs' zoom (character sheet, creation form, familiar editor) is drawn by the app (a gold-filled track, a gold thumb, a focus ring, a 40 px touch area), as the controls rule requires of any slider.
- Checks: type check; 53 unit tests; both builds; 47 browser tests. A picture of the crop dialog taken by a temporary test (not committed) at phone and desktop widths.

## Polish pass (b), part 5: the house tag menu — 9 November 2026

- The sheet's house selectors in edit mode (under the crest, and for a house without a recognised crest) are a tag menu: a tag with the house's medallion and name opens the five houses with their medallions, as in the approved demo. `TagMenu` options may now carry an icon, and a tag may take its own shape (`tagClass`). The character sheet has no browser selector left.
- Checks: type check; 53 unit tests; both builds; 49 browser tests (new: the house changes from its tag and is stored). Looked at in the demo build at phone width.

## Polish pass (b), part 6: the picker — 9 November 2026

- `src/components/Picker.tsx`: a dialog on wide screens and a tall sheet from the bottom on phones; search above 8 entries; a single choice closes on tap, a multiple choice uses checks and «Hecho (n)»; Escape, a tap outside and «×» close it and give focus back. It replaces the campaign selector in settings, the inline list of «+ Añadir de la lista» (now several skills at once, sheet and form) and the dialog that links a familiar from the character's sheet (with «Crear Familiar» in its footer).
- **Polish pass (b) is complete:** the app has no browser-drawn selector, checkbox, number spinner or unstyled slider left, except the language selector, hidden until the language choice returns (then a segmented control).
- Checks: type check; 53 unit tests; both builds; 49 browser tests (the skill tests pick from the list and confirm with «Hecho»). Looked at in the demo build at phone width.

## Custom fields on phones — 9 November 2026

- Owner's report: in edit mode on a phone, a custom field's name box was squeezed to a sliver beside its value. On the sheet and in the creation form, phones now show the name with its remove button on one line and the value under them, full width; wider screens keep the single row (name, value, remove).
- Checks: type check; 53 unit tests; both builds; 49 browser tests. Measured in the demo build: at 375 px the name box is 203 px and the value 233 px; at 1280 px the row is unchanged.

## No cut words, first pass: shorter wording — 9 November 2026

- Owner's rule: a shorter way to say it is always the first option (example: «Buscar por nombre, jugador o concepto...» → «Buscar»); anything else changes only where text is still cut afterwards.
- 71 texts in `src/localization.ts` (Spanish, and the English kept for later) are shorter: verbose buttons («Registrar Objeto de Inventario» → «Añadir objeto»), placeholders (one example each, «Título (opcional)» for a journal title), empty-list sentences («Sin equipo.»), confirmations («¿Eliminar este objeto?», which also fixes «este de objeto»), the form's tabs («Aspectos», «Casa») and the familiar slot's «Vincular». New texts use sentence case. «Registro de Familiares» and «Elige un personaje.» fix wording the design document had flagged; the demo banner no longer mentions local sheets.
- A temporary browser test (not committed) measured every screen at phone and desktop widths, including placeholders: with the demo's data nothing is cut any more. With long names (a 48-character character name, a 36-character familiar name) the list cards' names, player and species, and the familiar sheet's title are still cut: user data, which needs the layout rules (product-design.md, «Text that does not fit», proposal in PR #58).
- Checks: type check; 53 unit tests; both builds; 49 browser tests (three steps of the student test find the renamed boxes and button).

## No cut words: the rules applied — 9 November 2026

- The owner adopted the rules in product-design.md («Text that does not fit»): wording first, then wrap; only the cards' concept and description keep two lines and «…» (also the bonded character's concept on the familiar sheet); no text under 9 px.
- Applied: names on the list cards, the player, species and bonded character, the familiar sheet's title, the linked familiar's name on the character banner, «Desvincular», the creation form's tabs, equipment names in the form (no hover-only name), image errors, the account's name and username in settings and the campaign skills' age note all wrap or show whole; the ten texts at 7–8 px are 9 px. The familiar sheet's «elegir mago» dialog is the shared picker. The code has no `truncate` left; `line-clamp-2` remains only for the summaries.
- Measured with a temporary test (not committed) with a 48-character character name, a 36-character familiar name and a 92-character concept, at phone and desktop widths: the only cut text is the long concept's two-line summary on its card. Pictures of the cards checked: long names wrap and the row's cards grow together.
- Checks: type check; 53 unit tests; both builds; 49 browser tests.

## Polish pass (d), part 1: the creation form's familiar — 9 November 2026

- The familiar dialog in the creation form no longer creates anything: its button reads «Confirmar familiar», the form keeps the values (the «Familiar» tab then shows the familiar's name; reopening the dialog shows what was entered), and saving the character creates the familiar and links it. «Cancelar» leaves no familiar behind (known inconsistency 1). `FamiliarEditor` can start from given values (`initial`) and take another button label (`confirmLabel`); the form's screen contract loses `onCreateFamiliar`, and `onSave` receives the pending familiar.
- Checks: type check; 53 unit tests; both builds; 51 browser tests (new: a confirmed familiar is not created when the character is cancelled, and is created and linked when it is saved).

## Polish pass (d), part 2: «Cancelar» asks before discarding any change — 9 November 2026

- The creation form compares the whole sheet with the blank one it started from, so any change (age, wand, house, skills, stress, anything) makes «Cancelar» ask first; so do a portrait, a confirmed familiar, and text typed in an «add» box but not added yet. A form left untouched closes at once, as before (known inconsistency 2).
- Checks: type check; 53 unit tests; both builds; 53 browser tests (new: an untouched form closes at once; a changed age or wand asks, «Cancelar» in the dialog keeps editing).

## Polish pass (d), part 3: one crop dialog, with zoom — 9 November 2026

- The creation form, the character sheet and the familiar sheet share one crop dialog (`src/components/CropDialog.tsx`): the character sheet's, with its title, 3:4 frame, zoom slider, «Cancelar» and «Confirmar Recorte». The familiar sheet's dialog had no zoom and looked different (known inconsistency 4).
- Checks: type check; 53 unit tests; both builds; 53 browser tests (the familiar portrait test now zooms to 200% before confirming).

## Polish pass (d), part 4: consistent confirmations — 9 November 2026

- Rules adopted by the owner (product-design.md, Confirmations), with one shared dialog (`src/components/ConfirmDialog.tsx`, and `useAskFirst` for the sheets' questions). Before, only six kinds of entry on the character sheet asked; the other 26 removals on both sheets happened at once.
- Saved sheets ask before removing anything (both sheets, edit mode and session tab); the creation form does not; the form's «Cancelar» and the familiar editor's «Volver» ask only when something changed; archiving a character or a familiar uses the same dialog with a tick box (the familiar's had none); unlinking does not ask. The old minor-delete dialog, the two archive dialogs and the form's discard dialog are gone. Eight new texts (`confirmDeleteAspect`, `confirmRemoveSkill`, `remove` «Quitar»…); the familiar's archive texts now match the character's.
- Checks: type check; 53 unit tests; both builds; 55 browser tests (new: «Cancelar» in the dialog keeps a skill; the familiar gallery asks; the familiar editor's «Volver» asks only after typing; both archive dialogs wait for the tick box). Screenshots of the dialog at phone and desktop widths.

## Polish pass (d), part 5: the familiar editor's crop dialog — 9 November 2026

- The familiar editor (standalone, and the creation form's familiar dialog) now uses the shared crop dialog too, so there is one crop dialog everywhere. Checks: type check; 53 unit tests; both builds; 55 browser tests (the editor test now crops a portrait at 150%).

## Polish pass (d), part 6: every text in the translations file — 9 November 2026

- The per-screen text tables (campaign skills, save status, sign-in errors and account texts, knowledge levels, settings, both archive dialogs, the form's save failure) moved into `src/localization.ts` as named tables; `src/remote/text.ts` is gone. Loose texts got keys: the familiar gallery's «Subir Imagen Local» is now «Elegir imagen», the stress «Max» is «Máx.», the gallery's English «Delete picture» uses «Eliminar», and the image alt texts are Spanish. English fallbacks in the form were dropped (the keys exist). The settings note no longer mentions the removed visual style. Only the demo's test panel keeps its own texts, as a development tool (known inconsistency 5).
- Checks: type check; 53 unit tests; both builds; 55 browser tests (the familiar gallery shows «Elegir imagen»).

## Polish pass (d), part 7: the familiar sheet's header and notes tab — 9 November 2026

- The familiar sheet's header becomes the character sheet's top bar: «Volver a Personajes» («Volver» on phones), «Editar» / «Finalizar Edición» and, for the GM, «Archivar», in the same button styles. The species, bonded character and name left the header; they are on the profile. The journal tab is «Notas del Familiar», its text box suggests «p. ej. Encontró una llave en el jardín», and an empty list says «Sin notas.». The profile's unlinked sentence («No está vinculado a ningún personaje.») moved into the translations file (missed by part 6).
- Checks: type check; 53 unit tests; both builds; 55 browser tests (the familiar test reads the species from the profile). Screenshots at phone and desktop widths, in reading and edit mode.
- **Polish pass (d) is complete** (Known inconsistencies 1–6 done; 7–9 were already settled).
- Released to staging at the owner's request for a trial (frontend release `20261109-164125-ef420c8`; backend untouched; the API answers). The public site stays on `206d290` until milestone 1.

## Image viewer — 12 November 2026

- Designed with an interactive demo and the owner's verdicts (product-design.md, Image viewer), then built as one component, `src/components/ImageViewer.tsx`, used by both sheets. It replaces the two different gallery lightboxes (no moving, zoom or Escape) and adds portraits in reading mode. Computer: buttons fade in near the mouse; phone: gestures only; the back button closes it; the hint shows once; the name and counter fade. It is drawn into the page's body, so no layer of the sheet covers it.
- A jump found by the owner on his phone in the demo (after a pinch, the finger left on the screen was measured from where the other one first touched, so the image slid down) is fixed in the demo and the app; a simulated two-finger touch confirms the image stays still and the viewer stays open.
- Released to staging at the owner's request for a trial on his phone (frontend release `20261112-143411-74aedea`; backend untouched; the API answers). The public site stays on `206d290` until milestone 1.
- Checks: type check; 53 unit tests; both builds; 57 browser tests (new: the viewer at phone and desktop widths: portrait in reading mode, edit mode still changes it, gallery counter, fading buttons on a computer and none on a phone, arrows, double-tap zoom, Escape, the back button, a tap to close; the familiar sheet's portrait and gallery).

## Roadmap review — 12 November 2026

- **Current version:** `main` (`375916c`) green in CI; staging serves `74aedea` (the image viewer, owner's trial); the public site stays on `206d290` until milestone 1; both APIs answer.
- **Done since the 9 November order:** steps 1–3 (lists and limits, the polish pass, the image viewer). The plan's stale parts were corrected (the stopgap form, Classic, offline after R5, R6's apex switch and rollback).
- **Invitations:** 7 of the 9 testers' invitations are unused and all expire on 15 November 2026 (read-only check on staging). The administrator screens that let the owner reissue them come with R4 (a), after R6, so until then new ones are issued by hand on request.
- **R3 exit criterion still open:** the browser tests run in CI against the mock only, not against a real backend (planned in R3.6).
- **R3.5 prepared** as five steps (implementation-plan.md, R3.5): plain save messages; a notes design; small notes fixes on the server; personal notes with «Mover al diario»; GM notes.

## R3.5 step 1: save messages in plain words — 12 November 2026

- The save panel (`src/account/SaveStatus.tsx`, words in `src/account/saveMessages.ts`) names the field as the sheet does (most names come from the existing translations; list entries as «Bitácora Celestial (texto)»), says what is wrong and what to do, and shows values as typed (no JSON, no stored paths, no error codes). Owner's decision: only problems are shown; nothing appears while saving works.
- Two defects fixed: the «Descartado» line never cleared (now «Entendido» clears it, and closing the sheet forgets it), and «Reintentar» did nothing after a refusal (it now appears only for a lost connection, a server error or too many changes, as «Reintentar ahora»). On phones the panel spans the screen's width instead of running past its edge.
- Checks: type check; 58 unit tests (new: every field of both sheets has a plain label; messages for rules and server refusals; values; when «Reintentar» shows; «Entendido» clears discarded changes); both builds; 57 browser tests (the demo's refused edit and same-field conflict now read in plain words). Screenshots at phone and desktop widths.

## R3.5 step 2: notes design — 12 November 2026

- Designed with an interactive demo (claude.ai artifact «Magistri Scholae notes») and adopted with the owner's verdicts: [product-design.md, Notes](product-design.md#notes). Two kinds of notes: the shared Bitácora and private notes («Notas privadas», on each sheet and in «Mis notas»).
- Owner decisions: **no separate GM notes** (the GM keeps private notes like everyone; a GM's move to the Bitácora reveals the note to the player, and the dialog says so); **notes keep when they were written** (date and time), and «Mover a la bitácora» suggests that date and lets the author change it with the app's own calendar. The database change this needs is allowed now (nobody uses notes yet; read-only check on staging: 0 private notes, 0 GM notes), with a backup first.

## R3.5 step 3: notes on the server — 12 November 2026

- Private notes keep when they were written (`createdAt`, migration `0007_note_written_at`; the owner allowed this database change now, since no notes are stored); the title (and the text) may be empty; the list comes newest written first and can be filtered by sheet (`sheetId`); answers carry `createdAt` and `updatedAt`.
- «Mover a la bitácora»: the move takes the entry's date (`fecha`, by default when the note was written; before, the time of the move), and its preview checks the new entry against the journal's rules, so an empty or too long note is refused before anything moves (before, the preview passed and the move failed).
- A refused note text names its field (`title`, `content`, `label`) with its limit, like sheet fields (before, a bare `invalid_request`). The notes' rules are in field-rules.md, Private notes; the API in api-v1.md.
- The app's API types (`PersonalNoteView`, `NotePromotionPreview`) and the demo's mock server follow (optional title, dates, newest first); the mock learns the move in step 4.
- Checks: Django check, migrations and API contract checks locally; the backend suite in CI (new tests: dates, order, sheet filter, field-named errors, the chosen date, a note that does not fit); type check, unit and browser tests.

- **Released to the staging backend** with the owner's go-ahead: backup first (by hand, the nightly script: encrypted, verified, uploaded to Backblaze), then the server's code updated to `7a45e0f`, `api-staging` rebuilt, migration `0007_note_written_at` applied, `api-staging` restarted (a few seconds). After: both sites' APIs answer; data intact (6 sheets, 5 accounts, 0 notes); `check --deploy` shows only the intentional HSTS-preload warning. The staging frontend stays on `74aedea` (it uses no notes yet). Rollback: restore that backup (the migration adds a column; reversing it loses only note dates).

## R3.5 step 4: private notes in the app — 12 November 2026

- «Notas privadas» below the Bitácora on both sheets (`src/components/notes/PrivateNotes.tsx`), «Mis notas» from a new header button on the main list (`MyNotes.tsx`), and «Mover a la bitácora» (`MoveNoteDialog.tsx`), as designed (product-design.md, Notes). Notes save as you type and keep when they were written; a note left empty goes away by itself; deleting asks first; the move names who will read the entry (a GM is told the player will read it), suggests the note's date and lets the author change it with the new app-drawn date control (`DateTimeField.tsx`, Controls 12), and a note that does not fit is stopped by the server's preview with the field named in plain words. A note about no sheet chooses its sheet with the shared picker.
- Screens reach notes only through their own adapter (`src/account/notes.ts`: list, create, update, remove, preview, move), which the app builds on its API client; a move waits for the sheet's store to settle and hands the sheet's new copy to it. The demo's mock server learned the move (with the journal's checks), the sheet filter and the newest-first order.
- Checks: type check; 58 unit tests; both builds; 59 browser tests (new, at phone and desktop widths: a private note saved and kept after a reload; the GM does not see it and is told a move would reveal it; a move with a chosen date lands in the Bitácora by that date; a note that does not fit is stopped; deleting asks first; «Mis notas» with a note about no sheet moved by choosing the sheet). Screenshots at both widths.
- **R3.5 is complete** (step 5, GM notes, was dropped by the owner).
- Released to staging at the owner's request for a trial (frontend release `20261112-171034-12ab53c`, with plain save messages and the private notes; the staging backend already had the notes changes; both APIs answer). The public site stays on `206d290` until milestone 1.

**Next:** R3.6, retire the old app (local mode, Dexie, old backups and stopgap forms, the service worker's cache name; decide on the unused GM-notes endpoint; browser tests against a real backend in CI); then R6 with milestone 1.

## R3.6 step 1: the old local code deleted — 13 November 2026

- Deleted: `src/storage/` (the Dexie adapters, backups and storage-mode switch), `src/db.ts` (`MagistriScholaeDB`), the old hand-written types (`src/types.ts`), the old character factory and default skill list, the old preview fixtures, `test:baseline` with its script and CI step, the storage unit tests, the `dexie`, `dexie-react-hooks` and `fake-indexeddb` packages, the dead `VITE_STORAGE_MODE` variable, and 92 texts nothing used any more (backups, the typed reset, storage use, the install help, old familiar and sheet labels). No screen used any of it since the R3.4 switch, so nothing visible changes. The house colours and archetype registry now use the server model's character type.
- `tests/boundary.test.ts` now checks that no source file opens a browser database (the offline store, R7, will change that rule with its own module). [storage-contract.md](storage-contract.md) is kept as a record of the old mode.
- Browsers that ran the old app may still hold `MagistriScholaeDB`; the app never opens it.
- Staging data: the 7 unused player invitations were extended by 14 days, to 29 November 2026, after a backup (`staging/magistri-staging-20261113-053519.tar.gpg`), with the owner's go-ahead; the testers' links are unchanged.
- Checks: type check; 41 unit tests (the 17 storage tests went with the code); all three builds; browser tests (see the pull request).

**Next:** see step 2.

## R3.6 step 2: GM notes removed from the server — 13 November 2026

- The owner chose to remove the unused GM-notes endpoint (`/characters|familiars/{id}/gm-notes`), since GM notes were dropped on 12 November. Removed: the endpoint, its `GMNote` table (migration `0008_remove_gm_notes`, which drops the table; staging held 0 GM notes), its operation replay, its tests and the demo mock's copy. A request to the old path now answers 404 (tested).
- Checks: Django checks, migration check and API contract locally; the backend suite in CI (it needs PostgreSQL).
- Staging backend rebuilt at `bb27085` after a backup (`staging/magistri-staging-20261113-055552.tar.gpg`), with the owner's go-ahead given with the decision: migration `0008` applied, a few seconds of API restart; both APIs answer. Neither live frontend (staging `12ab53c`, public `206d290`) calls the removed path.

**Next:** see step 3.

## R3.6 step 3: the service worker's new cache name — 13 November 2026

- The cache is now `magistri-scholae-account-v3` (was `magistri-scholae-static-v2`). On activation the worker deletes every other `magistri-scholae-` cache, so a browser that had the old app drops its cached files once, at the next release it loads. What it caches is unchanged: only the app's own files, never `/api` or `/media`.
- Checks: a new unit test (activation drops the old caches and keeps the current one and other sites' caches); 42 unit tests; type check.

**Next:** see step 4.

## R3.6 step 4: browser tests against a real backend — 13 November 2026

- `e2e/remote.spec.ts` runs the account app against Django and PostgreSQL (the isolated fictional preview, `prepare_remote_preview`) through Vite's proxy: the assigned player's edit and private note are kept by the server after a reload, and a GM-only field never reaches the player's browser; the GM reads the edit and the GM-only field but not the player's note; the shared reader sees only the shared sheet, with no edit button. Playwright runs it only with `E2E_REMOTE=1`; CI has a new job, «e2e-backend», with its own PostgreSQL. The sheet's concept box gained an id (`input-sheet-concepto`) for it.
- **R3.6 is complete.** Exit criteria: the smoke suite runs in CI against the mock and a real backend; nothing visible changed; all tests pass. Checking the feature checklist on staging itself stays a manual check before milestone 1.
- Checks: type check; unit tests; the new job in CI (it needs PostgreSQL, so it did not run on this PC).

**Next:** R6, the testers' own backend, published with the finished R3 as milestone 1 (needs the owner's approval).

## R6 steps 1–4: the testers' own backend, milestone 1 published — 13 November 2026

Owner decisions the same morning: move before the testers' in-person session (14–15 November); staging keeps a copy of the data in which testers cannot sign in; the agent changes the Backblaze retention rule through the API after showing the owner the new rules (step 5).

- **Step 1 (PR #83):** `db-production` and `api-production` with their own network, volumes and secrets; `deploy/restore.sh` (restores an archive into either backend, backing up what it replaces); backups and the restore drill for production; `make_development_copy`, which refuses to run outside staging (`MAGISTRI_ENVIRONMENT`). Runbook: [deploy/README.md](../deploy/README.md) section 9.
- **Step 2, rehearsal:** production secrets (a new secret key and database password; the fingerprint key copied from staging, so the testers' unused invitation links keep working); the newest staging backup restored into production; all 21 tables matched live staging; `check --deploy` only W021 (HSTS preload, intentional).
- **Step 3, the move (PR #84):** staging's API stopped, staging backed up, restored into production, Caddy sends the public site's `/api` to production, staging serves only its own host. The API was down for 26 seconds. A failed login on the public site was counted in production's database only. **Milestone 1 published:** the public site serves `main` (`d127e58`): the finished R3 screens, with private notes. Production's nightly backup (03:45) and housekeeping (04:27) are scheduled; the first production backup restored in the drill with every table and image matching. A scripted session on the live site with the fictional test account passed 15 of 15 steps (sign-in, create, edit, portrait upload and download, a private note created, edited and deleted, list, sign-out); its fictional sheet and image were then removed.
- **Step 4, staging's development copy:** staging's backend rebuilt at `d127e58` (no migrations); only the administrator and the two fictional test accounts can sign in there; the other accounts' personal notes and all unused invitations were removed from the copy (production keeps them); staging has new keys. Production: 5 accounts, 6 sheets, 8 images, 7 unused invitations (still expiring on 29 November).
- Still to check by the owner: in a browser that had the old app, the new service worker takes over (R3.6 renamed its cache).

**Next:** see step 5.

## R6 step 5: backups that store each image once — 13 November 2026

- `deploy/media_backup.py`: each nightly backup lists the images with their SHA-256 (`media.txt`) instead of carrying them; an image not yet stored is encrypted, uploaded once to B2 `media/` and kept in `/opt/magistri/backups/media/` (shared by both environments; names are keyed hashes). `backup.sh`, `restore.sh` and `restore-check.sh` use it and still read older archives; `restore.sh --media-store` takes a `media/` folder downloaded from B2 if the server is lost.
- Backblaze rules changed through the API with `deploy/b2_lifecycle.py`, as agreed with the owner: `staging/` and `production/` hidden after 30 days and deleted 30 days later; `media/` kept. Read back from the bucket afterwards.
- Checks on the server: the image store tested with fictional files (duplicates stored once, restored folder identical, a damaged image and a wrong passphrase detected, a path outside the folder refused); first new-format backups of both environments (archives about 40 KB instead of 9.5 MB; staging reused production's 8 stored images); the production restore drill matched every table and decrypted and checked all 8 images; staging refreshed from that production archive with `restore.sh --replace` (staging backed up first, 8 images rebuilt and checked), then `make_development_copy` again.
- **R6 is complete.** Launch checklist: H1–H4 resolved in R2; H5 (old browser data) was settled by decision 11 (no legacy reader); CI green; backups verified; the checklist session passed on production (steps 1–4); logs visible (`docker compose logs api-production`); `check --deploy` clean but for W021 (HSTS preload, intentional). Release tag `r6-20261113`.

**Next:** R4, administration and roles, starting with (a) the administrator screens for invitations, reset codes and users. Migrations are rehearsed on staging's development copy and reach production only at milestone 2.

## Spanish texts: the owner's revision and the glossary — 13 November 2026

- The owner revised the Spanish texts in `src/localization.ts` (hints are plain examples, without «p. ej.»; new tagline, «Acerca de», type chooser title and others).
- The glossary ([product-design.md](product-design.md#words)) applied to the rest: «escuela», «Máster», «campaña» / «partida», «Bitácora» only for the journal and «entrada» for its items («Bitácora del Familiar»), «conjuro», «equipo» («Equipo y Bitácora», «Aspectos y equipo»), «Ver Ficha del Personaje», «Descartar cambios», «Añadir» for adding to a list; the loading text «Consultando el libro de matrículas…»; the empty list «Aún no hay personajes».
- One concept hint for both boxes (`placeholderConceptoEdit` removed). Texts nothing showed were deleted: four in the main table and 46 old account-screen texts (the sign-in screen keeps its 15).
- Checks: type check; 42 unit tests; both builds; 59 browser tests (three selectors followed the new wording).

## The sheet's layout reorganized — 13 November 2026

- Owner's request: clubs and equipment sat in the journal's tab. Now: **Perfil** has a new «Escuela» panel (students: year and class rank; adults: teacher and subjects; everyone: the clubs), **«Magia y equipo»** (was «Conjuros y Pociones») adds «Equipo», and **«Bitácora»** (was «Equipo y Bitácora») holds the journal and the private notes only. The Máster's «Habilidades de la campaña» opens from the main list instead of «Ajustes». Headings «Equipo» and «Clubes» follow the glossary. Only where things are shown changed; no stored field changed.
- Code: `src/components/sheet/SchoolPanel.tsx` and `EquipmentPanel.tsx` (the moved blocks); tab ids stay `hechizos` and `notas`.
- Checks: type check; 42 unit tests; 59 browser tests (the feature test now adds equipment on «Magia y equipo» and a club on Perfil, and checks the Bitácora holds neither; the skill list opens from the main list); screenshots of a student, an adult and a phone.

## The «Institución» tab — 13 November 2026

- Owner's request, after the half-width «Escuela» card on Perfil: the school and the house get their own tab, **«Institución»**, second after Perfil. «Escuela» is laid out like the house card (the app's crest and the school's name on the left; a student's year and class rank, or an adult's role and teaching, on the right; then subjects and clubs, one row each like the subjects); «Casa y Heráldica» sits beside it, and for adults becomes «Antigua casa», with heraldry when the text names a house. **Perfil** is «Datos Personales» beside one card with «Aspectos Personales» and «Complicaciones», then «Campos Personalizados». An adult's role, institution and former house moved from «Datos Personales» to «Institución». No stored field changed; the former house stays free text.
- Code: `src/components/sheet/InstitutionTab.tsx`, `HousePanel.tsx` (moved out of `ProfileTab.tsx`), `SchoolPanel.tsx` rewritten; tab id `institucion`; new texts `institucion` and `removeClub`.
- Checks: type check; 42 unit tests; 59 browser tests (the house, the clubs and an adult's role and institution are now checked on «Institución»); screenshots of a student and an adult on a desktop, a tablet and a phone, in view and edit mode.
- Open with the owner: whether players should add their own named cards of custom fields (a stored change: each custom field would need a group).

## Updating this handoff

After a milestone, record the commit/working-tree context, changes, exact checks and outcomes, unresolved defects, and next milestone. Replace stale status rather than accumulating contradictory completion claims. Never record secrets or actual player-note content here.
