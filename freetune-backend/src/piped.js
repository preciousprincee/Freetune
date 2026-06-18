/**
 * src/piped.js
 * Fetches audio stream URLs via the Piped API network.
 * Uses native fetch (Node 18+) — no node-fetch dependency.
 */

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://api.piped.yt',
  'https://piped.video/api',
  'https://piped.adminforge.de/api',
]

async function getAudioUrl(videoId) {
  const errors = []

  for (const instance of INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'FreeTune/1.0' },
      })

      if (!res.ok) { errors.push(`${instance}: HTTP ${res.status}`); continue }

      const data = await res.json()
      if (data.error) { errors.push(`${instance}: ${data.error}`); continue }

      const audioStreams = (data.audioStreams || [])
        .filter(s => s.url && s.mimeType)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

      if (!audioStreams.length) { errors.push(`${instance}: no audio streams`); continue }

      const preferred = audioStreams.find(s => s.mimeType.includes('mp4') || s.mimeType.includes('m4a'))
        || audioStreams[0]

      console.log(`[piped] ${instance} — ${preferred.mimeType} @ ${preferred.bitrate}bps`)
      return { url: preferred.url, mimeType: preferred.mimeType, instance }

    } catch (err) {
      errors.push(`${instance}: ${err.message}`)
    }
  }

  throw new Error(`All Piped instances failed:\n${errors.join('\n')}`)
}

module.exports = { getAudioUrl }
