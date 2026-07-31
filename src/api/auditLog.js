import { api } from "./client";

/**
 * GET /audit-logs?limit=
 * resp: Array<{ id, createdAt, userName, action, entityType, entityId, detail }>
 * Admin-only (Paramètres -> "Journal d'audit").
 */
export function getAuditLogs(limit = 50) {
  return api.get(`/audit-logs?limit=${limit}`);
}
