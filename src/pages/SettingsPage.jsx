/**
 * pages/SettingsPage.jsx
 * Settings — Cobalt API instance URL, audio quality, storage info, about.
 * Future: Google login toggle for cloud sync.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    cobaltInstance, saveCobaltInstance,
    audioQuality,   saveAudioQuality,
    library,
  } = useStore()

  const [instanceDraft, setInstanceDraft] = useState(cobaltInstance)
  const [saved,         setSaved]         = useState(false)

  const handleSave = async () => {
    await saveCobaltInstance(instanceDraft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const storageSize = library.length + ' songs saved locally'

  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted text-sm mb-4 hover:text-fg transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Cobalt Instance */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Audio Source</h2>
          <div className="bg-surface rounded-2xl overflow-hidden">
            <div className="px-4 py-4 border-b border-subtle">
              <p className="text-sm font-semibold mb-1">Cobalt API Instance</p>
              <p className="text-xs text-muted leading-relaxed mb-3">
                Required for streaming and downloading. Self-host{' '}
                <a href="https://github.com/imputnet/cobalt" target="_blank" rel="noopener noreferrer"
                   className="text-green underline">Cobalt</a>{' '}
                or use a community instance with CORS enabled.
              </p>
              <input
                type="url"
                value={instanceDraft}
                onChange={e => setInstanceDraft(e.target.value)}
                placeholder="https://your-cobalt-instance.com"
                className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-green placeholder:text-muted mb-3"
              />
              <button
                onClick={handleSave}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  saved ? 'bg-green/20 text-green' : 'bg-green text-base hover:bg-green-hover'
                }`}
              >
                {saved ? '✓ Saved!' : 'Save Instance'}
              </button>
            </div>

            {/* Audio quality */}
            <div className="px-4 py-4">
              <p className="text-sm font-semibold mb-3">Download Quality</p>
              <div className="grid grid-cols-4 gap-2">
                {['96', '128', '256', '320'].map(q => (
                  <button
                    key={q}
                    onClick={() => saveAudioQuality(q)}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                      audioQuality === q
                        ? 'bg-green text-base'
                        : 'bg-elevated text-muted hover:bg-subtle'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">kbps — higher = better quality, larger file</p>
            </div>
          </div>
        </section>

        {/* Quick setup guide */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Quick Setup</h2>
          <div className="bg-surface rounded-2xl px-4 py-4 space-y-3">
            {[
              ['1', 'Go to github.com/imputnet/cobalt', null],
              ['2', 'Deploy with Docker or Railway (free tier available)', null],
              ['3', 'Set CORS_WILDCARD=1 in environment variables', null],
              ['4', 'Paste your instance URL above and save', null],
            ].map(([n, text]) => (
              <div key={n} className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-green/20 text-green rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {n}
                </span>
                <p className="text-sm text-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Storage */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Storage</h2>
          <div className="bg-surface rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Device storage</p>
                <p className="text-xs text-muted mt-0.5">{storageSize}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
              </svg>
            </div>
          </div>
        </section>

        {/* Coming soon */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Coming soon</h2>
          <div className="bg-surface rounded-2xl px-4 py-4 space-y-3">
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-elevated rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Google Login</p>
                <p className="text-xs text-muted">Sync your library across devices</p>
              </div>
              <span className="ml-auto text-xs bg-elevated text-muted px-2 py-1 rounded-full">Soon</span>
            </div>
          </div>
        </section>

        {/* About */}
        <div className="text-center text-muted text-xs py-4">
          <p className="font-semibold text-sm text-fg mb-1">FreeTune</p>
          <p>v1.0.0 · Free music for everyone</p>
          <p className="mt-1">Powered by <a href="https://github.com/imputnet/cobalt" target="_blank" rel="noopener noreferrer" className="text-green underline">Cobalt</a> &amp; Invidious</p>
        </div>
      </div>
    </div>
  )
}
