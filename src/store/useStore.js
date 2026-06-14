/**
 * store/useStore.js
 * Global state via Zustand.
 *
 * Sections:
 *  - player  : currently playing track, queue, playback state
 *  - library : downloaded songs (mirrors IndexedDB, kept in memory for speed)
 *  - playlists
 *  - settings: cobalt instance URL, audio quality preference
 *  - ui      : active tab, modals
 *
 * All write operations also persist to IndexedDB via db.js.
 */

import { create } from 'zustand'
import {
  saveSong, getAllSongs, deleteSong,
  getAllPlaylists, createPlaylist, deletePlaylist,
  addSongToPlaylist, removeSongFromPlaylist, updatePlaylist,
  addToHistory, getHistory,
  getSetting, setSetting,
} from '../utils/db'

const useStore = create((set, get) => ({

  // ── Player ─────────────────────────────────────────────────────────────
  currentTrack: null,    // Track object
  queue:        [],      // Track[]
  queueIndex:   0,
  isPlaying:    false,
  progress:     0,       // 0–1
  duration:     0,       // seconds
  volume:       1,
  shuffle:      false,
  repeat:       'off',   // 'off' | 'one' | 'all'
  audioEl:      null,    // HTMLAudioElement ref

  setAudioEl: (el) => set({ audioEl: el }),

  playTrack: (track, queue = null) => {
    const q = queue || [track]
    const idx = q.findIndex(t => t.videoId === track.videoId)
    set({ currentTrack: track, queue: q, queueIndex: idx < 0 ? 0 : idx, isPlaying: true })
    addToHistory(track).catch(() => {})
  },

  setIsPlaying: (v)    => set({ isPlaying: v }),
  setProgress:  (v)    => set({ progress: v }),
  setDuration:  (v)    => set({ duration: v }),
  setVolume:    (v)    => set({ volume: v }),
  toggleShuffle: ()    => set(s => ({ shuffle: !s.shuffle })),
  toggleRepeat:  ()    => set(s => ({
    repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off'
  })),

  playNext: () => {
    const { queue, queueIndex, shuffle, repeat } = get()
    if (!queue.length) return
    let next
    if (shuffle) {
      next = Math.floor(Math.random() * queue.length)
    } else if (repeat === 'one') {
      next = queueIndex
    } else {
      next = (queueIndex + 1) % queue.length
    }
    const track = queue[next]
    set({ currentTrack: track, queueIndex: next, isPlaying: true })
    addToHistory(track).catch(() => {})
  },

  playPrev: () => {
    const { queue, queueIndex } = get()
    if (!queue.length) return
    const prev = (queueIndex - 1 + queue.length) % queue.length
    set({ currentTrack: queue[prev], queueIndex: prev, isPlaying: true })
  },

  // ── Library ────────────────────────────────────────────────────────────
  library:        [],   // Song[]
  libraryLoaded:  false,

  loadLibrary: async () => {
    const songs = await getAllSongs()
    set({ library: songs, libraryLoaded: true })
  },

  addToLibrary: async (song) => {
    await saveSong(song)
    const songs = await getAllSongs()
    set({ library: songs })
  },

  removeFromLibrary: async (videoId) => {
    await deleteSong(videoId)
    set(s => ({ library: s.library.filter(s => s.videoId !== videoId) }))
  },

  isInLibrary: (videoId) => {
    return get().library.some(s => s.videoId === videoId)
  },

  // ── Playlists ──────────────────────────────────────────────────────────
  playlists: [],

  loadPlaylists: async () => {
    const pls = await getAllPlaylists()
    set({ playlists: pls })
  },

  createPlaylist: async (name) => {
    const pl = await createPlaylist(name)
    set(s => ({ playlists: [pl, ...s.playlists] }))
    return pl
  },

  deletePlaylist: async (id) => {
    await deletePlaylist(id)
    set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }))
  },

  addSongToPlaylist: async (playlistId, videoId) => {
    await addSongToPlaylist(playlistId, videoId)
    const pls = await getAllPlaylists()
    set({ playlists: pls })
  },

  removeSongFromPlaylist: async (playlistId, videoId) => {
    await removeSongFromPlaylist(playlistId, videoId)
    const pls = await getAllPlaylists()
    set({ playlists: pls })
  },

  // ── History ────────────────────────────────────────────────────────────
  history: [],
  loadHistory: async () => {
    const h = await getHistory(20)
    set({ history: h })
  },

  // ── Settings ───────────────────────────────────────────────────────────
  cobaltInstance: '',
  audioQuality:   '128',
  settingsLoaded: false,

  loadSettings: async () => {
    const instance = await getSetting('cobaltInstance') || ''
    const quality  = await getSetting('audioQuality')  || '128'
    set({ cobaltInstance: instance, audioQuality: quality, settingsLoaded: true })
  },

  saveCobaltInstance: async (url) => {
    const clean = url.trim().replace(/\/$/, '')
    await setSetting('cobaltInstance', clean)
    set({ cobaltInstance: clean })
  },

  saveAudioQuality: async (q) => {
    await setSetting('audioQuality', q)
    set({ audioQuality: q })
  },

  // ── UI ─────────────────────────────────────────────────────────────────
  activeTab:       'home',   // 'home' | 'search' | 'library'
  nowPlayingOpen:  false,
  playlistModal:   null,     // { videoId } | null

  setActiveTab:      (t) => set({ activeTab: t }),
  setNowPlayingOpen: (v) => set({ nowPlayingOpen: v }),
  setPlaylistModal:  (v) => set({ playlistModal: v }),
}))

export default useStore
