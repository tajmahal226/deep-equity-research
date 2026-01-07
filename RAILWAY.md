# Railway Deployment Guide

This guide covers deploying the Deep Equity Research app to Railway, which supports the long-running SSE connections required for AI research operations.

## Why Railway?

Vercel's serverless functions timeout at 60 seconds (Pro/Hobby tiers), which is insufficient for AI research operations that can take 3-10 minutes. Railway uses containerized deployment that supports connections of 15+ minutes.

## Quick Start (5 minutes)

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email

### 2. Deploy from GitHub

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: `tajmahal226/deep-equity-research`
4. Railway will automatically detect it's a Node.js project

### 3. Configure Environment Variables

Railway will use the existing `Dockerfile` and `railway.json`. Add these environment variables in the **Variables** tab:

**Required (for production):**
```bash
NODE_ENV=production
PORT=3000
```

**Optional (access control):**
```bash
ACCESS_PASSWORD=your_secure_password_here
```

**Note:** This app uses user-provided API keys (BYOK model). You do NOT need to add AI provider keys unless you're running the MCP server.

### 4. Deploy

1. Click **"Deploy"**
2. Wait ~3-5 minutes for the build to complete
3. Railway will provide a URL like: `https://your-app.railway.app`

### 5. Verify Deployment

Visit `https://your-app.railway.app/api/health` — you should see a healthy response.

---

## Environment Variables Reference

### Access Control
| Variable | Required | Description |
|----------|----------|-------------|
| `ACCESS_PASSWORD` | No | Password to protect API endpoints |

### Server-Side API Keys (Optional)
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Only for MCP server |
| `ANTHROPIC_API_KEY` | No | Only for MCP server |
| `TAVILY_API_KEY` | No | Only for MCP server |

> **Note:** For normal usage, users provide their own API keys through the Settings UI. Server-side keys are only needed for MCP server integration.

---

## Troubleshooting

### Build Fails
- Check that Node.js 22.x is selected in Railway settings
- Verify `pnpm-lock.yaml` exists in your repo

### Timeouts Still Occurring
- Railway supports long-running connections by default
- Check your Railway service logs for actual errors
- Verify the health check is passing

### App Shows "Unauthorized"
- You may have set `ACCESS_PASSWORD` in Railway variables
- Either remove it or enter the password in the app's Settings

---

## Cost

- **Free Tier:** $5/month credit (plenty for personal use)
- **Paid plans:** Start at $5/month if you exceed free tier

---

## Vercel vs Railway

| Feature | Vercel | Railway |
|---------|--------|---------|
| Serverless timeout | 60 seconds | No limit (container) |
| SSE connections | Times out | Full support |
| Deployment speed | Instant | ~2-3 minutes |
| Free tier | Generous | $5 credit/month |
| Best for | Static sites, APIs | Long-running processes |

---

## Switching Back to Vercel

If you ever need to switch back:
1. The `vercel.json` file is still in the repo
2. All code works on both platforms
3. Just note the 60-second timeout limitation on Vercel

---

Need help? Check the [main README](./README.md) or [open an issue](https://github.com/tajmahal226/deep-equity-research/issues).
