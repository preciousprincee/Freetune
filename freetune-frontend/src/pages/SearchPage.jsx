import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { apiSearch, triggerDownload } from '../utils/api'

const SUGGESTIONS = ['Afrobeats 2024','Lo-fi chill','Hip hop classics','Pop hits','R&B vibes','Amapiano','Gospel music','Reggae hits','Dancehall 2024','Jazz classics']

export default function SearchPage() {
  const { currentTrack, playTrack, isInLibrary, addToLibrary } = useStore()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [plTrack, setPlTrack] = useState(null)
  const inputRef  = useRef(null)
  const debounce  = useRef(null)

  useEffect(() => {
    // Handle Web Share Target
    const p = new URLSearchParams(window.location.search)
    const q = p.get('text') || p.get('title') || p.get('url') || ''
    if (q) { setQuery(q); doSearch(q) }
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  async function doSearch(q) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true); setError(null)
    try { setResults(await apiSearch(q.trim())) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleInput = v => {
    setQuery(v)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(v), 600)
  }

  const handleDownload = t => { triggerDownload(t.videoId, t.title); addToLibrary({ ...t, addedAt: Date.now() }) }

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 bg-base z-20 px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input ref={inputRef} type="search" value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query)}
            placeholder="Songs, artists…"
            className="w-full bg-elevated text-fg rounded-xl py-3 pl-11 pr-10 placeholder:text-muted outline-none text-sm focus:ring-2 ring-green transition-all"/>
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {!query && !loading && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3 mt-2">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setQuery(s); doSearch(s) }}
                  className="bg-elevated text-sm px-4 py-2 rounded-full hover:bg-subtle transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && [...Array(8)].map((_,i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
            <div className="w-12 h-12 bg-elevated rounded"/><div className="flex-1 space-y-2"><div className="h-3 bg-elevated rounded w-3/4"/><div className="h-3 bg-elevated rounded w-1/2"/></div>
          </div>
        ))}

        {error && !loading && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">{error}</p>
            <button onClick={() => doSearch(query)} className="mt-3 text-green text-sm">Try again</button>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <p className="text-xs text-muted mb-2 mt-1">{results.length} results</p>
            {results.map(t => (
              <TrackCard key={t.videoId} track={t} isActive={currentTrack?.videoId===t.videoId}
                isDownloaded={isInLibrary(t.videoId)}
                onPlay={tr => playTrack(tr, results)} onDownload={handleDownload} onAddToPlaylist={setPlTrack}/>
            ))}
          </>
        )}

        {!loading && !error && query && results.length === 0 && (
          <p className="text-center py-12 text-muted text-sm">No results for "{query}"</p>
        )}
      </div>

      {plTrack && <AddToPlaylistModal track={plTrack} onClose={() => setPlTrack(null)}/>}
    </div>
  )
}
