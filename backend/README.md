# Backend — milestones 2 and 3

Django-native JSON views, PostgreSQL, server-backed sessions and explicit domain services. React/Vite remains at the repository root, with local/mock selection preserved and explicit remote mode implemented. No Vercel, DNS or VPS configuration is changed.

Verified on Windows with Python **3.14.7**, Django **5.2.18**, psycopg **3.3.6**, PostgreSQL **18.6**, Docker Engine **29.8.2** and Compose **5.6.0**. Python dependencies are pinned, including transitive dependencies, in `requirements.txt`; `.python-version` records the tested Python runtime. Django 5.2 is the selected LTS series; consult the [official supported-version table](https://www.djangoproject.com/download/) when updating its security patches. Linux/production packaging has not been tested here.

## Local setup (PowerShell, repository root)

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Copy the example only for initial setup; retain an existing `.env`. It contains intentionally public development-only credentials, never production secrets. You may generate a local signing key without printing it using:

```powershell
backend/.venv/Scripts/python.exe -c "import secrets; from dotenv import set_key; set_key('backend/.env','DJANGO_SECRET_KEY',secrets.token_urlsafe(64))"
```

Start Docker Desktop, then:

```powershell
docker compose --env-file backend/.env -f compose.dev.yaml up -d --wait
backend/.venv/Scripts/python.exe backend/manage.py migrate
backend/.venv/Scripts/python.exe backend/manage.py createsuperuser --username operator
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

The superuser command prompts for a password; no email is required. It creates an operational account, not an automatic GM for every campaign. There is no Django admin data browser. Account administration uses the explicit API or trusted management shell. If the operator loses their password, use `manage.py changepassword operator` interactively on the trusted host; it invalidates old sessions through Django's password hash. Do not put real passwords in command arguments or environment variables intended for the frontend.

On Linux/macOS use `backend/.venv/bin/python` and the corresponding shell file-copy command. Docker Compose runs PostgreSQL only, at `127.0.0.1:55432`, in the named `magistri-development` project and its own persistent volume. It does not touch IndexedDB or other Docker projects. `docker compose --env-file backend/.env -f compose.dev.yaml stop` stops this development service without deleting its volume. The database role is for development/tests, including creation of Django's isolated test database; it is not a production least-privilege setup.

The API is at `http://127.0.0.1:8000/api/v1`. Start `npm run dev:remote` in another terminal; it serves `http://127.0.0.1:3002/` and proxies `/api` to Django. Browser requests remain same-origin, with session cookies and CSRF. Development settings trust precisely the loopback frontend origins on port 3002. Changing that port requires updating `DJANGO_CSRF_TRUSTED_ORIGINS`. Production uses same-origin routing and secure cookies; the development proxy is not deployment configuration.

## Isolated fictional browser preview

For testing without real accounts or development records, use this explicit alternate database and media directory. PostgreSQL must already be running:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py prepare_remote_preview --settings=config.preview_settings
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000 --settings=config.preview_settings
npm run dev:remote
```

Run the final two commands in separate terminals. The preparation command creates only loopback `magistri_preview`, applies migrations and seeds fictional `preview_gm`, `preview_alice` and `preview_bob`, with public test password `Fictional-preview-only-42!`. It refuses ordinary settings and preserves an existing preview rather than resetting it. Alice owns a student, an adult wizard and a familiar; Bob has a read-only student share. A reputation field is GM-only. Media is isolated in ignored `backend/.tmp/preview-media/`. Never enter real data or use these credentials outside this fictional loopback preview. This is a real API preview, distinct from backend-independent `npm run dev:mock`.

## Verification

```powershell
backend/.venv/Scripts/python.exe backend/manage.py check
backend/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
backend/.venv/Scripts/python.exe backend/manage.py export_api_contract --check
backend/.venv/Scripts/python.exe backend/manage.py test domain.tests --settings=config.test_settings --noinput
backend/.venv/Scripts/python.exe -m pip check
npm test
npm run lint
npm run build:mock
npm run build
```

Backend tests use a separate `test_magistri_dev` PostgreSQL database, destroyed after each run; they never reset the development database. Concurrency tests assert PostgreSQL explicitly, rather than silently using SQLite. `config.test_settings` uses a fast test-only password hasher and loopback HTTP; an additional test checks the actual production PBKDF2 hasher. Do not use test settings to run an application service. The live HTTP test exercises a real loopback server, cookie jar, CSRF, login, create/patch and logout inside the test database.

To regenerate the public frontend field registry after a reviewed schema change:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py export_api_contract
```

It writes `src/contracts/fieldRegistry.generated.ts`; no accounts or entity values enter that file. Tests compare generated source and verify registry coverage against existing frontend entity fields/archetypes. `src/contracts/api-v1.ts` defines projection/mutation types consumed by the separate `src/remote/` adapter; they are not complete local records.

## Security and scope

- All entity access first requires campaign membership plus GM status, assignment or an explicit read-only share. Site administration alone does not grant campaign sheet or personal-note reads. A GM role in one campaign does not carry to another.
- Every sheet response, including list results, is projected on the server. Hidden fields, list leaves and identifying archetype fields are omitted. Unknown fields fail closed for players. Lists accept only campaign, limit and offset; hidden-value search/sorting is not provided.
- Field changes are allowlisted paths with viewer-bound revision tokens. Complete PUT/replacement saves are absent. Bulk section/list changes cannot remove hidden descendants. All campaign-domain writes serialize through the campaign row lock, including permission changes and bonds. Remote mutations carry operation IDs; atomic retry receipts store only keyed fingerprints and outcome references, and replays project under current access. Per-sheet online queues serialize saves and retain uncertain requests verbatim in memory.
- GM defaults and overrides, campaign defaults and player restrictions have explicit preview/apply endpoints. Preview tokens contain policy only, are actor/revision-bound, expire after five minutes and cannot apply after intervening changes. Explicit parent restrictions dominate child policies. Ordinary sheet data remains visible to the campaign GM.
- Personal notes are separate author-owned rows. Their titles/content never enter sheet projections, GM notes, membership responses or ordinary audit records. They remain with the author after reassignment/removal. GM notes have separate revisions and GM-only endpoints. Author-controlled promotion previews the destination/audiences, then atomically adds a journal item and deletes the source note; stale, expired or tampered previews cannot publish it.
- Familiars are independent entities with their own assignment, visibility and shares. A bond grants no access, transfers no notes and is shown only if the viewer can independently access both entities. Players must be able to edit both entities, including displaced partners; GMs manage cross-owner bonds within their campaign.
- Invitations are seven-day, single-use tokens; GM invitations require a site administrator. Reset codes are administrator-issued, single-use, expire in 15 minutes, supersede prior codes and are stored only as keyed hashes. Login/reset attempts have database-backed limits. Codes/tokens are returned only at issuance to the authorized issuer; never log or share API responses containing them indiscriminately.
- Password reset/change and account disable/re-enable invalidate prior sessions. Session cookies are HttpOnly; mutations, including anonymous login/registration/reset, require CSRF. Production defaults use HTTPS redirects, secure cookies, HSTS and framing protection. Non-development startup rejects the public example signing key. HSTS preload is intentionally off pending deployment/domain review; `check --deploy` with non-development settings reports that deliberate warning. Local DEBUG settings intentionally produce other deployment warnings.
- API responses are `no-store, private`. The service worker bypasses `/api` and `/media`, permits only same-origin static shell/assets, honors cache directives and removes its old broad-cache namespace. Remote drafts/data stay in memory; account-aware offline snapshots remain milestone 5. Cross-tab logout clears views/drafts immediately, with a pending-revocation marker when network logout fails.
- Image uploads accept bounded PNG/JPEG/WebP bytes, decode with Pillow, enforce 4 MiB encoded-file/output and 16-million-pixel/8192-side limits, reject animation, strip metadata and re-encode PNG. UUID asset references are bound to one sheet and field. Every authenticated image GET checks current entity/field access and current attachment; no public filesystem route exists. Private development media lives in ignored `backend/private-media/`. Detached images remain inaccessible but retained; storage reclamation/quotas and off-VPS media backup are operational work before release. Existing local/mock images remain unchanged.
- Separate character/familiar import/export is the owner's intended transfer behavior, deferred until the backend foundation. No backend transfer endpoints or automatic local data migration are implemented. Legacy local combined backups remain compatible.

See [API contract](../docs/api-v1.md), [design](../docs/design.md), and [checkpoint](../docs/project-state.md). This is a local backend foundation, not a deployed account-backed product.
