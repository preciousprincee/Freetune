/**
 * components/TrackCard.jsx
 * Reusable track row — thumbnail, title, artist, duration.
 * Used in search results, library, playlists, history.
 *
 * Props:
 *  - track      {Track}
 *  - onPlay     {function}
 *  - onDownload {function} (optional)
 *  - showMenu   {boolean}  (optional — shows ⋮ menu)
 *  - isActive   {boolean}  (optional — highlights if currently playing)
 *  - isDownloaded {boolean} (optional)
 */

import { useState } from 'react'
import { formatDuration } from '../utils/youtube'

export default function TrackCard({
  track,
  onPlay,
  onDownload,
  onAddToPlaylist,
  onRemove,
  isActive      = false,
  isDownloaded  = false,
  showMenu      = true,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`
        relative flex items-center gap-3 px-4 py-2.5 rounded-lg
        transition-colors cursor-pointer active:bg-elevated
        ${isActive ? 'bg-elevated' : 'hover:bg-elevated'}
      `}
      onClick={() => { setMenuOpen(false); onPlay(track) }}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-subtle">
        {!imgError ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xl">♪</div>
        )}
        {/* Playing indicator */}
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-4">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 bg-green rounded-full animate-bounce"
                     style={{ height: `${60 + i * 15}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-green' : 'text-fg'}`}>
          {track.title}
        </p>
        <p className="text-xs text-muted line-clamp-1 mt-0.5">{track.artist}</p>
      </div>

      {/* Duration + icons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isDownloaded && (
          <span className="text-green" title="Downloaded">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        <span className="text-xs text-muted tabular-nums">{formatDuration(track.duration)}</span>

        {showMenu && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1 text-muted hover:text-fg transition-colors rounded"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-8 w-48 bg-elevated border border-subtle rounded-lg shadow-2xl z-50 py-1 animate-fade-in">
                {onDownload && (
                  <button
                    onClick={() => { setMenuOpen(false); onDownload(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle transition-colors flex items-center gap-3"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {isDownloaded ? 'Downloaded' : 'Download'}
                  </button>
                )}
                {onAddToPlaylist && (
                  <button
                    onClick={() => { setMenuOpen(false); onAddToPlaylist(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle transition-colors flex items-center gap-3"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                    Add to playlist
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => { setMenuOpen(false); onRemove(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle transition-colors flex items-center gap-3 text-red"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
