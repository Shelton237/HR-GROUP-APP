const request = require("supertest");
const { resetDatabase, loginAs, app, db } = require("./helpers");

describe("Planning (Control Room, native)", () => {
  let passwords, adminToken, employees;

  beforeAll(async () => {
    passwords = await resetDatabase();
    adminToken = await loginAs("direction@groupe.mg", passwords.adminTempPassword);
    const res = await request(app).get("/api/employees").set("Authorization", `Bearer ${adminToken}`);
    employees = res.body;
    expect(employees.length).toBeGreaterThanOrEqual(7);
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  // Each employee can only hold one planning profile (unique constraint) — wipe
  // just the planning tables before each independent top-level test so every
  // test can freely reuse the same 7 seeded employees. Called explicitly
  // (not via beforeEach) so it doesn't also fire inside the nested "Agent
  // self-service" describe, whose tests intentionally share one fixture.
  async function resetPlanningTables() {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of ["planning_absences", "planning_room_week_loans", "planning_schedule_overrides", "planning_profiles", "planning_rooms"]) {
      await db.sequelize.query(`TRUNCATE TABLE \`${table}\``);
    }
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  async function createRoom(name) {
    const res = await request(app).post("/api/planning/rooms").set("Authorization", `Bearer ${adminToken}`).send({ name });
    expect(res.status).toBe(201);
    return res.body;
  }

  async function attachAgent(employeeId, roomId, type) {
    const res = await request(app)
      .post("/api/planning/agents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employee_id: employeeId, room_id: roomId, type });
    expect(res.status).toBe(201);
    return res.body;
  }

  it("attaching an existing RH employee auto-assigns offset/binome by creation rank", async () => {
    await resetPlanningTables();
    const room = await createRoom("Salle A");
    const [e1, e2, e3, e4] = employees;

    const a1 = await attachAgent(e1.id, room.id, "rotation");
    const a2 = await attachAgent(e2.id, room.id, "rotation");
    const a3 = await attachAgent(e3.id, room.id, "rotation");
    const a4 = await attachAgent(e4.id, room.id, "rotation");

    expect([a1.offset, a1.binome]).toEqual([0, 1]);
    expect([a2.offset, a2.binome]).toEqual([0, 1]);
    expect([a3.offset, a3.binome]).toEqual([1, 2]);
    expect([a4.offset, a4.binome]).toEqual([1, 2]);
  });

  it("a full room (3 binômes + 1 control) never exceeds 2 simultaneous J/N, all week", async () => {
    await resetPlanningTables();
    const room = await createRoom("Salle B");
    for (let i = 0; i < 6; i++) {
      await attachAgent(employees[i].id, room.id, "rotation");
    }
    await attachAgent(employees[6].id, room.id, "fixed_day");

    const res = await request(app)
      .get(`/api/planning/rooms/${room.id}/schedule?week=2026-02-02`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.coverage.J.every((n) => n <= 2)).toBe(true);
    expect(res.body.coverage.N.every((n) => n <= 2)).toBe(true);
    expect(res.body.roster).toHaveLength(7);
  });

  it("effectiveCell precedence: an explicit override wins over the auto cycle, and an absence wins over everything", async () => {
    await resetPlanningTables();
    const room = await createRoom("Salle C");
    const agent = await attachAgent(employees[0].id, room.id, "rotation");

    const patch = await request(app)
      .patch(`/api/planning/rooms/${room.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ week: "2026-02-02", employee_id: agent.id, day_index: 0, value: "N" });
    expect(patch.status).toBe(200);
    expect(patch.body.grid[agent.id][0]).toBe("N");

    await request(app)
      .post("/api/planning/absences")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employee_id: agent.id, start_date: "2026-02-02", end_date: "2026-02-02", reason: "Maladie" });

    const after = await request(app)
      .get(`/api/planning/rooms/${room.id}/schedule?week=2026-02-02`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(after.body.grid[agent.id][0]).toBe("ABS");
  });

  it("cross-room loan: an assigned loan day makes the agent disappear from the home room's grid that day", async () => {
    await resetPlanningTables();
    const home = await createRoom("Salle D-home");
    const other = await createRoom("Salle D-other");
    const agent = await attachAgent(employees[1].id, home.id, "rotation");

    await request(app)
      .post(`/api/planning/rooms/${other.id}/schedule/loans`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ week: "2026-02-02", employee_id: agent.id });

    await request(app)
      .patch(`/api/planning/rooms/${other.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ week: "2026-02-02", employee_id: agent.id, day_index: 0, value: "J" });

    const homeSchedule = await request(app)
      .get(`/api/planning/rooms/${home.id}/schedule?week=2026-02-02`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(homeSchedule.body.grid[agent.id][0]).toBe("");

    const otherSchedule = await request(app)
      .get(`/api/planning/rooms/${other.id}/schedule?week=2026-02-02`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(otherSchedule.body.grid[agent.id][0]).toBe("J");
    expect(otherSchedule.body.roster.find((r) => r.id === agent.id).cross).toBe(true);
  });

  it("manager-submitted permission decides immediately per the 48h rule (no en_attente step)", async () => {
    await resetPlanningTables();
    const room = await createRoom("Salle E");
    const agent = await attachAgent(employees[2].id, room.id, "rotation");
    const soon = new Date(Date.now() + 3600e3 * 5).toISOString().slice(0, 10);
    const far = new Date(Date.now() + 3600e3 * 24 * 20).toISOString().slice(0, 10);

    const refused = await request(app)
      .post("/api/planning/permissions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employee_id: agent.id, start_date: soon });
    expect(refused.body.status).toBe("refusee");

    const registered = await request(app)
      .post("/api/planning/permissions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ employee_id: agent.id, start_date: far });
    expect(registered.body.status).toBe("enregistree");
  });

  describe("Agent self-service", () => {
    let agentToken, homeAgentId, otherAgentId;

    beforeAll(async () => {
      const room = await createRoom("Salle F");
      const other = await createRoom("Salle F-other");
      const target = employees[3];
      const decoy = employees[4];

      await request(app)
        .put(`/api/employees/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "agent.selfservice@example.com" });

      const profile = await attachAgent(target.id, room.id, "rotation");
      homeAgentId = profile.id;
      const decoyProfile = await attachAgent(decoy.id, other.id, "rotation");
      otherAgentId = decoyProfile.id;

      const created = await request(app)
        .post(`/api/planning/agents/${profile.profile_id}/account`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();
      expect(created.body.created).toBe(true);

      agentToken = await loginAs("agent.selfservice@example.com", created.body.password);
    });

    it("returns only the authenticated agent's own schedule, never another's", async () => {
      const res = await request(app)
        .get("/api/planning/me/schedule?week=2026-02-02")
        .set("Authorization", `Bearer ${agentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.roster).toHaveLength(1);
      expect(res.body.roster[0].id).toBe(homeAgentId);
      expect(res.body.roster[0].id).not.toBe(otherAgentId);
      expect(Object.keys(res.body.grid)).toEqual([homeAgentId]);
    });

    it("is rejected from manager-only planning routes", async () => {
      const res = await request(app).get("/api/planning/rooms").set("Authorization", `Bearer ${agentToken}`);
      expect(res.status).toBe(403);
    });

    it("self-submitted permission under 48h is auto-refused; a valid one goes en_attente pending manager review", async () => {
      const soon = new Date(Date.now() + 3600e3 * 10).toISOString().slice(0, 10);
      const far = new Date(Date.now() + 3600e3 * 24 * 30).toISOString().slice(0, 10);

      const refused = await request(app)
        .post("/api/planning/me/permissions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ start_date: soon });
      expect(refused.body.status).toBe("refusee");

      const pending = await request(app)
        .post("/api/planning/me/permissions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ start_date: far, reason: "Rendez-vous médical" });
      expect(pending.body.status).toBe("en_attente");

      const approve = await request(app)
        .post(`/api/planning/absences/${pending.body.id}/approve`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(approve.body.status).toBe("enregistree");

      const mine = await request(app).get("/api/planning/me/absences").set("Authorization", `Bearer ${agentToken}`);
      expect(mine.body.some((a) => a.id === pending.body.id && a.status === "enregistree")).toBe(true);
    });
  });
});
