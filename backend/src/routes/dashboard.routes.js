const router = require("express").Router();
const ctrl = require("../controllers/dashboard.controller");
const { authenticate, blockOperateur, blockPlanificateur } = require("../middlewares/auth");

router.get("/alerts", authenticate, blockOperateur, blockPlanificateur, ctrl.alerts);
router.get("/summary", authenticate, blockOperateur, blockPlanificateur, ctrl.summary);

module.exports = router;
