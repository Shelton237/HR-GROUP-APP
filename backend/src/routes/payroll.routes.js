const router = require("express").Router();
const ctrl = require("../controllers/payments.controller");
const { authenticate, requireRole, blockReadOnly, blockPlanificateur } = require("../middlewares/auth");

router.use(authenticate, blockPlanificateur);

router.get("/summary", ctrl.summary);
router.get("/bulletins", ctrl.bulletins);
router.post("/bulletins/generate", blockReadOnly, requireRole("RH", "Manager"), ctrl.generateBulletins);

module.exports = router;
