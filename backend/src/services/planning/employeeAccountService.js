/*
 * Port fidèle de CONTROL-ROOM-PLANNING/backend/app/Support/EmployeeAccountService.php :
 * crée le compte de connexion (rôle Agent) d'un salarié RH qui a un e-mail, et lui
 * envoie ses identifiants par e-mail. Best-effort : un échec d'envoi n'empêche
 * jamais la création du compte.
 */
const bcrypt = require("bcryptjs");
const db = require("../../models");
const mail = require("../mail.service");

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomPassword(length = 12) {
  let out = "";
  for (let i = 0; i < length; i++) out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return out;
}

function fullName(employee) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

/** @returns {Promise<{created: boolean, emailSent: boolean, password: ?string, reason: ?string}>} */
async function createAccountAndNotify(employee, { loginUrl }) {
  if (!employee.email) {
    return { created: false, emailSent: false, password: null, reason: "no_email" };
  }

  const existing = await db.User.findOne({ where: { email: employee.email } });
  if (existing) {
    return { created: false, emailSent: false, password: null, reason: "email_already_used" };
  }

  const password = randomPassword(12);
  const passwordHash = await bcrypt.hash(password, 10);
  const name = fullName(employee);

  await db.User.create({
    id: "user-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email: employee.email,
    passwordHash,
    role: "Agent",
    scope: [],
    active: true,
    mustChangePassword: true,
    employeeId: employee.id,
  });

  let emailSent = false;
  try {
    await mail.sendWelcomeAgentMail(employee.email, { employeeName: name, loginEmail: employee.email, password, loginUrl });
    emailSent = true;
  } catch (e) {
    // best-effort : le compte existe même si l'e-mail échoue (ex. SMTP indisponible).
    console.warn("Échec envoi e-mail de bienvenue agent", { employeeId: employee.id, email: employee.email, error: e.message });
  }

  return { created: true, emailSent, password, reason: null };
}

module.exports = { createAccountAndNotify };
