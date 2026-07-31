const db = require("../models");
const { asyncHandler } = require("../middlewares/error");

// GET /api/audit-logs?limit=
const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db.AuditLog.findAll({ order: [["createdAt", "DESC"]], limit });
  res.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      userName: r.userName,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      detail: r.detail,
    }))
  );
});

module.exports = { list };
