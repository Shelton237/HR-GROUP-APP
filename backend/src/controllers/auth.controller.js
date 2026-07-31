const bcrypt = require("bcryptjs");
const db = require("../models");
const { signToken } = require("../middlewares/auth");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { logAction, logActionForReq } = require("../services/audit.service");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, "E-mail et mot de passe requis.");
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await db.User.findOne({ where: { email: normalizedEmail } });
  if (!user || !user.active) {
    await logAction({ userName: normalizedEmail, action: "LOGIN_FAILED", entityType: "Auth", detail: "Compte introuvable ou inactif — " + normalizedEmail });
    throw new ApiError(401, "Identifiants invalides.");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await logAction({ userId: user.id, userName: user.name, action: "LOGIN_FAILED", entityType: "Auth", detail: "Mot de passe incorrect — " + normalizedEmail });
    throw new ApiError(401, "Identifiants invalides.");
  }

  await logAction({ userId: user.id, userName: user.name, action: "LOGIN", entityType: "Auth", detail: "Connexion réussie — " + normalizedEmail });

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      scope: user.scope,
      mustChangePassword: user.mustChangePassword,
      employeeId: user.employeeId,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    scope: user.scope,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    employeeId: user.employeeId,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "Le nouveau mot de passe doit contenir au moins 8 caractères.");
  }
  const user = await db.User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  if (!user.mustChangePassword) {
    const ok = oldPassword && (await bcrypt.compare(oldPassword, user.passwordHash));
    if (!ok) throw new ApiError(401, "Mot de passe actuel incorrect.");
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();
  await logActionForReq(req, { action: "Modification", entityType: "Auth — Mot de passe", entityId: user.id, detail: user.email });
  res.json({ ok: true });
});

module.exports = { login, me, changePassword };
