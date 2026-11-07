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

## 5. Apex cutover

1. The day before, lower the TTL of the apex (and `www`, if used) records in Vercel DNS.
2. Confirm your own backup of the live site exists.
3. Point the apex `A` record (and `www`) at the server. Vercel may require removing the domain from the Vercel project first. Keep the Vercel project itself as the rollback copy.
4. When `dig +short magistrischolae.fyi` returns the server's IP, set `SITE_ADDRESS=magistrischolae.fyi, www.magistrischolae.fyi, staging.magistrischolae.fyi` in `deploy/.env` (drop `www` if unused) and apply it:

   ```bash
   docker compose -f deploy/compose.yaml up -d
   ```

   Adding the apex only after DNS points here avoids failed certificate attempts and rate limits. Expect a short window of certificate errors while DNS propagates.
5. Verify `https://magistrischolae.fyi/version.txt`, run the browser tests against it, and open the site in your usual browser: your existing records must still be there.

The domain must always be served over HTTPS; browsers may already enforce HTTPS for it.

## Releasing and rolling back

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

**DNS rollback:** point the apex record back to Vercel and wait out the TTL. Players' browser data is untouched in either direction because the origin does not change.

## Local test (no network exposure)

On Linux or WSL with Docker, from a clone:

```bash
printf 'SITE_ADDRESS=:80\nHTTP_PORT=8088\nHTTPS_PORT=8443\nBIND_ADDRESS=127.0.0.1\n' > deploy/.env
deploy/release.sh <branch>
docker compose -f deploy/compose.yaml up -d
E2E_LOCAL_URL=http://127.0.0.1:8088 npx playwright test --project=local-desktop
docker compose -f deploy/compose.yaml down
```
