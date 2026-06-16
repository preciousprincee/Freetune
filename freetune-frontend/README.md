# FreeTune Frontend

React + Vite + Tailwind PWA. Connects to the FreeTune backend for search and audio.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL to your Railway backend URL
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import at vercel.com/new → auto-detects Vite
3. Add environment variable: `VITE_API_URL` = your Railway backend URL
4. Deploy

## Project structure

```
src/
├── App.jsx                        # Root — routing, install prompt, player init
├── main.jsx                       # React entry point
├── index.css                      # Tailwind + global styles
│
├── components/
│   ├── InstallPrompt.jsx          # Full-screen PWA install banner (first visit)
│   ├── TrackCard.jsx              # Reusable song row with ⋮ menu
│   ├── AddToPlaylistModal.jsx     # Bottom sheet playlist picker
│   ├── layout/BottomNav.jsx       # Home / Search / Library tabs
│   └── player/
│       ├── MiniPlayer.jsx         # Persistent mini bar above nav
│       └── NowPlaying.jsx         # Full-screen now playing sheet
│
├── hooks/
│   └── usePlayer.js               # HTMLAudioElement lifecycle manager
│
├── pages/
│   ├── HomePage.jsx               # Greeting, recent plays, trending
│   ├── SearchPage.jsx             # Search + results
│   ├── LibraryPage.jsx            # Downloads, playlists, local files
│   ├── PlaylistPage.jsx           # Single playlist view
│   └── SettingsPage.jsx           # Local files toggle, about
│
├── store/
│   └── useStore.js                # Zustand global state (player, library, etc.)
│
└── utils/
    ├── api.js                     # All backend HTTP calls
    ├── db.js                      # IndexedDB (songs, playlists, history)
    └── fileSystem.js              # File System Access API (local MP3s, Android only)
```

## PWA features

- Install prompt shown on first visit (Android Chrome)
- iOS: manual "Add to Home Screen" instructions
- Web Share Target: share YouTube links directly from the YouTube app
- Service worker caches app shell for offline loading
- Downloaded songs stored in IndexedDB — fully offline playback
