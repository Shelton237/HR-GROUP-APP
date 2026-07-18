const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");

async function loadCountryOr404(code) {
  const country = await db.Country.findByPk(code);
  if (!country) throw new ApiError(404, "Pays introuvable.");
  return country;
}

const list = asyncHandler(async (req, res) => {
  const countries = await db.Country.findAll({ order: [["name", "ASC"]] });
  res.json(countries);
});

const getOne = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  res.json(country);
});

const update = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  const { name, currency, flag, validated, leaveAccrual, minTax } = req.body || {};
  Object.assign(country, {
    ...(name !== undefined && { name }),
    ...(currency !== undefined && { currency }),
    ...(flag !== undefined && { flag }),
    ...(validated !== undefined && { validated: !!validated }),
    ...(leaveAccrual !== undefined && { leaveAccrual: Number(leaveAccrual) }),
    ...(minTax !== undefined && { minTax: Number(minTax) }),
  });
  await country.save();
  res.json(country);
});

const updateContributions = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  const { employee, employer } = req.body || {};
  if (!Array.isArray(employee) && !Array.isArray(employer)) {
    throw new ApiError(400, "Listes 'employee' et/ou 'employer' requises.");
  }
  country.contributionsJson = {
    employee: employee !== undefined ? employee : country.contributionsJson.employee,
    employer: employer !== undefined ? employer : country.contributionsJson.employer,
  };
  country.changed("contributionsJson", true);
  await country.save();
  res.json(country);
});

const updateTax = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  const { brackets, minTax } = req.body || {};
  if (brackets !== undefined) {
    if (!Array.isArray(brackets)) throw new ApiError(400, "'brackets' doit être un tableau.");
    country.taxBracketsJson = brackets;
    country.changed("taxBracketsJson", true);
  }
  if (minTax !== undefined) country.minTax = Number(minTax);
  await country.save();
  res.json(country);
});

const updateChecklist = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  const { checklist } = req.body || {};
  if (!Array.isArray(checklist)) throw new ApiError(400, "'checklist' doit être un tableau.");
  country.checklistJson = checklist;
  country.changed("checklistJson", true);
  await country.save();
  res.json(country);
});

const updateHolidays = asyncHandler(async (req, res) => {
  const country = await loadCountryOr404(req.params.code);
  const { holidays } = req.body || {};
  if (!Array.isArray(holidays)) throw new ApiError(400, "'holidays' doit être un tableau.");
  country.holidaysJson = [...holidays].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  country.changed("holidaysJson", true);
  await country.save();
  res.json(country);
});

module.exports = { list, getOne, update, updateContributions, updateTax, updateChecklist, updateHolidays };
