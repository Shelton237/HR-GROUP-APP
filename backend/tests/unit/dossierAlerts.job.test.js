const { shouldRunToday } = require("../../src/jobs/dossierAlerts.job");

describe("dossierAlerts job — shouldRunToday", () => {
  const monday = new Date("2026-08-03T08:00:00Z"); // a Monday
  const wednesday = new Date("2026-08-05T08:00:00Z");

  it("runs every day for 'Quotidienne'", () => {
    expect(shouldRunToday("Quotidienne", monday)).toBe(true);
    expect(shouldRunToday("Quotidienne", wednesday)).toBe(true);
  });

  it("runs every day for 'Immédiate + hebdomadaire' (treated as a daily digest)", () => {
    expect(shouldRunToday("Immédiate + hebdomadaire", wednesday)).toBe(true);
  });

  it("only runs on Monday for 'Hebdomadaire (lundi matin)'", () => {
    expect(shouldRunToday("Hebdomadaire (lundi matin)", monday)).toBe(true);
    expect(shouldRunToday("Hebdomadaire (lundi matin)", wednesday)).toBe(false);
  });
});
