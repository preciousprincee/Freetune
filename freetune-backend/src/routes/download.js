/**
 * routes/download.js
 * GET /api/download/:videoId?title=<name>
 *
 * Same as /stream but sets Content-Disposition: attachment
 * so the browser saves the file instead of playing inline.
 * The MP3 is piped directly — never stored on the server.
 */
const router = require('express').Router()
const { getAudioStream } = require('../ytdlp')

router.get('/:videoId', (req, res) => {
  const { videoId }  = req.params
  const title        = (req.query.title || 'freetune-audio').substring(0, 100)
  const safeTitle    = title.replace(/[^\w\s\-_.]/g, '').trim().replace(/\s+/g, '_') || 'audio'

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  let proc
  try {
    proc = getAudioStream(videoId)
  } catch (err) {
    console.error('[download] Failed to start yt-dlp:', err.message)
    return res.status(503).json({ error: 'Audio service unavailable: ' + err.message })
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  proc.stdout.pipe(res)

  req.on('close', () => {
    try { proc.kill('SIGTERM') } catch {}
  })

  proc.on('error', err => {
    console.error('[download] Process error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Download failed' })
    else res.end()
  })

  proc.on('close', code => {
    if (code !== 0 && code !== null) {
      console.error(`[download] yt-dlp exited with code ${code}`)
    }
    res.end()
  })
})

module.exports = router
