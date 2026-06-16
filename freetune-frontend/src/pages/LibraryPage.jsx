/**
 * pages/LibraryPage.jsx
 * Three tabs: Downloads, Playlists, Local Files.
 * Local Files tab uses File System Access API (Android Chrome only).
 * Feature is ON by default, user can disable in Settings.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import { supportsFilePicker, scanSubFolders } from '../utils/fileSystem'

export default function LibraryPage() {
  const navigate = useNavigate()
  const { library, removeFromLibrary, playlists, createPlaylist, currentTrack, playTrack,
          localTracks, setLocalTracks, localFilesEnabled } = useStore()

  const [tab,       setTab]       = useState('downloads')
  const [plTrack,   setPlTrack]   = useState(null)
  const [newName,   setNewName]   = useState('')
  const [creating,  setCreating]  = useState(false)
  const [scanning,  setScanning]  = useState(false)

  const canScanFiles = supportsFilePicker() && localFilesEnabled

  const handleScanFiles = async () => {
    setScanning(true)
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' })
      const tracks    = await scanSubFolders(dirHandle)
      setLocalTracks(tracks)
    } catch (e) {
      if (e.name !== 'AbortError') alert('Could not read folder: ' + e.message)
    } finally { setScanning(false) }
  }

  const allTracks = [...library, ...localTracks]

  const TABS = [
    { id: 'downloads', label: `Downloads (${library.length})` },
    { id: 'playlists', label: `Playlists (${playlists.length})` },
    ...(localFilesEnabled && supportsFilePicker() ? [{ id: 'local', label: 'Local Files' }] : []),
  ]

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 bg-base z-20 px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Library</h1>
          <button onClick={() => navigate('/settings')} className="p-2 text-muted hover:text-fg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab===t.id ? 'bg-green text-base' : 'bg-elevated text-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {/* Downloads */}
        {tab === 'downloads' && (
          library.length === 0
            ? <div className="text-center py-16 text-muted"><div className="text-5xl mb-4">⬇️</div><p className="text-sm font-medium">No downloads yet</p><p className="text-xs mt-1">Search a song and tap Download</p></div>
            : library.map(t => (
                <TrackCard key={t.videoId} track={t} isActive={currentTrack?.videoId===t.videoId} isDownloaded={true}
                  onPlay={tr => playTrack(tr, library)} onAddToPlaylist={setPlTrack} onRemove={tr => removeFromLibrary(tr.videoId)}/>
              ))
        )}

        {/* Playlists */}
        {tab === 'playlists' && (
          <div className="space-y-2 mt-1">
            {creating
              ? <div className="flex gap-2 mb-3">
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && (createPlaylist(newName.trim()), setNewName(''), setCreating(false))}
                    placeholder="Playlist name"
                    className="flex-1 bg-elevated rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 ring-green"/>
                  <button onClick={() => { createPlaylist(newName.trim()); setNewName(''); setCreating(false) }}
                    className="bg-green text-base px-4 py-2 rounded-lg text-sm font-bold">Create</button>
                  <button onClick={() => setCreating(false)} className="bg-elevated px-3 py-2 rounded-lg text-sm text-muted">✕</button>
                </div>
              : <button onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-subtle text-muted hover:border-green hover:text-fg transition-colors mb-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                  <span className="text-sm font-medium">New playlist</span>
                </button>}
            {playlists.length === 0 && <p className="text-center py-8 text-muted text-sm">No playlists yet</p>}
            {playlists.map(pl => (
              <div key={pl.id} onClick={() => navigate(`/playlist/${pl.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-elevated transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-elevated rounded-xl flex items-center justify-center text-2xl">🎵</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{pl.name}</p>
                  <p className="text-xs text-muted mt-0.5">{pl.songIds?.length || 0} songs</p>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-muted">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Local Files */}
        {tab === 'local' && (
          <div>
            {localTracks.length === 0
              ? <div className="text-center py-12">
                  <div className="text-5xl mb-4">📁</div>
                  <p className="text-sm font-medium mb-1">Scan your phone for music</p>
                  <p className="text-xs text-muted mb-6">FreeTune can read MP3 files already on your device</p>
                  <button onClick={handleScanFiles} disabled={scanning}
                    className="bg-green text-base font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                    {scanning ? 'Scanning…' : '📂 Choose Music Folder'}
                  </button>
                </div>
              : <>
                  <div className="flex items-center justify-between py-2 mb-1">
                    <p className="text-xs text-muted">{localTracks.length} local files</p>
                    <button onClick={handleScanFiles} className="text-xs text-green">Rescan</button>
                  </div>
                  {localTracks.map(t => (
                    <TrackCard key={t.videoId} track={t} isLocal={true}
                      isActive={currentTrack?.videoId===t.videoId}
                      onPlay={tr => playTrack(tr, localTracks)}/>
                  ))}
                </>}
          </div>
        )}
      </div>

      {plTrack && <AddToPlaylistModal track={plTrack} onClose={() => setPlTrack(null)}/>}
    </div>
  )
}
