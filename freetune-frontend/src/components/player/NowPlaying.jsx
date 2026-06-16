import { useState } from 'react'
import useStore from '../../store/useStore'

function fmt(s) { if (!s) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}` }

export default function NowPlaying() {
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat,
          setIsPlaying, setVolume, toggleShuffle, toggleRepeat, playNext, playPrev,
          setNowPlayingOpen, audioEl } = useStore()
  const [imgErr, setImgErr] = useState(false)
  if (!currentTrack) return null

  const seek = e => { const r = e.target.value/100; if (audioEl?.duration) audioEl.currentTime = r * audioEl.duration }

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col animate-slide-up" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={() => setNowPlayingOpen(false)} className="p-2 text-muted hover:text-fg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <p className="text-xs text-muted uppercase tracking-widest font-semibold">Now Playing</p>
        <div className="w-10"/>
      </div>

      {/* Art */}
      <div className="flex-1 flex items-center justify-center px-10">
        <div className={`w-full aspect-square max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-90'}`}>
          {currentTrack.thumbnail && !imgErr
            ? <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgErr(true)}/>
            : <div className="w-full h-full bg-elevated flex items-center justify-center text-7xl">{currentTrack.isLocal ? '📁' : '♪'}</div>}
        </div>
      </div>

      {/* Info + controls */}
      <div className="px-6 pb-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold line-clamp-1">{currentTrack.title}</h2>
          <p className="text-muted text-sm mt-0.5">{currentTrack.artist}</p>
        </div>

        {/* Seek */}
        <input type="range" min="0" max="100" value={Math.round(progress*100)} onChange={seek} className="w-full mb-1"
          style={{ background: `linear-gradient(to right, #1db954 ${Math.round(progress*100)}%, #535353 ${Math.round(progress*100)}%)` }}/>
        <div className="flex justify-between text-xs text-muted mb-6">
          <span>{fmt(Math.round(progress * duration))}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2 mb-6">
          <button onClick={toggleShuffle} className={`p-2 transition-colors ${shuffle ? 'text-green' : 'text-muted'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button onClick={playPrev} className="p-2 text-fg hover:text-green">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-fg rounded-full flex items-center justify-center text-base hover:scale-105 active:scale-95 transition-transform shadow-lg">
            {isPlaying
              ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button onClick={playNext} className="p-2 text-fg hover:text-green">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
          </button>
          <button onClick={toggleRepeat} className={`p-2 transition-colors ${repeat !== 'off' ? 'text-green' : 'text-muted'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            {repeat === 'one' && <span className="text-[8px] font-bold block -mt-1 text-center">1</span>}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 px-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted flex-shrink-0"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" min="0" max="100" value={Math.round(volume*100)} onChange={e => setVolume(e.target.value/100)} className="flex-1"/>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted flex-shrink-0"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        </div>
      </div>
    </div>
  )
}
