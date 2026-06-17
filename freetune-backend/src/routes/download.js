/**
 * routes/download.js
 * GET /api/download/:videoId?title=<name>
 *
 * Same as /stream but sets Content-Disposition: attachment
 * so the browser saves the file instead of playing inline.
 * The audio is piped directly — never stored on the server.
 *
 * File extension matches the actual format streamed: .mp3 when ffmpeg
 * is available, .m4a otherwise (see ytdlp.js).
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

  let proc, contentType
  try {
    ;({ proc, contentType } = getAudioStream(videoId))
  } catch (err) {
    console.error('[download] Failed to start yt-dlp:', err.message)
    return res.status(503).json({ error: 'Audio service unavailable: ' + err.message })
  }

  const ext = contentType === 'audio/mpeg' ? 'mp3' : 'm4a'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  let bytesWritten = false
  proc.stdout.once('data', () => { bytesWritten = true })
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
      if (!bytesWritten && !res.headersSent) {
        return res.status(502).json({ error: 'Could not retrieve audio for this video. It may be region-locked, age-restricted, or blocked by YouTube.' })
      }
    }
    res.end()
  })
})

module.exports = router
