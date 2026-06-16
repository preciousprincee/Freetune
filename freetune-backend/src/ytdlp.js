/**
 * src/ytdlp.js
 * yt-dlp integration using Node.js child_process.spawn directly.
 * This gives us reliable stdout piping without depending on yt-dlp-wrap's
 * streaming API (which changed across versions).
 *
 * On Railway: yt-dlp is installed via the postinstall script (curl from GitHub).
 * Audio is piped stdout → HTTP response. Nothing is saved to disk.
 * Standard quality: 128kbps MP3 — good balance of size and quality for mobile.
 */

const { spawn }   = require('child_process')
const { execSync } = require('child_process')
const path         = require('path')
const fs           = require('fs')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')

/**
 * getYtDlpBin
 * Returns the path to the yt-dlp binary.
 * Prefers: local bin/ → system PATH
 */
function getYtDlpBin() {
  if (fs.existsSync(BIN_PATH)) return BIN_PATH
  // Try system-installed yt-dlp (available on some hosts)
  try {
    const systemPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim()
    if (systemPath) return systemPath
  } catch {}
  throw new Error('yt-dlp binary not found. Run: npm run postinstall')
}

/**
 * getAudioStream
 * Spawns yt-dlp and returns the ChildProcess.
 * Caller pipes process.stdout → HTTP response.
 * Audio is NEVER saved to disk.
 *
 * @param {string} videoId  YouTube video ID (11 chars)
 * @returns {ChildProcess}
 */
function getAudioStream(videoId) {
  const bin  = getYtDlpBin()
  const url  = `https://www.youtube.com/watch?v=${videoId}`

  const args = [
    url,
    '--format',        'bestaudio[ext=m4a]/bestaudio/best',
    '--extract-audio',
    '--audio-format',  'mp3',
    '--audio-quality', '128K',       // standard 128kbps — small file, good quality
    '--no-playlist',
    '--output',        '-',          // pipe to stdout
    '--quiet',
    '--no-warnings',
    '--no-cache-dir',
    '--add-header',    'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  ]

  const proc = spawn(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  // Log stderr for debugging but don't block
  proc.stderr.on('data', d => {
    const msg = d.toString().trim()
    if (msg) console.error(`[yt-dlp] ${msg}`)
  })

  return proc
}

/**
 * getVideoInfo
 * Returns JSON metadata for a single video.
 * Used for getting title/thumbnail when needed.
 *
 * @param {string} videoId
 * @returns {Promise<object>}
 */
function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const bin  = getYtDlpBin()
    const url  = `https://www.youtube.com/watch?v=${videoId}`
    const proc = spawn(bin, [url, '--dump-json', '--no-playlist', '--quiet', '--no-warnings'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    proc.stdout.on('data', d => output += d.toString())
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`))
      try { resolve(JSON.parse(output)) }
      catch (e) { reject(new Error('Failed to parse yt-dlp JSON output')) }
    })
    proc.on('error', reject)
  })
}

module.exports = { getAudioStream, getVideoInfo, getYtDlpBin }
