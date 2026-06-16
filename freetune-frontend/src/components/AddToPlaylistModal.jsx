import { useState } from 'react'
import useStore from '../store/useStore'

export default function AddToPlaylistModal({ track, onClose }) {
  const { playlists, addSongToPlaylist, createPlaylist } = useStore()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleAdd = async id => { await addSongToPlaylist(id, track); onClose() }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const pl = await createPlaylist(newName.trim())
    await handleAdd(pl.id)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60" onClick={onClose}>
      <div className="w-full bg-elevated rounded-t-2xl p-6 max-h-[70vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold mb-4">Add to playlist</h3>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {playlists.length === 0 && !creating && <p className="text-muted text-sm text-center py-4">No playlists yet.</p>}
          {playlists.map(pl => (
            <button key={pl.id} onClick={() => handleAdd(pl.id)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-subtle flex items-center gap-3">
              <div className="w-10 h-10 bg-subtle rounded flex items-center justify-center text-xl">🎵</div>
              <div>
                <p className="text-sm font-medium">{pl.name}</p>
                <p className="text-xs text-muted">{pl.songIds?.length || 0} songs</p>
              </div>
            </button>
          ))}
        </div>
        {creating
          ? <div className="flex gap-2">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Playlist name"
                className="flex-1 bg-subtle rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-green"/>
              <button onClick={handleCreate} className="bg-green text-base px-4 py-2 rounded-lg text-sm font-bold">Create</button>
              <button onClick={() => setCreating(false)} className="bg-subtle px-3 py-2 rounded-lg text-sm text-muted">✕</button>
            </div>
          : <button onClick={() => setCreating(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-subtle text-muted hover:border-green hover:text-fg transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
              <span className="text-sm font-medium">New playlist</span>
            </button>}
      </div>
    </div>
  )
}
