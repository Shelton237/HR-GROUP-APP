const { asyncHandler } = require("../../middlewares/error");
const engine = require("../../services/planning/planningEngine");
const diffusionService = require("../../services/planning/diffusionService");
const { loadRoomOr404 } = require("./rooms.controller");

const preview = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const week = req.query.week || engine.mondayISOof(new Date().toISOString().slice(0, 10));
  res.json(await diffusionService.buildMessages(room, week));
});

const send = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const week = req.body?.week;
  res.json(await diffusionService.sendForRoom(room, week || engine.mondayISOof(new Date().toISOString().slice(0, 10))));
});

module.exports = { preview, send };
