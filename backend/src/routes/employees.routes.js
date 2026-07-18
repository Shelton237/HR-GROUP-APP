const router = require("express").Router();
const ctrl = require("../controllers/employees.controller");
const { authenticate, requireRole, blockReadOnly } = require("../middlewares/auth");

router.use(authenticate, blockReadOnly);

router.get("/", ctrl.list);
router.post("/", requireRole("RH"), ctrl.create);
router.get("/:id", ctrl.getOne);
router.put("/:id", requireRole("RH", "Manager"), ctrl.update);
router.delete("/:id", requireRole(), ctrl.remove); // Admin only

router.get("/:id/payroll", ctrl.payroll);

router.get("/:id/checklist", ctrl.listChecklist);
router.put("/:id/checklist/:key", requireRole("RH", "Manager"), ctrl.setChecklistItem);

router.get("/:id/evaluations", ctrl.listEvaluations);
router.post("/:id/evaluations", requireRole("RH", "Manager"), ctrl.addEvaluation);

router.get("/:id/warnings", ctrl.listWarnings);
router.post("/:id/warnings", requireRole("RH", "Manager"), ctrl.addWarning);

router.get("/:id/documents", ctrl.listDocuments);
router.post("/:id/documents", requireRole("RH", "Manager"), ctrl.addDocument);
router.delete("/:id/documents/:docId", requireRole("RH", "Manager"), ctrl.removeDocument);

router.get("/:id/onboarding", ctrl.getOnboarding);
router.put("/:id/onboarding", requireRole("RH", "Manager"), ctrl.updateOnboarding);

router.get("/:id/overtime", ctrl.listOvertime);
router.post("/:id/overtime", requireRole("RH", "Manager"), ctrl.addOvertime);
router.delete("/:id/overtime/:otId", requireRole("RH", "Manager"), ctrl.removeOvertime);

router.get("/:id/pay-vars", ctrl.listPayVars);
router.post("/:id/pay-vars", requireRole("RH", "Manager"), ctrl.addPayVar);
router.put("/:id/pay-vars/:pvId", requireRole("RH", "Manager"), ctrl.updatePayVar);
router.delete("/:id/pay-vars/:pvId", requireRole("RH", "Manager"), ctrl.removePayVar);

router.get("/:id/emergency-contacts", ctrl.listEmergencyContacts);
router.post("/:id/emergency-contacts", requireRole("RH", "Manager"), ctrl.addEmergencyContact);
router.put("/:id/emergency-contacts/:contactId", requireRole("RH", "Manager"), ctrl.updateEmergencyContact);
router.delete("/:id/emergency-contacts/:contactId", requireRole("RH", "Manager"), ctrl.removeEmergencyContact);

module.exports = router;
