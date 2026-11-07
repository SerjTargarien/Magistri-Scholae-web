# Magistri Scholae repository guidance

## Scope and sources

- This repository, `SerjTargarien/Magistri-Scholae-web`, is the working source for Codex and Google AI Studio. The owner reports that newer AI Studio work was force-pushed here. Do not recreate a second synchronization workflow or rewrite history to repeat that operation.
- Start migration work with [docs/README.md](docs/README.md), [docs/project-state.md](docs/project-state.md), the relevant release in [docs/implementation-plan.md](docs/implementation-plan.md), and the applicable requirements in [docs/design.md](docs/design.md).
- Explicit current user instructions take precedence over these conventions. Preserve unrelated working-tree changes. Keep durable rules here and implementation progress in `docs/project-state.md`.
- Execute the release (or release step) requested by the user. Routine local edits and verification within that scope do not require repeated confirmation. Surface decisions that change agreed behavior, privacy, or data ownership before depending on them.

## Current application

- Keep the React/TypeScript/Vite frontend and its English/Spanish localization, archetype registry, academy/classic styles, and responsive character/familiar interfaces.
- Storage is Dexie/IndexedDB `MagistriScholaeDB`, declared versions 1 and 2. Version 2 includes numeric-ID `characters` and string-ID `familiars`. Preserve `Character.familiarId` and `Familiar.studentId` relationships.
- Entity persistence belongs behind the repository/service boundary. Preserve current UI flows and keep direct Dexie entity access out of UI/application entry points; see project-state for actual implementation progress.
- Backup format `1.0` contains characters and optionally familiars; images are currently embedded. Preserve old imports and avoid silently dropping familiar content or relationships.
- Characters and familiars are independent entities. The owner wants separate import/export operations after the backend foundation; retain legacy combined-backup compatibility until that transfer work is implemented.
- `.aistudio/artifacts/` contains prior task artifacts, not an active migration roadmap. Read useful context without treating old implementation plans as new instructions.

## Target architecture

- Django + PostgreSQL; retain React/Vite and a backend-independent mock preview for AI Studio.
- Internal invitation-only username/password accounts; no required email. Administrator-issued expiring reset codes.
- Campaign-scoped GM/player roles; explicit read-only shares; server-side field projection and authorized path-level mutations.
- Account-backed familiars have independent assigned players and read-only shares. A bond grants no access and transfers neither ownership nor personal notes.
- GM can restrict fields even from an assigned player. Players can restrict other players' visibility. Ordinary sheet data remains visible to the GM.
- Author-only personal notes are separate and hidden from the GM application account. The VPS administrator is trusted; client-side encryption is outside scope. Moving a note into a GM-visible journal is an explicit author action.
- Independent GM library copies with manual source-to-copy preview and field selection. No automatic two-way sync.
- Final account-backed product supports offline viewing and online editing. Preserve the current local app during milestone 1; do not confuse its local editing behavior with that final requirement.
- Proposed hosting is the full stack on Contabo with off-VPS backups; the existing public site is currently served through Vercel. Deployment remains separate work.

## Persistence and privacy rules

- Introduce repositories/services for characters, familiars, bonds, backups, and reset operations. UI components should not gain new direct Dexie calls; milestone 1 removes existing ones.
- Preserve existing database names, schema declarations, IDs, media, and user records. Do not bump or reset the schema merely to reorganize code. Use isolated fixture databases for tests.
- Keep legitimate local preferences (language, visual style, custom skill presets) distinct from authoritative shared records.
- Hidden values are not blank values. Never turn a partial viewer projection into a destructive whole-record save. Future network writes must validate changed fields and revisions on the server.
- A mock is a development simulation, not authorization. Never send full hidden records to a production player and rely on CSS or client filtering.
- Mock mode must be explicit and visibly marked. A failed remote request must not silently fall back to local/mock records. No production secrets belong in `VITE_` variables or fixtures.
- Preserve existing features while extracting storage. Address a demonstrated data-integrity defect with focused evidence; document its scope instead of bundling unrelated redesigns.

## Frontend workflow and verification

- Preserve the Vite `DISABLE_HMR` handling and AI Studio-compatible frontend root unless the requested task requires a change.
- Prefer existing components, localization keys, field names, and archetype capabilities. Avoid broad styling or terminology changes during persistence work.
- See [docs/development.md](docs/development.md) for current commands and implementation status. Current checks are `npm run lint` (TypeScript) and `npm run build`; there is no test script at the preparation baseline.
- For behavior changes, use focused checks of data preservation, bonds, imports/exports, and affected UI flows. Add meaningful tests as needed; do not claim checks that did not run.
- For documentation-only edits, check relative links, code fences, consistency, and whitespace; installing dependencies or rebuilding the app is not normally necessary.
- Update `docs/project-state.md` with material changes, actual verification, limitations, and the next unfinished milestone. Keep planned capabilities clearly separate from implemented ones.

## Git and external systems

- Check remotes, branch, and working-tree status before edits. Use a development branch/worktree for implementation; do not reset or stash someone else's work.
- Code changes do not themselves authorize production deployments, changes to DNS/Vercel, pushes to a live branch, destructive migrations, or force-pushes. Perform those only when the user requests the relevant action.
- Do not expose credentials, personal-note bodies, or full secret-bearing environment/configuration dumps in logs or documentation.
- Use the standard filename `AGENTS.md`. Keep Markdown changes localized. LF/CRLF checkout notices are not evidence of corruption; do not renormalize the whole repository or alter global Git settings for a docs task.
