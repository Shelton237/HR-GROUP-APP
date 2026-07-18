const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  scope: u.scope,
  active: u.active,
  mustChangePassword: u.mustChangePassword,
});

const list = asyncHandler(async (req, res) => {
  const users = await db.User.findAll({ order: [["name", "ASC"]] });
  res.json(users.map(publicUser));
});

const create = asyncHandler(async (req, res) => {
  const { name, email, role, scope } = req.body || {};
  if (!name || !email) throw new ApiError(400, "Nom et e-mail requis.");
  const existing = await db.User.findOne({ where: { email: String(email).toLowerCase().trim() } });
  if (existing) throw new ApiError(409, "Un compte existe déjà avec cet e-mail.");
  const tempPassword = crypto.randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const user = await db.User.create({
    id: uid("u"),
    name,
    email: String(email).toLowerCase().trim(),
    passwordHash: bcrypt.hashSync(tempPassword, 10),
    mustChangePassword: true,
    role: role || "Lecture",
    scope: scope !== undefined ? scope : [],
    active: true,
  });
  // Temp password is returned once so the admin creating the account can relay it;
  // it is never stored or logged in plaintext afterwards.
  res.status(201).json({ ...publicUser(user), tempPassword });
});

const update = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  const { name, email, role, scope, active } = req.body || {};
  Object.assign(user, {
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email: String(email).toLowerCase().trim() }),
    ...(role !== undefined && { role }),
    ...(scope !== undefined && { scope }),
    ...(active !== undefined && { active: !!active }),
  });
  await user.save();
  res.json(publicUser(user));
});

const remove = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  await user.destroy();
  res.status(204).send();
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  const tempPassword = crypto.randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  user.passwordHash = bcrypt.hashSync(tempPassword, 10);
  user.mustChangePassword = true;
  await user.save();
  // Same one-time-return pattern as create(): never stored/logged in plaintext afterwards.
  res.json({ ...publicUser(user), tempPassword });
});

module.exports = { list, create, update, remove, resetPassword };
