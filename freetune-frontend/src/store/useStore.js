/**
 * store/useStore.js — Global Zustand state
 * Player, library, playlists, settings, UI.
 */
import { create } from 'zustand'
import { saveSong, getAllSongs, deleteSong, getPlaylists, putPlaylist, deletePlaylist, addHistory, getHistory, getSetting, setSetting } from '../utils/db'
import { streamUrl } from '../utils/api'

const useStore = create((set, get) => ({

  // ── Player ──────────────────────────────────────────────────────────────
  currentTrack: null,
  queue: [], queueIndex: 0,
  isPlaying: false,
  progress: 0, duration: 0,
  volume: 1, shuffle: false, repeat: 'off',
  audioEl: null,

  setAudioEl: el => set({ audioEl: el }),

  playTrack: (track, queue = null) => {
    const q   = queue || [track]
    const idx = q.findIndex(t => t.videoId === track.videoId)
    set({ currentTrack: track, queue: q, queueIndex: Math.max(0, idx), isPlaying: true })
    addHistory(track).catch(() => {})
  },

  setIsPlaying: v => set({ isPlaying: v }),
  setProgress:  v => set({ progress: v }),
  setDuration:  v => set({ duration: v }),
  setVolume:    v => set({ volume: v }),
  toggleShuffle: () => set(s => ({ shuffle: !s.shuffle })),
  toggleRepeat:  () => set(s => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),

  playNext: () => {
    const { queue, queueIndex, shuffle, repeat } = get()
    if (!queue.length) return
    const next = shuffle
      ? Math.floor(Math.random() * queue.length)
      : repeat === 'one' ? queueIndex : (queueIndex + 1) % queue.length
    const track = queue[next]
    set({ currentTrack: track, queueIndex: next, isPlaying: true })
    addHistory(track).catch(() => {})
  },

  playPrev: () => {
    const { queue, queueIndex } = get()
    if (!queue.length) return
    const prev = (queueIndex - 1 + queue.length) % queue.length
    set({ currentTrack: queue[prev], queueIndex: prev, isPlaying: true })
  },

  // ── Library ──────────────────────────────────────────────────────────────
  library: [], localTracks: [], libraryLoaded: false,

  loadLibrary: async () => {
    const songs = await getAllSongs()
    set({ library: songs, libraryLoaded: true })
  },

  addToLibrary: async song => {
    await saveSong(song)
    set(s => ({ library: [song, ...s.library.filter(x => x.videoId !== song.videoId)] }))
  },

  removeFromLibrary: async videoId => {
    await deleteSong(videoId)
    set(s => ({ library: s.library.filter(x => x.videoId !== videoId) }))
  },

  setLocalTracks: tracks => set({ localTracks: tracks }),

  isInLibrary: videoId => get().library.some(s => s.videoId === videoId),

  // ── Playlists ────────────────────────────────────────────────────────────
  playlists: [],

  loadPlaylists: async () => set({ playlists: await getPlaylists() }),

  createPlaylist: async name => {
    const pl = { id: `pl_${Date.now()}`, name, songIds: [], createdAt: Date.now() }
    await putPlaylist(pl)
    set(s => ({ playlists: [pl, ...s.playlists] }))
    return pl
  },

  deletePlaylist: async id => {
    await deletePlaylist(id)
    set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }))
  },

  addSongToPlaylist: async (playlistId, song) => {
    const pl = get().playlists.find(p => p.id === playlistId)
    if (!pl || pl.songIds.includes(song.videoId)) return
    const updated = { ...pl, songIds: [...pl.songIds, song.videoId] }
    await putPlaylist(updated)
    await saveSong({ ...song, addedAt: Date.now() })
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }))
  },

  removeSongFromPlaylist: async (playlistId, videoId) => {
    const pl = get().playlists.find(p => p.id === playlistId)
    if (!pl) return
    const updated = { ...pl, songIds: pl.songIds.filter(id => id !== videoId) }
    await putPlaylist(updated)
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }))
  },

  // ── History ──────────────────────────────────────────────────────────────
  history: [],
  loadHistory: async () => set({ history: await getHistory(20) }),

  // ── Settings ─────────────────────────────────────────────────────────────
  localFilesEnabled: true,
  settingsLoaded: false,

  loadSettings: async () => {
    const localFilesEnabled = await getSetting('localFilesEnabled')
    set({
      localFilesEnabled: localFilesEnabled !== false, // default ON
      settingsLoaded: true,
    })
  },

  setLocalFilesEnabled: async v => {
    await setSetting('localFilesEnabled', v)
    set({ localFilesEnabled: v })
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  nowPlayingOpen:  false,
  playlistModal:   null,
  installPrompt:   null,

  setNowPlayingOpen: v => set({ nowPlayingOpen: v }),
  setPlaylistModal:  v => set({ playlistModal: v }),
  setInstallPrompt:  v => set({ installPrompt: v }),
}))

export default useStore
