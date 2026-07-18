const router = require("express").Router();
const ctrl = require("../controllers/settings.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly);

router.get("/", ctrl.get);
router.put("/", requireRole(), ctrl.update); // Admin only

module.exports = router;
