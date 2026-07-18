const request = require("supertest");
const { resetDatabase, loginAs, app, db } = require("./helpers");

const C1 = "cmp-thara";
const C3 = "cmp-care"; // out of scope for RH (scope [Thara, ADS360])

describe("Leaves", () => {
  let passwords, adminToken, rhToken;

  beforeAll(async () => {
    passwords = await resetDatabase();
    adminToken = await loginAs("direction@groupe.mg", passwords.adminTempPassword);
    rhToken = await loginAs("rh.mg@groupe.mg", passwords.rhTempPassword);
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("full flow: request a paid leave -> validate -> leave balance decrements by the exact day count", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[0];
    const balanceBefore = employee.leaveBalance;

    const create = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employeeId: employee.id, type: "Congé payé", start: "2026-08-03", end: "2026-08-07" });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe("Demandé");
    expect(create.body.days).toBe(5); // inclusive day count (Mon-Fri)

    const list = await request(app).get("/api/leaves").set("Authorization", `Bearer ${adminToken}`);
    expect(list.body.some((l) => l.id === create.body.id)).toBe(true);

    const validate = await request(app)
      .put(`/api/leaves/${create.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Validé" });
    expect(validate.status).toBe(200);
    expect(validate.body.employee.leaveBalance).toBeCloseTo(balanceBefore - 5, 6);

    const refetched = await request(app)
      .get(`/api/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refetched.body.leaveBalance).toBeCloseTo(balanceBefore - 5, 6);
  });

  it("does not decrement the balance for an unpaid leave type ('Sans solde')", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[1];
    const balanceBefore = employee.leaveBalance;

    const create = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employeeId: employee.id, type: "Sans solde", start: "2026-08-10", end: "2026-08-11" });
    expect(create.status).toBe(201);

    const validate = await request(app)
      .put(`/api/leaves/${create.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Validé" });
    expect(validate.status).toBe(200);
    expect(validate.body.employee.leaveBalance).toBeCloseTo(balanceBefore, 6);
  });

  it("does not decrement the balance when a request is refused instead of validated", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[2];
    const balanceBefore = employee.leaveBalance;

    const create = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employeeId: employee.id, type: "Congé payé", start: "2026-09-01", end: "2026-09-02" });

    const refuse = await request(app)
      .put(`/api/leaves/${create.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Refusé" });
    expect(refuse.status).toBe(200);
    expect(refuse.body.leave.status).toBe("Refusé");

    const refetched = await request(app)
      .get(`/api/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refetched.body.leaveBalance).toBeCloseTo(balanceBefore, 6);
  });

  it("floors the balance at 0 rather than going negative", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = employees.body[0];

    // Drain the balance with a very long leave request.
    const create = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employeeId: employee.id, type: "Congé payé", start: "2026-01-01", end: "2027-01-01" });
    await request(app)
      .put(`/api/leaves/${create.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Validé" });

    const refetched = await request(app)
      .get(`/api/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refetched.body.leaveBalance).toBe(0);
  });

  it("RH cannot create a leave request for an employee outside their company scope", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C3}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const outOfScopeEmployee = employees.body[0];

    const res = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${rhToken}`)
      .send({ employeeId: outOfScopeEmployee.id, type: "Congé payé", start: "2026-08-01", end: "2026-08-02" });
    expect(res.status).toBe(403);
  });

  it("rejects an invalid status value", async () => {
    const employees = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const create = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employeeId: employees.body[0].id, type: "Congé payé", start: "2026-08-01", end: "2026-08-02" });

    const res = await request(app)
      .put(`/api/leaves/${create.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Annulé" });
    expect(res.status).toBe(400);
  });
});
