/**
 * src/ytdlp.js
 * yt-dlp integration using Node.js child_process.spawn directly.
 *
 * Uses the iOS/Android player client to bypass YouTube's bot detection
 * on cloud/datacenter IPs — these mobile API endpoints are far less
 * aggressively blocked than the web player endpoint.
 *
 * Audio is piped stdout → HTTP response. Nothing is saved to disk.
 */

const { spawn }    = require('child_process')
const { execSync } = require('child_process')
const path         = require('path')
const fs           = require('fs')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')

function getYtDlpBin() {
  if (fs.existsSync(BIN_PATH)) return BIN_PATH
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
 *
 * Uses iOS player client to avoid bot-detection on cloud IPs.
 *
 * @param {string} videoId  YouTube video ID (11 chars)
 * @returns {ChildProcess}
 */
function getAudioStream(videoId) {
  const bin = getYtDlpBin()
  const url = `https://www.youtube.com/watch?v=${videoId}`

  const args = [
    url,
    '--format',          'bestaudio[ext=m4a]/bestaudio/best',
    '--extract-audio',
    '--audio-format',    'mp3',
    '--audio-quality',   '128K',
    '--no-playlist',
    '--output',          '-',
    '--quiet',
    '--no-warnings',
    '--no-cache-dir',
    // Use iOS client — bypasses bot detection on datacenter IPs
    '--extractor-args',  'youtube:player_client=ios',
    // Fallback chain if iOS client also fails
    '--extractor-args',  'youtube:player_client=ios,android,web',
  ]

  const proc = spawn(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  proc.stderr.on('data', d => {
    const msg = d.toString().trim()
    if (msg) console.error(`[yt-dlp] ${msg}`)
  })

  return proc
}

function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const bin  = getYtDlpBin()
    const url  = `https://www.youtube.com/watch?v=${videoId}`
    const proc = spawn(bin, [
      url,
      '--dump-json',
      '--no-playlist',
      '--quiet',
      '--no-warnings',
      '--extractor-args', 'youtube:player_client=ios',
    ], {
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
