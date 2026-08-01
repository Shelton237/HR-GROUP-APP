const router = require("express").Router();
const ctrl = require("../controllers/leaves.controller");
const { authenticate, requireRole, blockReadOnly, blockPlanificateur } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly, blockPlanificateur);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id/status", requireRole("RH", "Manager"), ctrl.setStatus);

module.exports = router;
