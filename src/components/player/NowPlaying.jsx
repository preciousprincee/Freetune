/**
 * components/player/NowPlaying.jsx
 * Full-screen now-playing sheet with album art, seek bar, all controls.
 * Slides up over the whole app.
 */

import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import { formatDuration } from '../../utils/youtube'

export default function NowPlaying() {
  const {
    currentTrack, isPlaying, progress, duration, volume, shuffle, repeat,
    setIsPlaying, setVolume, toggleShuffle, toggleRepeat,
    playNext, playPrev, setNowPlayingOpen, audioEl,
  } = useStore()

  const [imgError, setImgError] = useState(false)
  const seeking = useRef(false)

  if (!currentTrack) return null

  const current = Math.round(progress * duration)

  const handleSeek = (e) => {
    const ratio = parseFloat(e.target.value) / 100
    if (audioEl && audioEl.duration) {
      audioEl.currentTime = ratio * audioEl.duration
    }
  }

  const repeatIcon = () => {
    if (repeat === 'one') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          <text x="12" y="14" textAnchor="middle" fontSize="7" fill="currentColor">1</text>
        </svg>
      )
    }
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${repeat === 'all' ? 'text-green' : 'text-muted'}`}>
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
      </svg>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col animate-slide-up safe-pt safe-pb">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setNowPlayingOpen(false)} className="p-2 text-muted hover:text-fg transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs text-muted uppercase tracking-widest font-semibold">Now Playing</p>
        </div>
        <div className="w-10" /> {/* spacer */}
      </div>

      {/* Album art */}
      <div className="flex-1 flex items-center justify-center px-10 py-6">
        <div className={`
          w-full aspect-square max-w-xs rounded-2xl overflow-hidden shadow-2xl
          ${isPlaying ? 'scale-100' : 'scale-95'}
          transition-transform duration-500
        `}>
          {!imgError ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-elevated flex items-center justify-center">
              <span className="text-7xl">♪</span>
            </div>
          )}
        </div>
      </div>

      {/* Track info + like */}
      <div className="px-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold line-clamp-1">{currentTrack.title}</h2>
            <p className="text-muted text-sm mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Seek bar */}
        <div className="mt-5">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(progress * 100)}
            onChange={handleSeek}
            className="w-full progress-fill"
            style={{ '--pct': `${Math.round(progress * 100)}%` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted tabular-nums">{formatDuration(current)}</span>
            <span className="text-xs text-muted tabular-nums">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-between mt-4 px-2">
          {/* Shuffle */}
          <button onClick={toggleShuffle} className={`p-2 transition-colors ${shuffle ? 'text-green' : 'text-muted'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          {/* Prev */}
          <button onClick={playPrev} className="p-2 text-fg hover:text-green transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-fg rounded-full flex items-center justify-center text-base hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Next */}
          <button onClick={playNext} className="p-2 text-fg hover:text-green transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
            </svg>
          </button>

          {/* Repeat */}
          <button onClick={toggleRepeat} className="p-2 transition-colors">
            {repeatIcon()}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mt-5 px-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted flex-shrink-0">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range" min="0" max="100"
            value={Math.round(volume * 100)}
            onChange={e => setVolume(e.target.value / 100)}
            className="flex-1"
          />
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted flex-shrink-0">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
