# Backend API v1 — milestones 2 and 3

Implemented as explicit Django JSON views. All success responses currently use HTTP 200. IDs are UUID strings. Routes have no trailing slash. Mutating requests require `Content-Type: application/json`, the session cookie when authenticated, and an `X-CSRFToken` header. Use `GET /api/v1/auth/csrf` first; login returns a freshly rotated CSRF token. Anonymous registration/reset still require CSRF.

Errors have shape `{ "error": { "code": "..." } }`. Principal statuses: 400 invalid request, 401 unauthenticated, 403 forbidden/CSRF, 404 inaccessible or absent, 409 stale revision/conflict, 413 oversized request/image, 415 wrong content type, 429 rate limit. Conflicts never include the latest unfiltered record. All API responses are non-cacheable. There is no raw model serializer, admin data browser, public filesystem media route, import/export endpoint or registration without invitation.

## Mutation retries

Remote clients supply UUID `operationId` on entity creation/patch/manage/share/visibility-apply/bond, asset upload, personal-note create/edit/delete/promotion-apply and GM-note edits. Existing v1 requests without an ID retain compatibility but cannot claim retry deduplication. Auth and signed preview routes do not accept operation IDs. Do not attach IDs to unsupported account/campaign administration requests.

An actor-scoped operation ID binds to the method, route and exact body, including expected revision. Reusing it with another request yields `409 operation_reused`. Retrying the identical request returns the current authorized projection/note, without reapplying a mutation. Revoked access returns denial. Receipts store keyed request fingerprints and outcome references, never reusable response/note bodies. The operation and receipt commit together; concurrent retries serialize. Unknown outcomes must retry the same body/ID before generating a new one. Explicit conflict reconciliation creates a new operation with a newly fetched revision; no whole-record last-write-wins exists.

## Accounts and campaigns

| Route after `/api/v1/` | Method / body / result |
|---|---|
| `auth/csrf` | GET → `{csrfToken}`. Public. |
| `auth/login` | POST `{username, password}` → `{user, csrfToken}`. Usernames normalize to lowercase, 3–30 ASCII letters/digits/underscore/hyphen. |
| `auth/logout` | POST `{}` → `{}`. |
| `auth/me` | GET → `{id, username, displayName, isAdministrator}` for this account only. |
| `auth/invitations` | POST `{campaignId, role: "player" or "gm"}` → `{token, expiresAt}`. Campaign GM or site administrator; GM-role invitations require administrator. |
| `auth/register` | POST `{invitationToken, username, password, displayName?}` → `{user}`. Does not log in automatically. No required email. |
| `auth/reset-codes` | POST `{userId}` → `{code, expiresAt}`. Site administrator only. |
| `auth/password-reset` | POST `{code, newPassword}` → `{}`; invalidates all old sessions. |
| `auth/password-change` | POST `{currentPassword, newPassword}` → `{}`; signs out all old sessions, including this one. |
| `admin/users/{userId}/state` | POST `{active: boolean}` → `{}`. Site administrator only; disable/re-enable invalidates old sessions. |
| `campaigns` | GET → `{items: [{id, name, policyRevision, role}]}`; current memberships, or operational summaries for site administrator. `role` is the viewer's own role in that campaign (`"gm"`, `"player"`, or `null` for an administrator who is not a member). POST `{name}` creates a campaign, administrator only. Creation does not grant the operator a GM role. Issue a GM invitation or add an existing account explicitly. |
| `campaigns/{id}/members` | GET lists `{userId, username, role}` to that campaign's GM. POST `{userId, role: "player", "gm", or null}` adds/changes/removes an existing account. GM-role changes require administrator; last GM cannot be removed. New accounts still need invitations. |
| `campaigns/{id}/visibility/preview` | POST `{expectedRevision: number, defaults}` → current/proposed defaults, signed preview token and expected revision. GM only. |
| `campaigns/{id}/visibility` | POST `{expectedRevision, previewToken}` → `{policyRevision}`. GM only. |

List routes accept `limit` (1–100, default 50) and `offset` (0–100000). Entity lists also require `campaignId`. Other query filters, including free-text search or sorting by hidden fields, are rejected. No unbounded full-account export endpoint exists.

## Separate entity endpoints

