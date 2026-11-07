# Incremental implementation plan

## Execution rules

- [design.md](design.md) defines the target; [project-state.md](project-state.md) records actual implementation. Read both before starting migration work.
- The initial implementation request is milestone 1 only. Later milestones are a roadmap, not blanket authorization to build or deploy everything.
- Preserve the current application and recent AI Studio features. Treat familiars and bonds as first-class persistence concerns.
- Inspect, explain a concise approach, implement, verify, and update the handoff. Do not pause for routine confirmation inside the requested milestone.
- A newly found defect should be reproduced/characterized. Repair narrowly when necessary for the active milestone; record unrelated issues without expanding into a redesign.
- Establish runtime/dependency baselines and report actual failures. No application checks are presumed to pass from the documentation preparation.

## 0. Local preparation and deployment inventory

Local documentation and source inspection are prepared. Verify the current checkout, branch, user changes, and runtime before implementation. Complete the VPS/deployment inventory before rollout; it does not block milestone 1.

The canonical repository is `SerjTargarien/Magistri-Scholae-web`. The old force-push is reported as completed. Do not rewrite history, synchronize the obsolete AI Studio repository, or change Vercel/DNS during local refactoring.

## 1. Persistence boundary and mock preview — first implementation task

### Outcome

The existing frontend works with a local adapter or explicitly selected isolated mock data. UI screens no longer own direct character/familiar database calls. A later Django adapter can reuse the boundary without another UI-wide storage rewrite.

### Scope

1. Inventory all persistence operations, including both tables, bidirectional bonds, autosave, imports, exports, quota reporting, and confirmed local reset.
2. Establish a focused baseline with nontrivial numeric IDs, string familiar IDs, linked and unlinked records, journals, images, and both character types.
3. Introduce typed character/familiar repositories and application-level operations for bonds, backups, and local reset. Coordinate multi-record operations in services/transactions instead of recreating storage logic in components.
4. Wrap existing Dexie storage without changing its database name, schema declarations, stored IDs, or user data. Do not normalize string/numeric relationship references destructively on startup.
5. Move direct data access from `App.tsx`, character/familiar detail/editors, and settings behind the boundary. Preserve form navigation, appearance, localization, and feedback.
6. Introduce explicit local/mock selection, defaulting to local. Mocks use fictional data and isolated storage, never the user's database. Add a visible demo indicator.
7. Separate complete local domain data from proposed future viewer projections/capabilities. Do not feed partial records into legacy full-record saves or claim mock filtering enforces security. Avoid building the full permission UI now.
8. Document the actual storage contract, mode-selection command, and verification. A `docs/storage-contract.md` file can be introduced when concrete interfaces exist; do not treat speculative interfaces as already implemented.

### Preservation and known integrity gaps

- Retain student/adult-wizard profiles, familiar content, registry capabilities, language/style preferences, image operations, and responsive layouts.
- Preserve `MagistriScholaeDB` version 2 and both table schemas. ID adapters must be lossless at the storage boundary; future remote IDs do not require rewriting current records.
- Keep the existing backup version readable, including backups without a familiars collection. Do not silently discard familiar records when exporting or importing.
- Characterize the current import/bond gaps listed in `project-state.md`. For a verified import fix, remap familiar backlinks using actual newly assigned character IDs, preserve unbound familiars, handle collisions deliberately, and test the affected round trip.
- Keep local add/replace/reset operations explicitly scoped to local data and their existing user confirmation. Do not create a future unrestricted shared-database wipe endpoint.
- No background deletion, reset, schema upgrade, or automatic migration of real user data. Tests must use isolated fixtures/databases and clean up only their own data.

### Out of scope

Django/PostgreSQL implementation, login, production authorization, new privacy controls, remote media storage, complete remote autosave conflict handling, library sync, offline account caches, deployment automation, and visual redesigns.

### Completion evidence

