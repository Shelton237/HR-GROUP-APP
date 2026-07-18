const {
  contribTotal,
  progressiveTax,
  overtimeTotal,
  computePay,
} = require("../../src/services/payroll.service");
const { seedCountries } = require("../../src/seedData");

const countries = Object.fromEntries(seedCountries().map((c) => [c.code, c]));
const asCountryShape = (c) => ({ employee: c.employee, employer: c.employer, tax: c.tax, minTax: c.minTax });
const settings = { legalMonthlyHours: 173.33 };

describe("contribTotal", () => {
  it("sums rate% of base across all contribution lines", () => {
    const list = [
      { label: "A", rate: 1 },
      { label: "B", rate: 1 },
    ];
    expect(contribTotal(list, 600000)).toBeCloseTo(12000, 6);
  });

  it("caps the base at each line's ceiling when provided", () => {
    const list = [{ label: "Capped", rate: 10, ceiling: 100000 }];
    expect(contribTotal(list, 500000)).toBeCloseTo(10000, 6); // capped at 100000 * 10%
    expect(contribTotal(list, 50000)).toBeCloseTo(5000, 6); // below ceiling, uses base
  });

  it("returns 0 for an empty list or zero base", () => {
    expect(contribTotal([], 500000)).toBe(0);
    expect(contribTotal([{ label: "X", rate: 5 }], 0)).toBe(0);
  });
});

describe("progressiveTax", () => {
  it("Madagascar: 0 taxable -> 0 tax (minTax only applies when tax > 0)", () => {
    const mg = countries.MG;
    expect(progressiveTax(0, mg.tax, mg.minTax)).toBe(0);
  });

  it("Madagascar: taxable inside the first (0%) bracket stays 0, no minTax floor", () => {
    const mg = countries.MG;
    expect(progressiveTax(200000, mg.tax, mg.minTax)).toBe(0);
  });

  it("Madagascar: minTax floors a small positive tax", () => {
    const mg = countries.MG;
    // Just above 350000 -> tiny 5% slice, but minTax=3000 should floor it.
    const tax = progressiveTax(350100, mg.tax, mg.minTax);
    expect(tax).toBe(3000);
  });

  it("Madagascar: crosses multiple brackets correctly (588000 taxable)", () => {
    const mg = countries.MG;
    // 0% up to 350k, 5% (350k-400k)=2500, 10% (400k-500k)=10000, 15% (500k-588k)=13200
    const tax = progressiveTax(588000, mg.tax, mg.minTax);
    expect(tax).toBeCloseTo(2500 + 10000 + 13200, 6);
  });

  it("Madagascar: top (open-ended) bracket applies 20% beyond 600000", () => {
    const mg = countries.MG;
    // Bracket sums up to 600000: 0 + (400000-350000)*.05 + (500000-400000)*.10 + (600000-500000)*.15
    const upTo600k = 0 + 50000 * 0.05 + 100000 * 0.1 + 100000 * 0.15; // 2500+10000+15000=27500
    const tax = progressiveTax(700000, mg.tax, mg.minTax);
    expect(tax).toBeCloseTo(upTo600k + 100000 * 0.2, 6); // + 20% of the last 100000
  });

  it("Cameroun: 4 brackets (first bracket taxed at 10%, no 0% band), no minTax", () => {
    const cm = countries.CM;
    expect(progressiveTax(0, cm.tax, cm.minTax)).toBe(0);
    // 166667*.10 + (250000-166667)*.15 + (300000-250000)*.25
    const tax = progressiveTax(300000, cm.tax, cm.minTax);
    const expected = 166667 * 0.1 + (250000 - 166667) * 0.15 + (300000 - 250000) * 0.25;
    expect(tax).toBeCloseTo(expected, 4);
  });

  it("Côte d'Ivoire: 0% band up to 75000, then progressive", () => {
    const ci = countries.CI;
    expect(progressiveTax(75000, ci.tax, ci.minTax)).toBe(0);
    const tax = progressiveTax(100000, ci.tax, ci.minTax);
    expect(tax).toBeCloseTo((100000 - 75000) * 0.16, 6);
  });

  it("Tchad: top bracket at 30% beyond 1,000,000", () => {
    const td = countries.TD;
    const tax = progressiveTax(1200000, td.tax, td.minTax);
    const expected = 250000 * 0 + 250000 * 0.1 + 500000 * 0.2 + 200000 * 0.3;
    expect(tax).toBeCloseTo(expected, 4);
  });

  it("Gabon: exercises all 4 brackets", () => {
    const ga = countries.GA;
    const tax = progressiveTax(2000000, ga.tax, ga.minTax);
    const expected = 150000 * 0 + (1500000 - 150000) * 0.05 + (1920000 - 1500000) * 0.1 + (2000000 - 1920000) * 0.2;
    expect(tax).toBeCloseTo(expected, 4);
  });

  it("Mali: exercises all 4 brackets", () => {
    const ml = countries.ML;
    const tax = progressiveTax(1500000, ml.tax, ml.minTax);
    const expected = 175000 * 0 + (600000 - 175000) * 0.15 + (1200000 - 600000) * 0.25 + (1500000 - 1200000) * 0.33;
    expect(tax).toBeCloseTo(expected, 4);
  });
});

