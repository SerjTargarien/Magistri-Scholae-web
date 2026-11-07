# Release chat prompt

Use this to start one release from [implementation-plan.md](implementation-plan.md) in a new Codex or Claude chat opened on this repository. Replace `R?` with the release, or release step, you are authorizing, such as `R0` or `R3a`. The prompt authorizes that release only. The milestone 1 prompt that used to live here is in Git history.

```text
You are working in my local Magistri Scholae repository. Implement release R? from docs/implementation-plan.md, and only that release.

Read AGENTS.md, docs/project-state.md, the R? section and the execution rules in docs/implementation-plan.md, and the parts of docs/design.md it references. Treat the recorded product decisions as settled. Verify the current branch, remotes and working tree instead of assuming the docs are current. Preserve my uncommitted changes. Never reset, stash or force-push.

Work on a development branch. Briefly state what you found and your approach, then carry out the release without asking for routine confirmation. Ask me before anything the release lists as an owner action, and before any push, merge to main, deployment, DNS, Vercel or VPS change, unless my message explicitly asks for it.

Keep local mode and every item in the plan's feature checklist working. Do not bump or rename MagistriScholaeDB, and do not turn a partial projection into a whole-record remote save. Keep changes inside the release. Record unrelated defects instead of fixing them.

Run npm run lint, npm test and the builds the release affects, the backend checks if backend code changed, and any smoke tests that exist. Report exactly what ran and what could not be verified. Update docs/project-state.md with the changes, the checks and their results, the limits, and the next release.

In your final message, explain what changed, how it was verified, what I need to do (owner actions), and the recommended next release.
```
