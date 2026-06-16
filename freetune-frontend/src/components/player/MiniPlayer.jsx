import useStore from '../../store/useStore'

export default function MiniPlayer() {
  const { currentTrack, isPlaying, progress, setIsPlaying, playNext, setNowPlayingOpen } = useStore()
  if (!currentTrack) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 bg-elevated border-t border-subtle cursor-pointer"
         onClick={() => setNowPlayingOpen(true)}>
      <div className="h-0.5 bg-subtle">
        <div className="h-full bg-green transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded overflow-hidden bg-subtle flex-shrink-0">
          {currentTrack.thumbnail
            ? <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-lg">{currentTrack.isLocal ? '📁' : '♪'}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{currentTrack.title}</p>
          <p className="text-xs text-muted line-clamp-1">{currentTrack.artist}</p>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center text-fg hover:text-green transition-colors">
            {isPlaying
              ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button onClick={playNext} className="w-8 h-8 flex items-center justify-center text-muted hover:text-fg transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
