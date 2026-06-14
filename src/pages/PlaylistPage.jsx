/**
 * pages/PlaylistPage.jsx
 * View and manage a single playlist.
 * Shows all songs in the playlist, play all, remove individual songs.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import TrackCard from '../components/TrackCard'
import { getSong } from '../utils/db'

export default function PlaylistPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const {
    playlists, deletePlaylist,
    removeSongFromPlaylist,
    currentTrack, playTrack,
    isInLibrary,
  } = useStore()

  const [tracks,   setTracks]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [newName,  setNewName]  = useState('')

  const playlist = playlists.find(p => p.id === id)

  useEffect(() => {
    if (!playlist) return
    loadTracks()
    setNewName(playlist.name)
  }, [playlist?.songIds?.length])

  async function loadTracks() {
    setLoading(true)
    const loaded = await Promise.all(
      (playlist.songIds || []).map(vid => getSong(vid))
    )
    setTracks(loaded.filter(Boolean))
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${playlist.name}"?`)) return
    await deletePlaylist(id)
    navigate('/library')
  }

  const handleRemoveSong = async (track) => {
    await removeSongFromPlaylist(id, track.videoId)
    setTracks(t => t.filter(s => s.videoId !== track.videoId))
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm">
        Playlist not found.
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate('/library')} className="flex items-center gap-2 text-muted text-sm mb-4 hover:text-fg transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Library
        </button>

        {/* Playlist art */}
        <div className="w-40 h-40 mx-auto bg-elevated rounded-2xl flex items-center justify-center text-6xl shadow-xl mb-5">
          🎵
        </div>

        {/* Name */}
        {renaming ? (
          <div className="flex gap-2 mb-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setRenaming(false) }}
              className="flex-1 bg-elevated rounded-lg px-3 py-2 text-base font-bold outline-none focus:ring-1 ring-green text-center"
            />
            <button onClick={() => setRenaming(false)} className="text-green text-sm px-3">Done</button>
          </div>
        ) : (
          <h1
            className="text-xl font-bold text-center mb-1 cursor-pointer"
            onClick={() => setRenaming(true)}
          >
            {playlist.name}
          </h1>
        )}
        <p className="text-muted text-xs text-center mb-5">{tracks.length} songs</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => tracks.length && playTrack(tracks[0], tracks)}
            disabled={!tracks.length}
            className="flex-1 bg-green text-base font-bold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-green-hover transition-colors"
          >
            ▶ Play all
          </button>
          <button
            onClick={handleDelete}
            className="bg-elevated text-red px-4 py-3 rounded-xl text-sm hover:bg-subtle transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Songs */}
      <div className="px-4">
        {loading && (
          <div className="space-y-2 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-elevated rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-elevated rounded w-3/4" />
                  <div className="h-3 bg-elevated rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            <p>No songs in this playlist yet.</p>
            <p className="text-xs mt-1">Search for songs and add them here.</p>
          </div>
        )}

        {!loading && tracks.length > 0 && (
          <div className="space-y-0.5 pb-4">
            {tracks.map(track => (
              <TrackCard
                key={track.videoId}
                track={track}
                isActive={currentTrack?.videoId === track.videoId}
                isDownloaded={isInLibrary(track.videoId)}
                onPlay={t => playTrack(t, tracks)}
                onRemove={handleRemoveSong}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
