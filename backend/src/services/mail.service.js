const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.MAIL_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: process.env.MAIL_USERNAME ? { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD } : undefined,
  });
  return transporter;
}

async function sendMail(to, subject, text) {
  const t = getTransporter();
  if (!t) throw new Error("Mail non configuré (MAIL_HOST manquant).");
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.MAIL_USERNAME, to, subject, text });
}

function sendPlanningMail(to, subject, bodyText) {
  return sendMail(to, subject, bodyText);
}

function sendWelcomeAgentMail(to, { employeeName, loginEmail, password, loginUrl }) {
  const text = `Bonjour ${employeeName},

Un compte vient d'être créé pour vous sur le module Planning de Gestion RH Groupe (Thara Services).
Vous pouvez y consulter votre planning et faire vos demandes de permission.

Adresse de connexion : ${loginUrl}
E-mail : ${loginEmail}
Mot de passe provisoire : ${password}

Pensez à changer ce mot de passe dès votre première connexion.

Une question ? Contactez votre responsable.

Cordialement,
Thara Services Madagascar`;
  return sendMail(to, "Votre accès au Planning Control Room", text);
}

module.exports = { sendMail, sendPlanningMail, sendWelcomeAgentMail };
