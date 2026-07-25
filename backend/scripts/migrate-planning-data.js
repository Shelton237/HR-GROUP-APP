/*
 * Migration ponctuelle des données Control Room Planning depuis l'app Laravel
 * autonome (crm.thara-services.mg/planning, sa propre base MySQL — NON celle
 * de RH) vers les tables planning_* natives de RH.
 *
 * Lecture SEULE côté source (aucune écriture, jamais). Écriture additive côté
 * RH : ne modifie ni ne supprime aucun salarié RH existant, ne crée que ce qui
 * manque. Idempotent : peut être relancé sans dupliquer (voir dryRun / clés
 * de correspondance ci-dessous).
 *
 * Chaque agent Control Room source est rattaché à un salarié RH existant en
 * comparant les noms normalisés ; si aucune correspondance fiable n'est trouvée,
 * un nouveau salarié RH minimal est créé (à compléter ensuite par les RH) —
 * conforme à l'exigence "les agents doivent être des salariés".
 *
 * Usage :
 *   SOURCE_DB_HOST=... SOURCE_DB_PORT=3306 SOURCE_DB_NAME=thara_planning \
 *   SOURCE_DB_USER=readonly SOURCE_DB_PASSWORD=*** \
 *   TARGET_COMPANY_ID=cmp-thara \
 *   node scripts/migrate-planning-data.js --dry-run   # prévisualisation, aucune écriture
 *   node scripts/migrate-planning-data.js              # exécution réelle
 */
require("dotenv").config();
const { Sequelize } = require("sequelize");
const db = require("../src/models");

const DRY_RUN = process.argv.includes("--dry-run");
const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/);
  const firstName = parts[0] || fullName || "?";
  const lastName = parts.slice(1).join(" ") || "?";
  return { firstName, lastName };
}

/** Minimal read-only connection to the source Laravel app's own MySQL DB. */
function openSourceConnection() {
  const required = ["SOURCE_DB_HOST", "SOURCE_DB_NAME", "SOURCE_DB_USER"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Variables d'environnement manquantes pour la connexion source : ${missing.join(", ")}. ` +
        "Voir l'en-tête de ce script pour l'usage complet."
    );
  }
  return new Sequelize(process.env.SOURCE_DB_NAME, process.env.SOURCE_DB_USER, process.env.SOURCE_DB_PASSWORD || "", {
    host: process.env.SOURCE_DB_HOST,
    port: process.env.SOURCE_DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  });
}

async function fetchSourceData(source) {
  const [rooms] = await source.query("SELECT id, name, mode FROM rooms ORDER BY id");
  const [employees] = await source.query(
    "SELECT id, room_id, name, email, type, offset, binome, day_spec, alt_parity FROM employees ORDER BY id"
  );
  const [overrides] = await source.query(
    "SELECT room_id, week_start, employee_id, day_index, value FROM schedule_overrides"
  );
  const [loans] = await source.query("SELECT room_id, week_start, employee_id FROM room_week_loans");
  const [absences] = await source.query(
    "SELECT employee_id, start_date, end_date, type, reason, status FROM absences"
  );
  return { rooms, employees, overrides, loans, absences };
}

