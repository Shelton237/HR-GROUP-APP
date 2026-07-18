const router = require("express").Router();
const ctrl = require("../controllers/countries.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly);

router.get("/", ctrl.list);
router.get("/:code", ctrl.getOne);
router.put("/:code", requireRole(), ctrl.update); // Admin only
router.put("/:code/contributions", requireRole(), ctrl.updateContributions);
router.put("/:code/tax", requireRole(), ctrl.updateTax);
router.put("/:code/checklist", requireRole(), ctrl.updateChecklist);
router.put("/:code/holidays", requireRole(), ctrl.updateHolidays);

module.exports = router;
