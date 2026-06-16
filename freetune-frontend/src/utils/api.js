/**
 * utils/api.js — All HTTP calls to the FreeTune backend.
 * Base URL from VITE_API_URL env variable (set in Vercel dashboard).
 */
const BASE = import.meta.env.VITE_API_URL || ''

export async function apiSearch(query, limit = 20) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const { results } = await res.json()
  return results
}

export async function apiTrending() {
  const res = await fetch(`${BASE}/api/search/trending`)
  if (!res.ok) throw new Error(`Trending failed: ${res.status}`)
  const { results } = await res.json()
  return results
}

/** Audio stream URL — used directly as <audio src="..."> */
export function streamUrl(videoId) {
  return `${BASE}/api/stream/${videoId}`
}

/** Triggers browser "Save file" dialog for MP3 download */
export function triggerDownload(videoId, title) {
  const url = `${BASE}/api/download/${videoId}?title=${encodeURIComponent(title)}`
  const a   = document.createElement('a')
  a.href = url; a.download = `${title}.mp3`; a.click()
}
