import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { apiTrending, triggerDownload } from '../utils/api'

const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening' }

export default function HomePage() {
  const navigate = useNavigate()
  const { history, loadHistory, currentTrack, playTrack, isInLibrary, addToLibrary } = useStore()
  const [trending, setTrending]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState(null)
  const [plTrack,  setPlTrack]    = useState(null)

  useEffect(() => { loadHistory(); fetchTrending() }, [])

  async function fetchTrending() {
    setLoading(true); setError(null)
    try { setTrending(await apiTrending()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDownload = t => { triggerDownload(t.videoId, t.title); addToLibrary({ ...t, addedAt: Date.now() }) }

  return (
    <div className="px-4 pt-6 pb-4 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{greet()}</h1>
        <p className="text-muted text-sm mt-1">What do you want to listen to?</p>
      </div>

      {history.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3">Recently played</h2>
          <div className="grid grid-cols-2 gap-2">
            {history.slice(0, 6).map(t => (
              <button key={t.videoId} onClick={() => playTrack(t, history)}
                className={`flex items-center gap-0 bg-elevated rounded-lg overflow-hidden h-14 text-left hover:bg-subtle transition-colors ${currentTrack?.videoId===t.videoId?'ring-1 ring-green':''}`}>
                {t.thumbnail
                  ? <img src={t.thumbnail} alt="" className="w-14 h-14 object-cover flex-shrink-0"/>
                  : <div className="w-14 h-14 bg-subtle flex items-center justify-center text-2xl flex-shrink-0">{t.isLocal?'📁':'♪'}</div>}
                <span className="text-xs font-semibold line-clamp-2 px-2">{t.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Trending music</h2>
          {error && <button onClick={fetchTrending} className="text-xs text-green">Retry</button>}
        </div>
        {loading && [...Array(6)].map((_,i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
            <div className="w-12 h-12 bg-elevated rounded"/><div className="flex-1 space-y-2"><div className="h-3 bg-elevated rounded w-3/4"/><div className="h-3 bg-elevated rounded w-1/2"/></div>
          </div>
        ))}
        {error && !loading && <p className="text-muted text-sm text-center py-8">{error}</p>}
        {!loading && !error && trending.map(t => (
          <TrackCard key={t.videoId} track={t} isActive={currentTrack?.videoId===t.videoId} isDownloaded={isInLibrary(t.videoId)}
            onPlay={tr => playTrack(tr, trending)} onDownload={handleDownload} onAddToPlaylist={setPlTrack}/>
        ))}
      </section>

      {plTrack && <AddToPlaylistModal track={plTrack} onClose={() => setPlTrack(null)}/>}
    </div>
  )
}
