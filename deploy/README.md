# Server runbook — release R1 (static hosting on Contabo)

R1 serves the current app (local browser storage, no backend) from the Contabo VPS with Caddy and automatic HTTPS: first on `staging.magistrischolae.fyi`, then on `magistrischolae.fyi`. The origin stays the same, so every player's browser data remains readable. R2 adds Django and PostgreSQL to this stack. See [the roadmap](../docs/implementation-plan.md) for exit criteria.

Server specifics (IP address, resources, existing containers, access method) live only in the git-ignored `docs/infrastructure.local.md` on the owner's machine. Do not put them in this file. Commands below assume Ubuntu or Debian; adapt package commands if the inventory shows otherwise.

| File | Purpose |
|---|---|
| `compose.yaml` | Caddy service; ports 80/443; opts out of container auto-updaters. |
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

1. In Porkbun's DNS panel, delete Porkbun's default parking or forwarding records for the domain, then create the same records as the live zone: apex `A`, `www` `A` and `staging` `A` to the server, plus CAA entries permitting at least `letsencrypt.org`. Do not recreate Vercel's `*` catch-all.
2. Ask Porkbun's nameservers directly and confirm every name returns the server's IP.
3. Change the domain's nameservers at Porkbun from Vercel's to Porkbun's. Both providers now give identical answers, so visitors notice nothing while the change spreads (allow up to 48 hours).
4. When the `.fyi` registry and public resolvers report Porkbun's nameservers, remove the domain from the Vercel project; delete the project when you no longer need it as a reference.

The domain must always be served over HTTPS.

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

**DNS rollback:** during phase 1, point the apex record back to Vercel's address and delete the `www` record, then wait out the TTL; this only works while the Vercel project still has the domain. After phase 2 the old Vercel deployment is no longer a rollback target; use `--activate` releases instead. Players' browser data is untouched in either direction because the origin does not change.

## Local test (no network exposure)

On Linux or WSL with Docker, from a clone:

```bash
printf 'SITE_ADDRESS=:80\nHTTP_PORT=8088\nHTTPS_PORT=8443\nBIND_ADDRESS=127.0.0.1\n' > deploy/.env
deploy/release.sh <branch>
docker compose -f deploy/compose.yaml up -d
E2E_LOCAL_URL=http://127.0.0.1:8088 npx playwright test --project=local-desktop
docker compose -f deploy/compose.yaml down
```
