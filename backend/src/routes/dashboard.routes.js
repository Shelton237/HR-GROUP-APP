const router = require("express").Router();
const ctrl = require("../controllers/dashboard.controller");
const { authenticate, blockOperateur } = require("../middlewares/auth");

router.get("/alerts", authenticate, blockOperateur, ctrl.alerts);
router.get("/summary", authenticate, blockOperateur, ctrl.summary);

module.exports = router;
