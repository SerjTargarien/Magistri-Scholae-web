# Milestone 1 storage contract

> **Retired in R3.6 (13 November 2026).** This describes the old browser-only mode, whose code (`src/storage/`, `src/db.ts`, `src/types.ts`, `test:baseline`) was deleted. It is kept as a record; records now go through the sheet store and its adapters ([development.md](development.md)).

Implemented on 18 October 2026. The React/Vite frontend stays at the repository root. Milestones 2–3 provide a separate [backend API and remote editor](api-v1.md). This document describes the unchanged local/mock contract.

## Selection and isolation

`src/storage/index.ts` selects exactly one adapter through `VITE_STORAGE_MODE`. An unset/empty value selects `local`; `mock` must be explicit. Other values, including `remote`, throw instead of falling back.

| Mode | Database | Initial records |
|---|---|---|
| `local` | `MagistriScholaeDB` | Existing browser records; no seed, reset, migration, or normalization added. |
| `mock` | `MagistriScholaeMockDB` | Fictional student, adult wizard, linked owl and standalone fox, seeded only when this database is first created. |

Both use the unchanged version 1/version 2 schema declarations in `src/db.ts`. The constructor accepts an alternate name for isolated adapters and test databases. Only the selected database is constructed. Mock edits, imports, exports and confirmed reset operate solely on the mock database. Reload preserves mock edits; reset leaves it empty rather than reseeding on startup. A localized DEMO banner identifies mock screens.

These modes are complete local editors. Mock mode does not promise authentication or privacy. `sharedReaderExample` demonstrates an absent field and read-only capabilities for future projection consumers; it is not a role selector or a production security boundary.

## Repositories and services

The concrete types are in `src/storage/contracts.ts`; implementations are in `src/storage/dexieStorage.ts`. UI/application entry points import `storage`, never a Dexie table. `tests/boundary.test.ts` guards that restriction.

| Boundary | Operations and semantics |
|---|---|
| `characters` | `list`, `get`, `save`, `remove`. IDs remain numeric. New saves return the assigned ID without mutating the caller. Updates require an existing record. |
| `familiars` | `list`, `get`, `save`, `remove`. IDs remain strings; saves create or update the complete entity. |
| `bonds` | `assignCharacter(characterId, familiarIdOrNull)` and `assignFamiliar(familiarId, characterIdOrNull)`. Missing endpoints fail. Reassignment detaches displaced partners in both directions. |
| `backups` | `parse(json)`, `export(characterIds?)`, `import(data, "add" or "replace")`. Export without IDs includes both complete collections, including standalone familiars; an empty selection exports no entities. |
| `maintenance` | `reset`, `estimate`, `close`. Reset retains both table schemas and clears only the selected database's entities, inside one transaction. Close releases the adapter connection. |

Lists preserve existing descending `createdAt` ordering. Existing form/detail timestamps, media strings, journals, unknown legacy fields and IDs are preserved. Bond changes and opposite-link deletion cleanup use fresh database values in a single read/write transaction. Complete editor updates preserve the currently stored bond; changing a bond requires its explicit service operation. Creating an entity with a selected partner establishes both links atomically.

Canonical numeric-string familiar backlinks such as `"41"` can resolve character `41` without changing the stored value on reads. Explicit bond operations write numeric backlinks. There is no startup repair of inconsistent legacy records. The boundary does not introduce remote revisions, save queues or general concurrent-edit reconciliation; full local sheet saves retain the existing whole-record behavior for ordinary fields.

`estimate` wraps `navigator.storage.estimate()`: its figures cover the browser origin, including other storage at that origin, **not this database alone**. Missing/failed support keeps the prior fallback strings. UI confirmation remains required for reset and replace import; there is no shared-server wipe endpoint.

Language and visual style remain local preferences in `localStorage` (custom skill defaults were too, until 8 November 2026, when starting skills became the GM's campaign setting), outside entity repositories and backups. Mock records use built-in skills rather than copying saved presets; preferences themselves can still be changed locally in either mode.

## Backup compatibility and integrity

The owner subsequently clarified that character/familiar transfer operations should be separate. That redesign is deferred until after the backend foundation; the legacy-compatible combined local backups described below remain implemented meanwhile.

Format `backupVersion: "1.0"`, `app: "Magistri Scholae"`, `characters`, and optional `familiars` remains supported. Embedded images are retained. The validator checks the envelope, entity identity, timestamps and basic profile fields without applying defaults or stripping unknown content. It is not the future comprehensive server schema validator. Future/unknown backup versions, malformed collections and duplicate source IDs fail before destructive work.

- Add import assigns new numeric character IDs and remaps familiar backlinks using the actual assigned keys. Familiar IDs remain unchanged when free; collisions generate unique `_copy_<UUID>` IDs and remap character links. Existing destination records are not overwritten.
- Replace import clears and reinserts both collections in the same transaction. Validation conflicts or write failures roll back the entire operation, including clears. Reimported numeric IDs can differ, as they did in the legacy importer; ordinary application startup never rekeys anything.
- Valid one-sided links can reconstruct their other side. Contradictory or many-to-one source bonds fail atomically rather than picking an owner silently.
- A missing referenced entity cannot be recovered from the file. Import detaches that reference, preserves the entity content and returns structured `missing-character` / `missing-familiar` warnings. The UI shows a localized warning count. References never attach to an unrelated destination entity with a coincidentally matching ID.
- Single/selected character exports include linked familiars and their media/journals. Full exports also support familiar-only and empty collections. No old omitted familiar content can be reconstructed without its original records or another backup.

The original import/reassignment defects are reproducible with `npm run test:baseline`, which executes actual handler bodies from inspected commit `2518abd50809c3f59fab3dbb4e412ac6cc50a911` against a fixture database. The same script characterizes the old export omissions through source assertions. It does not access a browser's database.

## Future partial views

`LocalCharacter` / `LocalFamiliar` describe complete legacy domain data. `ViewerProjection<T>` is a distinct envelope containing `fields: Partial<T>`, revision and readable/writable paths. It cannot be supplied to a typed complete local save. Missing projected values are not filled with blank values. The remote adapter lives separately in `src/remote/`, using `src/contracts/api-v1.ts`, registered stable-ID paths and operation IDs. Its projections never enter the complete-record Dexie repositories. The application entry point imports only the selected mode; remote selection constructs no local/mock database and failures do not select another adapter.

Django services now project responses and validate authorized paths/revisions on the server. Do not adapt a partial projection by filling defaults and then calling these whole-record local saves. Author-only notes and field policies are implemented in the backend API but are not connected to these local editors. See [api-v1.md](api-v1.md) and [design.md](design.md).

See [development.md](development.md) for commands and [project-state.md](project-state.md) for verification and limitations.
