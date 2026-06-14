/**
 * components/player/MiniPlayer.jsx
 * Compact player bar that sits above the bottom nav.
 * Shows current track, play/pause, next, progress bar.
 * Tap anywhere on it to open full NowPlaying sheet.
 */

import useStore from '../../store/useStore'

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress,
    setIsPlaying, playNext, setNowPlayingOpen,
  } = useStore()

  if (!currentTrack) return null

  const pct = Math.round(progress * 100)

  return (
    <div
      className="
        fixed bottom-16 left-0 right-0 z-30
        bg-elevated border-t border-subtle
        cursor-pointer
      "
      onClick={() => setNowPlayingOpen(true)}
    >
      {/* Thin progress bar at top */}
      <div className="h-0.5 bg-subtle">
        <div
          className="h-full bg-green transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Thumbnail */}
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
          onError={e => { e.target.style.display = 'none' }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{currentTrack.title}</p>
          <p className="text-xs text-muted line-clamp-1">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-fg hover:text-green transition-colors"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M6 5a1 1 0 011 1v12a1 1 0 11-2 0V6a1 1 0 011-1zm8 0a1 1 0 011 1v12a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-fg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