The following route families exist independently under **`characters`** and **`familiars`**. They share a discriminated relational `Sheet` model for common policy logic, with separate first-class records and no inherited ownership. A `Bond` has one-to-one constraints on each side; services additionally validate entity kind and campaign.

| Suffix | Methods / body |
|---|---|
| collection | GET `?campaignId={id}&limit=50&offset=0`; POST `{campaignId, fields, assignedPlayerId?}`. Player creation assigns self and rejects forged assignment; GM may assign an active campaign member or leave unassigned. |
| `/{id}` | GET a projected view; PATCH `{expectedRevision, changes: [{path, value}]}`. 1–100 non-overlapping changed paths. |
| `/{id}/manage` | POST `{expectedRevision, assignedPlayerId?, archived?}`. GM only. Archived entities disappear for players; GM can restore them. |
| `/{id}/sharing` | GET recipient IDs/access; POST `{expectedRevision, recipientId, grant: boolean}`. GM only, same-campaign active recipient. Shares are always read-only. |
| `/{id}/visibility` | GET current policy (GM) or own restrictions (assigned player); POST `{expectedRevision, previewToken}` applies a preview. |
| `/{id}/visibility/preview` | GM POST `{expectedRevision, defaultAudience?, overrides?}`; assigned player POST `{expectedRevision, restrictions}`. Returns proposed policy, changed path audiences and a signed preview token. |
| `/{id}/bond` | POST `{expectedRevision, targetId: UUID or null, targetRevision?}`. Target revision required when linking. Player must edit both sides and any displaced partners; GM may manage all within the campaign. |
| `/{id}/gm-notes` | GET `{content, revision}`; PATCH `{expectedRevision: number, content}`. GM only; use revision 0 when creating the first note. |
| `/{id}/assets` | POST `{operationId, expectedRevision, path, imageBase64}` atomically attaches a decoded image to a media path and returns the updated projection. |

Example projected entity:

```json
{
  "kind": "viewer-projection",
  "id": "00000000-0000-0000-0000-000000000001",
  "entityType": "character",
  "campaignId": "00000000-0000-0000-0000-000000000002",
  "schemaVersion": 1,
  "revision": "opaque-viewer-bound-token",
  "fields": { "nombre": "Fictional Luna" },
  "capabilities": { "readablePaths": ["nombre"], "writablePaths": [] }
}
```

`assignedPlayerId` and `archived` metadata are GM-only. `bondId`, when present, is the counterpart entity's UUID and requires independent access to it; it is not an access grant. Hidden fields are absent, not replaced with empty strings. `readablePaths` describes projected leaves. `writablePaths` also includes registered absent scalar paths the actor may create; this authorizes an input, not a blank default write. `collectionPaths` permits new stable items; `removablePaths` lists entirely writable projected items. `bondWritable` and `isGM` describe available actions. These are UI hints; every mutation independently validates actual paths/current permissions. The remote React adapter consumes this envelope directly without converting it into a complete local entity.

## Field registry and policies

`GET /api/v1/schema` returns the public versioned registry to authenticated accounts. Generated TypeScript is checked against this registry. Current frontend field names/archetype values are retained, but remote collections require stable item IDs. For example:

```json
{
  "notasList": [
    { "id": "note-1", "titulo": "Demo", "contenido": "Fictional journal", "fecha": 1790000000000 }
  ],
  "complicaciones": [ { "id": "flaw-1", "value": "Fictional flaw" } ]
}
```

Paths use registered names and stable IDs, e.g. `adultWizardProfile/reputation` or `notasList/note-1/contenido`. Array indices are not identities. IDs must be unique ASCII letters/digits/underscore/hyphen, up to 64 characters. Lists hold at most 500 entries. An item path accepts its registered object to add/replace an item, or `null` to remove it; replacing/removing unseen children remains forbidden. Missing object/list parents are initialized only for explicit mutations. New entities require a nonempty name; fields/types/enum values are validated. Ordinary request bodies are bounded to 1 MiB; the image endpoint allows 6 MiB JSON for base64 overhead. Journal `fecha` values are milliseconds with JavaScript Date's range; ordinary numeric fields retain the 1e12 bound.

## Private images

Media fields contain a UUID or empty value, never a raw path/public URL. `GET assets/{id}` requires a current session, independent entity access, field visibility and that the field still references this asset. Responses are PNG with `no-store, private`, `nosniff`, same-origin resource policy and generic filename. Permission changes, reassignment, detach/replacement and archive rules apply on the next request. A downloaded copy already held by a viewer cannot be recalled.

