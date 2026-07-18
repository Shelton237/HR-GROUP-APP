const router = require("express").Router();
const ctrl = require("../controllers/users.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

// Admin-only account management (Settings -> "Comptes & rôles").
router.use(authenticate, blockReadOnly, requireRole());

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.post("/:id/reset-password", ctrl.resetPassword);

module.exports = router;
