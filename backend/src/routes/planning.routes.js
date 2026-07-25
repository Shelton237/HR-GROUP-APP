const router = require("express").Router();
const { authenticate, requireRole, requireSelfEmployee, blockReadOnly } = require("../middlewares/auth");
const rooms = require("../controllers/planning/rooms.controller");
const agents = require("../controllers/planning/agents.controller");
const schedule = require("../controllers/planning/schedule.controller");
const absences = require("../controllers/planning/absences.controller");
const diffusion = require("../controllers/planning/diffusion.controller");
const me = require("../controllers/planning/me.controller");

router.use(authenticate, blockReadOnly);

const manager = requireRole("RH", "Manager");

// ----- Rooms -----
router.get("/rooms", manager, rooms.list);
router.post("/rooms", manager, rooms.create);
router.patch("/rooms/:id", manager, rooms.update);
router.delete("/rooms/:id", manager, rooms.destroy);

// ----- Agents (planning profile attached to an existing RH employee) -----
router.get("/agents", manager, agents.list);
router.post("/agents", manager, agents.create);
router.patch("/agents/:id", manager, agents.update);
router.delete("/agents/:id", manager, agents.destroy);
router.post("/agents/:id/account", manager, agents.createAccount);

// ----- Schedule -----
router.get("/rooms/:id/schedule", manager, schedule.show);
router.patch("/rooms/:id/schedule", manager, schedule.update);
router.post("/rooms/:id/schedule/reset", manager, schedule.reset);
router.post("/rooms/:id/schedule/loans", manager, schedule.addLoan);
router.delete("/rooms/:id/schedule/loans", manager, schedule.removeLoan);

// ----- Absences / permissions -----
router.get("/absences", manager, absences.list);
router.post("/absences", manager, absences.create);
router.delete("/absences/:id", manager, absences.destroy);
router.post("/absences/:id/approve", manager, absences.approve);
router.post("/absences/:id/reject", manager, absences.reject);
router.post("/permissions", manager, absences.createPermission);

// ----- Diffusion -----
router.get("/rooms/:id/diffusion", manager, diffusion.preview);
router.post("/rooms/:id/diffusion/send", manager, diffusion.send);

// ----- Agent self-service (scope = employeeId du user connecté) -----
router.get("/me/schedule", requireSelfEmployee, me.schedule);
router.get("/me/absences", requireSelfEmployee, me.absencesMine);
router.post("/me/permissions", requireSelfEmployee, me.requestPermission);

module.exports = router;
