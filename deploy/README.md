# Server runbook — release R1 (static hosting on Contabo)

R1 serves the current app (local browser storage, no backend) from the Contabo VPS with Caddy and automatic HTTPS: first on `staging.magistrischolae.fyi`, then on `magistrischolae.fyi`. The origin stays the same, so every player's browser data remains readable. R2 adds Django and PostgreSQL to this stack. See [the roadmap](../docs/implementation-plan.md) for exit criteria.

Server specifics (IP address, resources, existing containers, access method) live only in the git-ignored `docs/infrastructure.local.md` on the owner's machine. Do not put them in this file. Commands below assume Ubuntu or Debian; adapt package commands if the inventory shows otherwise.

| File | Purpose |
|---|---|
| `compose.yaml` | Caddy service; ports 80/443; opts out of container auto-updaters; mounts other websites' folders (section 8). |
| `caddy/Caddyfile` | HTTPS, compression, security headers, cache rules, single-page-app fallback. |
| `release.sh` | Builds a Git ref in a pinned Node container and switches releases atomically. |
| `.env.example` | Copy to `deploy/.env` on the server (git-ignored). No secrets in R1. |

## 1. Inventory (read-only)

From the current console, record the results in `docs/infrastructure.local.md`. Avoid commands that print container environments.

```bash
cat /etc/os-release; uname -r
docker --version; docker compose version
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker volume ls
ss -lntup
df -h; free -h
sudo ufw status verbose || sudo iptables -S | head -40
```

Do not remove or restart the existing containers. If an auto-updater is running, stop it or confirm it ignores containers labelled `com.centurylinklabs.watchtower.enable=false` (roadmap decision 4).

## 2. One-time server setup

Run as root or with `sudo`. Keep the current console session open until SSH login with the new key is confirmed.

```bash
# Deploy user with Docker access and key-only SSH
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy   # Docker access is root-equivalent; keep this account key-only
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# Paste the owner's (or agent's) public key, then:
nano /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
```

From your own computer, confirm `ssh deploy@<server>` works. Only then disable password logins:

```bash
printf 'PasswordAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/90-hardening.conf
sshd -t && systemctl reload ssh
```

Firewall and updates. Allow SSH **before** enabling the firewall, or you will be locked out. Docker-published ports bypass `ufw`, so only Caddy may publish ports.

```bash
apt-get update && apt-get install -y ufw unattended-upgrades git
ufw allow OpenSSH; ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 443/udp
ufw --force enable
dpkg-reconfigure -f noninteractive unattended-upgrades
```

Install Docker Engine and the Compose plugin from Docker's official repository if the inventory shows they are missing.

## 3. Install the app

As `deploy`:

```bash
sudo install -d -o deploy -g deploy /opt/magistri
git clone https://github.com/SerjTargarien/Magistri-Scholae-web.git /opt/magistri/app
cd /opt/magistri/app
cp deploy/.env.example deploy/.env    # SITE_ADDRESS=staging.magistrischolae.fyi
deploy/release.sh main                # builds and activates the first release
docker compose -f deploy/compose.yaml up -d
```

## 4. Staging

