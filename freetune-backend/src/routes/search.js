const router = require('express').Router()
const fetch  = require('node-fetch')

const INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacydev.net',
  'https://vid.puffyan.us',
]

let instanceIdx = 0

// node-fetch v2 doesn't support {timeout} — use AbortController instead
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

async function tryInstances(buildUrl) {
  const errors = []
  for (let i = 0; i < INSTANCES.length; i++) {
    const idx  = (instanceIdx + i) % INSTANCES.length
    const base = INSTANCES[idx]
    try {
      const res = await fetchWithTimeout(buildUrl(base))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      instanceIdx = idx // stick to working instance
      return data
    } catch (err) {
      errors.push(`${base}: ${err.message}`)
    }
  }
  throw new Error(`All instances failed: ${errors.join(' | ')}`)
}

// GET /api/search?q=...
router.get('/', async (req, res, next) => {
  const { q, limit = 20 } = req.query
  if (!q?.trim()) return res.status(400).json({ error: 'Missing param: q' })
  try {
    const data = await tryInstances(base =>
      `${base}/api/v1/search?q=${encodeURIComponent(q.trim())}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`
    )
    const results = data
      .filter(v => v.videoId && v.lengthSeconds > 0 && v.lengthSeconds < 3600)
      .slice(0, parseInt(limit) || 20)
      .map(normalise)
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

// GET /api/search/trending
router.get('/trending', async (req, res, next) => {
  try {
    const data = await tryInstances(base =>
      `${base}/api/v1/trending?type=music&fields=videoId,title,author,lengthSeconds,videoThumbnails`
    )
    const results = data
      .filter(v => v.videoId && v.lengthSeconds < 3600)
      .slice(0, 24)
      .map(normalise)
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

module.exports = router
