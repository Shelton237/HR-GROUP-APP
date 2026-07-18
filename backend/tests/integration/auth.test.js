const request = require("supertest");
const { resetDatabase, app, db } = require("./helpers");

describe("Auth", () => {
  let passwords;

  beforeAll(async () => {
    passwords = await resetDatabase();
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("rejects login with a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("rejects login for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@groupe.mg", password: "whatever" });
    expect(res.status).toBe(401);
  });

  it("logs in the seeded admin with the generated temp password and returns a JWT + user profile", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: passwords.adminTempPassword });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: "direction@groupe.mg",
      role: "Admin",
      scope: "all",
      mustChangePassword: true,
    });
  });

  it("GET /api/auth/me returns the authenticated profile", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: passwords.adminTempPassword });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("direction@groupe.mg");
  });

  it("GET /api/auth/me without a token is rejected", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me with a garbage token is rejected", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/change-password lets the admin set a new password and clears mustChangePassword", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: passwords.adminTempPassword });
    const token = login.body.token;

    const change = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ newPassword: "BrandNewPassw0rd!" });
    expect(change.status).toBe(200);

    const relogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: "BrandNewPassw0rd!" });
    expect(relogin.status).toBe(200);
    expect(relogin.body.user.mustChangePassword).toBe(false);

    // Old temp password no longer works.
    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "direction@groupe.mg", password: passwords.adminTempPassword });
    expect(oldLogin.status).toBe(401);
  });
});
