/**
 * routes/search.js
 * YouTube Data API v3 — free, 10,000 requests/day, no bot blocking.
 * Requires YOUTUBE_API_KEY environment variable.
 */
const router = require('express').Router()
const fetch  = require('node-fetch')

const YT_API = 'https://www.googleapis.com/youtube/v3'

function getKey() {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY not set in environment variables')
  return key
}

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

function normalise(item) {
  const snippet = item.snippet || {}
  const id      = item.id?.videoId || item.id
  const thumbs  = snippet.thumbnails || {}
  const thumb   = thumbs.medium?.url || thumbs.default?.url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
  return {
    videoId:   id,
    title:     snippet.title   || 'Unknown',
    artist:    snippet.channelTitle || 'Unknown',
    duration:  0,
    thumbnail: thumb,
  }
}

// GET /api/search?q=...&limit=20
router.get('/', async (req, res, next) => {
  const { q, limit = 20 } = req.query
  if (!q?.trim()) return res.status(400).json({ error: 'Missing param: q' })
  try {
    const key = getKey()
    const url = `${YT_API}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(q.trim())}&maxResults=${Math.min(parseInt(limit)||20, 50)}&key=${key}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message || `YouTube API HTTP ${response.status}`)
    }
    const data    = await response.json()
    const results = (data.items || []).map(normalise)
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

// GET /api/search/trending?regionCode=US
router.get('/trending', async (req, res, next) => {
  try {
    const key        = getKey()
    const regionCode = (req.query.regionCode || 'US').toUpperCase().slice(0, 2)
    const url = `${YT_API}/videos?part=snippet&chart=mostPopular&videoCategoryId=10&maxResults=24&regionCode=${regionCode}&key=${key}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message || `YouTube API HTTP ${response.status}`)
    }
    const data    = await response.json()
    const results = (data.items || []).map(item => normalise({ ...item, id: { videoId: item.id } }))
    res.json({ results, regionCode })
  } catch (err) {
    next(err)
  }
})

module.exports = router
