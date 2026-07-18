const { computeAlerts } = require("../../src/services/alerts.service");
const { addMonths } = require("../../src/services/payroll.service");

const iso = (d) => d.toISOString().slice(0, 10);
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
// Returns a hireDate such that hireDate + probationMonths lands `daysAhead` from now.
const hireDateForProbationIn = (daysAhead, probationMonths = 3) => {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  const hire = new Date(target);
  hire.setMonth(hire.getMonth() - probationMonths);
  return iso(hire);
};

const baseCountries = [
  {
    code: "MG",
    checklist: [
      { key: "contract", label: "Contrat de travail signé" },
      { key: "cin", label: "Copie CIN / pièce d'identité" },
    ],
  },
];
const company = { id: "cmp-1", name: "Thara Services Sarl", countryCode: "MG" };
const companyById = (id) => (id === company.id ? company : undefined);

function makeEmployee(overrides) {
  return {
    firstName: "Jean",
    lastName: "Rakoto",
    companyId: company.id,
    status: "Actif",
    hireDate: null,
    probationMonths: 3,
    contractEndDate: null,
    evaluations: [],
    checklist: { contract: true, cin: true },
    documents: [],
    ...overrides,
  };
}

describe("computeAlerts", () => {
  it("returns no alerts for a fully compliant, up-to-date employee", () => {
    const e = makeEmployee({
      status: "Actif",
      evaluations: [{ date: daysFromNow(-30) }], // evaluated a month ago, next due in 11 months
    });
    const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
    expect(alerts).toEqual([]);
  });

  it("excludes employees with status 'Sorti' entirely", () => {
    const e = makeEmployee({ status: "Sorti", checklist: {} }); // would otherwise trigger a dossier alert
    const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
    expect(alerts).toEqual([]);
  });

  describe("probation (essai) alerts", () => {
    it("warns (amber) when probation end is within 21 days", () => {
      const e = makeEmployee({ status: "Période d'essai", hireDate: hireDateForProbationIn(10) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const essai = alerts.find((a) => a.type === "essai");
      expect(essai).toBeDefined();
      expect(essai.tone).toBe("amber");
      expect(essai.text).toMatch(/Fin de période d'essai dans \d+ j/);
    });

    it("flags overdue (rose) when probation end has already passed", () => {
      const e = makeEmployee({ status: "Période d'essai", hireDate: hireDateForProbationIn(-5) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const essai = alerts.find((a) => a.type === "essai");
      expect(essai).toBeDefined();
      expect(essai.tone).toBe("rose");
      expect(essai.text).toMatch(/dépassée de \d+ j/);
    });

    it("does not fire when probation end is more than 21 days away", () => {
      const e = makeEmployee({ status: "Période d'essai", hireDate: hireDateForProbationIn(60) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      expect(alerts.find((a) => a.type === "essai")).toBeUndefined();
    });
  });

  describe("evaluation (eval) alerts", () => {
    it("uses hireDate + probationMonths as the due date when there are no evaluations yet", () => {
      const e = makeEmployee({ status: "Actif", hireDate: hireDateForProbationIn(15), evaluations: [] });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const ev = alerts.find((a) => a.type === "eval");
      expect(ev).toBeDefined();
      expect(ev.tone).toBe("teal");
    });

    it("uses last evaluation date + 12 months as the next due date", () => {
      const e = makeEmployee({
        status: "Actif",
        evaluations: [{ date: daysFromNow(-360) }], // due in 5 days
      });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const ev = alerts.find((a) => a.type === "eval");
      expect(ev).toBeDefined();
      expect(ev.tone).toBe("teal");
      expect(ev.text).toMatch(/Évaluation à réaliser dans \d+ j/);
    });

    it("flags overdue (rose) evaluations", () => {
      const e = makeEmployee({ evaluations: [{ date: daysFromNow(-400) }] });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const ev = alerts.find((a) => a.type === "eval");
      expect(ev).toBeDefined();
      expect(ev.tone).toBe("rose");
      expect(ev.text).toMatch(/en retard de \d+ j/);
    });

    it("picks the most recent evaluation (array is in insertion order)", () => {
      const e = makeEmployee({
        evaluations: [{ date: daysFromNow(-400) }, { date: daysFromNow(-30) }],
      });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      // Last entry (-30 days) puts the next due date ~11 months out -> no eval alert.
      expect(alerts.find((a) => a.type === "eval")).toBeUndefined();
    });
  });

  describe("dossier (checklist) alerts", () => {
    it("lists every missing checklist item by label", () => {
      const e = makeEmployee({ checklist: { contract: true, cin: false } });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const dossier = alerts.find((a) => a.type === "dossier");
      expect(dossier).toBeDefined();
      expect(dossier.tone).toBe("amber");
      expect(dossier.text).toBe("Dossier incomplet : Copie CIN / pièce d'identité");
    });

    it("does not fire when every checklist item is done", () => {
      const e = makeEmployee({ checklist: { contract: true, cin: true } });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      expect(alerts.find((a) => a.type === "dossier")).toBeUndefined();
    });
  });

  describe("contract (CDD) end alerts", () => {
    it("fires when contractEndDate is within 30 days", () => {
      const e = makeEmployee({ contractEndDate: daysFromNow(20) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const contrat = alerts.find((a) => a.type === "contrat");
      expect(contrat).toBeDefined();
      expect(contrat.tone).toBe("amber");
      expect(contrat.text).toMatch(/Fin de CDD dans \d+ j/);
    });

    it("does not fire for an already-past contractEndDate (unlike probation/eval/doc)", () => {
      const e = makeEmployee({ contractEndDate: daysFromNow(-5) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      expect(alerts.find((a) => a.type === "contrat")).toBeUndefined();
    });

    it("does not fire when more than 30 days away", () => {
      const e = makeEmployee({ contractEndDate: daysFromNow(45) });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      expect(alerts.find((a) => a.type === "contrat")).toBeUndefined();
    });
  });

  describe("document expiry alerts", () => {
    it("warns (amber) when a document expires within 30 days", () => {
      const e = makeEmployee({ documents: [{ name: "Visa de travail", expiryDate: daysFromNow(15) }] });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const doc = alerts.find((a) => a.type === "doc");
      expect(doc).toBeDefined();
      expect(doc.tone).toBe("amber");
      expect(doc.text).toBe(`Visa de travail expire dans 15 j`);
    });

    it("flags an already-expired document (rose)", () => {
      const e = makeEmployee({ documents: [{ name: "Permis de conduire", expiryDate: daysFromNow(-3) }] });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      const doc = alerts.find((a) => a.type === "doc");
      expect(doc).toBeDefined();
      expect(doc.tone).toBe("rose");
      expect(doc.text).toBe("Permis de conduire expiré");
    });

    it("ignores documents without an expiryDate", () => {
      const e = makeEmployee({ documents: [{ name: "Attestation", expiryDate: "" }] });
      const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
      expect(alerts.find((a) => a.type === "doc")).toBeUndefined();
    });
  });

  it("aggregates multiple alert types for the same employee and attaches company info", () => {
    const e = makeEmployee({
      status: "Période d'essai",
      hireDate: hireDateForProbationIn(5),
      checklist: { contract: false, cin: false },
      contractEndDate: daysFromNow(10),
    });
    const alerts = computeAlerts({ employees: [e], countries: baseCountries }, companyById);
    const types = alerts.map((a) => a.type).sort();
    expect(types).toEqual(["contrat", "dossier", "eval", "essai"].sort());
    alerts.forEach((a) => {
      expect(a.who).toBe("Jean Rakoto");
      expect(a.company).toBe("Thara Services Sarl");
    });
  });

  it("sanity-checks addMonths is applied the same way the alert due-dates rely on", () => {
    const d = addMonths("2026-01-15", 3);
    expect(d.getMonth()).toBe(3); // April (0-indexed)
    expect(d.getDate()).toBe(15);
  });
});
