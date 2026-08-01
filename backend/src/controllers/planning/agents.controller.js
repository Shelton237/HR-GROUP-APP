const { Op } = require("sequelize");
const db = require("../../models");
const { ApiError, asyncHandler } = require("../../middlewares/error");
const engine = require("../../services/planning/planningEngine");
const scheduleService = require("../../services/planning/scheduleService");
const employeeAccountService = require("../../services/planning/employeeAccountService");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DAY_SPEC_VALUES = ["on", "off", "alt"];

function normalize(profile, accountEmployeeIds) {
  return {
    id: profile.employeeId,
    profile_id: profile.id,
    room_id: profile.roomId,
    name: `${profile.Employee.firstName} ${profile.Employee.lastName}`.trim(),
    email: profile.Employee.email || null,
    type: profile.type,
    offset: profile.offset,
    binome: profile.binome,
    day_spec: profile.daySpecJson,
    alt_parity: profile.altParity,
    has_account: accountEmployeeIds.has(profile.employeeId),
  };
}

async function accountSetFor(employeeIds) {
  if (!employeeIds.length) return new Set();
  const users = await db.User.findAll({ where: { employeeId: { [Op.in]: employeeIds } } });
  return new Set(users.map((u) => u.employeeId));
}

function validateDaySpec(daySpec) {
  if (daySpec == null) return;
  if (!Array.isArray(daySpec) || daySpec.length !== 7 || daySpec.some((v) => !DAY_SPEC_VALUES.includes(v))) {
    throw new ApiError(400, "day_spec doit être un tableau de 7 valeurs parmi on/off/alt.");
  }
}

function validateAltParity(altParity) {
  if (altParity == null) return;
  if (![0, 1].includes(Number(altParity))) throw new ApiError(400, "alt_parity doit être 0 ou 1.");
}

async function loadProfileOr404(id) {
  const profile = await db.PlanningProfile.findByPk(id, { include: [{ model: db.Employee }] });
  if (!profile) throw new ApiError(404, "Agent introuvable.");
  return profile;
}

const MAX_FIXED_DAY_PER_ROOM = 1;
const MAX_ROTATION_PER_ROOM = 6;

/**
 * Une salle Control Room = maximum 7 personnes : 1 agent jour fixe (contrôle)
 * + 6 agents rotation (3 binômes). C'est le seul format qui garantit, TOUS
 * les jours sans exception, exactement 2 personnes en Jour et 2 en Nuit :
 * avec 3 binômes (offsets 0/1/2), un binôme entier est toujours naturellement
 * en J, un en N, un en R — le contrôle rejoint le binôme-J (rétrogradant l'un
 * de ses 2 membres en R ce jour-là pour rester à 2 en J). Moins de 3 binômes
 * ne peut pas garantir 2+2 tous les jours (vérifié : ça retombe parfois à 0
 * en nuit ou 1 seul en jour). Vérifié à chaque attachement/déplacement
 * d'agent, jamais uniquement côté UI.
 */
async function assertRoomCapacity(roomId, type, excludeProfileId) {
  const where = { roomId, type };
  if (excludeProfileId) where.id = { [Op.ne]: excludeProfileId };
  const count = await db.PlanningProfile.count({ where });

  if (type === "fixed_day" && count >= MAX_FIXED_DAY_PER_ROOM) {
    throw new ApiError(409, "Cette salle a déjà son agent jour fixe (contrôle) — une seule place par salle.");
  }
  if (type === "rotation" && count >= MAX_ROTATION_PER_ROOM) {
    throw new ApiError(409, "Cette salle a déjà ses 6 agents rotation (3 binômes) — maximum 7 personnes par salle.");
  }
}

const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.room_id) where.roomId = req.query.room_id;
  const profiles = await db.PlanningProfile.findAll({
    where,
    include: [{ model: db.Employee }],
    order: [["createdAt", "ASC"]],
  });
  const accountEmployeeIds = await accountSetFor(profiles.map((p) => p.employeeId));
  res.json(profiles.map((p) => normalize(p, accountEmployeeIds)));
});

