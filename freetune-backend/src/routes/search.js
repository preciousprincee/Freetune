/**
 * routes/search.js
 * GET /api/search?q=<query>&limit=<n>
 *
 * Searches YouTube via the Invidious public API (no API key needed).
 * Returns an array of track objects with metadata.
 *
 * Invidious is an open-source YouTube frontend — we use it only for
 * search metadata (title, thumbnail, duration). The actual audio
 * comes from yt-dlp, not Invidious.
 *
 * Falls back through multiple Invidious instances if one fails.
 */
const router = require('express').Router()
const fetch  = require('node-fetch')

const INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacydev.net',
  'https://vid.puffyan.us',
]

let instanceIdx = 0

async function searchInvidious(query, limit = 20) {
  const errors = []
  for (let i = 0; i < INSTANCES.length; i++) {
    const base = INSTANCES[(instanceIdx + i) % INSTANCES.length]
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`
      const res = await fetch(url, { timeout: 8000 })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      instanceIdx = (instanceIdx + i) % INSTANCES.length // stick to working instance
      return data
        .filter(v => v.videoId && v.lengthSeconds > 0 && v.lengthSeconds < 3600)
        .slice(0, limit)
        .map(normalise)
    } catch (err) {
      errors.push(`${base}: ${err.message}`)
    }
  }
  throw new Error(`All search instances failed: ${errors.join(' | ')}`)
}

async function getTrending() {
  const base = INSTANCES[instanceIdx]
  const url  = `${base}/api/v1/trending?type=music&fields=videoId,title,author,lengthSeconds,videoThumbnails`
  const res  = await fetch(url, { timeout: 8000 })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data
    .filter(v => v.videoId && v.lengthSeconds < 3600)
    .slice(0, 24)
    .map(normalise)
}

function normalise(v) {
  const thumbs = v.videoThumbnails || []
  const thumb  = thumbs.find(t => t.quality === 'medium')
    || thumbs.find(t => t.quality === 'default')
    || thumbs[0]
  return {
    videoId:   v.videoId,
    title:     v.title  || 'Unknown',
    artist:    v.author || 'Unknown',
    duration:  v.lengthSeconds || 0,
    thumbnail: thumb?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
  }
}

// GET /api/search?q=...&limit=20
router.get('/', async (req, res, next) => {
  const { q, limit = 20 } = req.query
  if (!q?.trim()) return res.status(400).json({ error: 'Missing query param: q' })
  try {
    const results = await searchInvidious(q.trim(), parseInt(limit))
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

// GET /api/search/trending
router.get('/trending', async (req, res, next) => {
  try {
    const results = await getTrending()
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

module.exports = router
