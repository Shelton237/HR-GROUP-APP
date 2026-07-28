/*
 * Récapitulatif automatique des alertes RH (dossiers incomplets, périodes
 * d'essai, évaluations, fins de CDD, documents expirants) — configuré dans
 * Paramètres > Notifications (destinataires, règles activées, fréquence).
 *
 * Un e-mail séparé est envoyé par pays, déclenché à 07h00 heure LOCALE de ce
 * pays (pas l'heure du serveur) — les sociétés du groupe sont réparties sur
 * plusieurs fuseaux (Madagascar, Cameroun, Côte d'Ivoire, Tchad, Gabon, Mali).
 */
const cron = require("node-cron");
const db = require("../models");
const { computeAlerts } = require("../services/alerts.service");
const { buildAlertsData } = require("../controllers/dashboard.controller");
const mail = require("../services/mail.service");

const RULE_BY_TYPE = {
  essai: "probationEnd",
  eval: "evalDue",
  dossier: "incompleteDossier",
  contrat: "contractEnd",
  doc: "docExpiry",
};

/** Heure et jour locaux (fuseau IANA du pays) pour un instant donné. */
function localHourAndWeekday(timezone, now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  // Certaines versions d'ICU rendent minuit "24" plutôt que "0" avec hour12:false.
  const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
  const weekday = parts.find((p) => p.type === "weekday").value; // "Mon", "Tue", ...
  return { hour, weekday };
}

function shouldRunForCountry(frequency, timezone, now) {
  const { hour, weekday } = localHourAndWeekday(timezone, now);
  if (hour !== 7) return false;
  if (frequency === "Hebdomadaire (lundi matin)") return weekday === "Mon";
  // "Quotidienne" et "Immédiate + hebdomadaire" tournent toutes les deux comme
  // un récapitulatif quotidien — une vraie livraison "immédiate" (déclenchée à
  // chaque écriture) sortirait du cadre d'une tâche planifiée.
  return true;
}

function emailBody(countryName, alerts) {
  const lines = alerts.map((a) => `- ${a.who} (${a.company || "—"}) : ${a.text}`);
  return `Bonjour,

Voici le récapitulatif des dossiers et échéances RH à traiter pour ${countryName} :

${lines.join("\n")}

Cordialement,
Gestion RH Groupe`;
}

async function runDossierAlerts(now = new Date()) {
  const notifications = await db.Notifications.findByPk(1);
  if (!notifications) return;

  const recipients = (notifications.adminEmails || []).filter(Boolean);
  if (!recipients.length) return;

  const rules = notifications.rules || {};
  const countries = await db.Country.findAll();

  for (const country of countries) {
    if (!shouldRunForCountry(notifications.frequency, country.timezone, now)) continue;

    const companies = await db.Company.findAll({ where: { countryCode: country.code } });
    if (!companies.length) continue;

    const { data, companyById } = await buildAlertsData(companies, [country]);
    const countryAlerts = computeAlerts(data, companyById).filter((a) => rules[RULE_BY_TYPE[a.type]]);
    if (!countryAlerts.length) continue;

    try {
      await mail.sendMail(recipients, `Suivi RH — dossiers à compléter (${country.name})`, emailBody(country.name, countryAlerts));
      // eslint-disable-next-line no-console
      console.log(`[rh:notifications] ${country.name} : ${countryAlerts.length} alerte(s) envoyée(s) à ${recipients.join(", ")}`);
    } catch (e) {
      console.error(`[rh:notifications] ${country.name} : échec de l'envoi :`, e.message);
    }
  }
}

function start() {
  // Toutes les heures pile — chaque pays n'est traité que lorsqu'il est 07h00
  // dans son propre fuseau, donc le job doit vérifier plus souvent qu'une
  // seule fois par jour côté serveur.
  cron.schedule("0 * * * *", () => {
    runDossierAlerts().catch((e) => console.error("[rh:notifications] Erreur job :", e.message));
  });
}

module.exports = { start, runDossierAlerts, shouldRunForCountry };
