const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");

const UPDATABLE_FIELDS = [
  "refCurrency",
  "rates",
  "legalMonthlyHours",
  "contractTypes",
  "leaveTypes",
  "warningTypes",
  "evalDecisions",
  "documentCategories",
  "departments",
  "sites",
  "postes",
  "categories",
  "payElements",
  "customFields",
  "evalTemplates",
  "onboardingTemplates",
  "maxEmergencyContacts",
];

const get = asyncHandler(async (req, res) => {
  const settings = await db.Settings.findByPk(1);
  if (!settings) throw new ApiError(404, "Paramètres introuvables.");
  res.json(settings);
});

const update = asyncHandler(async (req, res) => {
  const settings = await db.Settings.findByPk(1);
  if (!settings) throw new ApiError(404, "Paramètres introuvables.");
  const body = req.body || {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      settings[field] = body[field];
      settings.changed(field, true);
    }
  }
  await settings.save();
  res.json(settings);
});

module.exports = { get, update };