1. In Vercel DNS (the domain's current nameservers), add an `A` record `staging` pointing to the server's IP.
2. Once `dig +short staging.magistrischolae.fyi` returns the server's IP, Caddy obtains a certificate on the next request: `curl -I https://staging.magistrischolae.fyi`.
3. Check the live commit: `curl https://staging.magistrischolae.fyi/version.txt`.
4. From a development machine, run the local-mode browser tests against staging, including the offline-reload test:

   ```bash
   E2E_LOCAL_URL=https://staging.magistrischolae.fyi npx playwright test --project=local-desktop
   ```

## 5. Cutover, then leaving Vercel

The goal is a site that depends only on the registrar (Porkbun) and the VPS. It happens in two phases, so no visitor reaches the server before it has a certificate. Browsers that visited before enforce HTTPS for the domain and refuse certificate errors.

### Phase 1: point the website at the VPS (DNS still hosted by Vercel)

1. Confirm your own backup of the live site exists.
2. Check that the apex record's TTL is short (60 s). If it isn't, lower it a day ahead.
3. In Vercel DNS, change the apex `A` record to the server's IP and add a `www` `A` record with the same IP. An explicit record overrides Vercel's `*` catch-all for that name only.
4. When both Vercel nameservers (`dig +short magistrischolae.fyi @ns1.vercel-dns.com`, and the same for `www`) return the server's IP, immediately set `SITE_ADDRESS=magistrischolae.fyi, www.magistrischolae.fyi, staging.magistrischolae.fyi` in `deploy/.env` and apply it:

   ```bash
   docker compose -f deploy/compose.yaml up -d
   ```

   Let's Encrypt asks the authoritative nameservers, so certificates succeed as soon as those answer. Adding the names before that would cause failed attempts and rate limits. Caddy redirects `www` to the apex (`deploy/caddy/Caddyfile`).
5. Verify `https://magistrischolae.fyi/version.txt`, the `www` redirect, the browser tests against the apex, and your usual browser: your existing records must still be there.

### Phase 2: move DNS to the registrar

1. Check that DNSSEC is off (no `DS` record at the `.fyi` registry). Otherwise remove it before changing nameservers.
2. In Porkbun's DNS panel, dismiss the "use our nameservers" prompt with **No, thank you** (its **Yes** button is step 4). Fix or delete any leftover records, then create the same records as the live zone: apex `A`, `www` `A` and `staging` `A` to the server, plus CAA. Porkbun's minimum TTL is 600 s. Its CAA form has a single Value box that must read `0 issue "letsencrypt.org"` (flag, tag and quoted value on one line); other formats may be saved but not published. Do not recreate Vercel's `*` catch-all.
3. Porkbun's nameservers refuse queries for a domain until it uses them, so records cannot be checked in advance. Recheck them in the panel instead.
4. Switch the nameservers to Porkbun's (the **Yes, please update my domain** button, or the nameserver setting). Immediately ask all four Porkbun nameservers directly for every record. Resolvers keep asking Vercel for up to an hour, which leaves time to fix a mistake or switch back. Both providers give identical answers, so visitors notice nothing while the change spreads (allow up to 48 hours).
5. When the `.fyi` registry and public resolvers report Porkbun's nameservers, and 48 hours have passed, remove the domain from the Vercel project; delete the project when you no longer need it as a reference.

**Status:** both phases completed on 7 November 2026; only step 5 remains.

The domain must always be served over HTTPS.

## 6. Staging backend (release R2)

Staging becomes the account version with its own Django backend and PostgreSQL database. The public site is unaffected. The services run only with the `staging-backend` profile; secrets live in `deploy/.env.staging`, created on the server and git-ignored (template: `.env.staging.example`). Commands run in `/opt/magistri/app` as `deploy`.

1. Create the staging release folder first, so Docker does not create it owned by root:

   ```bash
   mkdir -p deploy/releases-staging
   ```

2. Generate the secrets on the server. They are never printed, committed or copied elsewhere:

   ```bash
   (umask 077; {
     echo "DJANGO_SECRET_KEY=$(openssl rand -hex 40)"
     echo "DJANGO_HMAC_KEY=$(openssl rand -hex 40)"
     echo "DJANGO_ALLOWED_HOSTS=staging.magistrischolae.fyi"
     echo "POSTGRES_DB=magistri_staging"
     echo "POSTGRES_USER=magistri"
     echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
   } > deploy/.env.staging)
   ```

3. Build the account version of the frontend: `deploy/release.sh --target staging main`.
4. Build the backend image, start the database and apply migrations:

   ```bash
   docker compose -f deploy/compose.yaml --profile staging-backend build api-staging
   docker compose -f deploy/compose.yaml --profile staging-backend up -d db-staging
   docker compose -f deploy/compose.yaml --profile staging-backend run --rm api-staging python manage.py migrate
   ```

5. In `deploy/.env`, remove `staging.magistrischolae.fyi` from `SITE_ADDRESS`, then add `STAGING_ADDRESS=staging.magistrischolae.fyi` and `COMPOSE_PROFILES=staging-backend`. Apply with `docker compose -f deploy/compose.yaml up -d`. Caddy's container is recreated once, because its network changes: a few seconds of downtime for every site. The certificates are kept.
6. Create the administrator interactively (the password is typed, never passed as an argument):

   ```bash
   docker compose -f deploy/compose.yaml run --rm api-staging python manage.py createsuperuser --username <name>
   ```

7. Schedule housekeeping in the `deploy` user's crontab (`crontab -e`):

   ```text
   17 4 * * * cd /opt/magistri/app && docker compose -f deploy/compose.yaml exec -T api-staging python manage.py maintenance >> $HOME/maintenance-staging.log 2>&1
   ```

**Updating the backend:** `git pull --ff-only`, then rebuild the image, apply migrations, and restart only the backend:

```bash
docker compose -f deploy/compose.yaml build api-staging
docker compose -f deploy/compose.yaml run --rm api-staging python manage.py migrate
docker compose -f deploy/compose.yaml up -d api-staging
```

## 7. Backups to Backblaze B2 (release R2.4)

- **What runs:** `deploy/backup.sh --target staging` dumps the database (`pg_dump`, custom format) and tars the media volume. It encrypts the bundle with GnuPG (AES-256), checks that the result decrypts, uploads it with `deploy/b2_upload.py` (B2 native API, Python standard library only), and keeps the newest 7 archives in `/opt/magistri/backups/<target>/` (readable by `deploy` only).
- **Secrets:** `deploy/.env.backup` (server-only, git-ignored, mode 600) holds `BACKUP_PASSPHRASE`, generated on the server, plus `B2_BUCKET`, `B2_KEY_ID` and `B2_APP_KEY`, entered by the owner. The owner keeps a **paper copy of the passphrase**; without it, backups cannot be opened if the server is lost. The passphrase reaches GnuPG through a file descriptor, never the command line.
- **Retention:** the bucket's lifecycle rule hides files 30 days after upload and deletes them 30 days after hiding. The server's key can write, delete and change lifecycle rules (Backblaze's web "Write Only" key includes those). The owner accepted this: an intruder on the server could destroy the backup history. A stricter key (`writeFiles` and `listBuckets` only) would need the B2 API and a master key.
- **Schedule:** the `deploy` crontab runs it nightly at 03:30 server time and logs to `~/backup-staging.log`.
- **Restore drill:** `deploy/restore-check.sh --target staging [archive]` decrypts an archive (default: the newest local one), restores it into a throwaway PostgreSQL on an isolated network, and compares every table's row count and the media file count with the live environment. It then removes everything temporary.
- **Restoring for real** (not yet needed): decrypt with `gpg --decrypt` using the passphrase, then `pg_restore` the `database.dump` into the target database and untar `media.tar` into the media volume, with the backend stopped. Write the exact steps the first time it is needed.
- **If the server is lost:** download the archive from the Backblaze web console. Decrypt it on any computer with GnuPG (Gpg4win on Windows) and the paper passphrase: `gpg --decrypt archive.tar.gpg > archive.tar`.

## 8. Other websites on this server

Caddy in this stack owns ports 80 and 443, so other websites on the VPS are served through it, while their files stay outside this repository. The web container mounts `/opt/sites` (override with `SITES_DIR` in `deploy/.env`) read-only at `/srv/sites`, and the Caddyfile imports `/srv/sites/*/Caddyfile`.

**One-time setup** (before the web container first starts with this mount, or Docker creates the folder as root):

```bash
sudo install -d -m 755 -o deploy -g deploy /opt/sites
cd /opt/magistri/app && git pull --ff-only
docker compose -f deploy/compose.yaml up -d web   # recreates Caddy: about two seconds of downtime, certificates kept
```

A plain `restart` does not pick up a new mount; the container must be recreated.

**Rules for a site's files** (`/opt/sites/<site>/Caddyfile`, content in e.g. `/opt/sites/<site>/public/`):

- Only that site's own blocks. No global options block, and no snippet names this Caddyfile already uses (`static_app`).
- Paths as Caddy sees them inside the container: `root * /srv/sites/<site>/public`, not `/opt/sites/...`.
- The site sets its own headers; it does not reuse Magistri's snippet.
- Add the DNS record (A only: Caddy listens on IPv4) and check it reaches the VPS before adding the Caddyfile, so Caddy can obtain the certificate at once.

**Changing a site:** validate, then reload. A reload has no downtime, and a failed one keeps the previous configuration. Never restart Caddy for a site change: a broken file would stop Caddy, and every site with it, from starting.

```bash
cd /opt/magistri/app
docker compose -f deploy/compose.yaml exec web caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose -f deploy/compose.yaml exec web caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

To remove a site, delete its folder, then validate and reload.

## 9. Public site on the staging backend (8 November 2026, temporary)

Owner decision: testers use one address. The public site (`SITE_ADDRESS`) serves the account app (`release.sh --target production` builds `build:remote`) and its Caddy block sends `/api/*` to `api-staging`, so the public site and the staging site share the staging backend and database. One-time server steps:

1. Add the public addresses to `DJANGO_ALLOWED_HOSTS` in `deploy/.env.staging` (comma-separated, after `staging.magistrischolae.fyi`) and recreate `api-staging` (`docker compose -f deploy/compose.yaml up -d api-staging`).
2. `git pull`, then reload Caddy: `docker compose -f deploy/compose.yaml exec -T web caddy reload --config /etc/caddy/Caddyfile`.
3. `deploy/release.sh --target production main`. Roll back with `--activate` (the previous release is the old local-storage app).

The nightly staging backup now protects the testers' data. When the production backend exists (R6), restore the latest staging backup into it, point this block's `/api/*` at it, and remove the staging hosts from it.

## Releasing and rolling back

**Keep the server checkout on `main` and update it only with `git pull --ff-only`.** Never check out a branch or commit that lacks the `deploy/` folder while Caddy runs: Git deletes `deploy/caddy/`, and the running container stays attached to the deleted folder, so `caddy reload` fails until the container is restarted (`docker compose -f deploy/compose.yaml restart web`, about two seconds of downtime, certificate reused). Check the server's local `main` with `git status -sb` before switching: a clone keeps its own `main` at the commit it was cloned from.

```bash
cd /opt/magistri/app
git pull --ff-only                    # updates deploy files; builds always use the fetched ref
deploy/release.sh main                # or a tag such as r1-20261107
deploy/release.sh --list              # * marks the live release
deploy/release.sh --activate <id>     # instant rollback, no restart
```

After a change to `deploy/caddy/Caddyfile`:

```bash
docker compose -f deploy/compose.yaml exec web caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Logs: `docker compose -f deploy/compose.yaml logs -f web`. The last five releases are kept (`KEEP_RELEASES`).

**Rollback now that both phases are done:** use `deploy/release.sh --activate <id>` to return to an earlier release. The old Vercel deployment is no longer a rollback target. Until step 5, switching the nameservers back to Vercel's would restore Vercel's zone, which also points at this server. Players' browser data is untouched in either direction because the origin does not change.

## Local test (no network exposure)

On Linux or WSL with Docker, from a clone:

```bash
printf 'SITE_ADDRESS=:80\nHTTP_PORT=8088\nHTTPS_PORT=8443\nBIND_ADDRESS=127.0.0.1\n' > deploy/.env
deploy/release.sh <branch>
docker compose -f deploy/compose.yaml up -d
E2E_LOCAL_URL=http://127.0.0.1:8088 npx playwright test --project=local-desktop
docker compose -f deploy/compose.yaml down
```
