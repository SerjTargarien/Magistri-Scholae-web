# Magistri Scholae repository guidance

## Scope and sources

- This repository, `SerjTargarien/Magistri-Scholae-web`, is the working source for Codex and Google AI Studio. The owner reports that newer AI Studio work was force-pushed here. Do not recreate a second synchronization workflow or rewrite history to repeat that operation.
- Start migration work with [docs/README.md](docs/README.md), [docs/project-state.md](docs/project-state.md), the relevant release in [docs/implementation-plan.md](docs/implementation-plan.md), and the applicable requirements in [docs/design.md](docs/design.md).
- Explicit current user instructions take precedence over these conventions. Preserve unrelated working-tree changes. Keep durable rules here and implementation progress in `docs/project-state.md`.
- Execute the release (or release step) requested by the user. Routine local edits and verification within that scope do not require repeated confirmation. Surface decisions that change agreed behavior, privacy, or data ownership before depending on them.

## Current application

- Keep the React/TypeScript/Vite frontend and its English/Spanish localization, archetype registry, the Academia visual style (the only one since the owner's decision of 9 November 2026: Classic and its selector were removed), and responsive character/familiar interfaces. The first version is Spanish only (owner decision, 8 November 2026): `LANGUAGE_CHOICE` in `src/App.tsx` hides the language card and ignores a saved English choice; the English texts stay for later. Never ask a user for words in the other language.
- No cut words: text wraps rather than ending in «…» wherever the layout allows (owner decision, 9 November 2026). No aesthetic changes without a reason; any step that has a reason for a visible change may make it (owner decision, 8 November 2026, replacing the stricter rule of the transition and the R3.1 screenshot tests). New screens follow the Academia style. Choices use the shared controls and rules in [docs/product-design.md](docs/product-design.md#controls) (owner decision, 9 November 2026): never a browser-drawn selector, checkbox or number spinner.
- Local mode stores data in Dexie/IndexedDB `MagistriScholaeDB`, declared versions 1 and 2. Version 2 includes numeric-ID `characters` and string-ID `familiars`, linked by `Character.familiarId` and `Familiar.studentId`.
- **Local mode ended at the R3.4 switch (owner decision, 8 November 2026).** Its only records were the owner's test data, so nothing is migrated or converted: no legacy reader, no importer for backup format `1.0`. The app is the account app; R3.6 deletes the unused local storage code. Do not bump or reset its schema meanwhile.
- Entity persistence belongs behind the repository/service boundary. Keep direct Dexie entity access out of UI/application entry points; see project-state for actual implementation progress.
- Characters and familiars are independent entities. The owner wants separate import/export operations for accounts (R7.4). Never silently drop familiar content or bond relationships.
- `.aistudio/artifacts/` contains prior task artifacts, not an active migration roadmap. Read useful context without treating old implementation plans as new instructions.

## Target architecture

- Django + PostgreSQL; retain React/Vite and a backend-independent mock preview for AI Studio.
- Internal invitation-only username/password accounts; no required email. Administrator-issued expiring reset codes.
- Campaign-scoped GM/player roles; explicit read-only shares; server-side field projection and authorized path-level mutations.
- Account-backed familiars have independent assigned players and read-only shares. A bond grants no access and transfers neither ownership nor personal notes.
- GM can restrict fields even from an assigned player. Players can restrict other players' visibility. Ordinary sheet data remains visible to the GM, except a player's **drafts** (borradores): a private vault the GM does not see at all until the player proposes a sheet and the GM confirms it (owner decision, 9 November 2026; R4).
- Author-only personal notes are separate and hidden from the GM application account. The VPS administrator is trusted; client-side encryption is outside scope. Moving a note into a GM-visible journal is an explicit author action.
- The site administrator does not read campaign sheet content, except with the GM's explicit, audited permission for an issue: the whole campaign, read and change, until 24 hours pass, the GM withdraws it, or the administrator marks the issue as solved (owner decision, 9 November 2026; R4; personal notes stay excluded).
- Independent GM library copies with manual source-to-copy preview and field selection. No automatic two-way sync. (Owner, 9 November 2026: a far-backlog multiverse collection may link characters between campaigns both ways; it needs its own design and does not change this rule until then.)
- The account-backed app launches with online editing. Right after launch, a new offline mode built on the server's data model adds offline viewing (R7.1) and offline editing that syncs on reconnect (R7.2). It uses its own account-scoped database and is unrelated to the retired local mode (owner decision, 8 November 2026; design.md sections 10 and 12).
- The screens use the server's data model directly, with no translation layer: generated types, stable item IDs, edits by ID, and saves of changed paths only.
- Hosting is the full stack on Contabo with off-VPS backups. Since 7 November 2026 the public site is served from the Contabo VPS (release R1) and DNS is hosted at the registrar, Porkbun; the owner wants no Vercel dependency. Releases go through `deploy/release.sh` (see `deploy/README.md`); backend deployment (R2 onward) remains separate work.
- **Testers use the public site on the staging backend (owner decision, 8 November 2026).** magistrischolae.fyi serves the account app and sends `/api` to `api-staging`, so the staging database holds the testers' real data until the production backend (R6) gets a copy and the public site points to it. Meanwhile any backend change on staging (rebuild, migration, data script) reaches testers: back up first and do it only with the owner's go-ahead. Frontend trials on staging.magistrischolae.fyi are separate releases and do not affect them. Never wipe or reset staging data.

## Persistence and privacy rules

- Screens read and write records only through the sheet store and its adapters (remote, the in-browser mock server, and later the offline store), never through Dexie or the API directly.
- Every stored field has a rule in [docs/field-rules.md](docs/field-rules.md) (length, range, choice or list size), enforced by the server and mirrored by the input. A new field gets its rule there and in the backend registry.
- Preserve server records, IDs and media. Do not bump or reset `MagistriScholaeDB` until R3.6 deletes it. Use isolated fixture databases for tests.
- Keep legitimate local preferences (language, visual style) distinct from authoritative shared records. Which skills new characters start with is the GM's campaign setting, not a local preference (the per-device skill preset was removed on 8 November 2026).
- Hidden values are not blank values. Never turn a partial viewer projection into a destructive whole-record save. Network writes are validated (changed fields and revisions) on the server.
- Unsent changes keep their path, value, base revision and operation ID. After a stale revision, re-send only changes to paths the server did not also change, and ask the viewer about the rest; never use last-write-wins. Unsent changes belong to one account and are cleared, after a warning, on logout.
- A mock is a development simulation, not authorization. Never send full hidden records to a production player and rely on CSS or client filtering.
- Mock mode must be explicit and visibly marked. A failed remote request must not silently fall back to local/mock records. No production secrets belong in `VITE_` variables or fixtures.
- Preserve existing features while extracting storage. Address a demonstrated data-integrity defect with focused evidence; document its scope instead of bundling unrelated redesigns.

## Frontend workflow and verification

- Preserve the Vite `DISABLE_HMR` handling and AI Studio-compatible frontend root unless the requested task requires a change.
- Prefer existing components, localization keys, field names, and archetype capabilities. Avoid broad styling or terminology changes during persistence work.
- See [docs/development.md](docs/development.md) for current commands and implementation status. Current checks are `npm run lint` (TypeScript), `npm test`, `npm run test:e2e` (Playwright smoke tests of the feature checklist), the builds and the backend suite; CI in `.github/workflows/ci.yml` runs them all.
- For behavior changes, use focused checks of data preservation, bonds, imports/exports, and affected UI flows. Add meaningful tests as needed; do not claim checks that did not run.
- For documentation-only edits, check relative links, code fences, consistency, and whitespace; installing dependencies or rebuilding the app is not normally necessary.
- Update `docs/project-state.md` with material changes, actual verification, limitations, and the next unfinished milestone. Keep planned capabilities clearly separate from implemented ones.

## Git and external systems

- Commits are made in the owner's name, using the repository's configured Git user. Add no `Co-Authored-By`, tool or model attribution, or other trailers to commit messages or pull-request descriptions, and do not override the author.
- Check remotes, branch, and working-tree status before edits. Use a development branch/worktree for implementation; do not reset or stash someone else's work.
- **Workflow (owner decision, 9 November 2026):** each change is its own pull request. Once its CI passes, merge it into `main` (fast-forward) without asking each time, and say so in the summary. Nothing is published to magistrischolae.fyi (`deploy/release.sh`) until an important milestone the owner approves; between milestones, release to staging.magistrischolae.fyi only when the owner asks to try something (it shares the testers' backend and database).
- Code changes do not themselves authorize production deployments, changes to DNS/Vercel, pushes to a live branch, destructive migrations, or force-pushes. Perform those only when the user requests the relevant action.
- Do not expose credentials, personal-note bodies, or full secret-bearing environment/configuration dumps in logs or documentation.
- VPS, registrar, DNS and hosting-account specifics (IP addresses, resources, existing containers, access methods) belong only in the git-ignored `docs/infrastructure.local.md`. Read it locally when needed; never copy its contents into tracked files, commit messages or pull requests. Refer to it by path instead.
- Use the standard filename `AGENTS.md`. Keep Markdown changes localized. LF/CRLF checkout notices are not evidence of corruption; do not renormalize the whole repository or alter global Git settings for a docs task.
