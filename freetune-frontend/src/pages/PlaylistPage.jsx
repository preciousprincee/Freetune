import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import { getSong } from '../utils/db'

export default function PlaylistPage() {
  const { id } = useParams(), navigate = useNavigate()
  const { playlists, deletePlaylist, removeSongFromPlaylist, currentTrack, playTrack, isInLibrary } = useStore()
  const [tracks, setTracks] = useState([])
  const pl = playlists.find(p => p.id === id)

  useEffect(() => {
    if (!pl) return
    Promise.all((pl.songIds || []).map(vid => getSong(vid)))
      .then(r => setTracks(r.filter(Boolean)))
  }, [pl?.songIds?.length])

  if (!pl) return <div className="flex items-center justify-center h-64 text-muted text-sm">Playlist not found.</div>

  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate('/library')} className="flex items-center gap-2 text-muted text-sm mb-4 hover:text-fg">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          Library
        </button>
        <div className="w-40 h-40 mx-auto bg-elevated rounded-2xl flex items-center justify-center text-6xl shadow-xl mb-5">🎵</div>
        <h1 className="text-xl font-bold text-center mb-1">{pl.name}</h1>
        <p className="text-muted text-xs text-center mb-5">{tracks.length} songs</p>
        <div className="flex gap-3">
          <button onClick={() => tracks.length && playTrack(tracks[0], tracks)} disabled={!tracks.length}
            className="flex-1 bg-green text-base font-bold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-green-d transition-colors">
            ▶ Play all
          </button>
          <button onClick={async () => { if (confirm(`Delete "${pl.name}"?`)) { await deletePlaylist(id); navigate('/library') } }}
            className="bg-elevated text-red px-4 py-3 rounded-xl text-sm">Delete</button>
        </div>
      </div>
      <div className="px-4 pb-4">
        {tracks.length === 0
          ? <p className="text-center py-8 text-muted text-sm">No songs yet. Add from Search or Library.</p>
          : tracks.map(t => (
              <TrackCard key={t.videoId} track={t} isActive={currentTrack?.videoId===t.videoId}
                isDownloaded={isInLibrary(t.videoId)}
                onPlay={tr => playTrack(tr, tracks)}
                onRemove={async tr => { await removeSongFromPlaylist(id, tr.videoId); setTracks(s => s.filter(x => x.videoId!==tr.videoId)) }}/>
            ))}
      </div>
    </div>
  )
}
