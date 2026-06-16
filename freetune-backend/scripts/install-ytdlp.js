/**
 * scripts/install-ytdlp.js
 * Downloads yt-dlp binary at npm postinstall time.
 * Runs automatically when Railway runs `npm install`.
 * Safe to re-run — skips if binary already exists.
 */

const { execSync, spawnSync } = require('child_process')
const { existsSync, mkdirSync, chmodSync } = require('fs')
const path = require('path')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')

// Check system yt-dlp first
const sys = spawnSync('which', ['yt-dlp'], { encoding: 'utf8' })
if (sys.stdout && sys.stdout.trim()) {
  console.log('✓ yt-dlp found at system path:', sys.stdout.trim())
  process.exit(0)
}

// Check local bin
if (existsSync(BIN_PATH)) {
  console.log('✓ yt-dlp already installed at', BIN_PATH)
  process.exit(0)
}

// Download from GitHub releases
console.log('⬇ Downloading yt-dlp binary from GitHub...')
try {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true })
  execSync(
    `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${BIN_PATH}"`,
    { stdio: 'inherit' }
  )
  chmodSync(BIN_PATH, 0o755)
  console.log('✓ yt-dlp installed at', BIN_PATH)
} catch (err) {
  console.warn('⚠ Could not download yt-dlp:', err.message)
  console.warn('  Ensure yt-dlp is available on PATH in production.')
  // Don't exit with error - let the app start, it'll fail gracefully on first request
}
