/**
 * routes/download.js
 * GET /api/download/:videoId?title=<name>
 *
 * Fetches audio via Piped API, converts to MP3 via ffmpeg on the fly,
 * and streams the result to the client as a downloadable .mp3 file.
 * Nothing is saved to disk.
 */
const router       = require('express').Router()
const fetch        = require('node-fetch')
const { spawn }    = require('child_process')
const { execSync } = require('child_process')
const { getAudioUrl } = require('../piped')

function getFfmpegBin() {
  try {
    return execSync('which ffmpeg', { encoding: 'utf8' }).trim() || 'ffmpeg'
  } catch {
    return 'ffmpeg'
  }
}

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  const title     = (req.query.title || 'freetune-audio').substring(0, 100)
  const safeTitle = title.replace(/[^\w\s\-_.]/g, '').trim().replace(/\s+/g, '_') || 'audio'

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  // 1. Resolve audio URL from Piped
  let audioUrl
  try {
    ;({ url: audioUrl } = await getAudioUrl(videoId))
  } catch (err) {
    console.error('[download] Failed to resolve audio URL:', err.message)
    return res.status(503).json({ error: 'Could not resolve audio stream. Try again.' })
  }

  // 2. Fetch the m4a stream from Piped CDN
  let upstream
  try {
    upstream = await fetch(audioUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.youtube.com/' },
    })
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`)
  } catch (err) {
    console.error('[download] Upstream fetch failed:', err.message)
    return res.status(502).json({ error: 'Failed to fetch audio' })
  }

  // 3. Pipe through ffmpeg: m4a/webm → mp3 128kbps (stdin → stdout, no disk I/O)
  const ffmpeg = spawn(getFfmpegBin(), [
    '-i', 'pipe:0',       // read from stdin
    '-vn',                // no video
    '-ar', '44100',       // sample rate
    '-ac', '2',           // stereo
    '-b:a', '128k',       // 128kbps
    '-f', 'mp3',          // output format
    'pipe:1',             // write to stdout
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  ffmpeg.stderr.on('data', d => {
    // ffmpeg logs progress to stderr — suppress unless debugging
    // console.log('[ffmpeg]', d.toString().trim())
  })

  ffmpeg.on('error', err => {
    console.error('[download] ffmpeg error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Conversion failed — ffmpeg not available' })
  })

  // Send headers only once ffmpeg starts producing output
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Pipeline: Piped CDN → ffmpeg stdin → ffmpeg stdout → HTTP response
  upstream.body.pipe(ffmpeg.stdin)
  ffmpeg.stdout.pipe(res)

  // Clean up if client disconnects mid-download
  req.on('close', () => {
    try { upstream.body.destroy() } catch {}
    try { ffmpeg.kill('SIGTERM') } catch {}
  })

  ffmpeg.on('close', code => {
    if (code !== 0) console.error(`[download] ffmpeg exited with code ${code}`)
    res.end()
  })
})

module.exports = router
