const db = require("../models");

/**
 * Records one row in the audit trail (Paramètres -> Journal d'audit). Best-effort:
 * a logging failure must never break the action it's describing, so errors are
 * swallowed here rather than propagated.
 */
async function logAction({ userId = null, userName, action, entityType, entityId = null, detail = null }) {
  try {
    await db.AuditLog.create({ userId, userName, action, entityType, entityId, detail });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("audit.service: failed to record log entry", err.message);
  }
}

/** Convenience wrapper: pulls the acting user's identity off req.user (set by authenticate()). */
function logActionForReq(req, { action, entityType, entityId = null, detail = null }) {
  return logAction({
    userId: req.user?.id || null,
    userName: req.user?.name || "—",
    action,
    entityType,
    entityId,
    detail,
  });
}

module.exports = { logAction, logActionForReq };
