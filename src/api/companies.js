import { api } from "./client";

/**
 * GET /companies
 * resp: Array<{ id, name, countryCode, nif, rcs, employerNumber, address, documents }>
 */
export function listCompanies() {
  return api.get("/companies");
}

/**
 * GET /companies/:id
 * resp: { id, name, countryCode, nif, rcs, employerNumber, address, documents }
 */
export function getCompany(id) {
  return api.get(`/companies/${id}`);
}

/**
 * POST /companies
 * body: { name, countryCode, nif, rcs, employerNumber, address, documents? }
 * resp: created company (with id)
 */
export function createCompany(body) {
  return api.post("/companies", body);
}

/**
 * PUT /companies/:id
 * body: { name?, countryCode?, nif?, rcs?, employerNumber?, address? } — the
 * backend ignores any "documents" field here; documents are a dedicated
 * sub-resource, see below.
 * resp: updated company
 */
export function updateCompany(id, body) {
  return api.put(`/companies/${id}`, body);
}

/** GET /companies/:id/documents -> Array<Document> */
export function listCompanyDocuments(id) {
  return api.get(`/companies/${id}/documents`);
}

/**
 * POST /companies/:id/documents
 * body: { name, category, expiryDate, dataUrl }
 * resp: created document
 */
export function addCompanyDocument(id, body) {
  return api.post(`/companies/${id}/documents`, body);
}

/** DELETE /companies/:id/documents/:docId */
export function deleteCompanyDocument(id, docId) {
  return api.del(`/companies/${id}/documents/${docId}`);
}
