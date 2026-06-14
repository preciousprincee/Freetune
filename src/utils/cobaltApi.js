/**
 * utils/cobaltApi.js
 * Wraps the Cobalt API for audio stream/download URL extraction.
 *
 * Two modes:
 *  1. stream  — returns a URL for <audio> src (in-app playback)
 *  2. download — same URL, browser is told to save as file
 */

/**
 * getAudioUrl
 * Calls Cobalt API and returns a streamable/downloadable audio URL.
 *
 * @param {string} instance  - Cobalt instance base URL
 * @param {string} youtubeUrl
 * @param {'mp3'|'opus'} format
 * @param {string} quality   - kbps e.g. '128', '320'
 * @returns {Promise<string>} audio URL
 */
export async function getAudioUrl({ instance, youtubeUrl, format = 'mp3', quality = '128' }) {
  if (!instance) throw new Error('NO_INSTANCE')

  const payload = {
    url:          youtubeUrl,
    downloadMode: 'audio',
    audioFormat:  format,
    audioBitrate: quality,
  }

  let response
  try {
    response = await fetch(`${instance}/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot reach your Cobalt instance. Check Settings.')
    }
    throw err
  }

  const data = await response.json().catch(() => {
    throw new Error(`Instance returned invalid response (HTTP ${response.status}).`)
  })

  if (!response.ok || data.status === 'error') {
    const code = data?.error?.code || data?.text || `HTTP ${response.status}`
    throw new Error(friendlyError(code))
  }

  if (data.url) return data.url
  if (data.status === 'redirect' || data.status === 'stream') return data.url

  throw new Error('Unexpected Cobalt response. Try a different instance.')
}

/**
 * downloadAudioBlob
 * Fetches the audio as a Blob for saving to IndexedDB (offline playback).
 *
 * @param {string} audioUrl
 * @returns {Promise<Blob>}
 */
export async function downloadAudioBlob(audioUrl) {
  const res = await fetch(audioUrl)
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
  return res.blob()
}

function friendlyError(code = '') {
  if (code.includes('youtube'))    return 'YouTube blocked this request. Your Cobalt instance may need fresh cookies.'
  if (code.includes('rate'))       return 'Rate limited. Try again in a moment.'
  if (code.includes('CORS'))       return 'CORS error — set CORS_WILDCARD=1 on your Cobalt instance.'
  if (code.includes('too_long'))   return 'This video is too long to process.'
  if (code.includes('link.invalid')) return 'Invalid YouTube URL.'
  return code || 'Something went wrong. Check your Cobalt instance in Settings.'
}
