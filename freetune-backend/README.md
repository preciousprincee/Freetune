# FreeTune Backend

Node.js + Express + yt-dlp API. Handles search, streaming, and MP3 downloads.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/search?q=<query>` | Search YouTube |
| GET | `/api/search/trending` | Trending music |
| GET | `/api/stream/:videoId` | Stream audio (for in-app player) |
| GET | `/api/download/:videoId?title=<name>` | Download MP3 to device |

## Deploy to Railway (5 minutes)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo → Railway auto-detects Node.js
4. Add environment variables:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. Click Deploy — Railway installs dependencies and starts the server
6. Copy the generated Railway URL (e.g. `https://freetune-backend.up.railway.app`)
7. Paste it into the frontend `.env` as `VITE_API_URL`

## yt-dlp binary

The binary is downloaded automatically from GitHub on first start.
Railway's filesystem is ephemeral, so it re-downloads on each deploy (takes ~10 seconds).
This is normal and expected.

## Keeping yt-dlp updated

YouTube changes break yt-dlp occasionally. To update:
1. Go to Railway dashboard → your service → Redeploy
2. That's it — the latest yt-dlp binary is fetched on startup

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```
