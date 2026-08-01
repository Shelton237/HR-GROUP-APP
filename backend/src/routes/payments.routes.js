const router = require("express").Router();
const ctrl = require("../controllers/payments.controller");
const { authenticate, requireRole, blockReadOnly, blockPlanificateur } = require("../middlewares/auth");

router.put("/:employeeId/:month", authenticate, blockPlanificateur, blockReadOnly, requireRole("RH", "Manager"), ctrl.setStatus);

module.exports = router;
