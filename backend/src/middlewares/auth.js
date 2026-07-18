const jwt = require("jsonwebtoken");
const { ApiError } = require("./error");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-please-change";
const JWT_EXPIRES_IN = "8h";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, scope: user.scope, name: user.name, email: user.email },
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
    };
    next();
  } catch (err) {
    next(new ApiError(401, "Jeton invalide ou expiré."));
  }
}

/** Restricts a route to a fixed set of roles. Admin is implicitly always allowed. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentification requise."));
    if (req.user.role === "Admin" || roles.includes(req.user.role)) return next();
    return next(new ApiError(403, "Droits insuffisants pour cette action."));
  };
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
  blockReadOnly,
  hasCompanyScope,
  scopedCompanyIds,
  requireCompanyScope,
  JWT_SECRET,
};
