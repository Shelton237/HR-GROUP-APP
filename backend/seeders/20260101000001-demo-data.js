"use strict";
/**
 * Ports seedCountries() and seedData() from app/src/App.jsx (lines ~32-106)
 * so the real starting data (6 countries with real tax brackets/contribution
 * rates, 3 companies, 7 employees, settings, notifications) is preserved.
 *
 * Uses the Sequelize models directly (rather than raw queryInterface.bulkInsert)
 * so JSON columns and per-model defaults are handled consistently, and so the
 * normalized sub-resources (checklist items, evaluations, warnings, onboarding)
 * can be created through their proper associations.
 */
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../src/models");
const { baseChecklist, seedCountries } = require("../src/seedData");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function generateTempPassword() {
  // 16 random bytes -> base64url, trimmed to a readable 20-char temp password.
  return crypto.randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
}

module.exports = {
  up: async () => {
    const t = await db.sequelize.transaction();
    try {
      // ---------------------------------------------------------------
      // Countries
      // ---------------------------------------------------------------
      const countries = seedCountries();
      for (const c of countries) {
        await db.Country.create(
          {
            code: c.code,
            name: c.name,
            currency: c.currency,
            flag: c.flag,
            validated: c.validated,
            leaveAccrual: c.leaveAccrual,
            minTax: c.minTax,
            contributionsJson: { employee: c.employee, employer: c.employer },
            taxBracketsJson: c.tax,
            checklistJson: c.checklist,
            holidaysJson: c.holidays,
          },
          { transaction: t }
        );
      }

      // ---------------------------------------------------------------
      // Settings (singleton)
      // ---------------------------------------------------------------
      await db.Settings.create(
        {
          id: 1,
          refCurrency: "EUR",
          rates: { MGA: 5100, XAF: 655.957, XOF: 655.957 },
          legalMonthlyHours: 173.33,
          contractTypes: ["Période d'essai", "CDI", "CDD", "Stage", "Prestation", "Apprentissage"],
          leaveTypes: [
            { name: "Congé payé", paid: true, accrual: 2.5 },
            { name: "Maladie", paid: true, accrual: 0 },
            { name: "Sans solde", paid: false, accrual: 0 },
            { name: "Maternité / paternité", paid: true, accrual: 0 },
            { name: "Événement familial", paid: true, accrual: 0 },
          ],
          warningTypes: ["Rappel à l'ordre", "Avertissement", "Blâme", "Mise à pied"],
          evalDecisions: ["Confirmation", "Renouvellement essai", "Plan d'amélioration", "Rupture"],
          documentCategories: [
            { name: "Contrat", expires: false },
            { name: "CIN / Pièce d'identité", expires: true },
            { name: "Diplôme", expires: false },
            { name: "Visite médicale", expires: true },
            { name: "Permis de conduire", expires: true },
            { name: "Attestation", expires: false },
            { name: "Autre", expires: false },
          ],
          departments: [
            "Direction",
            "Technique / Terrain",
            "Control Room",
            "ADS360",
            "Administration & RH",
            "Commercial",
          ],
          sites: ["Siège Talatamaty", "Terrain / Province", "Douala"],
          postes: [
            "Technicien Support & Maintenance",
            "Opérateur Control Room",
            "Opérateur Monitoring ADS360",
            "Superviseur",
            "Consultant RH",
            "Assistant administratif",
          ],
          categories: ["Cadre", "Agent de maîtrise", "Employé", "Ouvrier"],
          payElements: [
            { id: "pe1", label: "Prime de déplacement", kind: "gain", taxable: true, cotisable: true },
            { id: "pe2", label: "Prime d'astreinte", kind: "gain", taxable: true, cotisable: true },
            { id: "pe3", label: "Indemnité de transport", kind: "gain", taxable: false, cotisable: false },
            { id: "pe4", label: "Avance sur salaire", kind: "retenue", taxable: false, cotisable: false },
            { id: "pe5", label: "Retenue diverse", kind: "retenue", taxable: false, cotisable: false },
          ],
          customFields: [
            { id: "cf1", label: "Taille uniforme", type: "select", options: ["S", "M", "L", "XL"] },
            { id: "cf2", label: "N° permis de conduire", type: "text", options: [] },
          ],
          evalTemplates: [
            {
              id: "et1",
              name: "Technicien / Opérateur terrain",
              criteria: [
                { label: "Qualité technique", weight: 30 },
                { label: "Respect des délais", weight: 20 },
                { label: "Qualité du reporting", weight: 20 },
                { label: "Respect des consignes de sécurité", weight: 15 },
                { label: "Satisfaction client", weight: 15 },
              ],
            },
            {
              id: "et2",
              name: "Control Room",
              criteria: [
                { label: "Réactivité sur alertes/incidents", weight: 30 },
                { label: "Respect des procédures et SLA", weight: 25 },
                { label: "Qualité et régularité des rapports", weight: 20 },
                { label: "Assiduité et ponctualité", weight: 15 },
                { label: "Communication client", weight: 10 },
              ],
            },
          ],
          onboardingTemplates: [
            {
              id: "ot1",
              name: "Intégration Control Room (3 semaines)",
              steps: [
                { phase: "Semaine 1", label: "Découverte environnement & règles" },
                { phase: "Semaine 1", label: "Prise en main des systèmes (supervision)" },
                { phase: "Semaine 2", label: "Procédures de relève et passation" },
                { phase: "Semaine 2", label: "Gestion des requêtes clients" },
                { phase: "Semaine 3", label: "Mise en autonomie supervisée" },
                { phase: "Décision", label: "Décision J+30 (confirmation / plan / alerte)" },
              ],
            },
          ],
          maxEmergencyContacts: 2,
        },
        { transaction: t }
      );

      // ---------------------------------------------------------------
      // Notifications (singleton)
      // ---------------------------------------------------------------
      await db.Notifications.create(
        {
          id: 1,
          adminEmails: ["direction@groupe.mg", "rh.mg@groupe.mg"],
          driveFolderUrl: "https://drive.google.com/drive/folders/1CvA4-FYDj6uiOTejbU7johRtHNzDwLFx",
          rules: {
            incompleteDossier: true,
            probationEnd: true,
            evalDue: true,
            docExpiry: true,
            contractEnd: true,
          },
          frequency: "Hebdomadaire (lundi matin)",
        },
        { transaction: t }
      );

      // ---------------------------------------------------------------
      // Companies
      // ---------------------------------------------------------------
      const c1 = "cmp-thara",
        c2 = "cmp-ads",
        c3 = "cmp-care";
      await db.Company.bulkCreate(
        [
          {
            id: c1,
            name: "Thara Services Sarl",
            countryCode: "MG",
            nif: "2018100907",
            rcs: "2023B00920",
            employerNumber: "",
            address: "Ankadivory, Talatamaty — Antananarivo",
          },
          { id: c2, name: "ADS360", countryCode: "MG", nif: "", rcs: "", employerNumber: "", address: "Antananarivo" },
          {
            id: c3,
            name: "CareBusiness Consulting",
            countryCode: "CM",
            nif: "",
            rcs: "",
            employerNumber: "",
            address: "Douala",
          },
        ],
        { transaction: t }
      );

      // ---------------------------------------------------------------
      // Users: seed data's 3 demo accounts, direction@groupe.mg is the
      // Admin/"all"-scope account the spec calls out. Its temp password is
      // random and printed to the console; the other two demo accounts also
      // get random (unprinted) passwords since they aren't meant for login yet.
      // ---------------------------------------------------------------
      const adminTempPassword = generateTempPassword();
      const rhTempPassword = generateTempPassword();
      const managerTempPassword = generateTempPassword();

      await db.User.bulkCreate(
        [
          {
            id: "u1",
            name: "Direction Groupe",
            email: "direction@groupe.mg",
            passwordHash: bcrypt.hashSync(adminTempPassword, 10),
            mustChangePassword: true,
            role: "Admin",
            scope: "all",
            active: true,
          },
          {
            id: "u2",
            name: "RH Madagascar",
            email: "rh.mg@groupe.mg",
            passwordHash: bcrypt.hashSync(rhTempPassword, 10),
            mustChangePassword: true,
            role: "RH",
            scope: [c1, c2],
            active: true,
          },
          {
            id: "u3",
            name: "Responsable ADS360",
            email: "ads360@groupe.mg",
            passwordHash: bcrypt.hashSync(managerTempPassword, 10),
            mustChangePassword: true,
            role: "Manager",
            scope: [c2],
            active: true,
          },
        ],
        { transaction: t }
      );

      // ---------------------------------------------------------------
      // Employees + sub-resources
      // ---------------------------------------------------------------
      const today = new Date();
      const iso = (d) => d.toISOString().slice(0, 10);
      const ago = (n) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return iso(d);
      };
      const done = Object.fromEntries(baseChecklist().map((c) => [c.key, true]));
      const part = { ...done, jobdesc: false, medical: false, photo: false };

      const employeeSeeds = [
        [c1, "Rakoto", "Jean", "Technicien Support & Maintenance", "CDI", ago(400), 200000, done, ago(35), []],
        [c1, "Randria", "Miora", "Opérateur Control Room", "Période d'essai", ago(70), 350000, part, null, []],
        [c1, "Andrianina", "Tovo", "Superviseur", "CDI", ago(700), 600000, done, ago(200), []],
        [
          c2,
          "Ravel",
          "Hanta",
          "Opérateur Monitoring ADS360",
          "CDI",
          ago(320),
          400000,
          done,
          ago(20),
          [{ date: ago(30), type: "Avertissement", reason: "Retard répété de rapport", notes: "" }],
        ],
        [c2, "Solofo", "Naina", "Opérateur Monitoring ADS360", "Période d'essai", ago(80), 400000, part, null, []],
        [c3, "Mballa", "Sandrine", "Consultant RH", "CDI", ago(150), 350000, done, ago(60), []],
        [c3, "Nguema", "Éric", "Assistant administratif", "Période d'essai", ago(75), 180000, part, null, []],
      ];

      for (const [companyId, last, first, poste, contract, hire, brut, cl, lastEval, warns] of employeeSeeds) {
        const empId = uid("emp");
        await db.Employee.create(
          {
            id: empId,
            companyId,
            firstName: first,
            lastName: last,
            poste,
            contractType: contract,
            hireDate: hire,
            contractEndDate: null,
            salaryBrut: brut,
            probationMonths: 3,
            status: contract === "Période d'essai" ? "Période d'essai" : "Actif",
            matricule: "",
            gender: "",
            maritalStatus: "",
            dependents: 0,
            nationality: "",
            birthDate: null,
            cin: "",
            socialNumber: "",
            phone: "",
            email: "",
            address: "",
            bankAccount: "",
            mobileMoney: "",
            managerId: null,
            department: "",
            site: "",
            category: "",
            leaveBalance: 30,
            customJson: {},
          },
          { transaction: t }
        );

        // Checklist items, keyed on the shared base checklist (also the MG/CM
        // country default checklist template at seed time).
        await db.EmployeeChecklistItem.bulkCreate(
          Object.entries(cl).map(([key, doneVal]) => ({ employeeId: empId, key, done: doneVal })),
          { transaction: t }
        );

        if (lastEval) {
          await db.EmployeeEvaluation.create(
            {
              id: uid("ev"),
              employeeId: empId,
              templateId: "",
              date: lastEval,
              scoresJson: {},
              total: null,
              decision: "Confirmation",
              notes: "",
              evaluator: "",
            },
            { transaction: t }
          );
        }

        for (const w of warns) {
          await db.EmployeeWarning.create(
            { id: uid("w"), employeeId: empId, date: w.date, type: w.type, reason: w.reason, notes: w.notes },
            { transaction: t }
          );
        }

        await db.EmployeeOnboarding.create(
          { employeeId: empId, templateId: "", stepsJson: {}, decision: "" },
          { transaction: t }
        );
      }

      await t.commit();

      // eslint-disable-next-line no-console
      console.log("\n================ SEED COMPLETE ================");
      console.log(`Admin login........: direction@groupe.mg`);
      console.log(`Admin temp password: ${adminTempPassword}`);
      console.log("(must_change_password = true; share this securely and rotate it.)");
      console.log("=================================================\n");

      // Returned for callers that invoke this seeder's up() directly (e.g. the
      // integration test suite's DB reset helper). sequelize-cli ignores this.
      return { adminTempPassword, rhTempPassword, managerTempPassword };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async () => {
    await db.EmployeeOnboarding.destroy({ where: {}, truncate: true });
    await db.EmployeeWarning.destroy({ where: {}, truncate: true });
    await db.EmployeeEvaluation.destroy({ where: {}, truncate: true });
    await db.EmployeeChecklistItem.destroy({ where: {}, truncate: true });
    await db.Employee.destroy({ where: {}, truncate: true });
    await db.User.destroy({ where: {}, truncate: true });
    await db.Company.destroy({ where: {}, truncate: true });
    await db.Notifications.destroy({ where: {}, truncate: true });
    await db.Settings.destroy({ where: {}, truncate: true });
    await db.Country.destroy({ where: {}, truncate: true });
  },
};
