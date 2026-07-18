const router = require("express").Router();
const ctrl = require("../controllers/leaves.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id/status", requireRole("RH", "Manager"), ctrl.setStatus);

module.exports = router;
