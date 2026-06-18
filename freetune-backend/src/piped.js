/**
 * src/piped.js
 * Resolves YouTube audio URLs via Piped and Invidious public instances.
 * Tries all instances in parallel and takes the first success.
 * No API key, no cookies needed.
 */

// Piped instances — returns audioStreams array
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.coldforge.xyz',
  'https://piped-api.privacy.com.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.drgns.space',
  'https://pipedapi.moomoo.me',
  'https://pipedapi.phoenixthrush.com',
]

// Invidious instances — returns adaptiveFormats array
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacydev.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.perennialte.ch',
  'https://yt.cdaut.de',
  'https://invidious.fdn.fr',
  'https://invidious.lunar.icu',
  'https://inv.tux.pizza',
  'https://invidious.protokolla.fi',
  'https://invidious.io.lol',
  'https://iv.melmac.space',
]

async function tryPiped(instance, videoId) {
  const res = await fetch(`${instance}/streams/${videoId}`, {
    signal: AbortSignal.timeout(6000),
    headers: { 'User-Agent': 'FreeTune/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)

  const streams = (data.audioStreams || [])
    .filter(s => s.url && s.mimeType)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

  if (!streams.length) throw new Error('no audio streams')

  const best = streams.find(s => s.mimeType.includes('mp4') || s.mimeType.includes('m4a')) || streams[0]
  return { url: best.url, mimeType: best.mimeType }
}

async function tryInvidious(instance, videoId) {
  const res = await fetch(`${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats`, {
    signal: AbortSignal.timeout(6000),
    headers: { 'User-Agent': 'FreeTune/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)

  const streams = (data.adaptiveFormats || [])
    .filter(s => s.url && s.type && s.type.startsWith('audio/'))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

  if (!streams.length) throw new Error('no audio streams')

  const best = streams.find(s => s.type.includes('mp4') || s.type.includes('m4a')) || streams[0]
  return { url: best.url, mimeType: best.type.split(';')[0] }
}

/**
 * getAudioUrl
 * Races all Piped + Invidious instances in parallel.
 * Returns the first successful result.
 */
async function getAudioUrl(videoId) {
  const attempts = [
    ...PIPED_INSTANCES.map(i => tryPiped(i, videoId).then(r => ({ ...r, instance: i }))),
    ...INVIDIOUS_INSTANCES.map(i => tryInvidious(i, videoId).then(r => ({ ...r, instance: i }))),
  ]

  // Try all in parallel, return first success
  return new Promise((resolve, reject) => {
    let failures = 0
    const total  = attempts.length

    attempts.forEach(p =>
      p.then(result => {
        console.log(`[piped] ✓ ${result.instance} — ${result.mimeType}`)
        resolve(result)
      }).catch(err => {
        failures++
        if (failures === total) {
          reject(new Error(`All ${total} instances failed. Last: ${err.message}`))
        }
      })
    )
  })
}

module.exports = { getAudioUrl }
