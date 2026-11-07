# First implementation chat prompt

Open this local repository as a Codex project, start a new chat in it, and paste the prompt below. This chat request authorizes milestone 1 only. The documents themselves are preparation, not evidence that the refactor already happened.

```text
You are working in my local Magistri Scholae repository. Prepare and implement milestone 1 from docs/implementation-plan.md: the persistence boundary and isolated mock preview.

Read the applicable AGENTS.md instructions, docs/project-state.md, docs/design.md, docs/development.md, and milestone 1 in docs/implementation-plan.md. Treat the recorded product decisions as settled. Verify current source and working-tree changes instead of assuming the preparation baseline is still current.

The canonical working repository is SerjTargarien/Magistri-Scholae-web. I have consolidated newer AI Studio changes into it. This same repository is used for Codex and AI Studio. Do not synchronize another repository or repeat the force-push.

The target backend is Django + PostgreSQL, with the React/Vite frontend retained and a future full-stack Contabo deployment. Current public delivery is through Vercel. This milestone does not authorize a push, a production deployment, DNS/Vercel changes, or infrastructure access.

Important current-source details:
- Dexie MagistriScholaeDB is at declared version 2 and has BOTH characters and familiars tables. Read the real name in src/db.ts; do not rename it.
- Character IDs are numeric; familiar IDs are strings. Preserve Character.familiarId and Familiar.studentId, linked/unlinked records, journals, images, and backup data.
- The newer app includes a character archetype registry, academy/classic visual modes, familiar screens, and a responsive mobile profile banner. Preserve those features and localization.
- The preparation handoff flags possible import ID-remapping, selective-export, and reassignment integrity gaps. Characterize them; do not claim they are reproduced or solved without evidence.

First inspect Git remotes, branch, status, instructions, scripts/tooling, and all current persistence paths. Briefly state your findings and approach, then carry out the milestone without asking for routine confirmation.

Implement typed repository/service boundaries for characters, familiars, bonds, backups, and local reset. Wrap existing Dexie persistence, remove direct entity-table access from UI components/application entry points, and introduce explicitly selected isolated mock mode with fictional data and a demo indicator. Keep local mode as the default during this milestone. Preserve the existing database name, schema declarations, IDs, and user records; no startup migration, wipe, or schema bump merely to move code.

Keep legitimate local preferences separate from character storage. Define complete local entity data separately from future partial viewer projections; hidden is not empty. Do not turn a partial projection into a whole-record overwrite. Mock filtering is not production authorization.

Preserve current editing, navigation, autosave, images, and legacy backup compatibility. Handle any narrow demonstrated data-integrity issue necessary for the milestone with focused tests and an explicit explanation. Do not bundle unrelated styling or behavior changes. Document unresolved baseline defects.

Do not implement Django/PostgreSQL, login, the full permission UI, remote media, library sync, offline account snapshots, or deployment yet. Future requirements remain in docs/design.md; they constrain interfaces but are not all part of this task.

Use a development branch/worktree as needed while preserving my existing changes. Do not reset/stash my work or force-push. Preserve the AI Studio frontend root and DISABLE_HMR handling.

Run the existing TypeScript check and production build. Add focused meaningful verification for persistence, mock isolation, familiar bonds, and relevant backup round trips. Use isolated test data/databases. Exercise browser flows if tooling permits and report exactly what could not be verified. Do not assume dependencies, a lockfile, or a passing test baseline already exist.

Document the actual implemented storage contract and mock/local run commands. Update docs/project-state.md with changes, checks/results, limitations, and next milestone. Finish milestone 1 before starting the backend.

In your final response, explain what changed, how it was verified, how I can run local/mock modes, any remaining issues, and the recommended next step.
```
