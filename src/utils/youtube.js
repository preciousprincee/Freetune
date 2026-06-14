/**
 * utils/youtube.js
 * YouTube search and metadata helpers.
 *
 * Search strategy: Uses the Invidious public API (open-source YouTube frontend)
 * — no API key required, free, returns JSON results with thumbnails.
 *
 * Invidious instance list: https://instances.invidious.io
 * We try a primary and fall back to others if it fails.
 *
 * Future upgrade: swap for YouTube Data API v3 with a key for higher quotas.
 */

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacydev.net',
]

let currentInstanceIdx = 0

function getInstance() {
  return INVIDIOUS_INSTANCES[currentInstanceIdx]
}

function rotateInstance() {
  currentInstanceIdx = (currentInstanceIdx + 1) % INVIDIOUS_INSTANCES.length
}

/**
 * searchYouTube
 * Search for videos by query string.
 * Returns an array of track objects.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Track[]>}
 */
export async function searchYouTube(query, limit = 20) {
  let lastError
  for (let attempt = 0; attempt < INVIDIOUS_INSTANCES.length; attempt++) {
    try {
      const base = getInstance()
      const url  = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      return data
        .filter(v => v.videoId && v.lengthSeconds > 0 && v.lengthSeconds < 3600) // skip >1hr
        .slice(0, limit)
        .map(v => videoToTrack(v))
    } catch (err) {
      lastError = err
      rotateInstance()
    }
  }
  throw new Error(`Search failed: ${lastError?.message || 'All instances unreachable'}`)
}

/**
 * getTrending
 * Returns trending music videos from Invidious.
 *
 * @returns {Promise<Track[]>}
 */
export async function getTrending() {
  let lastError
  for (let attempt = 0; attempt < INVIDIOUS_INSTANCES.length; attempt++) {
    try {
      const base = getInstance()
      const url  = `${base}/api/v1/trending?type=music&fields=videoId,title,author,lengthSeconds,videoThumbnails`
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data
        .filter(v => v.videoId && v.lengthSeconds < 3600)
        .slice(0, 24)
        .map(v => videoToTrack(v))
    } catch (err) {
      lastError = err
      rotateInstance()
    }
  }
  throw new Error(`Trending failed: ${lastError?.message}`)
}

/**
 * getVideoInfo
 * Fetch metadata for a single video.
 *
 * @param {string} videoId
 * @returns {Promise<Track>}
 */
export async function getVideoInfo(videoId) {
  const base = getInstance()
  const url  = `${base}/api/v1/videos/${videoId}?fields=videoId,title,author,lengthSeconds,videoThumbnails,description`
  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const v = await res.json()
  return videoToTrack(v)
}

/**
 * videoToTrack
 * Normalises a raw Invidious video object into a FreeTune Track object.
 *
 * Track shape:
 * {
 *   videoId:    string
 *   title:      string
 *   artist:     string   (channel name)
 *   duration:   number   (seconds)
 *   thumbnail:  string   (URL)
 *   streamUrl:  string   (YouTube embed URL — used by Audio element)
 * }
 */
function videoToTrack(v) {
  // Pick best available thumbnail
  const thumbs   = v.videoThumbnails || []
  const mqThumb  = thumbs.find(t => t.quality === 'medium')
    || thumbs.find(t => t.quality === 'default')
    || thumbs[0]
  const thumbnail = mqThumb?.url
    || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`

  return {
    videoId:   v.videoId,
    title:     v.title   || 'Unknown Title',
    artist:    v.author  || 'Unknown Artist',
    duration:  v.lengthSeconds || 0,
    thumbnail,
    // YouTube watch URL — used with cobalt for audio extraction
    youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
  }
}

/**
 * formatDuration
 * Converts seconds to mm:ss string.
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * isValidYouTubeUrl
 */
export function isValidYouTubeUrl(url) {
  return /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/.test(url)
}

/**
 * extractVideoId
 */
export function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]+)/)
  return m ? m[1] : null
}
