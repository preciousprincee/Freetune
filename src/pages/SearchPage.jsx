/**
 * pages/SearchPage.jsx
 * Search for songs via Invidious API.
 * Results can be played (streams via Cobalt) or downloaded to library.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { searchYouTube } from '../utils/youtube'
import { getAudioUrl, downloadAudioBlob } from '../utils/cobaltApi'

const SUGGESTIONS = [
  'Afrobeats 2024', 'Lo-fi chill', 'Hip hop classics',
  'Pop hits', 'R&B vibes', 'Amapiano mix', 'Gospel music',
]

export default function SearchPage() {
  const navigate = useNavigate()
  const {
    currentTrack, playTrack, isInLibrary, addToLibrary,
    cobaltInstance, audioQuality,
  } = useStore()

  const [query,         setQuery]         = useState('')
  const [results,       setResults]       = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [playlistTrack, setPlaylistTrack] = useState(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Handle Web Share Target (?url=, ?text=, ?title=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('text') || params.get('title') || params.get('url') || ''
    if (shared) {
      const q = shared.replace(/https?:\/\/\S+/g, '').trim() || shared
      setQuery(q)
      doSearch(q)
    }
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  async function doSearch(q) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
      const data = await searchYouTube(q.trim())
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 600)
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
    <div className="animate-fade-in">
      {/* Search header */}
      <div className="sticky top-0 bg-base z-20 px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query)}
            placeholder="Songs, artists…"
            className="
              w-full bg-elevated text-fg rounded-xl py-3 pl-11 pr-4
              placeholder:text-muted outline-none text-sm
              focus:ring-2 ring-green transition-all
            "
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* Suggestions */}
        {!query && results.length === 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 mt-2">Try searching for</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s) }}
                  className="bg-elevated text-sm px-4 py-2 rounded-full hover:bg-subtle transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 mt-2">
            {[...Array(8)].map((_, i) => (
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

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">Search failed.</p>
            <p className="text-xs mt-1">{error}</p>
            <button onClick={() => doSearch(query)} className="mt-3 text-green text-sm">Try again</button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <>
            <p className="text-xs text-muted mb-2 mt-1">{results.length} results</p>
            <div className="space-y-0.5">
              {results.map(track => (
                <TrackCard
                  key={track.videoId}
                  track={track}
                  isActive={currentTrack?.videoId === track.videoId}
                  isDownloaded={isInLibrary(track.videoId)}
                  onPlay={t => playTrack(t, results)}
                  onDownload={downloadingId === track.videoId ? null : handleDownload}
                  onAddToPlaylist={t => setPlaylistTrack(t)}
                />
              ))}
            </div>
          </>
        )}

        {/* No results */}
        {!loading && !error && query && results.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No results for "{query}"</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {playlistTrack && (
        <AddToPlaylistModal track={playlistTrack} onClose={() => setPlaylistTrack(null)} />
      )}
    </div>
  )
}
