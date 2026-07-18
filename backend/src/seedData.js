/**
 * Ported 1:1 from app/src/App.jsx `baseChecklist()` / `seedCountries()`
 * (lines ~24-42). Shared by the demo-data seeder and by tests so both stay
 * in sync with a single source of truth for the real starting tax/contribution
 * data (rather than duplicating the fixture in two places).
 */
function baseChecklist() {
  return [
    { key: "contract", label: "Contrat de travail signé" },
    { key: "rules", label: "Règlement intérieur signé" },
    { key: "jobdesc", label: "Fiche de poste signée" },
    { key: "nda", label: "Accord de confidentialité signé" },
    { key: "cin", label: "Copie CIN / pièce d'identité" },
    { key: "photo", label: "Photo d'identité" },
    { key: "bank", label: "Coordonnées de paiement" },
    { key: "medical", label: "Visite médicale d'embauche" },
  ];
}

function seedCountries() {
  const mk = (o) => ({
    minTax: 0,
    validated: false,
    leaveAccrual: 2.5,
    checklist: baseChecklist(),
    holidays: [],
    ...o,
  });
  return [
    mk({
      code: "MG",
      name: "Madagascar",
      currency: "MGA",
      flag: "🇲🇬",
      employee: [
        { label: "CNaPS", rate: 1 },
        { label: "OSTIE", rate: 1 },
      ],
      employer: [
        { label: "CNaPS", rate: 13 },
        { label: "OSTIE", rate: 5 },
      ],
      tax: [
        { upTo: 350000, rate: 0 },
        { upTo: 400000, rate: 5 },
        { upTo: 500000, rate: 10 },
        { upTo: 600000, rate: 15 },
        { upTo: null, rate: 20 },
      ],
      minTax: 3000,
      holidays: [
        { date: "2026-01-01", name: "Jour de l'an" },
        { date: "2026-03-29", name: "Journée des Martyrs" },
        { date: "2026-06-26", name: "Fête de l'Indépendance" },
      ],
    }),
    mk({
      code: "CM",
      name: "Cameroun",
      currency: "XAF",
      flag: "🇨🇲",
      employee: [{ label: "CNPS (pension)", rate: 4.2 }],
      employer: [{ label: "CNPS (pension+PF+AT)", rate: 11.2 }],
      tax: [
        { upTo: 166667, rate: 10 },
        { upTo: 250000, rate: 15 },
        { upTo: 416667, rate: 25 },
        { upTo: null, rate: 35 },
      ],
      holidays: [
        { date: "2026-01-01", name: "Jour de l'an" },
        { date: "2026-05-20", name: "Fête nationale" },
      ],
    }),
    mk({
      code: "CI",
      name: "Côte d'Ivoire",
      currency: "XOF",
      flag: "🇨🇮",
      employee: [{ label: "CNPS (retraite)", rate: 6.3 }],
      employer: [{ label: "CNPS (retraite+PF+AT)", rate: 15.75 }],
      tax: [
        { upTo: 75000, rate: 0 },
        { upTo: 240000, rate: 16 },
        { upTo: 800000, rate: 21 },
        { upTo: null, rate: 32 },
      ],
    }),
    mk({
      code: "TD",
      name: "Tchad",
      currency: "XAF",
      flag: "🇹🇩",
      employee: [{ label: "CNPS", rate: 3.5 }],
      employer: [{ label: "CNPS + risques pro", rate: 16.5 }],
      tax: [
        { upTo: 250000, rate: 0 },
        { upTo: 500000, rate: 10 },
        { upTo: 1000000, rate: 20 },
        { upTo: null, rate: 30 },
      ],
    }),
    mk({
      code: "GA",
      name: "Gabon",
      currency: "XAF",
      flag: "🇬🇦",
      employee: [
        { label: "CNSS", rate: 2.5 },
        { label: "CNAMGS", rate: 1 },
      ],
      employer: [{ label: "CNSS+CNAMGS+PF", rate: 20.1 }],
      tax: [
        { upTo: 150000, rate: 0 },
        { upTo: 1500000, rate: 5 },
        { upTo: 1920000, rate: 10 },
        { upTo: null, rate: 20 },
      ],
    }),
    mk({
      code: "ML",
      name: "Mali",
      currency: "XOF",
      flag: "🇲🇱",
      employee: [{ label: "INPS", rate: 3.6 }],
      employer: [{ label: "INPS+AMO+PF", rate: 17.4 }],
      tax: [
        { upTo: 175000, rate: 0 },
        { upTo: 600000, rate: 15 },
        { upTo: 1200000, rate: 25 },
        { upTo: null, rate: 33 },
      ],
    }),
  ];
}

module.exports = { baseChecklist, seedCountries };