- `npm run lint` and `npm run build` results, plus a scoped test command documented if added.
- Repository scan confirms UI/application entry points no longer directly access character/familiar Dexie tables; persistence implementations retain legitimate access.
- Local create/edit/delete and reload work for both entities, with bond/unbond/reassignment/delete-cleanup checks in both directions.
- Relevant import/export round trips retain content, media, and relationships, with known unsupported cases explicitly reported rather than claimed as passed.
- Mock mode starts without backend services/production credentials and cannot write into the real database. Mode selection and isolation are exercised, not just described.
- Browser smoke checks cover mobile/desktop and critical character/familiar flows where tooling permits. Report unrun browser checks explicitly.
- `docs/project-state.md` records changes, actual checks, remaining defects, and the next unfinished milestone.

## 2. Django domain API, accounts, and permission foundation

Authorized by the owner after milestone 1. Confirmed familiar rule: independent assignment and read-only shares; bonds grant no access or note ownership. Separate character/familiar import/export is the intended transfer behavior, deferred until the backend foundation is solid. Keep legacy combined-backup compatibility in the current local app meanwhile.

Create the backend and PostgreSQL development environment. Implement invitation-only username accounts, reset codes, server-backed sessions, campaign roles, explicit shares, private notes, and server projection/authorized field changes. Define the character/familiar relational model and bond invariants together; do not migrate characters while losing familiars.

Before exposing standalone familiars through accounts, record the ownership/share rule and its consistency with bonded wizard permissions. A bond must not grant weaker access to hidden data or transfer author-only notes.

Prove cross-user/campaign isolation, GM field restrictions, author-only personal notes, session revocation, and that no generic serializer/download route bypasses projection. Use versioned migrations and a documented API contract. Full privacy promises must be enforced before real sensitive content is entered.

## 3. Remote editing and private media

Authorized by the owner after the milestone 2 pause. Implemented behavior, checks and limits are recorded in the milestone 3 checkpoint in [project-state.md](project-state.md). Milestone 4 is not started.

Add the remote adapter, serialized save queues, revisions, idempotent mutation handling, and permitted conflict reconciliation. Implement protected media and explicit personal-note promotion. Keep local/mock modes intentionally separated from remote failures.

Prove rapid edits/retries/conflicts do not overwrite newer or hidden data. Exercise image authorization, relationship transactions, and note-promotion atomicity. Keep player-visible responses partial and preserve unseen fields on writes.

## 4. GM library, sharing, and selective updates

Implement private PCs/NPCs/templates and independent campaign copies, including safe familiar/media associations. Add per-copy manual source-to-copy previews with field selection and per-field baselines. Preserve target assignment, disclosure rules, notes, and campaign values unless explicitly changed by an authorized operation.

Prove source deletion does not remove copies, stale previews cannot apply, and copying/sync never includes author-only notes or silently widens disclosure.

## 5. Legacy transfer and account-aware offline viewing

Implement a dry-run legacy importer, portable versioned exports, stable ID mapping for characters/familiars, per-item reports, and safe retries. Include older characters-only backups and the current familiar-capable format.

Restrict service-worker caching before authenticated data goes live. Add read-only viewer snapshots, automatic own/assigned caching, explicit GM additional downloads, online permission revalidation, and cross-tab logout cleanup. No offline mutation queue.

Prove projections apply to exports, images, search, and offline data; a second account cannot reuse the first account's cache. Document the unavoidable limit on revoking copies while a device remains offline.

## 6. Staging, Contabo deployment, and cutover

Inventory the VPS and existing deployment. Build reproducible frontend/backend images and Compose services with private PostgreSQL and media volumes. Configure HTTPS, allowed hosts/proxy trust, CSRF/session settings, monitoring, and encrypted off-VPS backups. Verify database/media restoration on a clean test environment.

Keep the existing Vercel site available until the new deployment is verified. Confirm its current production commit/branch, retain recoverable old data, then perform any requested domain cutover as a separate release action. Document rollback and support/recovery procedures.

## Checkpoint reporting

After each milestone, report outcomes, changed files, exact validation and its limitations, any agreed scope adjustment, and the next recommended milestone. Keep the handoff current. Do not mark the migration complete merely because the frontend compiles or a server container starts.
