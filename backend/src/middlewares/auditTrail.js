const { logAction } = require("../services/audit.service");

// Human-readable French label for the top-level resource (first path segment
// after /api/). Routes not listed here (auth, users, payments, audit-logs)
// are either unauthenticated or already carry their own richer, bespoke
// logAction() calls in their controllers — this generic pass must not
// duplicate those.
const ENTITY_LABELS = {
  employees: "Salariés",
  companies: "Sociétés",
  countries: "Pays",
  leaves: "Congés",
  settings: "Paramètres",
  notifications: "Notifications",
  planning: "Planning",
};
const SKIP_ROOTS = new Set(["auth", "users", "payments", "audit-logs", "health"]);

// Any path segment matching one of these keys becomes a qualifier on the
// entity type (e.g. "Salariés — Documents"); anything else is treated as a
// record id, and the last one encountered wins (the most specific/nested one).
const SUBRESOURCE_LABELS = {
  documents: "Documents",
  checklist: "Checklist",
  evaluations: "Évaluations",
  warnings: "Avertissements",
  onboarding: "Intégration",
  overtime: "Heures sup.",
  "pay-vars": "Éléments de paie",
  "emergency-contacts": "Contacts d'urgence",
  status: "Statut",
  contributions: "Cotisations",
  tax: "Barème fiscal",
  checklist_country: "Checklist",
  holidays: "Jours fériés",
  rooms: "Salles",
  agents: "Agents",
  schedule: "Grille",
  loans: "Prêts de salle",
  reset: "Réinitialisation",
  absences: "Absences",
  permissions: "Permissions",
  approve: "Approbation",
  reject: "Refus",
  account: "Accès agent",
  diffusion: "Diffusion",
  send: "Envoi",
};

const METHOD_ACTION = { POST: "Création", PUT: "Modification", PATCH: "Modification", DELETE: "Suppression" };

// Body fields worth surfacing as the log's "Détail" column — deliberately a
// short allow-list so large payloads (base64 document uploads, full settings
// documents) never end up in the audit trail.
const DETAIL_FIELDS = ["name", "label", "title", "email", "status", "firstName", "action", "type", "reason"];

function summarizeBody(body) {
  if (!body || typeof body !== "object") return null;
  for (const key of DETAIL_FIELDS) {
    if (body[key]) return String(body[key]).slice(0, 120);
  }
  return null;
}

/**
 * Best-effort, catch-all audit logger for every mutating request that isn't
 * already covered by a bespoke logAction() call in its own controller (see
 * SKIP_ROOTS). Derives a French entity label and record id purely from the
 * URL shape, so newly added routes are covered automatically without needing
 * to remember to instrument them by hand.
 */
function auditTrail(req, res, next) {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (mutating) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.locals._auditBody = body;
      return originalJson(body);
    };
  }

  res.on("finish", () => {
    if (!mutating) return;
    if (res.statusCode >= 400) return;
    if (res.locals.auditLogged) return; // a controller already logged a richer entry for this request
    if (!req.user) return; // unauthenticated mutation (e.g. login itself, handled separately)

    const fullPath = req.originalUrl.split("?")[0];
    const segments = fullPath.split("/").filter(Boolean); // ["api","employees","emp-123","documents"]
    const root = segments[1];
    if (!root || SKIP_ROOTS.has(root)) return;

    const rest = segments.slice(2);
    const labelParts = [];
    let entityId = null;
    for (const seg of rest) {
      if (SUBRESOURCE_LABELS[seg]) labelParts.push(SUBRESOURCE_LABELS[seg]);
      else entityId = seg;
    }
    if (!entityId) {
      const body = res.locals._auditBody;
      entityId = body && typeof body === "object" && !Array.isArray(body) ? body.id || null : null;
    }

    const rootLabel = ENTITY_LABELS[root] || root;
    const entityType = labelParts.length ? `${rootLabel} — ${labelParts[labelParts.length - 1]}` : rootLabel;

    logAction({
      userId: req.user.id,
      userName: req.user.name,
      action: METHOD_ACTION[req.method] || req.method,
      entityType,
      entityId,
      detail: summarizeBody(req.body),
    });
  });

  next();
}

module.exports = { auditTrail };
