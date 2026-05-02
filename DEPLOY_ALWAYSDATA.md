# CodeSync — Deploy to alwaysdata Guide

## How it works

Angular builds to static files → uploaded via rsync over SSH → served by Apache.
alwaysdata's **Static Files** site type runs Apache, which reads `.htaccess` for SPA routing.

```
Push to main
      │
      ▼
┌─────────────────┐
│  Run Jest Tests │  ← fails here? fix before deploy
└────────┬────────┘
         │ pass
         ▼
┌──────────────────────────────────────────────────┐
│  Build & Deploy job                              │
│  1. npm ci                                       │
│  2. Inject API URLs from GitHub Secrets          │
│  3. ng build --configuration=production          │
│  4. Copy .htaccess into dist/                    │
│  5. rsync dist/ → alwaysdata via SSH             │
│  6. Live at https://ACCOUNT.alwaysdata.net/      │
└──────────────────────────────────────────────────┘
```

---

## Step 1 — alwaysdata admin setup

### 1a. Create the site in alwaysdata admin

1. Log into **admin.alwaysdata.com**
2. Go to **Web → Sites → Add a site**
3. Fill in:
   - **Name**: `codesync`
   - **Addresses**: `ACCOUNT.alwaysdata.net` (your free subdomain)
   - **Type**: `Static files`
   - **Root directory**: `www/codesync`
4. Click **Save**

> Apache will serve files from `~/www/codesync/` on your account.

### 1b. Create the upload directory via SSH

```bash
# Connect to your alwaysdata account
ssh ACCOUNT@ssh-ACCOUNT.alwaysdata.net

# Create the directory
mkdir -p ~/www/codesync
exit
```

---

## Step 2 — Generate SSH key pair

On your local machine:

```bash
# Generate a dedicated deploy key (no passphrase)
ssh-keygen -t ed25519 -C "github-actions-codesync" -f ~/.ssh/alwaysdata_deploy -N ""

# You now have:
#   ~/.ssh/alwaysdata_deploy      ← PRIVATE key (goes to GitHub Secret)
#   ~/.ssh/alwaysdata_deploy.pub  ← PUBLIC key  (goes to alwaysdata)

# Print the public key to copy it
cat ~/.ssh/alwaysdata_deploy.pub

# Print the private key to copy it
cat ~/.ssh/alwaysdata_deploy
```

### Add public key to alwaysdata

1. In alwaysdata admin → **SSH → Add an SSH key**
2. Paste the **public key** (`alwaysdata_deploy.pub`)
3. Save

---

## Step 3 — Add GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add all 6 secrets:

| Secret Name              | Value                                                    |
|--------------------------|----------------------------------------------------------|
| `ALWAYSDATA_ACCOUNT`     | Your alwaysdata account name (e.g. `johndoe`)            |
| `ALWAYSDATA_SSH_KEY`     | Full content of `~/.ssh/alwaysdata_deploy` (private key) |
| `API_BASE`               | `https://your-api-gateway.example.com`                   |
| `WS_COLLAB`              | `https://your-api-gateway.example.com/ws/collab/websocket` |
| `WS_NOTIF`               | `https://your-api-gateway.example.com/ws/notifications/websocket` |
| `WS_EXEC`                | `https://your-api-gateway.example.com/ws/execution/websocket` |

> ⚠️ For `ALWAYSDATA_SSH_KEY`: copy the **entire** private key including
> `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

---

## Step 4 — Push to GitHub

```bash
cd your-codesync-project

# Copy the deployment files from this zip into your project
cp .htaccess .gitignore DEPLOY_ALWAYSDATA.md ./
cp environment.prod.ts src/environments/environment.prod.ts
cp .github/workflows/deploy-alwaysdata.yml .github/workflows/

git init
git add .
git commit -m "feat: add alwaysdata deployment"
git remote add origin https://github.com/YOUR_USERNAME/codesync-frontend.git
git push -u origin main
```

GitHub Actions will immediately start the pipeline.
Watch it at: **GitHub repo → Actions tab**

---

## Step 5 — Verify deployment

After the workflow completes (~3 min):

```
https://ACCOUNT.alwaysdata.net/codesync
```

Test SPA routing works (refresh on any route should not give 404).

---

## Manual deploy (no GitHub Actions)

If you want to deploy from your local machine directly:

```bash
# Build locally
npm run build -- --configuration=production

# Copy .htaccess into dist
cp .htaccess dist/codesync-frontend/browser/

# Upload via rsync
rsync -az --delete \
  dist/codesync-frontend/browser/ \
  ACCOUNT@ssh-ACCOUNT.alwaysdata.net:www/codesync/
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 404 on page refresh | `.htaccess` missing or mod_rewrite not active — re-upload `.htaccess` |
| Permission denied (SSH) | Public key not added to alwaysdata SSH settings |
| `rsync: command not found` | Already installed on GitHub Actions ubuntu-latest |
| White screen / JS error | Check browser console — likely API URL not injected correctly |
| 403 Forbidden | No `index.html` in `www/codesync/` — build may have failed |
| Old files still showing | Hard refresh (Ctrl+Shift+R) — or clear browser cache |

---

## Custom domain (optional)

1. In alwaysdata admin → **Web → Sites** → edit your site
2. Change **Addresses** to `codesync.yourdomain.com`
3. In your domain DNS: add a `CNAME` → `ACCOUNT.alwaysdata.net`
4. In alwaysdata admin → **Domains → SSL** → generate Let's Encrypt cert
5. Update the `ALWAYSDATA_ACCOUNT` secret if the SSH host changes

---

## Free plan limits

| Feature | Free Plan |
|---|---|
| Storage | 100 MB |
| Bandwidth | Unlimited |
| SSH | ✅ Included |
| Static sites | ✅ Included |
| HTTPS / SSL | ✅ Let's Encrypt auto |
| Custom domain | ✅ Included |
| SPA / `.htaccess` | ✅ Apache with mod_rewrite |

The free 100 MB is more than enough for an Angular build (~5–15 MB).
