const request = require("supertest");
const { resetDatabase, loginAs, app, db } = require("./helpers");

describe("Settings", () => {
  let passwords, adminToken, rhToken;

  beforeAll(async () => {
    passwords = await resetDatabase();
    adminToken = await loginAs("direction@groupe.mg", passwords.adminTempPassword);
    rhToken = await loginAs("rh.mg@groupe.mg", passwords.rhTempPassword);
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("GET /api/settings returns the seeded configuration", async () => {
    const res = await request(app).get("/api/settings").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.refCurrency).toBe("EUR");
    expect(res.body.legalMonthlyHours).toBeCloseTo(173.33, 2);
    expect(res.body.contractTypes).toEqual(
      expect.arrayContaining(["CDI", "CDD", "Période d'essai"])
    );
    expect(res.body.payElements.length).toBeGreaterThan(0);
  });

  it("Admin can update settings (e.g. add a contract type, tweak conversion rates)", async () => {
    const current = await request(app).get("/api/settings").set("Authorization", `Bearer ${adminToken}`);
    const newContractTypes = [...current.body.contractTypes, "Détachement"];

    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contractTypes: newContractTypes, rates: { ...current.body.rates, MGA: 5200 } });
    expect(res.status).toBe(200);
    expect(res.body.contractTypes).toContain("Détachement");
    expect(res.body.rates.MGA).toBe(5200);

    const refetched = await request(app).get("/api/settings").set("Authorization", `Bearer ${adminToken}`);
    expect(refetched.body.contractTypes).toContain("Détachement");
    expect(refetched.body.rates.MGA).toBe(5200);
  });

  it("non-Admin roles cannot update settings", async () => {
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${rhToken}`)
      .send({ legalMonthlyHours: 160 });
    expect(res.status).toBe(403);
  });

  it("leaves unspecified fields untouched on a partial update", async () => {
    const before = await request(app).get("/api/settings").set("Authorization", `Bearer ${adminToken}`);
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ maxEmergencyContacts: 3 });
    expect(res.status).toBe(200);
    expect(res.body.maxEmergencyContacts).toBe(3);
    expect(res.body.departments).toEqual(before.body.departments);
    expect(res.body.postes).toEqual(before.body.postes);
  });
});
