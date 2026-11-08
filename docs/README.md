# Project documentation

This directory carries the migration decisions between Codex chats and AI Studio sessions. The canonical working repository is **SerjTargarien/Magistri-Scholae-web**; the owner has consolidated the newer AI Studio work into it.

## Start here

1. Read [project-state.md](project-state.md) for observed source state, previous decisions, known gaps, and actual verification.
2. Read [design.md](design.md) for the accepted product and architecture, distinguishing confirmed requirements from proposed defaults.
3. Use [implementation-plan.md](implementation-plan.md), the release roadmap, to execute one release at a time.
4. Use [development.md](development.md) for current commands, preview expectations, and the shared frontend workflow.
5. Paste [chat-starter.md](chat-starter.md) into a new agent chat to start a release.
6. Read [audit-2026-11-07.md](audit-2026-11-07.md) for the review behind the current roadmap.
7. Use [field-rules.md](field-rules.md) for the rule of every stored character and familiar field (lengths, ranges, choices, list sizes) and the skill catalogue.
8. Design a change in [product-design.md](product-design.md) before building it: screens, roles, rules and the recorded design notes.

The repository-wide agent instructions are in [../AGENTS.md](../AGENTS.md).

## Documentation responsibilities

| File | Owns |
|---|---|
| `design.md` | Requirements, architecture, permission model, and final product behavior. |
| `implementation-plan.md` | Release roadmap (R0–R7): order, exit criteria, owner actions, rollback. |
| `field-rules.md` | Rules for every stored field and the skill catalogue, decided by the owner. |
| `product-design.md` | Screens, roles and rules, where changes are designed first; recorded design notes. |
| `project-state.md` | Current observed implementation, gaps, and handoff/checkpoint records. |
| `development.md` | How to run and verify the current app; current versus future preview/deployment modes. |
| `storage-contract.md` | Implemented local/mock repositories, bonds, backups, reset and future projection boundary. |
| `api-v1.md` | Implemented backend session, campaign, entity, visibility, bond and private-note API. |
| `chat-starter.md` | Prompt template that starts one bounded release in a new agent chat. |
| `audit-2026-11-07.md` | Point-in-time review of the code and plan that led to the release roadmap. |

Milestones 1–3 implement local/mock storage, the Django/PostgreSQL API, remote editing, private media and note promotion. See [storage-contract.md](storage-contract.md), [api-v1.md](api-v1.md), [backend setup](../backend/README.md), and the checkpoints in [project-state.md](project-state.md). The remaining work, from CI and the Contabo move through the account launch and later the GM library, is ordered as releases R0–R7 in [implementation-plan.md](implementation-plan.md).
