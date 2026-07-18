const bcrypt = require("bcryptjs");
const request = require("supertest");
const { resetDatabase, loginAs, app, db } = require("./helpers");

const C1 = "cmp-thara"; // RH scope, Manager out of scope
const C2 = "cmp-ads"; // RH + Manager scope
const C3 = "cmp-care"; // out of scope for both RH and Manager

describe("Employees", () => {
  let passwords, adminToken, rhToken, managerToken, lectureToken;

  beforeAll(async () => {
    passwords = await resetDatabase();
    adminToken = await loginAs("direction@groupe.mg", passwords.adminTempPassword);
    rhToken = await loginAs("rh.mg@groupe.mg", passwords.rhTempPassword);
    managerToken = await loginAs("ads360@groupe.mg", passwords.managerTempPassword);

    await db.User.create({
      id: "u-lecture-test",
      name: "Lecture Seule",
      email: "lecture@groupe.mg",
      passwordHash: bcrypt.hashSync("LecturePass1", 10),
      mustChangePassword: false,
      role: "Lecture",
      scope: "all",
      active: true,
    });
    lectureToken = await loginAs("lecture@groupe.mg", "LecturePass1");
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("Admin sees every employee across all companies", async () => {
    const res = await request(app).get("/api/employees").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
  });

  it("RH (scope [Thara, ADS360]) only sees employees from in-scope companies", async () => {
    const res = await request(app).get("/api/employees").set("Authorization", `Bearer ${rhToken}`);
    expect(res.status).toBe(200);
    expect(res.body.every((e) => [C1, C2].includes(e.companyId))).toBe(true);
    expect(res.body.some((e) => e.companyId === C3)).toBe(false);
  });

  it("Manager (scope [ADS360]) only sees ADS360 employees", async () => {
    const res = await request(app).get("/api/employees").set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((e) => e.companyId === C2)).toBe(true);
  });

  it("filters by ?companyId= and rejects an out-of-scope companyId for RH", async () => {
    const ok = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${rhToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.every((e) => e.companyId === C1)).toBe(true);

    const forbidden = await request(app)
      .get(`/api/employees?companyId=${C3}`)
      .set("Authorization", `Bearer ${rhToken}`);
    expect(forbidden.status).toBe(403);
  });

  it("GET /api/employees/:id 403s for a Manager fetching an out-of-scope employee", async () => {
    const asAdmin = await request(app)
      .get(`/api/employees?companyId=${C3}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const outOfScopeId = asAdmin.body[0].id;

    const res = await request(app)
      .get(`/api/employees/${outOfScopeId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it("RH can create an employee within scope", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${rhToken}`)
      .send({
        firstName: "Test",
        lastName: "Nouveau",
        companyId: C1,
        poste: "Testeur",
        contractType: "CDI",
        hireDate: "2026-01-01",
        salaryBrut: 250000,
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Actif");
    expect(res.body.companyId).toBe(C1);

    // New hires inherit the country's checklist template, all unchecked.
    const checklist = await request(app)
      .get(`/api/employees/${res.body.id}/checklist`)
      .set("Authorization", `Bearer ${rhToken}`);
    expect(checklist.body.length).toBeGreaterThan(0);
    expect(checklist.body.every((c) => c.done === false)).toBe(true);
  });

  it("RH cannot create an employee in an out-of-scope company", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${rhToken}`)
      .send({ firstName: "X", lastName: "Y", companyId: C3, salaryBrut: 100000 });
    expect(res.status).toBe(403);
  });

  it("Manager cannot create employees (RH-only action)", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ firstName: "X", lastName: "Y", companyId: C2, salaryBrut: 100000 });
    expect(res.status).toBe(403);
  });

  it("updates an employee's salary and it persists", async () => {
    const list = await request(app)
      .get(`/api/employees?companyId=${C2}`)
      .set("Authorization", `Bearer ${managerToken}`);
    const target = list.body[0];

    const update = await request(app)
      .put(`/api/employees/${target.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ salaryBrut: 999999 });
    expect(update.status).toBe(200);
    expect(update.body.salaryBrut).toBe(999999);

    const refetch = await request(app)
      .get(`/api/employees/${target.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refetch.body.salaryBrut).toBe(999999);
  });

  it("only Admin can delete an employee", async () => {
    const list = await request(app)
      .get(`/api/employees?companyId=${C2}`)
      .set("Authorization", `Bearer ${managerToken}`);
    const target = list.body[0];

    const asManager = await request(app)
      .delete(`/api/employees/${target.id}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(asManager.status).toBe(403);

    const asAdmin = await request(app)
      .delete(`/api/employees/${target.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(204);
  });

  it("a Lecture (read-only) account can GET but not POST/PUT/DELETE", async () => {
    const read = await request(app).get("/api/employees").set("Authorization", `Bearer ${lectureToken}`);
    expect(read.status).toBe(200);

    const write = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${lectureToken}`)
      .send({ firstName: "X", lastName: "Y", companyId: C1, salaryBrut: 1 });
    expect(write.status).toBe(403);
  });

  it("adds a warning and an evaluation, and 'Confirmation' during probation activates the employee", async () => {
    const list = await request(app)
      .get(`/api/employees?companyId=${C1}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const probationary = list.body.find((e) => e.status === "Période d'essai");
    expect(probationary).toBeDefined();

    const warn = await request(app)
      .post(`/api/employees/${probationary.id}/warnings`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ type: "Rappel à l'ordre", reason: "Test de motif" });
    expect(warn.status).toBe(201);

    const evalRes = await request(app)
      .post(`/api/employees/${probationary.id}/evaluations`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: "2026-07-01", decision: "Confirmation", scores: {}, total: 80 });
    expect(evalRes.status).toBe(201);

    const refreshed = await request(app)
      .get(`/api/employees/${probationary.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refreshed.body.status).toBe("Actif");
  });
});
