/**
 * routes/health.js
 * GET /api/health — simple ping to verify the server is alive.
 * Railway uses this for health checks.
 */
const router = require('express').Router()

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'FreeTune API', timestamp: Date.now() })
})

module.exports = router
