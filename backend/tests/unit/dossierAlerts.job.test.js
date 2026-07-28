const { shouldRunForCountry } = require("../../src/jobs/dossierAlerts.job");

// 2026-08-03 is a Monday (UTC). Indian/Antananarivo = UTC+3 (no DST),
// Africa/Douala = UTC+1 (no DST) — both fixed offsets year-round.
const MG_TZ = "Indian/Antananarivo";
const CM_TZ = "Africa/Douala";

describe("dossierAlerts job — shouldRunForCountry (per-country local time)", () => {
  it("fires for Madagascar at 07:00 its local time (04:00 UTC), not before/after", () => {
    expect(shouldRunForCountry("Quotidienne", MG_TZ, new Date("2026-08-03T04:00:00Z"))).toBe(true);
    expect(shouldRunForCountry("Quotidienne", MG_TZ, new Date("2026-08-03T03:00:00Z"))).toBe(false);
    expect(shouldRunForCountry("Quotidienne", MG_TZ, new Date("2026-08-03T05:00:00Z"))).toBe(false);
  });

  it("fires for Cameroon at its own 07:00 local time (06:00 UTC), independent of Madagascar's", () => {
    expect(shouldRunForCountry("Quotidienne", CM_TZ, new Date("2026-08-03T06:00:00Z"))).toBe(true);
    // At Madagascar's trigger time (04:00 UTC), it's only 05:00 in Cameroon — not yet.
    expect(shouldRunForCountry("Quotidienne", CM_TZ, new Date("2026-08-03T04:00:00Z"))).toBe(false);
  });

  it("'Hebdomadaire (lundi matin)' only fires on Monday, in that country's local calendar", () => {
    const monday7amMG = new Date("2026-08-03T04:00:00Z");
    const tuesday7amMG = new Date("2026-08-04T04:00:00Z");
    expect(shouldRunForCountry("Hebdomadaire (lundi matin)", MG_TZ, monday7amMG)).toBe(true);
    expect(shouldRunForCountry("Hebdomadaire (lundi matin)", MG_TZ, tuesday7amMG)).toBe(false);
  });

  it("'Immédiate + hebdomadaire' runs every day (treated as a daily digest) as long as it's 07:00 local", () => {
    const wednesday7amMG = new Date("2026-08-05T04:00:00Z");
    expect(shouldRunForCountry("Immédiate + hebdomadaire", MG_TZ, wednesday7amMG)).toBe(true);
  });
});
