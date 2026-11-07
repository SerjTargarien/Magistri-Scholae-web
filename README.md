# Magistri Scholae

The canonical working repository for Codex and Google AI Studio is `SerjTargarien/Magistri-Scholae-web`.

- [Project documentation and reading order](docs/README.md)
- [Accepted design and migration target](docs/design.md)
- [Current source state and handoff](docs/project-state.md)
- [Release roadmap](docs/implementation-plan.md)
- [Development commands and AI Studio workflow](docs/development.md)
- [Starter prompt for a release chat](docs/chat-starter.md)

The app supports default local Dexie storage, isolated mock preview, and explicitly selected Django/PostgreSQL account storage. Milestones 1–3 are implemented locally. The road to the Contabo launch is ordered as releases R0–R7 in the roadmap. See the development guide for verified commands and limitations. The original AI Studio template instructions are retained below.

---
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

## Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8ed53db3-123f-4832-a0b0-7945a6c5b243

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Review [the development guide](docs/development.md) for configuration. The inspected character manager has no active Gemini integration, so a Gemini key is not a prerequisite for this local UI workflow.
3. Run the app:
   `npm run dev`
