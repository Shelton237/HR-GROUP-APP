const router = require("express").Router();
const ctrl = require("../controllers/notifications.controller");
const { authenticate, requireRole, blockReadOnly, blockPlanificateur } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly, blockPlanificateur);

router.get("/", requireRole("RH"), ctrl.get);
router.put("/", requireRole(), ctrl.update); // Admin only

module.exports = router;
