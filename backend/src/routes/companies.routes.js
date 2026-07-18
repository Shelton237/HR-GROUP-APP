const router = require("express").Router();
const ctrl = require("../controllers/companies.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly);

router.get("/", ctrl.list);
router.post("/", requireRole("RH"), ctrl.create);
router.get("/:id", ctrl.getOne);
router.put("/:id", requireRole("RH"), ctrl.update);
router.delete("/:id", requireRole(), ctrl.remove); // Admin only (requireRole() + Admin bypass)

router.get("/:id/documents", ctrl.listDocuments);
router.post("/:id/documents", requireRole("RH"), ctrl.addDocument);
router.delete("/:id/documents/:docId", requireRole("RH"), ctrl.removeDocument);

module.exports = router;
