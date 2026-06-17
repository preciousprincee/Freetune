/**
 * routes/stream.js
 * GET /api/stream/:videoId
 *
 * Streams audio to the browser for in-app playback.
 * yt-dlp stdout is piped directly to the HTTP response.
 * Nothing is saved to disk on the server.
 *
 * Content-Type varies: 'audio/mpeg' (mp3) when ffmpeg is available on the
 * host, otherwise the native format yt-dlp grabbed (typically audio/mp4
 * for m4a) — see ytdlp.js for why.
 */
const router = require('express').Router()
const { getAudioStream } = require('../ytdlp')

router.get('/:videoId', (req, res) => {
  const { videoId } = req.params

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  let proc, contentType
  try {
    ;({ proc, contentType } = getAudioStream(videoId))
  } catch (err) {
    console.error('[stream] Failed to start yt-dlp:', err.message)
    return res.status(503).json({ error: 'Audio service unavailable: ' + err.message })
  }

  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Range')
  res.setHeader('Accept-Ranges', 'none')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  let bytesWritten = false
  proc.stdout.once('data', () => { bytesWritten = true })
  proc.stdout.pipe(res)

  // Kill yt-dlp if client disconnects to free resources
  req.on('close', () => {
    try { proc.kill('SIGTERM') } catch {}
  })

  proc.on('error', err => {
    console.error('[stream] Process error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Stream failed' })
    else res.end()
  })

  proc.on('close', code => {
    if (code !== 0 && code !== null) {
      console.error(`[stream] yt-dlp exited with code ${code}`)
      // If yt-dlp failed before sending any audio bytes, surface a real
      // error instead of letting the browser see an empty 200 response
      // (which is what made playback fail silently before).
      if (!bytesWritten && !res.headersSent) {
        return res.status(502).json({ error: 'Could not retrieve audio for this video. It may be region-locked, age-restricted, or blocked by YouTube.' })
      }
    }
    res.end()
  })
})

module.exports = router
