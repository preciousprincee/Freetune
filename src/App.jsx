/**
 * App.jsx
 * Root component. Sets up:
 *  - Single-page layout: content area + bottom nav + persistent mini player
 *  - Loads library, playlists, history, settings from IndexedDB on mount
 *  - Initialises the audio player hook (runs for app lifetime)
 *  - Routes between Home / Search / Library pages
 */

import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useStore from './store/useStore'
import { usePlayer } from './hooks/usePlayer'

import BottomNav    from './components/layout/BottomNav'
import MiniPlayer   from './components/player/MiniPlayer'
import NowPlaying   from './components/player/NowPlaying'
import HomePage     from './pages/HomePage'
import SearchPage   from './pages/SearchPage'
import LibraryPage  from './pages/LibraryPage'
import PlaylistPage from './pages/PlaylistPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { loadLibrary, loadPlaylists, loadHistory, loadSettings, currentTrack, nowPlayingOpen } = useStore()

  // Init audio engine
  usePlayer()

  // Load persisted data on mount
  useEffect(() => {
    loadSettings()
    loadLibrary()
    loadPlaylists()
    loadHistory()
  }, [])

  return (
    <div className="flex flex-col h-full bg-base text-fg select-none overflow-hidden">

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(80px+64px)]">
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/search"    element={<SearchPage />} />
          <Route path="/library"   element={<LibraryPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Mini player — visible when a track is loaded */}
      {currentTrack && <MiniPlayer />}

      {/* Bottom navigation */}
      <BottomNav />

      {/* Full-screen Now Playing sheet */}
      {nowPlayingOpen && <NowPlaying />}
    </div>
  )
}