const create = asyncHandler(async (req, res) => {
  const { employee_id: employeeId, room_id: roomId, type } = req.body || {};
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  if (!roomId) throw new ApiError(400, "room_id est requis.");
  if (!["rotation", "fixed_day"].includes(type)) throw new ApiError(400, "type doit être rotation ou fixed_day.");

  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  const room = await db.PlanningRoom.findByPk(roomId);
  if (!room) throw new ApiError(404, "Salle introuvable.");

  const already = await db.PlanningProfile.findOne({ where: { employeeId } });
  if (already) throw new ApiError(409, "Ce salarié est déjà un agent du planning.");

  await assertRoomCapacity(roomId, type);

  validateDaySpec(req.body.day_spec);
  validateAltParity(req.body.alt_parity);

  let daySpecJson = null;
  let altParity = null;
  if (type === "fixed_day") {
    daySpecJson = req.body.day_spec ?? engine.defaultSpec();
    altParity = req.body.alt_parity != null ? Number(req.body.alt_parity) : 0;
  }

  const profile = await db.PlanningProfile.create({
    id: uid("pprof"),
    employeeId,
    roomId,
    type,
    offset: null,
    binome: null,
    daySpecJson,
    altParity,
  });

  if (type === "rotation") await scheduleService.reassignOffsets(roomId);

  const full = await loadProfileOr404(profile.id);
  const accountEmployeeIds = await accountSetFor([employeeId]);
  res.status(201).json(normalize(full, accountEmployeeIds));
});

const update = asyncHandler(async (req, res) => {
  const profile = await loadProfileOr404(req.params.id);
  const oldRoomId = profile.roomId;
  const oldType = profile.type;

  if (req.body?.room_id !== undefined) {
    const room = await db.PlanningRoom.findByPk(req.body.room_id);
    if (!room) throw new ApiError(404, "Salle introuvable.");
    profile.roomId = req.body.room_id;
  }
  if (req.body?.type !== undefined) {
    if (!["rotation", "fixed_day"].includes(req.body.type)) throw new ApiError(400, "type doit être rotation ou fixed_day.");
    profile.type = req.body.type;
  }

  if (profile.roomId !== oldRoomId || profile.type !== oldType) {
    await assertRoomCapacity(profile.roomId, profile.type, profile.id);
  }

  validateDaySpec(req.body?.day_spec);
  validateAltParity(req.body?.alt_parity);

  if (profile.type === "fixed_day") {
    profile.daySpecJson = req.body?.day_spec ?? profile.daySpecJson ?? engine.defaultSpec();
    profile.altParity = req.body?.alt_parity != null ? Number(req.body.alt_parity) : (profile.altParity ?? 0);
  } else {
    profile.daySpecJson = null;
    profile.altParity = null;
  }

  await profile.save();

  await scheduleService.reassignOffsets(profile.roomId);
  if (profile.roomId !== oldRoomId) await scheduleService.reassignOffsets(oldRoomId);

  const full = await loadProfileOr404(profile.id);
  const accountEmployeeIds = await accountSetFor([profile.employeeId]);
  res.json(normalize(full, accountEmployeeIds));
});

const destroy = asyncHandler(async (req, res) => {
  const profile = await loadProfileOr404(req.params.id);
  const roomId = profile.roomId;
  await profile.destroy();
  await scheduleService.reassignOffsets(roomId);
  res.json({ message: "ok" });
});

const createAccount = asyncHandler(async (req, res) => {
  const profile = await loadProfileOr404(req.params.id);
  const loginUrl = (process.env.APP_URL || "").replace(/\/$/, "") + "/";
  const result = await employeeAccountService.createAccountAndNotify(profile.Employee, { loginUrl });
  res.json({ created: result.created, email_sent: result.emailSent, password: result.password, reason: result.reason });
});

// GET /api/planning/employee-candidates
// Minimal, name-only employee list for the "add agent" picker — deliberately
// not the full GET /api/employees (dossier, salary, documents...): a
// Planificateur account manages Planning only and must never gain a
// backdoor into the Salariés module just to pick who to attach as an agent.
const listCandidates = asyncHandler(async (req, res) => {
  const employees = await db.Employee.findAll({
    where: { status: { [Op.ne]: "Sorti" }, archived: false },
    attributes: ["id", "firstName", "lastName"],
    order: [["lastName", "ASC"]],
  });
  res.json(employees);
});

module.exports = { list, create, update, destroy, createAccount, listCandidates };
