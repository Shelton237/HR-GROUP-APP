const router = require("express").Router();
const ctrl = require("../controllers/payments.controller");
const { authenticate } = require("../middlewares/auth");

router.get("/summary", authenticate, ctrl.summary);

module.exports = router;
