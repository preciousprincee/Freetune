/**
 * pages/HomePage.jsx
 * Home screen — greeting, recently played, trending music.
 * All data fetched from Invidious (trending) + IndexedDB (history).
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { getTrending } from '../utils/youtube'
import { getAudioUrl, downloadAudioBlob } from '../utils/cobaltApi'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const navigate = useNavigate()
  const {
    history, loadHistory,
    currentTrack, playTrack, isInLibrary, addToLibrary,
    cobaltInstance, audioQuality,
  } = useStore()

  const [trending,       setTrending]       = useState([])
  const [trendingLoading,setTrendingLoading] = useState(true)
  const [trendingError,  setTrendingError]   = useState(null)
  const [downloadingId,  setDownloadingId]   = useState(null)
  const [playlistTrack,  setPlaylistTrack]   = useState(null)

  useEffect(() => {
    loadHistory()
    fetchTrending()
  }, [])

  async function fetchTrending() {
    setTrendingLoading(true)
    setTrendingError(null)
    try {
      const results = await getTrending()
      setTrending(results)
    } catch (err) {
      setTrendingError(err.message)
    } finally {
      setTrendingLoading(false)
    }
  }

  async function handleDownload(track) {
    if (!cobaltInstance) {
      alert('Set your Cobalt instance in Settings first.')
      navigate('/settings')
      return
    }
    setDownloadingId(track.videoId)
    try {
      const url  = await getAudioUrl({ instance: cobaltInstance, youtubeUrl: track.youtubeUrl, quality: audioQuality })
      const blob = await downloadAudioBlob(url)
      const blobUrl = URL.createObjectURL(blob)
      await addToLibrary({ ...track, blobUrl, downloadedAt: Date.now() })
      alert(`"${track.title}" saved to your library!`)
    } catch (err) {
      alert(`Download failed: ${err.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{greeting()}</h1>
        <p className="text-muted text-sm mt-1">What do you want to listen to?</p>
      </div>

      {/* Recently played */}
      {history.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Recently played</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {history.slice(0, 6).map(track => (
              <button
                key={track.videoId}
                onClick={() => playTrack(track, history)}
                className={`
                  flex items-center gap-3 bg-elevated rounded-lg overflow-hidden h-14
                  hover:bg-subtle transition-colors text-left
                  ${currentTrack?.videoId === track.videoId ? 'ring-1 ring-green' : ''}
                `}
              >
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-14 h-14 object-cover flex-shrink-0"
                  onError={e => e.target.style.display = 'none'}
                />
                <span className="text-xs font-semibold line-clamp-2 pr-2">{track.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Trending music</h2>
          {trendingError && (
            <button onClick={fetchTrending} className="text-xs text-green">Retry</button>
          )}
        </div>

        {trendingLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                <div className="w-12 h-12 bg-elevated rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-elevated rounded w-3/4" />
                  <div className="h-3 bg-elevated rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {trendingError && !trendingLoading && (
          <div className="text-center py-8 text-muted text-sm">
            <p>Couldn't load trending songs.</p>
            <p className="text-xs mt-1">{trendingError}</p>
          </div>
        )}

        {!trendingLoading && !trendingError && (
          <div className="space-y-0.5">
            {trending.map(track => (
              <TrackCard
                key={track.videoId}
                track={track}
                isActive={currentTrack?.videoId === track.videoId}
                isDownloaded={isInLibrary(track.videoId)}
                onPlay={t => playTrack(t, trending)}
                onDownload={downloadingId === track.videoId ? null : handleDownload}
                onAddToPlaylist={t => setPlaylistTrack(t)}
              />
            ))}
          </div>
        )}
      </section>

      {playlistTrack && (
        <AddToPlaylistModal track={playlistTrack} onClose={() => setPlaylistTrack(null)} />
      )}
    </div>
  )
}
