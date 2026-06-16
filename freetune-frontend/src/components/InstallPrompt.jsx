/**
 * components/InstallPrompt.jsx
 * Full-screen install banner shown on first browser visit.
 * Only rendered by App.jsx when installPrompt is set AND not already installed.
 *
 * Android Chrome: shows a native install button
 * iOS Safari: shows step-by-step "Add to Home Screen" instructions
 */
import { useState } from 'react'
import useStore from '../store/useStore'

export default function InstallPrompt() {
  const { installPrompt, setInstallPrompt } = useStore()
  const [installing, setInstalling] = useState(false)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  const handleInstall = async () => {
    if (!installPrompt) return
    setInstalling(true)
    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      console.log('[pwa] Install outcome:', outcome)
    } catch (err) {
      console.error('[pwa] Install error:', err)
    } finally {
      setInstallPrompt(null)
      setInstalling(false)
    }
  }

  const handleSkip = () => setInstallPrompt(null)

  return (
    <div className="fixed inset-0 z-[100] bg-base flex flex-col items-center justify-center px-6 animate-fade-in">

      {/* App icon */}
      <div className="w-24 h-24 bg-green rounded-3xl flex items-center justify-center text-5xl shadow-2xl mb-8">
        🎵
      </div>

      <h1 className="text-3xl font-bold text-center mb-2">FreeTune</h1>
      <p className="text-muted text-center text-sm mb-10 leading-relaxed max-w-xs">
        Free music streaming &amp; downloads.<br/>No ads. No subscription. Ever.
      </p>

      {isIOS ? (
        /* iOS — no API, show manual steps */
        <div className="w-full max-w-sm bg-surface rounded-2xl p-5 mb-6 space-y-4">
          <p className="text-sm font-bold text-center mb-2">Add to Home Screen</p>
          {[
            ['1', 'Open this page in Safari (not Chrome)'],
            ['2', 'Tap the Share button (□↑) at the bottom'],
            ['3', 'Tap "Add to Home Screen" then "Add"'],
          ].map(([n, t]) => (
            <div key={n} className="flex items-center gap-3">
              <span className="w-7 h-7 bg-green/20 text-green rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{n}</span>
              <p className="text-sm text-muted">{t}</p>
            </div>
          ))}
          <button onClick={handleSkip} className="w-full mt-2 py-3 rounded-xl bg-elevated text-muted text-sm font-semibold">
            Continue in browser
          </button>
        </div>
      ) : (
        /* Android Chrome — native install prompt */
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-green text-base font-bold py-4 rounded-2xl text-lg hover:bg-green-d transition-colors disabled:opacity-60 shadow-lg"
          >
            {installing ? 'Installing…' : '📲  Install FreeTune'}
          </button>
          <button onClick={handleSkip} className="w-full py-3 rounded-2xl text-muted text-sm">
            Continue in browser
          </button>
        </div>
      )}

      <p className="text-[11px] text-subtle mt-8 text-center leading-relaxed">
        Installing adds FreeTune to your home screen<br/>for faster access and offline playback.
      </p>
    </div>
  )
}
