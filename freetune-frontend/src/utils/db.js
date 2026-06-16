/**
 * utils/db.js — IndexedDB via idb library.
 * Stores: songs (downloaded), playlists, history, settings.
 * All data lives on the user's phone. Zero server dependency for stored content.
 */
import { openDB } from 'idb'

const DB_NAME = 'freetune-db', DB_VER = 1
let _db = null

async function db() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VER, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'videoId' })
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'videoId' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
    },
  })
  return _db
}

// Songs
export const saveSong       = async s   => (await db()).put('songs', { ...s, addedAt: s.addedAt || Date.now() })
export const getSong        = async id  => (await db()).get('songs', id)
export const getAllSongs     = async ()  => (await db()).getAll('songs').then(a => a.sort((x,y) => y.addedAt - x.addedAt))
export const deleteSong     = async id  => (await db()).delete('songs', id)

// Playlists
export const getPlaylists   = async ()  => (await db()).getAll('playlists').then(a => a.sort((x,y) => y.createdAt - x.createdAt))
export const getPlaylist    = async id  => (await db()).get('playlists', id)
export const putPlaylist    = async pl  => (await db()).put('playlists', pl)
export const deletePlaylist = async id  => (await db()).delete('playlists', id)

// History
export const addHistory     = async s   => (await db()).put('history', { ...s, playedAt: Date.now() })
export const getHistory     = async (n=20) => (await db()).getAll('history').then(a => a.sort((x,y)=>y.playedAt-x.playedAt).slice(0,n))

// Settings
export const getSetting     = async k   => (await db()).get('settings', k)
export const setSetting     = async (k,v) => (await db()).put('settings', v, k)
