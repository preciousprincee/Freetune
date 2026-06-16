/**
 * routes/stream.js
 * GET /api/stream/:videoId
 *
 * Streams MP3 audio to the browser for in-app playback.
 * yt-dlp stdout is piped directly to the HTTP response.
 * Nothing is saved to disk on the server.
 */
const router = require('express').Router()
const { getAudioStream } = require('../ytdlp')

router.get('/:videoId', (req, res) => {
  const { videoId } = req.params

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  let proc
  try {
    proc = getAudioStream(videoId)
  } catch (err) {
    console.error('[stream] Failed to start yt-dlp:', err.message)
    return res.status(503).json({ error: 'Audio service unavailable: ' + err.message })
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Pipe yt-dlp stdout → HTTP response
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
    }
    res.end()
  })
})

module.exports = router
