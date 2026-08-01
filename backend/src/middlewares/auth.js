const jwt = require("jsonwebtoken");
const { ApiError } = require("./error");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-please-change";
const JWT_EXPIRES_IN = "8h";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      scope: user.scope,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId || undefined,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Verifies the Bearer JWT and attaches the decoded claims to req.user. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentification requise (jeton manquant)."));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      scope: payload.scope,
      name: payload.name,
      email: payload.email,
      employeeId: payload.employeeId || null,
    };
    next();
  } catch (err) {
    next(new ApiError(401, "Jeton invalide ou expiré."));
  }
}

/**
 * Restreint une route au rôle "Agent" scopé sur son propre employé — l'identité
 * vient toujours du JWT vérifié (req.user.employeeId), jamais d'un paramètre
 * d'URL, pour qu'un agent ne puisse jamais consulter le planning d'un autre.
 */
function requireSelfEmployee(req, res, next) {
  if (!req.user) return next(new ApiError(401, "Authentification requise."));
  if (req.user.role !== "Agent" || !req.user.employeeId) {
    return next(new ApiError(403, "Réservé aux comptes agent liés à un salarié."));
  }
  next();
}

/**
 * Restricts a route to a fixed set of roles. Admin is implicitly always
 * allowed. "Operateur" is treated as an alias of "RH" everywhere — it has
 * the exact same permissions, the only difference (Dashboard visibility) is
 * enforced separately, not through this role gate.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentification requise."));
    const effectiveRole = req.user.role === "Operateur" ? "RH" : req.user.role;
    if (effectiveRole === "Admin" || roles.includes(effectiveRole)) return next();
    return next(new ApiError(403, "Droits insuffisants pour cette action."));
  };
}

/**
 * "Operateur" has RH-equivalent permissions everywhere requireRole() checks,
 * but is explicitly excluded from certain whole modules (Dashboard, Planning)
 * that requireRole() alone can't express since it aliases Operateur to RH.
 */
function blockOperateur(req, res, next) {
  if (req.user?.role === "Operateur") return next(new ApiError(403, "Non disponible pour ce rôle."));
  next();
}

/**
 * "Planificateur" is the mirror image of Operateur: a role dedicated
 * entirely to the Planning module, with no business in any other one.
 * Applied to every router except planning.routes.js.
 */
function blockPlanificateur(req, res, next) {
  if (req.user?.role === "Planificateur") return next(new ApiError(403, "Ce compte n'a accès qu'au module Planning."));
  next();
}

/** "Lecture" is a read-only role; blocks it from any mutating request. */
function blockReadOnly(req, res, next) {
  if (!req.user) return next(new ApiError(401, "Authentification requise."));
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (mutating && req.user.role === "Lecture") {
    return next(new ApiError(403, "Compte en lecture seule."));
  }
  next();
}

/** True when the given user may access data belonging to companyId. */
function hasCompanyScope(user, companyId) {
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (user.scope === "all") return true;
  if (Array.isArray(user.scope)) return user.scope.includes(companyId);
  return false;
}

/** Returns the list of company ids the user is limited to, or null for "no restriction". */
function scopedCompanyIds(user) {
  if (!user) return [];
  if (user.role === "Admin" || user.scope === "all") return null;
  return Array.isArray(user.scope) ? user.scope : [];
}

/** Middleware factory: rejects the request unless the resolved companyId is in scope. */
function requireCompanyScope(resolveCompanyId) {
  return async (req, res, next) => {
    try {
      const companyId = await resolveCompanyId(req);
      if (companyId == null) return next(); // nothing to scope against (e.g. create with no company yet)
      if (!hasCompanyScope(req.user, companyId)) {
        return next(new ApiError(403, "Cette société est hors de votre périmètre d'accès."));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  signToken,
  authenticate,
  requireRole,
  requireSelfEmployee,
  blockOperateur,
  blockPlanificateur,
  blockReadOnly,
  hasCompanyScope,
  scopedCompanyIds,
  requireCompanyScope,
  JWT_SECRET,
};
