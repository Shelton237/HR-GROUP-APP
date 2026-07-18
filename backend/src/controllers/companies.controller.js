const crypto = require("crypto");
const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { scopedCompanyIds, hasCompanyScope } = require("../middlewares/auth");

const list = asyncHandler(async (req, res) => {
  const allowed = scopedCompanyIds(req.user);
  const where = allowed ? { id: allowed } : {};
  const companies = await db.Company.findAll({ where, include: [{ model: db.CompanyDocument, as: "documents" }] });
  res.json(companies);
});

const getOne = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id, {
    include: [{ model: db.CompanyDocument, as: "documents" }],
  });
  if (!company) throw new ApiError(404, "Société introuvable.");
  if (!hasCompanyScope(req.user, company.id)) throw new ApiError(403, "Hors périmètre d'accès.");
  res.json(company);
});

const create = asyncHandler(async (req, res) => {
  const { name, countryCode, nif, rcs, employerNumber, address } = req.body || {};
  if (!name || !countryCode) throw new ApiError(400, "Nom et pays requis.");
  const country = await db.Country.findByPk(countryCode);
  if (!country) throw new ApiError(400, "Pays inconnu.");
  const company = await db.Company.create({
    id: "cmp-" + crypto.randomUUID().slice(0, 12),
    name,
    countryCode,
    nif: nif || "",
    rcs: rcs || "",
    employerNumber: employerNumber || "",
    address: address || "",
  });
  res.status(201).json(company);
});

const update = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id);
  if (!company) throw new ApiError(404, "Société introuvable.");
  if (!hasCompanyScope(req.user, company.id)) throw new ApiError(403, "Hors périmètre d'accès.");
  const { name, countryCode, nif, rcs, employerNumber, address } = req.body || {};
  if (countryCode) {
    const country = await db.Country.findByPk(countryCode);
    if (!country) throw new ApiError(400, "Pays inconnu.");
  }
  Object.assign(company, {
    ...(name !== undefined && { name }),
    ...(countryCode !== undefined && { countryCode }),
    ...(nif !== undefined && { nif }),
    ...(rcs !== undefined && { rcs }),
    ...(employerNumber !== undefined && { employerNumber }),
    ...(address !== undefined && { address }),
  });
  await company.save();
  res.json(company);
});

const remove = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id);
  if (!company) throw new ApiError(404, "Société introuvable.");
  const employeeCount = await db.Employee.count({ where: { companyId: company.id } });
  if (employeeCount > 0) throw new ApiError(409, "Impossible de supprimer une société avec des salariés.");
  await company.destroy();
  res.status(204).send();
});

// --- Documents (nested) ---

const listDocuments = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id);
  if (!company) throw new ApiError(404, "Société introuvable.");
  if (!hasCompanyScope(req.user, company.id)) throw new ApiError(403, "Hors périmètre d'accès.");
  const docs = await db.CompanyDocument.findAll({ where: { companyId: company.id } });
  res.json(docs);
});

const addDocument = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id);
  if (!company) throw new ApiError(404, "Société introuvable.");
  if (!hasCompanyScope(req.user, company.id)) throw new ApiError(403, "Hors périmètre d'accès.");
  const { name, category, expiryDate, dataUrl } = req.body || {};
  if (!name) throw new ApiError(400, "Nom du document requis.");
  const doc = await db.CompanyDocument.create({
    id: "doc-" + crypto.randomUUID().slice(0, 12),
    companyId: company.id,
    name,
    category: category || "Autre",
    expiryDate: expiryDate || null,
    dataUrl: dataUrl || null,
    uploadedAt: new Date(),
  });
  res.status(201).json(doc);
});

const removeDocument = asyncHandler(async (req, res) => {
  const company = await db.Company.findByPk(req.params.id);
  if (!company) throw new ApiError(404, "Société introuvable.");
  if (!hasCompanyScope(req.user, company.id)) throw new ApiError(403, "Hors périmètre d'accès.");
  const doc = await db.CompanyDocument.findOne({ where: { id: req.params.docId, companyId: company.id } });
  if (!doc) throw new ApiError(404, "Document introuvable.");
  await doc.destroy();
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove, listDocuments, addDocument, removeDocument };
