"use strict";
module.exports = {
  up: async () => {
    const db = require("../src/models");
    const settings = await db.Settings.findByPk(1);
    if (!settings) return;
    const leaveTypes = settings.leaveTypes || [];
    if (leaveTypes.some((t) => t.name === "Absence injustifiée")) return;
    leaveTypes.push({ name: "Absence injustifiée", paid: false, accrual: 0, deductFromPay: true });
    settings.leaveTypes = leaveTypes;
    settings.changed("leaveTypes", true);
    await settings.save();
  },
  down: async () => {
    const db = require("../src/models");
    const settings = await db.Settings.findByPk(1);
    if (!settings) return;
    settings.leaveTypes = (settings.leaveTypes || []).filter((t) => t.name !== "Absence injustifiée");
    settings.changed("leaveTypes", true);
    await settings.save();
  },
};
