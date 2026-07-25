/*
 * Envoi automatique des e-mails de diffusion du planning à J-1 du début de
 * chaque semaine (dimanche, pour la semaine qui commence le lendemain) —
 * équivalent de la commande Artisan `planning:send-weekly-diffusion`.
 */
const cron = require("node-cron");
const db = require("../models");
const diffusionService = require("../services/planning/diffusionService");
const engine = require("../services/planning/planningEngine");

async function runIfMondayTomorrow() {
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  if (engine.dowISO(tomorrow) !== 0) return; // 0 = Lundi

  const rooms = await db.PlanningRoom.findAll();
  for (const room of rooms) {
    try {
      const result = await diffusionService.sendForRoom(room, tomorrow);
      // eslint-disable-next-line no-console
      console.log(
        `[planning:diffusion] Salle ${room.name} (semaine du ${tomorrow}) : ${result.sent.length} envoyé(s), ${result.failed.length} échec(s).`
      );
    } catch (e) {
      console.error(`[planning:diffusion] Échec salle ${room.name}:`, e.message);
    }
  }
}

function start() {
  // Tous les jours à 06:00, heure serveur.
  cron.schedule("0 6 * * *", () => {
    runIfMondayTomorrow().catch((e) => console.error("[planning:diffusion] Erreur job:", e.message));
  });
}

module.exports = { start, runIfMondayTomorrow };
