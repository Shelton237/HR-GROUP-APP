import { api } from "./client";

/**
 * GET /settings
 * resp: {
 *   refCurrency, rates: {[currency]: number}, legalMonthlyHours,
 *   contractTypes: string[], leaveTypes: Array<{name,paid,accrual}>,
 *   warningTypes: string[], evalDecisions: string[],
 *   documentCategories: Array<{name,expires}>,
 *   departments: string[], sites: string[], postes: string[], categories: string[],
 *   payElements: Array<{id,label,kind,taxable,cotisable}>,
 *   customFields: Array<{id,label,type,options}>,
 *   evalTemplates: Array<{id,name,criteria:Array<{label,weight}>}>,
 *   onboardingTemplates: Array<{id,name,steps:Array<{phase,label}>}>,
 *   maxEmergencyContacts: number
 * }
 * (User accounts — "Comptes & rôles" — are a dedicated resource, see api/users.js,
 * not part of this settings document.)
 */
export function getSettings() {
  return api.get("/settings");
}

/**
 * PUT /settings
 * body: full settings object (as returned by getSettings) with the edited
 * field(s) changed — the Settings page mutates a local draft and PUTs the
 * whole document back, mirroring the original single-store mutation pattern.
 * resp: updated settings object
 */
export function updateSettings(body) {
  return api.put("/settings", body);
}

/**
 * GET /notifications
 * resp: {
 *   adminEmails: string[], driveFolderUrl: string,
 *   rules: { incompleteDossier, probationEnd, evalDue, docExpiry, contractEnd },
 *   frequency: string
 * }
 */
export function getNotifications() {
  return api.get("/notifications");
}

/**
 * PUT /notifications
 * body: full notifications object (see getNotifications shape)
 * resp: updated notifications object
 */
export function updateNotifications(body) {
  return api.put("/notifications", body);
}
