# Project documentation

This directory carries the migration decisions between Codex chats and AI Studio sessions. The canonical working repository is **SerjTargarien/Magistri-Scholae-web**; the owner has consolidated the newer AI Studio work into it.

## Start here

1. Read [project-state.md](project-state.md) for observed source state, previous decisions, known gaps, and actual verification.
2. Read [design.md](design.md) for the accepted product and architecture, distinguishing confirmed requirements from proposed defaults.
3. Use [implementation-plan.md](implementation-plan.md) to execute one milestone at a time.
4. Use [development.md](development.md) for current commands, preview expectations, and the shared frontend workflow.
5. Paste [chat-starter.md](chat-starter.md) into the first new Codex chat opened on this local repository.

The repository-wide agent instructions are in [../AGENTS.md](../AGENTS.md).

## Documentation responsibilities

| File | Owns |
|---|---|
| `design.md` | Requirements, architecture, permission model, and final product behavior. |
| `implementation-plan.md` | Ordered milestones, scope boundaries, and completion evidence. |
| `project-state.md` | Current observed implementation, gaps, and handoff/checkpoint records. |
| `development.md` | How to run and verify the current app; current versus future preview/deployment modes. |
| `storage-contract.md` | Implemented local/mock repositories, bonds, backups, reset and future projection boundary. |
| `api-v1.md` | Implemented backend session, campaign, entity, visibility, bond and private-note API. |
| `chat-starter.md` | A bounded first implementation request; not a request to build every feature at once. |

Milestones 1–3 implement local/mock storage, the Django/PostgreSQL API, remote editing, private media and note promotion. See [storage-contract.md](storage-contract.md), [api-v1.md](api-v1.md), [backend setup](../backend/README.md), and the checkpoints in [project-state.md](project-state.md). Library, separate transfer/offline and deployment work remain later milestones.
