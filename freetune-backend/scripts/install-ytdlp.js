/**
 * scripts/install-ytdlp.js
 * Downloads yt-dlp binary at postinstall time.
 * Uses curl or wget. Fails gracefully — server starts anyway
 * and ytdlp.js will throw a clear error on first audio request.
 *
 * IMPORTANT: always re-downloads "latest", even if a binary already
 * exists locally. YouTube changes its bot-detection / signature logic
 * frequently, and yt-dlp ships fixes for it constantly — a stale
 * binary from a previous deploy can fail on videos that a current
 * version handles fine (this is what produces "Sign in to confirm
 * you're not a bot" errors that seem to affect some videos but not
 * others). If your host persists the bin/ directory across deploys,
 * skipping the download here would silently lock you to an old,
 * increasingly broken version forever.
 */
const { execSync, spawnSync } = require('child_process')
const { existsSync, mkdirSync, chmodSync, unlinkSync } = require('fs')
const path = require('path')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

// 1. Prefer system yt-dlp ONLY if it reports a reasonably recent version.
//    Otherwise we still fetch our own copy into bin/ so we control updates.
const sys = spawnSync('which', ['yt-dlp'], { encoding: 'utf8' })
if (sys.stdout && sys.stdout.trim()) {
  console.log('✓ system yt-dlp found at:', sys.stdout.trim(), '— will still fetch a fresh local copy to ensure latest bot-detection fixes')
}

// 2. Always remove any existing local binary so we never run stale code.
if (existsSync(BIN_PATH)) {
  try {
    unlinkSync(BIN_PATH)
    console.log('🗑 removed cached yt-dlp binary to force a fresh download')
  } catch (err) {
    console.warn('⚠ could not remove cached binary, will overwrite:', err.message)
  }
}

// 3. Download latest binary
console.log('⬇ Downloading latest yt-dlp...')
try {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true })

  // Try curl first, then wget
  const hasCurl = spawnSync('which', ['curl'], { encoding: 'utf8' }).stdout?.trim()
  const hasWget = spawnSync('which', ['wget'], { encoding: 'utf8' }).stdout?.trim()

  if (hasCurl) {
    execSync(`curl -L "${YT_DLP_URL}" -o "${BIN_PATH}"`, { stdio: 'inherit' })
  } else if (hasWget) {
    execSync(`wget -q "${YT_DLP_URL}" -O "${BIN_PATH}"`, { stdio: 'inherit' })
  } else {
    console.warn('⚠ Neither curl nor wget found. yt-dlp not installed.')
    process.exit(0)
  }

  chmodSync(BIN_PATH, 0o755)
  console.log('✓ yt-dlp installed at', BIN_PATH)

  // Print the version we just installed so it's visible in deploy logs
  try {
    const version = execSync(`"${BIN_PATH}" --version`, { encoding: 'utf8' }).trim()
    console.log('✓ yt-dlp version:', version)
  } catch {}
} catch (err) {
  // Don't fail the build — server starts, audio routes fail gracefully
  console.warn('⚠ yt-dlp download failed:', err.message)
}
