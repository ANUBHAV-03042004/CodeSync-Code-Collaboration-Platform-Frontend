# CodeSync — Netlify Deployment Guide

## What's included

```
netlify.toml                       ← Netlify build config + redirect rules + headers
.github/workflows/deploy.yml       ← GitHub Actions CI/CD pipeline
.gitignore                         ← Excludes node_modules, dist, secrets
src/environments/environment.prod.ts ← Uses placeholder values replaced at build time
DEPLOY.md                          ← This guide
```

---

## Step 1 — Push to GitHub

```bash
# In your project folder
git init
git add .
git commit -m "feat: initial CodeSync frontend"

# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/codesync-frontend.git
git push -u origin main
```

---

## Step 2 — Create Netlify site

1. Go to **[app.netlify.com](https://app.netlify.com)**
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → select your `codesync-frontend` repo
4. Netlify auto-detects `netlify.toml` — no manual config needed
5. Click **"Deploy site"**

Netlify will give you a URL like `https://codesync-xyz.netlify.app`

---

## Step 3 — Get your Netlify credentials

### NETLIFY_SITE_ID
1. Netlify dashboard → your site → **Site settings** → **General**
2. Copy the **Site ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### NETLIFY_AUTH_TOKEN
1. Netlify dashboard → top-right avatar → **User settings**
2. **Applications** → **Personal access tokens** → **New access token**
3. Name it `github-actions` → copy the token

---

## Step 4 — Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add ALL of these:

| Secret Name          | Value                                              |
|----------------------|----------------------------------------------------|
| `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token                 |
| `NETLIFY_SITE_ID`    | Your Netlify site ID                               |
| `ANGULAR_API_BASE`   | `https://your-api-gateway.example.com`             |
| `ANGULAR_WS_COLLAB`  | `https://your-api-gateway.example.com/ws/collab/websocket` |
| `ANGULAR_WS_NOTIF`   | `https://your-api-gateway.example.com/ws/notifications/websocket` |
| `ANGULAR_WS_EXEC`    | `https://your-api-gateway.example.com/ws/execution/websocket` |

---

## Step 5 — Verify CI/CD is working

Push any change to `main`:
```bash
git add .
git commit -m "test: verify CI/CD pipeline"
git push
```

Then go to **GitHub repo → Actions tab** — you'll see:
1. ✅ **Run Jest Tests** job
2. ✅ **Build & Deploy** job
3. A comment on the commit with the Netlify deploy URL

---

## How CI/CD works

```
Push to main
    │
    ▼
┌─────────────────────────┐
│  Job 1: Run Jest Tests  │  ← Fails here? Fix tests before deploy
└────────────┬────────────┘
             │ (only if tests pass)
             ▼
┌─────────────────────────────────────────────────┐
│  Job 2: Build & Deploy                          │
│  1. npm ci                                      │
│  2. Inject API URLs from GitHub Secrets         │
│  3. ng build --configuration=production         │
│  4. Push dist/ to Netlify → Live in ~30 seconds │
└─────────────────────────────────────────────────┘
```

### Pull Requests → Preview Deploys
Every PR automatically gets a **unique preview URL** like:
`https://deploy-preview-42--codesync-xyz.netlify.app`

Netlify posts the URL as a comment on the PR.

---

## Changing your API URL later

Just update the GitHub Secret `ANGULAR_API_BASE` and push any commit — the next build picks it up automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails with "Cannot find module" | Run `npm ci` locally first, push `package-lock.json` |
| `dist/codesync-frontend/browser` not found | Check Angular 17 — builder outputs to `/browser` subfolder |
| Routes give 404 on refresh | `netlify.toml` already handles this with `/* → /index.html 200` |
| Secrets not injected | Make sure secret names match exactly (case-sensitive) |
| Tests fail in CI | Run `npm test -- --forceExit` locally to reproduce |
