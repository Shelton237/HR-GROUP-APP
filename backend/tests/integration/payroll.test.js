const request = require("supertest");
const { resetDatabase, loginAs, app, db } = require("./helpers");

const C1 = "cmp-thara"; // Madagascar

describe("Payroll", () => {
  let passwords, adminToken;

  beforeAll(async () => {
    passwords = await resetDatabase();
    adminToken = await loginAs("direction@groupe.mg", passwords.adminTempPassword);
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("computes an employee's payroll for a given month via the country's real tax profile", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const supervisor = employees.body.find((e) => e.salaryBrut === 600000);
    expect(supervisor).toBeDefined();

    const res = await request(app)
      .get(`/api/employees/${supervisor.id}/payroll?month=2026-07`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe("MGA");
    expect(res.body.brut).toBe(600000);
    // Manually verified against Madagascar's seeded brackets/contributions:
    // 2% employee contrib, progressive tax = 25700, 18% employer contrib.
    expect(res.body.empContrib).toBeCloseTo(12000, 6);
    expect(res.body.tax).toBeCloseTo(25700, 6);
    expect(res.body.emrContrib).toBeCloseTo(108000, 6);
    expect(res.body.net).toBeCloseTo(562300, 6);
    expect(res.body.cost).toBeCloseTo(708000, 6);
  });

  it("overtime and pay-var entries for the requested month feed into the payroll computation", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[0];
    const month = "2026-09";

    await request(app)
      .post(`/api/employees/${employee.id}/overtime`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ month, method: "forfait", amount: 15000 });
    await request(app)
      .post(`/api/employees/${employee.id}/pay-vars`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ month, label: "Prime de déplacement", kind: "gain", taxable: true, cotisable: true, amount: 20000 });

    const before = await request(app)
      .get(`/api/employees/${employee.id}/payroll?month=2026-06`) // a month with no entries
      .set("Authorization", `Bearer ${adminToken}`);
    const after = await request(app)
      .get(`/api/employees/${employee.id}/payroll?month=${month}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(after.body.gainAll).toBeCloseTo(before.body.gainAll + 15000 + 20000, 6);
    expect(after.body.ot).toBeCloseTo(15000, 6);
  });

  it("GET /api/payroll/summary returns per-employee rows and totals for a company/month", async () => {
    const res = await request(app)
      .get(`/api/payroll/summary?companyId=${C1}&month=2026-07`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe("MGA");
    expect(res.body.rows.length).toBeGreaterThan(0);
    const totalNet = res.body.rows.reduce((s, r) => s + r.pay.net, 0);
    expect(res.body.totals.net).toBeCloseTo(totalNet, 6);
    res.body.rows.forEach((r) => {
      expect(r.status).toEqual({ validated: false, paid: false });
    });
  });

  it("PUT /api/payments/:employeeId/:month marks a payslip validated and paid, and it is reflected in the summary", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[0];
    const month = "2026-07";

    const update = await request(app)
      .put(`/api/payments/${employee.id}/${month}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ validated: true, paid: true });
    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({ validated: true, paid: true });

    const summary = await request(app)
      .get(`/api/payroll/summary?companyId=${C1}&month=${month}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const row = summary.body.rows.find((r) => r.employee.id === employee.id);
    expect(row.status).toEqual({ validated: true, paid: true });
  });

  it("rejects payroll summary requests for a company outside the caller's scope", async () => {
    const passwords2 = passwords;
    const managerToken = await loginAs("ads360@groupe.mg", passwords2.managerTempPassword);
    const res = await request(app)
      .get(`/api/payroll/summary?companyId=${C1}&month=2026-07`) // Manager scope is ADS360 only
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });
});
