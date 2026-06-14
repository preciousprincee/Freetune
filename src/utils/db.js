/**
 * utils/db.js
 * IndexedDB wrapper using the `idb` library.
 * Stores everything on the user's device — no server needed.
 *
 * Stores:
 *  - songs       : downloaded song metadata + blob data
 *  - playlists   : user-created playlists
 *  - history     : recently played songs
 *  - settings    : user preferences (cobalt instance, etc.)
 *
 * Future: swap localStorage/IndexedDB for cloud sync when Google login is added.
 */

import { openDB } from 'idb'

const DB_NAME    = 'freetune-db'
const DB_VERSION = 1

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Songs store — keyed by YouTube videoId
        if (!db.objectStoreNames.contains('songs')) {
          const songs = db.createObjectStore('songs', { keyPath: 'videoId' })
          songs.createIndex('title',    'title')
          songs.createIndex('artist',   'artist')
          songs.createIndex('addedAt',  'addedAt')
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          const pl = db.createObjectStore('playlists', { keyPath: 'id' })
          pl.createIndex('name', 'name')
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const h = db.createObjectStore('history', { keyPath: 'videoId' })
          h.createIndex('playedAt', 'playedAt')
        }

        // Settings store (key-value)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })
  }
  return dbPromise
}

// ── Songs ──────────────────────────────────────────────────────────────────

export async function saveSong(song) {
  const db = await getDb()
  await db.put('songs', { ...song, addedAt: song.addedAt || Date.now() })
}

export async function getSong(videoId) {
  const db = await getDb()
  return db.get('songs', videoId)
}

export async function getAllSongs() {
  const db = await getDb()
  const all = await db.getAll('songs')
  return all.sort((a, b) => b.addedAt - a.addedAt)
}

export async function deleteSong(videoId) {
  const db = await getDb()
  await db.delete('songs', videoId)
}

export async function songExists(videoId) {
  const db = await getDb()
  const song = await db.get('songs', videoId)
  return !!song
}

// ── Playlists ──────────────────────────────────────────────────────────────

export async function createPlaylist(name) {
  const db = await getDb()
  const playlist = {
    id:        `pl_${Date.now()}`,
    name,
    songIds:   [],
    createdAt: Date.now(),
    coverUrl:  null,
  }
  await db.put('playlists', playlist)
  return playlist
}

export async function getAllPlaylists() {
  const db = await getDb()
  const all = await db.getAll('playlists')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getPlaylist(id) {
  const db = await getDb()
  return db.get('playlists', id)
}

export async function addSongToPlaylist(playlistId, videoId) {
  const db = await getDb()
  const pl = await db.get('playlists', playlistId)
  if (!pl) return
  if (!pl.songIds.includes(videoId)) {
    pl.songIds.push(videoId)
    await db.put('playlists', pl)
  }
}

export async function removeSongFromPlaylist(playlistId, videoId) {
  const db = await getDb()
  const pl = await db.get('playlists', playlistId)
  if (!pl) return
  pl.songIds = pl.songIds.filter(id => id !== videoId)
  await db.put('playlists', pl)
}

export async function deletePlaylist(id) {
  const db = await getDb()
  await db.delete('playlists', id)
}

export async function updatePlaylist(playlist) {
  const db = await getDb()
  await db.put('playlists', playlist)
}

// ── History ────────────────────────────────────────────────────────────────

export async function addToHistory(song) {
  const db = await getDb()
  await db.put('history', { ...song, playedAt: Date.now() })
}

export async function getHistory(limit = 20) {
  const db = await getDb()
  const all = await db.getAll('history')
  return all
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, limit)
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSetting(key) {
  const db = await getDb()
  return db.get('settings', key)
}

export async function setSetting(key, value) {
  const db = await getDb()
  await db.put('settings', value, key)
}
