# Magistri Scholae: accounts, shared storage, and frontend development

**Status:** Design baseline with confirmed backend and privacy decisions. Django with PostgreSQL is selected. Personal notes use application-level privacy; the VPS administrator is trusted. Milestones 1–3 are implemented locally; see [project-state.md](project-state.md) for actual evidence and [implementation-plan.md](implementation-plan.md) for the remaining release order. Infrastructure discovery and deployment remain outstanding.

**Date:** 18 October 2026  
**Canonical repository:** [SerjTargarien/Magistri-Scholae-web](https://github.com/SerjTargarien/Magistri-Scholae-web), used by Codex and Google AI Studio after the owner's reported consolidation of newer AI Studio work.  
**Latest inspected local revision:** [`2518abd50809c3f59fab3dbb4e412ac6cc50a911`](https://github.com/SerjTargarien/Magistri-Scholae-web/commit/2518abd50809c3f59fab3dbb4e412ac6cc50a911) (`feat: redesign mobile character profile banner`). This is source HEAD, not a verified production deployment.  
**Current deployment (since 7 November 2026):** [magistrischolae.fyi](https://magistrischolae.fyi/) is served from the Contabo VPS by Caddy, built from [SerjTargarien/Magistri-Scholae-web](https://github.com/SerjTargarien/Magistri-Scholae-web) `main` (release R1, local-storage app). DNS is hosted at the registrar, Porkbun. Vercel, the previous host, no longer serves the site. Hosting specifics are kept outside Git (see section 15).

## 1. Executive proposal

Keep the existing React, TypeScript, and Vite frontend. Introduce an application API that owns authentication, permissions, validation, database writes, protected images, and exports. Replace direct component access to IndexedDB with a documented repository interface. Supply a mock implementation for frontend development and a remote implementation for production.

The resulting app supports internal accounts, player-controlled character sheets, campaign-wide GM access, a private GM character library, field-level disclosure, private player notes, and offline viewing and editing. Google AI Studio remains a frontend development environment rather than the authority for production data or database structure.

The current source also includes separate familiar records, wizard–familiar bonds, an archetype registry, and academy/classic visual modes. Those existing features are part of the preservation baseline. The migration must cover both entities and their relationships, rather than reverting to the earlier characters-only planning snapshot. See [project-state.md](project-state.md) and [implementation-plan.md](implementation-plan.md) for current evidence and the first bounded task.

Begin the architecture transition before adding many more storage-dependent features. Deploy in stages, proving permissions and import/export before moving real data. A fresh deployment is acceptable because the owner reports that nobody currently uses the hosted site. On 8 November 2026 the owner confirmed that the only records in the old local format are their own test data: the old local mode is retired, and nothing is migrated (see [implementation-plan.md](implementation-plan.md), decisions 3 and 11).

Use Django and PostgreSQL for the backend, as selected by the owner. The expanded permission model requires explicit application services for field projection, personal notes, selective synchronization, and safe writes. Section 4 records the selected architecture and its rationale.

## 2. Confirmed requirements

| Area | Confirmed decision |
|---|---|
| Initial audience | One private group with one GM; allow multiple groups and GMs later. Confirmed on 7 November 2026: one GM runs two crossing-over stories in one universe, modelled as **one campaign with two tables**; 7–12 players. The site owner is the administrator and a player at one table, not a GM. |
| Accounts | Invitation-only, username/password accounts; no required email and no Google login. |
| Recovery | A site administrator issues a short-lived reset code; the user chooses the replacement password. |
| Character creation | Players create and edit their own characters. The GM can create, assign, and edit campaign characters. |
| Other players' access | Own/assigned sheets by default. The GM explicitly shares other sheets as read-only. |
| GM library | Private PCs, NPCs, and templates, copied into campaigns as independent characters. |
| Optional synchronization | Per-copy, manual one-way updates from library to campaign, with a preview and field selection. |
| Field privacy | The GM can hide fields even from an assigned player. Players can hide fields from other players. Defaults and per-character overrides are required. |
| GM access exception | Player personal notes can be hidden from the GM and easily moved into the GM-visible journal. |
| Offline behavior | **Revised 8 November 2026:** online editing at launch, then, right after launch, a new offline mode built on the server's data model: offline viewing, followed by offline editing that syncs on reconnect (sections 10 and 12). Automatically cache own/assigned sheets; GM explicitly downloads additional sheets. Clear downloaded account data on logout. |
| Editing workflow | Continue frontend development through agentic tools such as Google AI Studio. |
| Hosting | Existing Contabo VPS (resources recorded in the local infrastructure notes), full-stack target using Docker Compose. Since 7 November 2026 it serves the public website, with DNS at Porkbun; the owner chose no Vercel dependency. |
| Working source | The owner has consolidated newer AI Studio work into `Magistri-Scholae-web`; agents and AI Studio use this repository. No continuing two-repository synchronization is planned. |
| Backend | Django + PostgreSQL, selected after reviewing the backend comparison. |
| Personal-note trust boundary | App-level privacy is sufficient. Notes are hidden from the GM's normal application account; the VPS administrator is trusted. No client-side encryption or separate encryption-key recovery is required. |

## 3. Scope and proposed defaults

### Initial production scope

- Invitations, login/logout, account disabling, password changes, and administrator-issued reset codes.
- Campaign membership and GM/player roles.
- Character creation, assignment, editing, archiving, and read-only sharing.
- Server-enforced privacy for every registered sheet field, including image and collection fields.
- GM-only notes and author-only player personal notes, stored separately from sheet content.
- Private GM library, independent campaign copies, and manual selective updates.
- Online autosave with conflict detection.
- Right after launch: offline snapshots, offline edits that sync on reconnect, and account-aware cache removal.
- After that: portable exports and imports for accounts. Old local-format backups are not imported.
- Staging, production deployment, and tested off-VPS backups.

### Outside initial scope

- Public registration, payments, marketplace features, or anonymous character links.
- Two-way library synchronization, or resolving a conflict on the same field without asking the user.
- Collaborative text editing with multiple cursors.
- End-to-end encryption of personal notes or a separate client encryption-key recovery system; the owner selected application-level privacy.
- A separate database per GM, group, or campaign.

### Proposed operational defaults, not additional user decisions

- A campaign can have multiple GMs structurally, while the first interface only needs one.
- Campaign content remains available to the campaign when its creator leaves. Creator identity is provenance, not a permanent permission grant.
- Assigned players edit sheet content; only GMs manage assignment, campaign sharing, and archiving campaign records. Players may discard personal unsubmitted drafts.
- Personal notes stay with their author after reassignment and can be read separately without granting access to the reassigned sheet.
- No SMTP service is required for the agreed account flow.
- Default retention target: daily off-VPS backups, seven daily copies and four weekly copies, with a restore exercise before launch. Confirm storage destination and retention during deployment preparation.
- Version 1 favors correctness and permission isolation over real-time updates; refresh on focus and modest polling are sufficient initially.

## 4. Selected backend: Django and PostgreSQL

A **database** stores information. A **backend** receives requests, verifies identity and permissions, and decides what can be read or changed. Players must interact with the backend, not connect to the database directly.

Django is a Python backend framework; PostgreSQL is a separate database service. Django supplies authentication and session infrastructure, password hashing, an ORM, and an administration interface. Application-specific campaign and field permissions still need implementation; they are not automatically provided by Django's ordinary model permissions. [Django authentication](https://docs.djangoproject.com/en/stable/topics/auth/).

Use relational tables for accounts, membership, sharing, assets, and notes, and a JSON field for the flexible character sheet. Django supports JSON fields, including PostgreSQL-backed storage. [JSONField](https://docs.djangoproject.com/en/stable/ref/models/fields/#jsonfield).

The selected stack provides a conventional structure for explicit application services, migrations, and tests. It introduces Python alongside the TypeScript frontend and a database container. The frontend stays a React/Vite application; Django serves an API rather than replacing the frontend with templates.

| Component | Responsibility |
|---|---|
| React + TypeScript + Vite | Existing user interface, mock previews, online editing, and offline viewing and editing. |
| Django application | Authentication, campaign authorization, field projection, notes, safe mutations, imports, exports, and library updates. |
| PostgreSQL | Relational domain records, versioned sheet JSON, transactions, and concurrency data. |
| Private media volume | Protected portraits and gallery files, accessed through authorized backend routes. |
| HTTPS reverse proxy | Same-origin frontend/API routing and TLS termination. |

PocketBase was considered for its smaller initial setup but was not selected. Its custom privacy and synchronization requirements would still need implementation. The proposal now specifies one backend path.

The stated VPS is a reasonable starting point for this stack and a small group, assuming sufficient free resources and no competing heavy workloads. This is a planning assessment, not a performance measurement. Verify available RAM, disk, existing services, and concurrent build/staging load before deployment. Pin supported framework/database releases and test application migrations before upgrading.

## 5. Current application and specific changes

The local revision identified above uses the following. The complete accepted design remains a target architecture. The storage interface, mocks and backend have since been implemented in milestones 1–3; the table records the original observations.

| Source | Observed behavior | Planned change |
|---|---|---|
| [src/db.ts](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/db.ts) | Dexie database `MagistriScholaeDB`, declared versions 1 and 2; numeric-ID characters and string-ID familiars. | Preserve both table schemas and existing IDs during the local adapter refactor. **Since 8 November 2026:** retired with local mode in R3, without migration; the offline mode uses its own account-scoped database. |
| [src/App.tsx](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/App.tsx) | Direct loading, saving, deleting, and bulk import; replace import clears the table. | Route operations through application hooks. Remove unrestricted replace semantics. |
| [CharacterDetail.tsx](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/components/CharacterDetail.tsx) | `saveStateToDB` saves the whole character. | Use local drafts, explicit patches, a serialized save queue, and server revisions. |
| [CharacterForm.tsx](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/components/CharacterForm.tsx) | Reconstructs form state from known fields; stores custom skill defaults locally. | Distinguish hidden from missing fields; preserve server fields; move account/campaign presets behind an interface when shared. |
| [SettingsScreen.tsx](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/components/SettingsScreen.tsx) | Exports IndexedDB records; displays browser quota; clears local records on reset. | Permission-scoped export, import reporting, separate device-cache clearing, and accurate storage labels. |
| [src/types.ts](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/src/types.ts) | One complete Character type, numeric ID, embedded images; student/adult-wizard types. | Split sheet, saved record, and viewer projection types; add schema version and stable repeated-item IDs. |
| [public/sw.js](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/public/sw.js) | Broad network-first caching of successful GETs. | Cache allowlisted static assets only. Store authorized offline snapshots explicitly in account-scoped IndexedDB. |
| [package.json](https://github.com/SerjTargarien/Magistri-Scholae-web/blob/2518abd50809c3f59fab3dbb4e412ac6cc50a911/package.json) | Vite frontend; TypeScript check named `lint`; build script. | Keep these checks, add targeted permission and integration tests, pin reproducible dependencies. |

Existing `characterType` values describe student versus adult wizard, not PC versus NPC. These remain separate concepts. Existing `jugador` text is a display label, never evidence of account ownership.

Additional current-source responsibilities:

- `src/models/characterRegistry.ts` defines capabilities/tabs for student, adult wizard, and familiar archetypes. Keep it as the frontend registry instead of creating conflicting type lists.
- `FamiliarEditor.tsx` and `FamiliarDetail.tsx` access the familiars table and edit familiar portraits, journals, and galleries. Extract those paths alongside character storage.
- `Character.familiarId` and `Familiar.studentId` are linked references. Bond changes, cleanup, import remapping, and later campaign copies must keep them coherent.
- The current backup type allows optional `familiars` even under `backupVersion: "1.0"`. Support older files without this collection and verify current round trips instead of assuming all export/import paths preserve bonds.
- Preserve the new mobile profile banner, house crest components, and academy/classic styling. The first migration milestone is not a UI redesign.
- **Owner decision, 8 November 2026:** no aesthetic changes without a reason; any step that has a reason for a visible change may make it (owner decision, 8 November 2026, replacing the stricter rule of the transition and the R3.1 screenshot tests). New screens follow the existing academy and classic styles.

## 6. Roles and domain model

### Roles

- **Site administrator:** Creates the first GM, manages accounts and reset codes, and operates deployments. This is distinct from the campaign GM role.
- **Campaign GM:** Manages one campaign, its membership, sheet disclosure, and character assignment; reads campaign sheet content and GM notes, with the personal-note exception below.
- **Player:** Creates and edits own/assigned characters and reads explicitly shared character projections.
- **Read-only recipient:** A campaign member with an explicit share grant for a character; can only read the projected fields allowed to them.

**Owner's target design (9 November 2026; [product-design.md](product-design.md), Roles; built in R4):**

- **Player drafts:** a new player sheet is a draft in the player's private vault; **the GM does not see drafts at all**, an exception to the GM's campaign-wide read access. The player proposes a draft once and the GM confirms it as the player's character or as his own NPC; it is then an ordinary campaign sheet.
- **Sheet types and versions:** the GM changes a sheet's type and creates sheets based on another (independent copies within the campaign); temporary versions that stand in for a player's character are designed after R5. The GM also marks campaign sheets active or inactive (dead, travelling) to keep the main list short without archiving.
- **Deletion:** the GM can delete only an archived sheet, after several confirmations.
- **The GM creates campaigns** and assigns sheets he creates to players.
- **Administrator access with the GM's permission:** a change to the rule that the site administrator does not read campaign sheet content. The GM grants access to the whole campaign for an issue; it ends after 24 hours, when the GM withdraws it, or when the administrator marks the issue as solved. Read and change; every access is audited; personal notes stay excluded.
- **Campaign data beyond sheets** (R5): institutions, branches and schools (year groups, subjects, clubs, classes) are GM-owned campaign records that sheets link to; players read what appears on their sheets.

A user may be a GM in one campaign and a player in another. Authorization is campaign-scoped even when only one campaign exists initially. Every relationship endpoint must verify that referenced users, characters, and grants belong to the expected scope.

### Logical records

| Record | Essential fields and rules |
|---|---|
| User | ID, normalized unique username, display name, password hash, active state. Email optional and unused by initial registration. |
| Invitation | Hashed token, issuer, expiry, intended campaign/role, consumed timestamp. GM invitations restricted to site administration initially. |
| PasswordReset | User, hashed code, issuer, expiry, attempt/consumption state. Never store the plaintext code. |
| Campaign | ID, name, visibility-default policy and policy version, timestamps. |
| CampaignMembership | Campaign, user, GM/player role; unique pair. |
| Character | ID, campaign or private-library scope, library owner where applicable, creator, assigned player, kind, sheet JSON, schema version, revision, archive state, server timestamps, legacy provenance. |
| Familiar | Independent entity with ID, scope/ownership, profile/media/journal data, optional bond, revision, and legacy provenance. Preserve standalone and bonded records; define campaign access consistently with the bonded wizard before account-backed release. |
| CharacterShare | Character and recipient; read-only access, unique grant. Membership alone grants no access to another player's character. |
| FieldPolicy | Campaign defaults, character overrides, and player restrictions keyed by registered field/item identity. Implementation may use policy JSON plus validated services. |
| GMNote | Character, campaign, content, independent revision. Never included in player sheet payloads. |
| PersonalNote | Author, optional character reference and author-visible label, content, independent revision. Author-only; no GM read grant. |
| CharacterAsset | Character, stable asset ID, private storage key, size, MIME type, checksum, owning field/item identity. |
| LibraryLink | Source library character, campaign copy, enabled state, and per-field last-applied baseline. GM-only access. |
| ImportJob / ImportItem | Actor, source identity/fingerprint, per-item status, legacy-to-new-ID mapping, errors. |
| ProcessedOperation | Actor, operation ID, request fingerprint, outcome reference; prevents duplicate mutations on retry. |
| AuditEvent | Actor, scope, action, affected IDs, timestamp, safe metadata. No personal-note bodies or secret codes. |

Use a single shared database. Relational ownership and membership provide separation; multiple databases per GM are unnecessary.

Keep sheet mechanics together as versioned JSON initially. Extract fields into indexed columns only when justified by queries; authorization must still gate derived indexes and search results.

## 7. Privacy model

### 7.1 Two gates: access to the sheet, then access to its fields

A field being called public never grants access to the whole sheet. A viewer must first be a campaign GM, the assigned/owning player under the character's scope, or an explicitly authorized read-only recipient.

Use precise UI audience labels rather than an ambiguous public/private toggle:

- **GM only:** GM-authored restriction; hides the field even from the assigned player.
- **Assigned player and GM:** Visible to the character's player and GM, hidden from other players.
- **Shared readers:** Visible to those already granted read access to the sheet, its assigned player, and GM.
- **Personal note — only me:** Separate author-owned content, not an ordinary sheet audience.

GM-only constraints take priority. A player can narrow a field from shared readers to assigned player and GM, but cannot expose a GM-hidden field or hide ordinary sheet data from the GM. All changes are validated server-side.

### 7.2 Defaults and overrides

Provide campaign defaults by registered field, and a GM-selectable character default with field/item exceptions. Give the assigned player their own restrictions for other-player visibility. Resolve policy in this order: campaign defaults, GM character settings, GM field/item overrides, then player restrictions that may only narrow the permitted audience.

Private GM notes and personal notes do not inherit ordinary sheet defaults. New/unregistered fields fail closed for player disclosure until added to the field registry with an explicit audience. New player-created data must still be visible to its author unless a GM policy expressly restricts that field; the UI explains such restrictions before submission.

Changing defaults must preview the affected audience changes and require an explicit apply action. Existing explicit overrides remain in force. Showing a field for the first time is a disclosure action, not just a style change.

### 7.3 Every field, nested structures, and lists

Create a versioned field registry defining stable field keys, labels, value types, validation, and disclosure defaults. Include nested profile values, custom fields, list items, images, and journal entries. Repeated items need stable IDs; array positions cannot serve as permanent policy identifiers because items can be reordered.

Allow a whole section/list to be hidden, with individual leaf/item controls where applicable. A hidden parent dominates child settings. Migrate current string-only lists or supplement them with stable item metadata; the schema migration and UI adapter must agree on their representation.

### 7.4 Server projection and safe writes

The backend returns a viewer-specific projection, never the complete raw sheet for the frontend to hide. This applies equally to detail views, cards, exports, offline downloads, assets, revisions, and any future notifications.

Projection also covers indirect disclosures: search/filter/sort cannot use hidden values for an unauthorized viewer; cards and type-specific decoration cannot reveal a hidden type; filenames and error messages cannot expose secret content. Use neutral labels when a visible identifying field is unavailable.

Frontend forms operate on projected, potentially partial data. Hidden is not the same as an empty value or a missing legacy default. Saving must patch only authorized changed paths. Replacing a complete object assembled by a player would risk deleting or overwriting values the player cannot see.

### 7.5 Personal notes hidden from the GM

Store author-only notes separately. Their bodies and titles are absent from GM sheet responses, GM exports, library copies, sync previews, campaign history, and ordinary administrative screens. A GM cannot edit or promote them.

The author can choose **Move to character journal**. The server verifies author ownership and current write access to the destination, previews the new audience, and creates a GM-visible journal entry. The move and private-note removal complete atomically; copying instead can be offered explicitly. Notes never become public merely because assignment changes. Author-only notes on a reassigned/archived character remain available in the author's personal notes area without revealing newly added sheet data.

**Confirmed trust boundary:** Personal notes are private from the GM's normal application account. The owner trusts the VPS administrator and accepts that someone with operational access to the database or backups can read stored notes. No client-side encryption, encryption-key recovery, or special encrypted-note password-reset flow is required. Ordinary application administration screens and support workflows still exclude personal-note bodies; trusted operational access is not a reason to expose them through GM features. Backup encryption protects backup storage and is a separate operational control.

## 8. Accounts and account recovery

### Invitation and registration

1. An authorized administrator or campaign GM generates a single-use invitation for an allowed campaign role.
2. The server stores only a hash of a high-entropy token and an expiry; proposed invitation lifetime is seven days.
3. The invitation is handed to the intended person outside the app; the app need not integrate with email or messaging.
4. The person chooses a unique username, display name, and password.
5. Account creation, membership creation, and token consumption are atomic. Uninvited public registration stays disabled.

Normalize usernames consistently; a conservative initial policy is ASCII letters, digits, underscore, and hyphen with case-insensitive uniqueness. Display names can support Unicode separately. Never implement a custom password hash; use the selected framework's supported password facilities.

### Recovery without email

The administrator verifies the request out of band, then issues a single-use high-entropy reset code. Proposed lifetime is 15 minutes. The user submits the code and chooses a password. Rate-limit attempts, consume the code atomically, invalidate old sessions, and record a metadata-only audit event. Reset codes must not be logged or placed in reusable public links. The administrator does not need to know the user's password or read their notes.

Provide a documented SSH/console recovery procedure for the site administrator's own account. Avoid a circular dependency where the only administrator needs another administrator to recover access.

### Authentication implementation

Use Django's server-backed sessions with secure HttpOnly session cookies and CSRF-protected mutations. Production serves frontend and API under the same domain, keeping cross-site cookie handling out of the main workflow. Logout, password reset, and account disabling must have tested session-revocation behavior. [Django CSRF guidance](https://docs.djangoproject.com/en/stable/howto/csrf/).

Require authentication for uploads, exports, downloads, and all non-public data. Keep operational administrator credentials separate from normal GM play sessions. Account disabling and membership removal take effect on the next authorized online request.

## 9. API and frontend contract

### Repository boundary

```ts
interface CharacterRepository {
  list(scope: CharacterScope): Promise<CharacterSummary[]>;
  get(id: string): Promise<CharacterView>;
  create(input: NewCharacter, operationId: string): Promise<CharacterView>;
  patch(id: string, input: {
    expectedRevision: number;
    operationId: string;
    changes: FieldChange[];
  }): Promise<CharacterView>;
  archive(id: string, expectedRevision: number): Promise<void>;
}
```

This is a proposed interface, not existing code. `CharacterView` contains a projected partial sheet, viewer capabilities, an opaque or numeric concurrency token, and permitted disclosure metadata. It is distinct from the complete server-stored `CharacterSheet`. Auth, sharing, notes, media, imports, and library operations have separate service interfaces.

### Proposed application endpoints

| Endpoint family | Responsibility |
|---|---|
| `/api/v1/auth/*` | Login, logout, current user, invitation acceptance, password/reset operations. |
| `/api/v1/campaigns/*` | Campaign membership and settings. |
| `/api/v1/characters` and `/{id}` | Authorized lists, projected detail, create, patch, and archive. |
| `/api/v1/characters/{id}/sharing` | GM-controlled read-only grants. |
| `/api/v1/characters/{id}/visibility` | Validated default/override changes and preview. |
| `/api/v1/characters/{id}/gm-notes` | GM-only notes. |
| `/api/v1/personal-notes/*` | Author-only notes and explicit promotion. |
| `/api/v1/characters/{id}/assets/*` | Authorized upload and projected media access. |
| `/api/v1/library/*` | GM library and independent campaign copies. |
| `/api/v1/library-links/{id}/preview` and `/apply` | Selective source-to-copy synchronization. |
| `/api/v1/imports`, `/exports`, `/offline-snapshots` | Validated transfer and permission-scoped projections. |

Use stable string IDs, schema versions, bounded pagination, explicit error codes, and request-size limits. Respond with 409 for stale writes; do not expose an unauthorized latest sheet in the conflict response. Do not provide arbitrary JSON paths, SQL, or unrestricted relation expansion to callers.

The backend's read and write services are the only authoritative implementation of permission rules. The mock frontend approximates their behavior for previews; backend tests establish correctness.

### Django implementation mapping

Implement explicit services and permission checks called by Django API views; use framework authentication and migrations. Choose an API toolkit during implementation and generate or verify the frontend contract from a versioned schema. Use database transactions for multi-record operations and conditional revision updates or appropriate row locks for concurrent edits. [Django transactions](https://docs.djangoproject.com/en/stable/topics/db/transactions/).

Expose only approved application endpoints. Do not add generic model serializers or debug endpoints that return complete sheets and bypass projection. Protected media follows the same authorization services. PostgreSQL is available only to the backend on the private container network. The operational Django administration interface is restricted and is not a replacement GM interface; author-only notes are excluded from routine admin screens.

## 10. Editing and concurrent changes

Update local UI drafts immediately; queue online saves per character and debounce typing. Validate registered paths, types, limits, actor capability, and expected revision on the server. Compare the revision and write atomically, then return the authorized saved projection and new token.

Retrying an operation ID with the same request must not duplicate a change; reusing it with different content is rejected. After a timeout, retrieve the prior operation's result and re-project under current permissions. Store references/outcome metadata rather than retaining reusable unfiltered response bodies.

On conflict, preserve the local draft and show a permitted diff or reload/reapply choice. Never silently use last-write-wins for a whole sheet. Source timestamps from the server; imported original timestamps remain provenance.

Show saving, saved, unsaved, offline, and conflict states. Never carry a previous account's draft into another account.

**Revised 8 November 2026 (owner decision).** The earlier rule (disable editing when offline; no offline write queue) applies until offline editing ships (R7.2). After that:

- All edits go through one sheet store per sheet. It holds the viewer's projection, the unsent changes by path, the revision they are based on, and an operation ID per change. At launch the unsent changes live in memory; R7.2 keeps them in account-scoped device storage, so they survive a closed browser or a restarted phone.
- The offline state is shown, with the number of unsent changes. Editing stays enabled for the paths the offline scope allows.
- On reconnect, the changes are sent in order. A stale revision is not resolved by last-write-wins. The client compares the base projection, the latest projection and its unsent changes:
  - changes to paths the other edit did not touch are re-sent on top of the latest revision, with their original operation IDs;
  - changes to a path that also changed on the server are shown to the viewer, who chooses which value to keep.
- The server re-validates every change against current permissions. A rejected change is shown to the viewer and is never silently dropped or turned into a whole-record save.
- Logging out with unsent changes warns first, then clears them with the account's device data.

Separate note revisions from sheet revisions. Authorization/default-policy changes and asset changes must participate in appropriate version checks. Refresh visible data on return to the tab and revalidate after permission changes.

## 11. GM library and selective synchronization

**Owner, 9 November 2026:** this section is superseded by a far-backlog idea, a multiverse collection that copies characters between campaigns as independent copies or as linked representations updating on both sides (two-way, unlike below). It needs its own design when it is taken up; only one campaign is in use for now ([product-design.md](product-design.md), Recorded for later). The per-campaign Biblioteca del Máster (R5) is a different thing.

Creating a campaign copy gives it a new ID, independent revision, campaign assignment, and its own asset associations. Include an explicit decision for any linked familiar: copy the needed entity and remap the bond without retaining invalid cross-scope references. Record the source and last-applied baseline in a GM-only link when optional synchronization is enabled. The copy remains usable if the source is archived or the link is disabled.

Synchronization is an explicit GM action:

1. Read the library source, campaign target, and per-field last-applied baseline.
2. Produce a preview showing source changes, target changes, and fields changed on both sides.
3. Let the GM select field/item changes and resolve conflicts individually.
4. Recheck source revision, target revision, policy version, and GM rights at apply time.
5. Apply the selected changes atomically, recording per-field baselines and audit metadata.

Example: the library NPC gains a spell while the campaign copy loses stress points. The GM can import the spell without replacing stress. If the same ability changed on both sides, the preview requires a choice. There is never an automatic campaign-to-library write.

Exclude personal notes and campaign GM notes. Preserve target assignment, sharing grants, and campaign-specific values unless explicitly included by an authorized operation. Default to preserving target visibility; any wider audience needs a separate, explicit disclosure confirmation. Private source values must not leak through previews to players. Partial synchronization requires per-field baselines; one last-synced revision number is insufficient.

## 12. Offline viewing, offline editing, and device data

This is the new offline mode, built on the server's data model, planned right after launch: viewing in R7.1, editing in R7.2 (section 10). It is unrelated to the retired local mode and uses its own database, not `MagistriScholaeDB`.

Automatically refresh read-only snapshots for own/assigned sheets after online authorization. GMs explicitly download additional campaign or library sheets. Store only each viewer's projection and permitted assets, keyed by account, character, policy version, and snapshot time. Personal notes, when cached, live only in their author's cache namespace.

The service worker caches allowlisted static app assets, not authenticated API/media responses. Authorized offline snapshots use a dedicated IndexedDB store with deliberate retention and cleanup. Avoid copying the raw complete server record into a generic cache.

When online, check current access before rendering cached material; purge revoked sheets and replace snapshots after policy changes. Mark offline content clearly with its last-updated time. Offline access cannot discover permission revocation or remove previously downloaded information until reconnection. A browser copy is also not a guarantee against screenshots, exports, or deliberate extraction.

Unsent offline changes are stored in the same account namespace as the snapshots and follow the rules in section 10. The offline scope (which actions work offline) is decided at the start of R7.2; administration, invitations, sharing and note promotion stay online-only.

Logout clears account-specific snapshots, assets, personal-note caches, drafts, and unsent changes in all app tabs. Offline logout clears locally immediately, marks the account logged out, and schedules server-session revocation before the next online authenticated workflow. An old cookie must not silently restore the logged-out offline view.

Treat cached data as information stored on that device. V1 assumes a trusted browser/device for offline access; protection from someone controlling the device would need a separate local-lock/encryption design. Do not store plaintext passwords or administrator tokens merely to enable offline viewing.

## 13. Images, exports, and imports

### Images

Keep the existing crop/compression UI. Upload validated image bytes to private server storage and reference assets by stable ID. Enforce size, type, and decoded-image limits on the backend. Images inherit their owning field's disclosure; raw filesystem paths are not publicly served. Exclude private images from unauthorized thumbnails, exports, and offline bundles.

Copies receive independent asset associations and safe deletion behavior. Physical deduplication can wait. An expired runtime URL must not become a permanent stored sheet value.

### Exports

**Owner clarification, milestone 2:** Characters and familiars are independent entities and should have separate import/export operations. Implement the transfer change after the backend foundation is solid; retain milestone 1's legacy combined-backup compatibility meanwhile. Account-backed familiars have independent assigned players and read-only shares. A bond grants no access to either entity and transfers no ownership or personal notes.

Produce versioned portable exports with actual permitted media, not expiring URLs. Introduce a new format for remote IDs, schema versions, and media packaging. The old local `backupVersion: "1.0"` is not imported into accounts (owner decision, 8 November 2026); it remains readable by local mode until R3 retires it.

Player exports include only their currently authorized projection. GM campaign exports exclude author-only player notes. A personal-note export is a separate author action. Administrative disaster-recovery backups are separate from user exports and are not accessible through GM campaign tools.

### Migration of existing browser data

**Not needed (owner decision, 8 November 2026):** the only records in the old local format are the owner's test data, so nothing is migrated. The plan below is kept for reference only.

1. Recover and inventory the existing deployment without deleting it.
2. Export from the old site in every browser with data worth keeping. Hosting files on a VPS does not imply its IndexedDB character data exists there.
3. Identify the exact Vercel production commit, inspect real deployed-version exports, and compare them with the current repository model. The local source now declares Dexie version 2 with familiars. Handle both characters-only older exports and newer familiar-capable exports; do not assume the live deployment uses the same schema as local HEAD.
4. Run a server-validated dry run with counts, warnings, defaults, media totals, ownership assignment, and destination campaign.
5. Import with new string IDs, stable nested-item IDs, provenance, per-item reporting, and safe retries. Map old character/familiar IDs together, update both bond directions, and keep unbound familiars. Characterize existing import/reference gaps before reuse.
6. Verify representative sheets, images, notes, and totals on a second browser.
7. Keep originals until the owner explicitly retires them.

Legacy `jugador` text does not assign accounts. Existing journal notes are imported as ordinary GM-visible sheet notes; never assume that an old note was author-only. Offer a clear choice to move selected notes to personal storage after account ownership is established.

Use import job IDs plus source-instance/record mappings where available. Exact file fingerprints protect exact retries; separate exports of overlapping data still need duplicate review. Names and numeric browser IDs are not globally unique. There is no unrestricted shared-database replace or wipe operation.

## 14. Frontend development in Google AI Studio

### Repository layout

```text
src/
  components/                React screens
  contracts/                 Generated/verified API view and mutation types
  storage/                   Repository interfaces and adapters
  hooks/                     Loading, drafts, saves, and offline state
  auth/                      Account UI and authentication adapter
  fixtures/                  Fictional preview characters and roles
backend/                     Django application and migrations
docs/
  design.md
  storage-contract.md
  frontend-development.md
deploy/                      Docker, proxy, backup, and restore configuration
```

Keep the current frontend root initially so AI Studio continues finding its Vite project. Use a single repository with independently built frontend/backend artifacts. A monorepo reorganization is not a prerequisite.

### Three environments

| Environment | Behavior |
|---|---|
| AI Studio preview | Mock data and simulated roles; no production credentials or real player content. |
| Staging | Real backend with fictional accounts and a separate database/media store. |
| Production | Live backend and real account data on the VPS. |

Proposed flag: `VITE_STORAGE_MODE=local|mock|remote`, plus a public backend base URL when required. During milestone 1, local is the default and only local/mock are implemented. The final account-backed production release selects remote and rejects accidental mock production builds. Never silently switch modes when a remote request fails. Frontend environment values are browser-visible configuration; secrets remain in server-only configuration. [Vite environment variables](https://vite.dev/guide/env-and-mode).

Mock fixtures must cover redacted fields, partial views, player-only notes, GM-only values, read-only sharing, expired login, failed saves, conflicts, and offline status. A demo banner distinguishes simulated state. The UI's hidden-field defaults must never become unintended writes.

### Editing cycle

1. Pull or import the latest reviewed state of `SerjTargarien/Magistri-Scholae-web` into AI Studio. This is the same canonical repository used by Codex; do not repeat the historical repository consolidation.
2. Work in mock mode using fictional data.
3. Request UI changes against existing hooks and contracts.
4. Sync/export changes to a feature branch, or use an editing fork if branch controls are limiting.
5. Review the diff; run type/build checks and affected tests.
6. Exercise the real staging API for storage-dependent changes.
7. Merge and deploy a frontend artifact; pull the merged state back before the next editing session.

Google documents GitHub import and two-way synchronization in AI Studio. Its deployment options do not require abandoning the VPS for this architecture. The workflow should still accommodate ZIP export if the connected project has integration limitations. [AI Studio build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode).

Suggested agent instruction:

> Use the existing repositories, hooks, viewer capabilities, and fixture roles. Preserve partial/hidden-field semantics. Do not access IndexedDB directly from components or introduce a new backend. Treat changes to contracts, field defaults, authentication, privacy, or backend services as explicit cross-stack work. Run the TypeScript check and production build, and report any contract changes.

Instructions guide agents; tests and code review enforce the boundary. Additive fields require a registered schema/default decision and a fixture, not just a new input. Keep HMR/environment behavior already used by AI Studio unless a task specifically changes it.

## 15. Deployment and operations

### Confirmed deployment discovery

| Evidence | Finding |
|---|---|
| Hosting discovery | Before 7 November 2026 the public site was served through Vercel; it is now served from the Contabo VPS, with DNS at Porkbun (see project-state). Registrar, DNS records, Vercel project settings and the Contabo VPS inventory are recorded in `docs/infrastructure.local.md`, a git-ignored file kept only on the owner's machine. |
| Earlier repository comparison (historical) | Before consolidation, 25 common files matched the old AI Studio snapshot and the web repository additionally had `.env.example` and `package-lock.json`. This comparison is superseded and must not guide file restoration. |
| Current local inspection after consolidation | HEAD `2518abd50809c3f59fab3dbb4e412ac6cc50a911` includes familiars, bonds, an archetype registry, and newer visuals. A root lockfile and `.env.example` were not present in that checkout; both were added in milestone 1. Both tools now work from the canonical web repository. |

Record the exact current production deployment commit before assuming the connected repository's latest branch is what users receive. Existing site content can remain on Vercel during development. The proposed all-VPS deployment below is a future topology, not a description of the current setup. A split Vercel frontend/Contabo backend would require an explicit routing/session design before adopting it.

### Complete the VPS inventory

The owner has recovered interactive Linux access. Establish a repeatable SSH workflow and record the OS, Docker/Compose configuration, exposed ports, existing services, mounted volumes, available resources, and backup status. Domain/DNS routing and frontend hosting are now identified above; any historical VPS proxy and HTTPS setup remain to be inventoried. Avoid commands that print complete container environments containing secrets.

Useful read-only commands, to run on the VPS after access is recovered:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker compose ls
df -h
free -h
ss -lntp
```

Save relevant Compose/proxy configuration and back up mounted data before replacing anything. The absence of current users makes a planned cutover practical; it does not establish that the VPS has no other workloads or data.

### Proposed deployment

```text
Internet / HTTPS
      |
Reverse proxy
      +-- /             React static frontend
      +-- /api/v1/*     Django application
                            +-- PostgreSQL (private network)
                            +-- Private media volume
```

Use Docker Compose if discovery finds no established manager worth keeping. Reuse a functioning proxy when practical; otherwise Caddy or Nginx can terminate HTTPS. Keep the database off public ports and protect operational administration routes separately. Do not add Redis, a job queue, Kubernetes, or object storage without a concrete need.

Build immutable images with pinned versions and dependency locks. Run schema migrations as a controlled deployment step after staging verification and backup. Deploy the backend's compatible API before a frontend that depends on it. Frontend-only releases must not rebuild or replace database volumes.

Use separate Compose services for the Django application and PostgreSQL, persistent database/media volumes, and a production Django application server. Package migrations with the backend image. Use the existing reverse proxy if suitable; otherwise include a proxy service. Run migration and administrator-bootstrap commands as deliberate deployment operations, not on every frontend startup. No SMTP container is needed for the agreed account workflow.

### Backups and recovery

Use supported PostgreSQL dumps plus media and configuration backup. Coordinate database and media snapshots so referenced assets remain restorable; a plain live file copy is not assumed consistent. [PostgreSQL dump documentation](https://www.postgresql.org/docs/current/backup-dump.html).

Encrypt off-VPS backups, restrict their access, and keep restoration keys separately recoverable. No destination has been supplied yet; choosing and testing one is a launch prerequisite. Proposed recovery targets are at most 24 hours of lost data and restoration within one working day, subject to a real restore exercise.

Application account-level privacy does not exclude personal notes from operator disaster-recovery backups. Those backups remain inaccessible to normal GM features. Define retention and deletion behavior clearly for users.

Rollback restores compatible application images; schema rollback is not assumed automatic. Prefer additive migrations and retain a tested database/media restore path for incompatible changes. Preserve the old deployment or a restorable snapshot through the initial acceptance period.

## 16. Implementation phases and release gates

| Phase | Work | Evidence required to finish |
|---|---|---|
| 0. Discovery and preparation | Record the selected Django/PostgreSQL and app-level privacy decisions; recover VPS details and sample old backups. | Resource inventory, recoverable old deployment, real import samples, and deployment configuration plan. |
| 1. Frontend storage boundary | Extract character/familiar/bond and backup persistence; add local and isolated mock adapters, future projection types, and fixtures. | Existing entity data and relationships survive; components no longer own direct table writes; local/mock previews and focused round trips are verified. |
| 2. Accounts and domain API | Implement invitations, username auth, reset codes, campaign ownership, field projection, notes, and path-level writes. | Two players and a GM pass permission tests; ordinary GM cannot read personal notes; no raw-API bypass. |
| 3. Editing and media | Save queue, revisions, operation IDs, protected image handling, journal promotion. | Rapid edits, retries, stale revisions, hidden fields, and asset access tested end to end. |
| 4. Library and sharing | Private library, independent copies, grants, defaults, selective update preview/apply. | Per-field sync baselines and source/target revision checks work; no surprise disclosure or note copying. |
| 5. Transfer and offline | Portable account exports and imports, account-scoped offline snapshots, offline edits with sync, and cache cleanup. The legacy importer was dropped on 8 November 2026. | Verified imports and duplicate handling; offline contains only viewer-authorized data; offline edits merge or ask, never overwrite; account switching isolates data. |
| 6. Staging and launch | Deployment scripts, backups, restore exercise, operating instructions, fresh cutover. | Staging sign-off, database/media restoration, retained originals, production smoke checks. |

These phases define the evidence each area needs. Since 7 November 2026, [implementation-plan.md](implementation-plan.md) owns the order of delivery: releases R0–R7, aiming at an early Contabo launch.

Phases can produce useful staging checkpoints. Do not launch an intermediate build that exposes complete sheets while promising field privacy or GM-hidden personal notes. Those promises require their full server enforcement before real users enter such data.

## 17. Acceptance criteria

### Accounts and scope

- An invitation is consumed once; uninvited registration fails.
- A reset code expires, cannot be reused, and invalidates prior online sessions.
- A player cannot grant themselves a GM role, change another campaign, or assign an arbitrary user through a forged request.
- One user's GM role does not carry into another campaign.

### Privacy

- A hidden field's value is absent from detail responses, cards, search/filter results, exports, offline snapshots, assets, and errors for an unauthorized viewer.
- A player can hide a field from read-only recipients but cannot hide ordinary sheet content from the GM.
- GM-only fields are absent even from the assigned player's view and cannot be changed by that player.
- Author-only notes are absent from GM application queries and exports; reassigning a character does not reveal them.
- Promotion of a personal note shows its new audience and is atomic.
- Changing a visible field never clears an unrelated hidden value.

### Editing and copies

- Stale saves fail without overwriting newer data; a timeout retry does not apply the same operation twice.
- A library copy is independent; deleting/archiving its source does not delete it.
- A selected spell update does not overwrite campaign stress, notes, assignment, or grants.
- A source or target change after sync preview invalidates stale application.

### Offline, transfer, and operations

- Own/assigned snapshots refresh automatically; GM additional downloads are explicit.
- Logout clears account-local data, including unsent changes, across tabs, after warning about unsent changes.
- Reconnection revalidates access before reusing snapshots.
- An offline edit to a field nobody else changed is saved on reconnect; an offline edit to a field that also changed on the server asks the viewer; a change the server rejects is shown, not lost.
- Account exports and imports preserve characters, familiars, images, and valid bond references through ID remapping.
- Player and GM exports respect their different projections; portable images survive a round trip.
- A frontend-only deployment retains all database and media data.
- A backup can restore accounts, characters, policies, notes, and referenced media on a clean test deployment.
- AI Studio preview requires neither a running production backend nor real account credentials.

Keep checks proportionate: retain `npm run lint` and `npm run build`; add backend permission/transaction tests and a small set of end-to-end workflows covering the above boundaries. No existing test suite was assumed.

## 18. Confirmed architecture and remaining preparation

### Confirmed by the owner

1. **Backend:** Django + PostgreSQL for the full requirements.
2. **Personal-note confidentiality:** Application-level privacy is sufficient. The GM's normal app account cannot read another user's personal notes; the VPS administrator is trusted. Client-side encryption is outside the agreed scope.

### Still to establish during implementation and deployment preparation

1. **Infrastructure discovery:** completed during R1 (7 November 2026). The Contabo inventory is recorded locally, and the domain cutover is done, with DNS at Porkbun. The old Vercel production commit was never pinned down and is no longer needed, because browser data stayed on the same origin.
2. **Backup destination:** Choose an off-VPS location and verify the proposed recovery targets.
3. **Technical packaging:** Select supported pinned release versions, the Django API toolkit and application server, and the production/staging configuration. These are implementation decisions within the selected architecture.

The architecture decisions needed to begin the storage-interface refactor and Django backend are now settled. Infrastructure discovery and backup verification remain launch prerequisites. This document describes the implementation; no production deployment or repository modification is represented as completed.
