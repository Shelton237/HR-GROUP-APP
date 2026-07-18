const router = require("express").Router();
const ctrl = require("../controllers/dashboard.controller");
const { authenticate } = require("../middlewares/auth");

router.get("/alerts", authenticate, ctrl.alerts);
router.get("/summary", authenticate, ctrl.summary);

module.exports = router;