describe("overtimeTotal", () => {
  const legalHours = 173.33;

  it("returns 0 with no overtime entries for the month", () => {
    const e = { salaryBrut: 300000, overtime: {} };
    expect(overtimeTotal(e, "2026-07", legalHours)).toBe(0);
  });

  it("sums a flat 'forfait' amount regardless of salary", () => {
    const e = { salaryBrut: 300000, overtime: { "2026-07": [{ method: "forfait", amount: 15000 }] } };
    expect(overtimeTotal(e, "2026-07", legalHours)).toBe(15000);
  });

  it("computes hourly overtime as brut/legalHours * hours * (1+rate%)", () => {
    const e = { salaryBrut: 173330, overtime: { "2026-07": [{ method: "hourly", hours: 10, rate: 50 }] } };
    // hourly rate = 173330/173.33 = 1000 exactly
    const expected = 10 * 1000 * 1.5;
    expect(overtimeTotal(e, "2026-07", legalHours)).toBeCloseTo(expected, 6);
  });

  it("falls back to 173.33 legal hours when settings value is missing", () => {
    const e = { salaryBrut: 173330, overtime: { "2026-07": [{ method: "hourly", hours: 1, rate: 0 }] } };
    expect(overtimeTotal(e, "2026-07", undefined)).toBeCloseTo(1000, 6);
  });

  it("sums multiple mixed entries (forfait + hourly) in the same month", () => {
    const e = {
      salaryBrut: 173330,
      overtime: {
        "2026-07": [
          { method: "forfait", amount: 5000 },
          { method: "hourly", hours: 2, rate: 0 },
        ],
      },
    };
    expect(overtimeTotal(e, "2026-07", legalHours)).toBeCloseTo(5000 + 2000, 6);
  });
});

describe("computePay", () => {
  it("returns all-zero pay for a 0 salary employee with no country", () => {
    const e = { salaryBrut: 0 };
    const p = computePay(e, null, "2026-07", settings);
    expect(p).toEqual({ brut: 0, ot: 0, gainAll: 0, retenues: 0, empContrib: 0, tax: 0, net: 0, emrContrib: 0, cost: 0 });
  });

  it("Madagascar: matches the manually-verified 600000 MGA case (Andrianina Tovo fixture)", () => {
    const e = { salaryBrut: 600000 };
    const p = computePay(e, asCountryShape(countries.MG), "2026-07", settings);
    expect(p.empContrib).toBeCloseTo(12000, 6); // 2% of 600000
    expect(p.tax).toBeCloseTo(25700, 6);
    expect(p.emrContrib).toBeCloseTo(108000, 6); // 18% of 600000
    expect(p.net).toBeCloseTo(562300, 6);
    expect(p.cost).toBeCloseTo(708000, 6);
  });

  it("Madagascar: low salary stays under the 0% tax bracket, no minTax floor triggers", () => {
    const e = { salaryBrut: 200000 };
    const p = computePay(e, asCountryShape(countries.MG), "2026-07", settings);
    expect(p.tax).toBe(0);
    expect(p.empContrib).toBeCloseTo(4000, 6);
    expect(p.net).toBeCloseTo(200000 - 4000, 6);
  });

  it("includes taxable+cotisable overtime and pay variables in the pay computation", () => {
    const e = {
      salaryBrut: 300000,
      overtime: { "2026-07": [{ method: "forfait", amount: 20000 }] },
      payVars: {
        "2026-07": [
          { kind: "gain", amount: 10000, taxable: true, cotisable: true }, // prime imposable/cotisable
          { kind: "gain", amount: 5000, taxable: false, cotisable: false }, // indemnité non imposable
          { kind: "retenue", amount: 8000 }, // avance sur salaire
        ],
      },
    };
    const p = computePay(e, asCountryShape(countries.MG), "2026-07", settings);
    // gainAll = ot(20000) + 10000 + 5000 = 35000 ; retenues = 8000
    expect(p.gainAll).toBeCloseTo(35000, 6);
    expect(p.retenues).toBe(8000);
    // cotisable base = brut + ot + taxable/cotisable gain = 300000+20000+10000 = 330000 -> *2%
    expect(p.empContrib).toBeCloseTo(6600, 6);
    expect(p.cost).toBeCloseTo(300000 + 35000 + p.emrContrib, 6);
  });

  it("Cameroun: computes a representative mid-salary employee end to end", () => {
    const e = { salaryBrut: 400000 };
    const p = computePay(e, asCountryShape(countries.CM), "2026-07", settings);
    expect(p.empContrib).toBeCloseTo(400000 * 0.042, 6);
    expect(p.emrContrib).toBeCloseTo(400000 * 0.112, 6);
    expect(p.net).toBeCloseTo(400000 - p.empContrib - p.tax, 6);
    expect(p.cost).toBeCloseTo(400000 + p.emrContrib, 6);
  });

  it("Côte d'Ivoire: representative salary below the 0% threshold pays no tax", () => {
    const e = { salaryBrut: 70000 };
    const p = computePay(e, asCountryShape(countries.CI), "2026-07", settings);
    expect(p.tax).toBe(0);
  });

  it("Tchad: representative high salary crosses all brackets", () => {
    const e = { salaryBrut: 1200000 };
    const p = computePay(e, asCountryShape(countries.TD), "2026-07", settings);
    expect(p.tax).toBeGreaterThan(0);
    expect(p.net).toBeCloseTo(1200000 - p.empContrib - p.tax, 6);
  });

  it("Gabon: representative mid salary", () => {
    const e = { salaryBrut: 900000 };
    const p = computePay(e, asCountryShape(countries.GA), "2026-07", settings);
    expect(p.empContrib).toBeCloseTo(900000 * 0.035, 6); // 2.5% + 1%
    expect(p.emrContrib).toBeCloseTo(900000 * 0.201, 6);
  });

  it("Mali: representative mid salary", () => {
    const e = { salaryBrut: 700000 };
    const p = computePay(e, asCountryShape(countries.ML), "2026-07", settings);
    expect(p.empContrib).toBeCloseTo(700000 * 0.036, 6);
    expect(p.emrContrib).toBeCloseTo(700000 * 0.174, 6);
  });
});
