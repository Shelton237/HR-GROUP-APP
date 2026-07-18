const request = require("supertest");
const db = require("../../src/models");
const seeder = require("../../seeders/20260101000001-demo-data");
const app = require("../../src/app");

// Children-first order so FK constraints don't block truncation.
const TABLES_CHILDREN_FIRST = [
  "employee_pay_vars",
  "employee_overtime",
  "employee_onboarding",
  "employee_documents",
  "employee_warnings",
  "employee_evaluations",
  "employee_checklist_items",
  "employee_emergency_contacts",
  "payments",
  "leaves",
  "employees",
  "company_documents",
  "companies",
  "users",
  "notifications",
  "settings",
  "countries",
];

/**
 * Wipes every table and re-runs the demo-data seeder, giving each integration
 * test file a known-clean starting fixture (6 countries, 3 companies, 7
 * employees, settings/notifications singletons, 3 users). Returns the freshly
 * generated temp passwords so tests can log in.
 */
async function resetDatabase() {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of TABLES_CHILDREN_FIRST) {
    await db.sequelize.query(`TRUNCATE TABLE \`${table}\``);
  }
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  return seeder.up();
}

async function loginAs(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

module.exports = { resetDatabase, loginAs, app, db };
