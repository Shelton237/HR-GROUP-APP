const router = require("express").Router();
const ctrl = require("../controllers/payments.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.get("/summary", authenticate, ctrl.summary);
router.get("/bulletins", authenticate, ctrl.bulletins);
router.post("/bulletins/generate", authenticate, blockReadOnly, requireRole("RH", "Manager"), ctrl.generateBulletins);

module.exports = router;
