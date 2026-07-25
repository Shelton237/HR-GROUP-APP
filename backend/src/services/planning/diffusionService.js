/*
 * Port fidèle de CONTROL-ROOM-PLANNING/backend/app/Support/DiffusionService.php :
 * construit et envoie les e-mails de diffusion du planning par agent, pour une
 * salle et une semaine donnée. Utilisé par l'envoi manuel et l'envoi auto J-1.
 */
const engine = require("./planningEngine");
const scheduleService = require("./scheduleService");
const mail = require("../mail.service");

async function buildMessages(room, week) {
  const weekStart = engine.mondayISOof(week);
  const result = await scheduleService.weekSchedule(room, weekStart);
  const dates = result.dates;

  return result.roster.map((employee) => {
    const values = result.grid[employee.id];
    const body = engine.emailBody(employee, room, dates, values);
    const subject = `Planning Control Room ${room.name} – semaine du ${dates[0]}`;
    return { employee_id: employee.id, name: employee.name, email: employee.email, subject, body };
  });
}

async function sendForRoom(room, week) {
  const sent = [];
  const failed = [];

  for (const m of await buildMessages(room, week)) {
    if (!m.email) {
      failed.push({ employee_id: m.employee_id, name: m.name, email: m.email, success: false, error: "no_email" });
      continue;
    }
    try {
      await mail.sendPlanningMail(m.email, m.subject, m.body);
      sent.push({ employee_id: m.employee_id, name: m.name, email: m.email, success: true });
    } catch (e) {
      failed.push({ employee_id: m.employee_id, name: m.name, email: m.email, success: false, error: e.message });
    }
  }

  return { sent, failed };
}

module.exports = { buildMessages, sendForRoom };