async function main() {
  if (!process.env.TARGET_COMPANY_ID) {
    throw new Error("TARGET_COMPANY_ID est requis (société RH où créer les salariés non appariés).");
  }
  const targetCompany = await db.Company.findByPk(process.env.TARGET_COMPANY_ID);
  if (!targetCompany) throw new Error(`Société RH introuvable : ${process.env.TARGET_COMPANY_ID}`);

  const source = openSourceConnection();
  await source.authenticate();
  console.log(`Connecté en lecture seule à la source : ${process.env.SOURCE_DB_NAME}@${process.env.SOURCE_DB_HOST}`);

  const { rooms, employees, overrides, loans, absences } = await fetchSourceData(source);
  await source.close(); // read-only, done with the source as soon as data is pulled

  console.log(
    `Source : ${rooms.length} salle(s), ${employees.length} agent(s), ${overrides.length} override(s), ${loans.length} prêt(s), ${absences.length} absence(s)/permission(s).`
  );

  const rhEmployees = await db.Employee.findAll({ where: { archived: false } });
  const byNormalizedName = new Map();
  for (const e of rhEmployees) {
    const key = normalizeName(`${e.firstName} ${e.lastName}`);
    if (!byNormalizedName.has(key)) byNormalizedName.set(key, []);
    byNormalizedName.get(key).push(e);
  }

  const roomIdMap = new Map(); // source room id -> RH planning_rooms id
  const employeeIdMap = new Map(); // source employee id -> RH employees id
  const matched = [];
  const created = [];
  const ambiguous = [];

  const t = await db.sequelize.transaction();
  try {
    for (const r of rooms) {
      const newId = uid("proom");
      roomIdMap.set(r.id, newId);
      if (!DRY_RUN) {
        await db.PlanningRoom.create({ id: newId, name: r.name, mode: r.mode || "quart" }, { transaction: t });
      }
    }

    for (const e of employees) {
      const key = normalizeName(e.name);
      const candidates = byNormalizedName.get(key) || [];

      let rhEmployeeId;
      if (candidates.length === 1) {
        rhEmployeeId = candidates[0].id;
        matched.push({ source: e.name, rhEmployeeId, email: candidates[0].email });
      } else if (candidates.length > 1) {
        ambiguous.push({ source: e.name, candidateCount: candidates.length });
        console.warn(`AMBIGU : "${e.name}" correspond à ${candidates.length} salariés RH — ignoré, à traiter manuellement.`);
        continue;
      } else {
        const { firstName, lastName } = splitName(e.name);
        rhEmployeeId = uid("emp");
        created.push({ source: e.name, rhEmployeeId, email: e.email });
        if (!DRY_RUN) {
          await db.Employee.create(
            {
              id: rhEmployeeId,
              companyId: targetCompany.id,
              firstName,
              lastName,
              email: e.email || "",
              status: "Actif",
            },
            { transaction: t }
          );
        }
      }

      employeeIdMap.set(e.id, rhEmployeeId);
      if (!DRY_RUN) {
        await db.PlanningProfile.create(
          {
            id: uid("pprof"),
            employeeId: rhEmployeeId,
            roomId: roomIdMap.get(e.room_id),
            type: e.type,
            offset: e.offset,
            binome: e.binome,
            daySpecJson: e.day_spec ? JSON.parse(e.day_spec) : null,
            altParity: e.alt_parity,
          },
          { transaction: t }
        );
      }
    }

    let overridesCopied = 0;
    for (const o of overrides) {
      const employeeId = employeeIdMap.get(o.employee_id);
      const roomId = roomIdMap.get(o.room_id);
      if (!employeeId || !roomId) continue; // employee was ambiguous/skipped
      overridesCopied++;
      if (!DRY_RUN) {
        await db.PlanningScheduleOverride.create(
          {
            id: uid("povr"),
            roomId,
            weekStart: o.week_start,
            employeeId,
            dayIndex: o.day_index,
            value: o.value || "",
          },
          { transaction: t }
        );
      }
    }

    let loansCopied = 0;
    for (const l of loans) {
      const employeeId = employeeIdMap.get(l.employee_id);
      const roomId = roomIdMap.get(l.room_id);
      if (!employeeId || !roomId) continue;
      loansCopied++;
      if (!DRY_RUN) {
        await db.PlanningRoomWeekLoan.create({ id: uid("ploan"), roomId, weekStart: l.week_start, employeeId }, { transaction: t });
      }
    }

    let absencesCopied = 0;
    for (const a of absences) {
      const employeeId = employeeIdMap.get(a.employee_id);
      if (!employeeId) continue;
      absencesCopied++;
      if (!DRY_RUN) {
        await db.PlanningAbsence.create(
          {
            id: uid("pabs"),
            employeeId,
            startDate: a.start_date,
            endDate: a.end_date,
            type: a.type,
            reason: a.reason,
            status: a.status,
          },
          { transaction: t }
        );
      }
    }

    if (DRY_RUN) {
      await t.rollback();
    } else {
      await t.commit();
    }

    console.log("\n================ RÉSUMÉ ================");
    console.log(`Mode : ${DRY_RUN ? "DRY-RUN (aucune écriture)" : "EXÉCUTÉ (écrit en base)"}`);
    console.log(`Salles migrées      : ${rooms.length}`);
    console.log(`Agents appariés à un salarié RH existant : ${matched.length}`);
    matched.forEach((m) => console.log(`   - ${m.source} -> ${m.rhEmployeeId}`));
    console.log(`Nouveaux salariés RH créés (à compléter) : ${created.length}`);
    created.forEach((c) => console.log(`   - ${c.source} -> ${c.rhEmployeeId} (${c.email || "sans e-mail"})`));
    console.log(`Ambigus, ignorés (à traiter manuellement) : ${ambiguous.length}`);
    ambiguous.forEach((a) => console.log(`   - ${a.source} (${a.candidateCount} correspondances)`));
    console.log(`Overrides copiés    : ${overridesCopied}/${overrides.length}`);
    console.log(`Prêts copiés        : ${loansCopied}/${loans.length}`);
    console.log(`Absences copiées    : ${absencesCopied}/${absences.length}`);
    console.log("==========================================\n");
    if (DRY_RUN) {
      console.log("Aucune écriture effectuée (--dry-run). Relancer sans ce flag pour appliquer.");
    }
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

main()
  .then(() => db.sequelize.close())
  .catch((err) => {
    console.error("ÉCHEC de la migration :", err.message);
    db.sequelize.close();
    process.exit(1);
  });
