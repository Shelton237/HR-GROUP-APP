const db = require("../../models");
const { ApiError, asyncHandler } = require("../../middlewares/error");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function loadRoomOr404(id) {
  const room = await db.PlanningRoom.findByPk(id);
  if (!room) throw new ApiError(404, "Salle introuvable.");
  return room;
}

const list = asyncHandler(async (req, res) => {
  const rooms = await db.PlanningRoom.findAll({ order: [["name", "ASC"]] });
  res.json(rooms);
});

const create = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw new ApiError(400, "Le nom de la salle est requis.");
  const room = await db.PlanningRoom.create({ id: uid("proom"), name, mode: "quart" });
  res.status(201).json(room);
});

const update = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) throw new ApiError(400, "Le nom de la salle est requis.");
    room.name = name;
  }
  await room.save();
  res.json(room);
});

const destroy = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  await room.destroy();
  res.json({ message: "ok" });
});

module.exports = { list, create, update, destroy, loadRoomOr404 };
