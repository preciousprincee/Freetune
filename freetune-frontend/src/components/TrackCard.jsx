/**
 * components/TrackCard.jsx
 * Song row: thumbnail, title, artist, duration, ⋮ menu.
 * Used in search results, library, playlists, history, local files.
 */
import { useState } from 'react'

function fmt(s) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2,'0')}`
}

export default function TrackCard({ track, onPlay, onDownload, onAddToPlaylist, onRemove, isActive, isDownloaded, isLocal, showMenu = true }) {
  const [menu, setMenu] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  return (
    <div
      onClick={() => { setMenu(false); onPlay?.(track) }}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-elevated' : 'hover:bg-elevated'}`}
    >
      {/* Art */}
      <div className="relative w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-subtle">
        {track.thumbnail && !imgErr
          ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center text-muted text-2xl">{isLocal ? '📁' : '♪'}</div>}
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
            <span className="bar" style={{height:'60%'}}/>
            <span className="bar" style={{height:'100%'}}/>
            <span className="bar" style={{height:'75%'}}/>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-green' : ''}`}>{track.title}</p>
        <p className="text-xs text-muted line-clamp-1 mt-0.5">{track.artist}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isDownloaded && !isLocal && (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        )}
        {isLocal && <span className="text-[10px] text-muted bg-elevated px-1.5 py-0.5 rounded">LOCAL</span>}
        <span className="text-xs text-muted tabular-nums">{fmt(track.duration)}</span>

        {showMenu && (onDownload || onAddToPlaylist || onRemove) && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMenu(o => !o)} className="p-1 text-muted hover:text-fg rounded">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            </button>
            {menu && (
              <div className="absolute right-0 bottom-8 w-48 bg-elevated border border-subtle rounded-xl shadow-2xl z-50 py-1 animate-fade-in">
                {onDownload && (
                  <button onClick={() => { setMenu(false); onDownload(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle flex items-center gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    {isDownloaded ? 'Re-download' : 'Download MP3'}
                  </button>
                )}
                {onAddToPlaylist && (
                  <button onClick={() => { setMenu(false); onAddToPlaylist(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle flex items-center gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    Add to playlist
                  </button>
                )}
                {onRemove && (
                  <button onClick={() => { setMenu(false); onRemove(track) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-subtle flex items-center gap-3 text-red">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
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
