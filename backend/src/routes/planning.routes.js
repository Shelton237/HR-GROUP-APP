const router = require("express").Router();
const { authenticate, blockReadOnly } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/error");
const { planningFetch } = require("../services/planningProxy.service");

// Generic proxy to the Control Room Planning Laravel API (see
// planningProxy.service.js) — mirrors docs/CONTRACT.md's /api surface
// under /api/planning/*, e.g. /api/planning/rooms/3/schedule?week=...
// forwards to <PLANNING_API_URL>/rooms/3/schedule?week=...
router.use(authenticate, blockReadOnly);

router.all(
  /.*/,
  asyncHandler(async (req, res) => {
    const path = req.originalUrl.replace(/^\/api\/planning/, "");
    const hasBody = !["GET", "HEAD", "DELETE"].includes(req.method) || Object.keys(req.body || {}).length > 0;
    const data = await planningFetch(req.method, path, hasBody ? req.body : undefined);
    res.json(data);
  })
);

module.exports = router;
