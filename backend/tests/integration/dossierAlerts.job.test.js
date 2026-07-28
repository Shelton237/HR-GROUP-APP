const { resetDatabase, db } = require("./helpers");

jest.mock("../../src/services/mail.service");
const mail = require("../../src/services/mail.service");
const { runDossierAlerts } = require("../../src/jobs/dossierAlerts.job");

describe("dossierAlerts job — runDossierAlerts", () => {
  const monday = new Date("2026-08-03T08:00:00Z");
  const wednesday = new Date("2026-08-05T08:00:00Z");

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

  it("sends a digest e-mail with the enabled alert types to the configured recipients, on the configured day", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Hebdomadaire (lundi matin)";
    notifications.adminEmails = ["direction@groupe.mg"];
    notifications.rules = { incompleteDossier: true, probationEnd: false, evalDue: false, docExpiry: false, contractEnd: false };
    notifications.changed("rules", true);
    await notifications.save();

    await runDossierAlerts(monday);

    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const [to, subject, body] = mail.sendMail.mock.calls[0];
    expect(to).toEqual(["direction@groupe.mg"]);
    expect(subject).toMatch(/dossiers/i);
    expect(body).toMatch(/Dossier incomplet/);
  });

  it("does not send on a non-configured day (weekly digest, not Monday)", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Hebdomadaire (lundi matin)";
    await notifications.save();

    await runDossierAlerts(wednesday);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("does not send when no recipients are configured", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Quotidienne";
    notifications.adminEmails = [];
    await notifications.save();

    await runDossierAlerts(wednesday);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("does not send when every rule for the pending alerts is disabled", async () => {
    const notifications = await db.Notifications.findByPk(1);
    notifications.frequency = "Quotidienne";
    notifications.adminEmails = ["direction@groupe.mg"];
    notifications.rules = { incompleteDossier: false, probationEnd: false, evalDue: false, docExpiry: false, contractEnd: false };
    notifications.changed("rules", true);
    await notifications.save();

    await runDossierAlerts(wednesday);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});
