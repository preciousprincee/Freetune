import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { apiTrending, triggerDownload } from '../utils/api'

const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening' }

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AR', name: 'Argentina' },
]

function getDefaultRegion() {
  // Try to detect from browser language, e.g. "en-US" → "US"
  try {
    const locale = navigator.language || ''
    const parts  = locale.split('-')
    if (parts.length > 1) {
      const code = parts[parts.length - 1].toUpperCase()
      if (COUNTRIES.find(c => c.code === code)) return code
    }
  } catch {}
  return 'US'
}

export default function HomePage() {
  const navigate = useNavigate()
  const { history, loadHistory, currentTrack, playTrack, isInLibrary, addToLibrary } = useStore()
  const [trending,       setTrending]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [plTrack,        setPlTrack]        = useState(null)
  const [regionCode,     setRegionCode]     = useState(getDefaultRegion)
  const [showCountries,  setShowCountries]  = useState(false)
  const [downloading,    setDownloading]    = useState({})

  useEffect(() => { loadHistory(); fetchTrending(regionCode) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchTrending(code) {
    setLoading(true); setError(null)
    try { setTrending(await apiTrending(code)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function selectCountry(code) {
    setRegionCode(code)
    setShowCountries(false)
    fetchTrending(code)
  }

  async function handleDownload(t) {
    if (downloading[t.videoId]) return
    setDownloading(d => ({ ...d, [t.videoId]: true }))
    try {
      const blobUrl = await triggerDownload(t.videoId, t.title)
      addToLibrary({ ...t, addedAt: Date.now(), blobUrl })
    } catch (err) {
      console.error('Download failed:', err.message)
    } finally {
      setDownloading(d => { const n = { ...d }; delete n[t.videoId]; return n })
    }
  }

  const countryName = COUNTRIES.find(c => c.code === regionCode)?.name || regionCode

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
          <div className="relative">
            <button
              onClick={() => setShowCountries(o => !o)}
              className="flex items-center gap-1.5 text-xs bg-elevated hover:bg-subtle px-3 py-1.5 rounded-full transition-colors text-muted"
            >
              🌍 {countryName}
              <svg viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${showCountries ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            {showCountries && (
              <div className="absolute right-0 top-9 w-52 bg-elevated border border-subtle rounded-xl shadow-2xl z-[60] py-1 max-h-72 overflow-y-auto animate-fade-in">
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => selectCountry(c.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-subtle flex items-center justify-between ${regionCode === c.code ? 'text-green font-semibold' : ''}`}>
                    <span>{c.name}</span>
                    {regionCode === c.code && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green flex-shrink-0">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && !loading && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted text-sm">{error}</p>
            <button onClick={() => fetchTrending(regionCode)} className="text-xs text-green ml-2">Retry</button>
          </div>
        )}

        {loading && [...Array(6)].map((_,i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
            <div className="w-12 h-12 bg-elevated rounded"/><div className="flex-1 space-y-2"><div className="h-3 bg-elevated rounded w-3/4"/><div className="h-3 bg-elevated rounded w-1/2"/></div>
          </div>
        ))}

        {!loading && !error && trending.map(t => (
          <TrackCard key={t.videoId} track={t} isActive={currentTrack?.videoId===t.videoId} isDownloaded={isInLibrary(t.videoId)}
            onPlay={tr => playTrack(tr, trending)}
            onDownload={downloading[t.videoId] ? null : handleDownload}
            onAddToPlaylist={setPlTrack}/>
        ))}
      </section>

      {/* Close country dropdown when clicking outside */}
      {showCountries && (
        <div className="fixed inset-0 z-40" onClick={() => setShowCountries(false)}/>
      )}

      {plTrack && <AddToPlaylistModal track={plTrack} onClose={() => setPlTrack(null)}/>}
    </div>
  )
}
