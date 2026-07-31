const router = require("express").Router();
const ctrl = require("../controllers/auditLogs.controller");
const { authenticate, requireRole } = require("../middlewares/auth");

// Admin-only, same gate as Utilisateurs (Settings -> "Journal d'audit").
router.use(authenticate, requireRole());

router.get("/", ctrl.list);

module.exports = router;
