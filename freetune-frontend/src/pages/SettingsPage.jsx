/**
 * pages/SettingsPage.jsx
 * Settings: Local files toggle (Android only), about, future Google login.
 * No API keys or instance URLs here — everything is handled by the backend.
 */
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { supportsFilePicker } from '../utils/fileSystem'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { library, localFilesEnabled, setLocalFilesEnabled } = useStore()

  const isEnabled = localFilesEnabled && supportsFilePicker()

  return (
    <div className="animate-fade-in px-4 pt-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted text-sm mb-4 hover:text-fg">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Local Files */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Local Files</h2>
        <div className="bg-surface rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Show local MP3 files</p>
              <p className="text-xs text-muted mt-0.5">
                {supportsFilePicker()
                  ? 'Read existing music files from your phone'
                  : 'Not supported on this browser (requires Android Chrome)'}
              </p>
            </div>
            <button
              onClick={() => supportsFilePicker() && setLocalFilesEnabled(!localFilesEnabled)}
              disabled={!supportsFilePicker()}
              aria-checked={isEnabled}
              role="switch"
              className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-green' : 'bg-subtle'} disabled:opacity-40`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}/>
            </button>
          </div>
          {!supportsFilePicker() && (
            <div className="px-4 pb-4 pt-0">
              <p className="text-xs text-muted bg-elevated rounded-lg px-3 py-2">
                💡 This feature works on Android with Chrome or Edge. iOS does not support folder access from the browser.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Storage */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Storage</h2>
        <div className="bg-surface rounded-2xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Downloaded songs</p>
            <p className="text-xs text-muted mt-0.5">{library.length} songs saved on this device</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
        </div>
      </section>

      {/* Coming soon */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Coming soon</h2>
        <div className="bg-surface rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-10 h-10 bg-elevated rounded-full flex items-center justify-center text-xl">🔐</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Google Login</p>
              <p className="text-xs text-muted">Sync your library &amp; playlists across devices</p>
            </div>
            <span className="text-xs bg-elevated text-muted px-2 py-1 rounded-full">Soon</span>
          </div>
        </div>
      </section>

      <div className="text-center text-muted text-xs py-4">
        <p className="font-semibold text-sm text-fg mb-1">FreeTune v1.0.0</p>
        <p>Free music for everyone · No ads · No subscription</p>
        <p className="mt-1">Powered by yt-dlp &amp; YouTube API</p>
      </div>
    </div>
  )
}
