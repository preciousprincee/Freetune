/**
 * pages/LibraryPage.jsx
 * Shows all downloaded songs and user playlists.
 * Songs play offline using stored IndexedDB blobs.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'

export default function LibraryPage() {
  const navigate = useNavigate()
  const {
    library, removeFromLibrary,
    playlists, createPlaylist, deletePlaylist,
    currentTrack, playTrack,
  } = useStore()

  const [tab,           setTab]           = useState('songs')   // 'songs' | 'playlists'
  const [playlistTrack, setPlaylistTrack] = useState(null)
  const [newPlName,     setNewPlName]     = useState('')
  const [creating,      setCreating]      = useState(false)

  const handleCreatePlaylist = async () => {
    if (!newPlName.trim()) return
    await createPlaylist(newPlName.trim())
    setNewPlName('')
    setCreating(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 bg-base z-20 px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Your Library</h1>
          <button onClick={() => navigate('/settings')} className="p-2 text-muted hover:text-fg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <circle cx="12" cy="12" r="3"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-elevated rounded-xl p-1">
          {[['songs', 'Songs'], ['playlists', 'Playlists']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === v ? 'bg-green text-base shadow-sm' : 'text-muted'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">

        {/* Songs tab */}
        {tab === 'songs' && (
          <>
            {library.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <div className="text-5xl mb-4">♪</div>
                <p className="text-sm font-medium">No downloaded songs yet</p>
                <p className="text-xs mt-1">Search for a song and tap Download</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted mb-2 mt-1">{library.length} songs downloaded</p>
                <div className="space-y-0.5">
                  {library.map(track => (
                    <TrackCard
                      key={track.videoId}
                      track={track}
                      isActive={currentTrack?.videoId === track.videoId}
                      isDownloaded={true}
                      onPlay={t => playTrack(t, library)}
                      onAddToPlaylist={t => setPlaylistTrack(t)}
                      onRemove={t => removeFromLibrary(t.videoId)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Playlists tab */}
        {tab === 'playlists' && (
          <div className="mt-1 space-y-2">
            {/* Create new */}
            {creating ? (
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  value={newPlName}
                  onChange={e => setNewPlName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Playlist name"
                  className="flex-1 bg-elevated rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 ring-green"
                />
                <button onClick={handleCreatePlaylist}
                  className="bg-green text-base px-4 py-2 rounded-lg text-sm font-bold">Create</button>
                <button onClick={() => setCreating(false)}
                  className="bg-elevated px-4 py-2 rounded-lg text-sm text-muted">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-subtle text-muted hover:text-fg hover:border-green transition-colors mb-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">New playlist</span>
              </button>
            )}

            {playlists.length === 0 && (
              <div className="text-center py-12 text-muted">
                <p className="text-sm">No playlists yet</p>
              </div>
            )}

            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => navigate(`/playlist/${pl.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-elevated transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 bg-elevated rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{pl.name}</p>
                  <p className="text-xs text-muted mt-0.5">{pl.songIds?.length || 0} songs</p>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-muted flex-shrink-0">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {playlistTrack && (
        <AddToPlaylistModal track={playlistTrack} onClose={() => setPlaylistTrack(null)} />
      )}
    </div>
  )
}