Upload uses raw base64 bytes, without a data-URL prefix; PNG/JPEG/WebP are detected by decoding rather than trusting filenames/MIME. Input/output limit is 4 MiB, decoded limit 16 million pixels, maximum side 8192, no animation. The server re-encodes PNG without source metadata. Asset references must match their owning sheet and exact stable field path; assigning another sheet's/field's asset is rejected, including through section replacement. Create sheets before uploading. Gallery items are added with an empty media value, then uploaded through their `galleryImages/{itemId}/value` path. Detach uses an ordinary revision-checked patch to `null`; old files remain retained but inaccessible pending operational reclamation. Existing local images are not uploaded automatically.

Audiences are `gm`, `assigned`, `shared`. Entity access is checked first; `shared` never makes an entity publicly accessible. Policy resolution is campaign defaults, explicit entity default, entity field/item overrides, then player restrictions. The entity default `inherit` uses campaign policy; otherwise it replaces campaign defaults while retaining explicit entity field exceptions. Without any explicit default the fallback is `assigned`. Explicit parent restrictions dominate children. Player restrictions narrow shared-reader visibility and never hide ordinary fields from the GM or assigned player.

Campaign defaults are a map such as `{ "character": { "*": "assigned", "notas": "gm" }, "familiar": { "*": "assigned" } }`. A campaign preview replaces that defaults map deliberately. Sheet `overrides` is a patch map: `null` removes that explicit exception, while other existing exceptions survive. Assigned-player `restrictions` is a patch map of path → boolean; false removes the player's restriction. Neither operation may bypass GM rules.

Policy preview tokens expire after five minutes and are tied to actor, entity/campaign, role and current revision. Applying a stale, tampered, expired or another actor's token fails. `audienceChanges` lists affected existing paths and before/after audience, without content. Campaign preview returns current/proposed defaults; the future permission UI must show these before apply. Campaign policy/member changes invalidate sheet revision tokens; ordinary GM/private notes have independent revisions.

Assigned-player policy metadata omits restriction paths that a GM has since hidden. Signed preview tokens are readable, so player tokens carry only the currently authorized restriction patch; applying it preserves other hidden restrictions internally. No private field content enters a preview token.

## Personal notes

- `GET personal-notes?limit=50&offset=0` returns only the current author's notes. No other-author/search filter is accepted.
- `POST personal-notes` takes `{title, content, label?, sheetId?}`. A referenced sheet must currently be accessible. The label is author supplied and never resolved against a sheet after reassignment.
- `GET personal-notes/{id}` returns `{id, sheetId, label, title, content, revision}` only to the author.
- `PATCH personal-notes/{id}` accepts `{expectedRevision: number, title?, content?, label?}`.
- `DELETE personal-notes/{id}` requires `{expectedRevision: number}`.

GM and site-administrator API accounts receive 404 for another author's note, including mutations. Notes remain available to their author after sheet reassignment, archiving or membership removal, without restoring sheet access. They are absent from all ordinary entity/GM responses.

- `POST personal-notes/{id}/promote/preview` accepts `{sheetId, expectedRevision, noteRevision}`. Only the author may preview, with current journal write access. Returns `previewToken`, per-journal-field `audiences`, the author's own title/content and `sourceWillBeDeleted: true`. Audience `shared` means GMs, assigned player and explicit shared readers, not public access.
- `POST personal-notes/{id}/promote` accepts the same references plus `{previewToken, operationId}` after explicit audience confirmation. It atomically adds a new stable journal item and deletes the personal source. Author, sheet, note revision, sheet/policy revision and five-minute preview expiry are checked again. Any failure preserves the private source and journal. Retries resolve to the current permitted destination projection without duplicate publication. Preview tokens contain references, not private note bodies.

## Deferred work

Private libraries and selective synchronization belong to milestone 4. Separate entity transfer and account-aware offline snapshots belong to milestone 5. Preserve old local combined backups until replacement transfer tooling is implemented and verified. Full administration/permission screens and production media lifecycle/backup hardening remain ahead. Deployment is a separate milestone.

See [backend setup](../backend/README.md), [storage boundary](storage-contract.md), and [project checkpoint](project-state.md).
