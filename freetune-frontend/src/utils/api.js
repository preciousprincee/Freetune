/**
 * utils/api.js — All HTTP calls to the FreeTune backend.
 * Base URL from VITE_API_URL env variable (set in Vercel dashboard).
 * Falls back to the production backend so streaming always works cross-origin.
 */
const BASE = import.meta.env.VITE_API_URL || 'https://freetune-backend.onrender.com'

export async function apiSearch(query, limit = 20) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const { results } = await res.json()
  return results
}

export async function apiTrending(regionCode = 'US') {
  const res = await fetch(
    `${BASE}/api/search/trending?regionCode=${encodeURIComponent(regionCode)}&_=${Date.now()}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Trending failed: ${res.status}`)
  const { results } = await res.json()
  return results
}

/** Audio stream URL — used directly as <audio src="..."> */
export function streamUrl(videoId) {
  return `${BASE}/api/stream/${videoId}`
}

/**
 * Downloads audio as a blob and triggers browser "Save file" dialog.
 * Returns the blobUrl so callers can reuse it (e.g. for offline playback).
 */
export async function triggerDownload(videoId, title) {
  const url = `${BASE}/api/download/${videoId}?title=${encodeURIComponent(title)}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    const blob     = await res.blob()
    const blobUrl  = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = blobUrl
    a.download     = `${title.replace(/[^\w\s\-_.]/g, '').trim() || 'audio'}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Return blobUrl so caller can store it; revocation is caller's responsibility
    return blobUrl
  } catch (err) {
    console.error('[download] Failed:', err.message)
    throw err
  }
}
