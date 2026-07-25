const engine = require("../../src/services/planning/planningEngine");

function makeRotation(id, offset, binome) {
  return { id, type: "rotation", offset, binome, name: id };
}
function makeControl(id, daySpec) {
  return { id, type: "fixed_day", daySpec: daySpec || engine.defaultSpec(), altParity: 0, name: id };
}

describe("planningEngine — date helpers", () => {
  it("dowISO: 0=Lundi..6=Dimanche", () => {
    expect(engine.dowISO("2026-01-05")).toBe(0); // Lundi
    expect(engine.dowISO("2026-01-11")).toBe(6); // Dimanche
  });

  it("mondayISOof finds the Monday of the week containing the date", () => {
    expect(engine.mondayISOof("2026-01-08")).toBe("2026-01-05");
    expect(engine.mondayISOof("2026-01-05")).toBe("2026-01-05");
  });

  it("dayNum is 0 at REF and negative before it", () => {
    expect(engine.dayNum(engine.REF)).toBe(0);
    expect(engine.dayNum("2026-01-02")).toBe(1);
    expect(engine.dayNum("2025-12-31")).toBe(-1);
    expect(engine.dayNum("2025-12-29")).toBe(-3);
  });
});

describe("planningEngine — autoStatus (rotation cycle)", () => {
  it("cycles J -> N -> R -> J for offset 0, anchored at REF", () => {
    const e = makeRotation("e1", 0, 1);
    expect(engine.autoStatus(e, "2026-01-01", "2025-12-29")).toBe("J");
    expect(engine.autoStatus(e, "2026-01-02", "2025-12-29")).toBe("N");
    expect(engine.autoStatus(e, "2026-01-03", "2025-12-29")).toBe("R");
    expect(engine.autoStatus(e, "2026-01-04", "2025-12-29")).toBe("J");
  });

  it("offset shifts the phase (3 offsets never collide on the same phase)", () => {
    const iso = "2026-01-01";
    const mon = engine.mondayISOof(iso);
    const statuses = [0, 1, 2].map((offset) => engine.autoStatus(makeRotation("e", offset, 1), iso, mon));
    expect(new Set(statuses).size).toBe(3); // J, N, R each exactly once
  });

  it("dayNum sign flip around REF does not break the 3-day cycle (no jump)", () => {
    const e = makeRotation("e1", 0, 1);
    const before = engine.autoStatus(e, "2025-12-31", engine.mondayISOof("2025-12-31"));
    const at = engine.autoStatus(e, "2026-01-01", engine.mondayISOof("2026-01-01"));
    // 2025-12-31 -> dayNum -1 -> ((-1)%3+3)%3=2 -> 'R'; 2026-01-01 -> dayNum 0 -> 'J'.
    expect(before).toBe("R");
    expect(at).toBe("J");
  });
});

describe("planningEngine — autoStatusesForRotation (binôme/contrôle coverage cap)", () => {
  const rotating = [
    makeRotation("a1", 0, 1),
    makeRotation("a2", 0, 1),
    makeRotation("b1", 1, 2),
    makeRotation("b2", 1, 2),
    makeRotation("c1", 2, 3),
    makeRotation("c2", 2, 3),
  ];
  const control = makeControl("ctrl");

  it("never exceeds 2 simultaneous J when the control agent works, across a full week", () => {
    const monIso = engine.mondayISOof("2026-01-05");
    for (let d = 0; d < 6; d++) {
      // control's day_spec defaults to Mon-Sat 'on' -> works days 0..5
      const iso = engine.weekDates(monIso)[d];
      const statuses = engine.autoStatusesForRotation(rotating, control, iso, monIso, []);
      const jCount = Object.values(statuses).filter((s) => s === "J").length;
      const nCount = Object.values(statuses).filter((s) => s === "N").length;
      expect(jCount).toBeLessThanOrEqual(2);
      expect(nCount).toBeLessThanOrEqual(2);
    }
  });

  it("does not downgrade a binôme member if their partner is away (no real conflict)", () => {
    const monIso = engine.mondayISOof("2026-01-05");
    const iso = engine.weekDates(monIso)[0];
    const withoutAway = engine.autoStatusesForRotation(rotating, control, iso, monIso, []);
    const jPair = rotating.filter((e) => withoutAway[e.id] === "J");
    expect(jPair.length).toBeGreaterThan(0);
    const [presentMember] = jPair;
    const partnerId = rotating.find((e) => e.binome === presentMember.binome && e.id !== presentMember.id).id;

    const withAway = engine.autoStatusesForRotation(rotating, control, iso, monIso, [partnerId]);
    // the present member keeps their natural J since the conflict isn't real (partner absent).
    expect(withAway[presentMember.id]).toBe("J");
  });

  it("falls back to independent per-employee cycles when there are not exactly 3 binômes", () => {
    const onlyTwoBinomes = rotating.slice(0, 4);
    const monIso = engine.mondayISOof("2026-01-05");
    const iso = engine.weekDates(monIso)[0];
    const statuses = engine.autoStatusesForRotation(onlyTwoBinomes, control, iso, monIso, []);
    for (const e of onlyTwoBinomes) {
      expect(statuses[e.id]).toBe(engine.autoStatus(e, iso, monIso));
    }
  });
});

describe("planningEngine — rank assignment", () => {
  it("assigns offsets/binomes 0,0,1,1,2,2 / 1,1,2,2,3,3 by creation rank", () => {
    const ranks = [0, 1, 2, 3, 4, 5].map((r) => [engine.offsetForRank(r), engine.binomeForRank(r)]);
    expect(ranks).toEqual([
      [0, 1],
      [0, 1],
      [1, 2],
      [1, 2],
      [2, 3],
      [2, 3],
    ]);
  });
});

describe("planningEngine — coverage & emailBody", () => {
  it("coverage counts J/N per day across employees", () => {
    const grid = { e1: ["J", "N", "R"], e2: ["J", "R", "N"] };
    const cov = engine.coverage(grid, ["e1", "e2"]);
    expect(cov.J).toEqual([2, 0, 0, 0, 0, 0, 0]);
    expect(cov.N).toEqual([0, 1, 1, 0, 0, 0, 0]);
  });

  it("emailBody renders the French template with day labels and vacation count", () => {
    const dates = engine.weekDates("2026-01-05");
    const values = ["J", "N", "R", "R", "R", "R", "R"];
    const body = engine.emailBody({ name: "Tovo Andrianina" }, { name: "Talatamaty" }, dates, values);
    expect(body).toContain("Bonjour Tovo,");
    expect(body).toContain("Control Room Talatamaty");
    expect(body).toContain("(2 vacations)");
    expect(body).toContain("Lundi");
    expect(body).toContain("Jour   07h30 – 17h30");
  });
});
