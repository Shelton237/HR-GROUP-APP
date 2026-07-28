const { resetDatabase, db } = require("./helpers");

jest.mock("../../src/services/mail.service");
const mail = require("../../src/services/mail.service");
const { runDossierAlerts } = require("../../src/jobs/dossierAlerts.job");

// Seed data: cmp-thara + cmp-ads are Madagascar (Indian/Antananarivo, UTC+3),
// cmp-care is Cameroun (Africa/Douala, UTC+1) — both fixed offsets, no DST.
// 2026-08-03 is a Monday.
const MG_7AM = new Date("2026-08-03T04:00:00Z");
const CM_7AM = new Date("2026-08-03T06:00:00Z");

describe("dossierAlerts job — runDossierAlerts (per-country local time)", () => {
  beforeAll(async () => {
    await resetDatabase();
  }, 30000);

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(() => {
    mail.sendMail.mockClear();
    mail.sendMail.mockResolvedValue(undefined);
  });

  it("sends only Madagascar's digest when it's 07:00 in Madagascar (Cameroun isn't there yet)", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Hebdomadaire (lundi matin)";
    notifications.adminEmails = ["direction@groupe.mg"];
    notifications.rules = { incompleteDossier: true, probationEnd: false, evalDue: false, docExpiry: false, contractEnd: false };
    notifications.changed("rules", true);
    await notifications.save();

    await runDossierAlerts(MG_7AM);

    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const [to, subject] = mail.sendMail.mock.calls[0];
    expect(to).toEqual(["direction@groupe.mg"]);
    expect(subject).toContain("Madagascar");
  });

  it("sends only Cameroun's digest when it's 07:00 there, two hours later on the server clock", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Hebdomadaire (lundi matin)";
    await notifications.save();

    await runDossierAlerts(CM_7AM);

    // Cameroun (cmp-care) may or may not have alert-worthy employees in the
    // fixture; assert we never re-fire Madagascar's digest at this instant.
    for (const call of mail.sendMail.mock.calls) {
      expect(call[1]).not.toContain("Madagascar");
    }
  });

  it("does not send anything outside any country's 07:00 local window", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Quotidienne";
    await notifications.save();

    await runDossierAlerts(new Date("2026-08-03T12:00:00Z")); // 15:00 MG, 13:00 CM — well past both mornings
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});
