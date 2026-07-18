const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");

const get = asyncHandler(async (req, res) => {
  const notifications = await db.Notifications.findByPk(1);
  if (!notifications) throw new ApiError(404, "Notifications introuvables.");
  res.json(notifications);
});

const update = asyncHandler(async (req, res) => {
  const notifications = await db.Notifications.findByPk(1);
  if (!notifications) throw new ApiError(404, "Notifications introuvables.");
  const { adminEmails, driveFolderUrl, rules, frequency } = req.body || {};
  if (adminEmails !== undefined) notifications.adminEmails = adminEmails;
  if (driveFolderUrl !== undefined) notifications.driveFolderUrl = driveFolderUrl;
  if (rules !== undefined) {
    notifications.rules = { ...notifications.rules, ...rules };
    notifications.changed("rules", true);
  }
  if (frequency !== undefined) notifications.frequency = frequency;
  await notifications.save();
  res.json(notifications);
});

module.exports = { get, update };
