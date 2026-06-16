/**
 * App.jsx — Root component.
 * - Loads persisted data on mount (library, playlists, history, settings)
 * - Captures PWA install prompt and shows full-screen banner on first visit
 * - Initialises the audio engine (usePlayer hook)
 * - Routes between pages
 */
import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useStore from './store/useStore'
import { usePlayer } from './hooks/usePlayer'
import InstallPrompt  from './components/InstallPrompt'
import BottomNav      from './components/layout/BottomNav'
import MiniPlayer     from './components/player/MiniPlayer'
import NowPlaying     from './components/player/NowPlaying'
import HomePage       from './pages/HomePage'
import SearchPage     from './pages/SearchPage'
import LibraryPage    from './pages/LibraryPage'
import PlaylistPage   from './pages/PlaylistPage'
import SettingsPage   from './pages/SettingsPage'

// True when the app is running as an installed PWA
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true  // iOS

export default function App() {
  const {
    loadLibrary, loadPlaylists, loadHistory, loadSettings,
    currentTrack, nowPlayingOpen,
    installPrompt, setInstallPrompt,
  } = useStore()

  // Initialise the global audio engine
  usePlayer()

  // Load all persisted data from IndexedDB on first mount
  useEffect(() => {
    loadSettings()
    loadLibrary()
    loadPlaylists()
    loadHistory()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture the browser's PWA install prompt
  useEffect(() => {
    if (isStandalone) return  // Already installed — don't capture prompt
    const handler = e => {
      e.preventDefault()  // Prevent default mini-infobar
      setInstallPrompt(e)  // Store it for our custom UI
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show install prompt if: not yet installed + prompt available
  const showInstall = !isStandalone && !!installPrompt

  return (
    <div className="flex flex-col h-full bg-base text-fg overflow-hidden select-none">

      {/* Full-screen install banner on first browser visit */}
      {showInstall && <InstallPrompt />}

      {/* Main scrollable content area */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: currentTrack ? '148px' : '64px' }}
      >
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/search"       element={<SearchPage />} />
          <Route path="/library"      element={<LibraryPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Persistent mini player above bottom nav */}
      {currentTrack && <MiniPlayer />}

      {/* Bottom navigation */}
      <BottomNav />

      {/* Full-screen now playing sheet */}
      {nowPlayingOpen && <NowPlaying />}
    </div>
  )
}
