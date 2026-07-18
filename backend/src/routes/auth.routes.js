const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth");

router.post("/login", ctrl.login);
router.get("/me", authenticate, ctrl.me);
router.post("/change-password", authenticate, ctrl.changePassword);

module.exports = router;
