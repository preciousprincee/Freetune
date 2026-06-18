/**
 * src/piped.js
 * Fetches audio stream URLs via the Piped API network.
 *
 * Piped (https://github.com/TeamPiped/Piped) is an open-source YouTube
 * frontend that proxies YouTube internally — no bot detection, no cookies.
 * Multiple public instances are tried in order for reliability.
 */

const fetch = require('node-fetch')

// Public Piped instances — tried in order, first success wins
// List kept updated: https://github.com/TeamPiped/Piped/wiki/Instances
const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://api.piped.yt',
  'https://piped.video/api',
  'https://piped.adminforge.de/api',
]

/**
 * getAudioUrl
 * Returns a direct audio stream URL for the given YouTube video ID.
 * Tries each Piped instance until one succeeds.
 *
 * @param {string} videoId
 * @returns {Promise<{url: string, mimeType: string, instance: string}>}
 */
async function getAudioUrl(videoId) {
  const errors = []

  for (const instance of INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        timeout: 8000,
        headers: { 'User-Agent': 'FreeTune/1.0' },
      })

      if (!res.ok) {
        errors.push(`${instance}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()

      if (data.error) {
        errors.push(`${instance}: ${data.error}`)
        continue
      }

      // Pick the best audio-only stream
      const audioStreams = (data.audioStreams || [])
        .filter(s => s.url && s.mimeType)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

      if (!audioStreams.length) {
        errors.push(`${instance}: no audio streams found`)
        continue
      }

      // Prefer m4a/mp4a (wider mobile support), fall back to webm/opus
      const preferred = audioStreams.find(s => s.mimeType.includes('mp4') || s.mimeType.includes('m4a'))
        || audioStreams[0]

      console.log(`[piped] Got stream from ${instance} — ${preferred.mimeType} @ ${preferred.bitrate}bps`)
      return { url: preferred.url, mimeType: preferred.mimeType, instance }

    } catch (err) {
      errors.push(`${instance}: ${err.message}`)
    }
  }

  throw new Error(`All Piped instances failed:\n${errors.join('\n')}`)
}

module.exports = { getAudioUrl }
