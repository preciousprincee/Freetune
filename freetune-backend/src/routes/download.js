/**
 * routes/download.js
 * Fetches audio via @distube/ytdl-core, converts to MP3 via ffmpeg on the fly.
 */
const router       = require('express').Router()
const { spawn }    = require('child_process')
const { execSync } = require('child_process')
const ytdl         = require('@distube/ytdl-core')

function getFfmpegBin() {
  try { return execSync('which ffmpeg', { encoding: 'utf8' }).trim() || 'ffmpeg' }
  catch { return 'ffmpeg' }
}

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  const title     = (req.query.title || 'freetune-audio').substring(0, 100)
  const safeTitle = title.replace(/[^\w\s\-_.]/g, '').trim().replace(/\s+/g, '_') || 'audio'

  if (!videoId || !/^[\w-]{11}$/.test(videoId))
    return res.status(400).json({ error: 'Invalid video ID' })

  let info
  try {
    info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
  } catch (err) {
    console.error('[download] getInfo failed:', err.message)
    return res.status(503).json({ error: 'Could not resolve audio. Try again.' })
  }

  const format = ytdl.chooseFormat(info.formats, {
    quality: 'highestaudio',
    filter: 'audioonly',
  })

  const audioStream = ytdl.downloadFromInfo(info, { format })

  const ffmpeg = spawn(getFfmpegBin(), [
    '-i', 'pipe:0',
    '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k',
    '-f', 'mp3', 'pipe:1',
  ], { stdio: ['pipe', 'pipe', 'pipe'] })

  ffmpeg.stderr.on('data', () => {})
  ffmpeg.on('error', err => {
    console.error('[download] ffmpeg error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Conversion failed' })
  })

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  audioStream.pipe(ffmpeg.stdin)
  ffmpeg.stdout.pipe(res)

  req.on('close', () => {
    try { audioStream.destroy() } catch {}
    try { ffmpeg.kill('SIGTERM') } catch {}
  })

  ffmpeg.on('close', code => {
    if (code !== 0) console.error(`[download] ffmpeg exited ${code}`)
    res.end()
  })
})

module.exports = router
