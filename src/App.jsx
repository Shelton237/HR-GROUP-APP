import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, Building2, Users, Wallet, CalendarDays, Percent, Settings, Bell, Plus, X, Check,
  AlertTriangle, FileText, Download, Upload, Search, Trash2, ShieldCheck, ChevronRight, Clock,
  ClipboardCheck, Landmark, Globe, Pencil, Info, Phone, ListChecks, UserCog, Timer, GraduationCap, Mail,
} from "lucide-react";

/* ============================ Tokens ============================ */
const INK = "#0F1B2D", INK_SOFT = "#17273D", BRAND = "#0E7C66", BRAND_DK = "#0A5C4C", AMBER = "#B45309", ROSE = "#BE123C";
const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:border-teal-500";
const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

/* ============================ Storage ============================ */
const mem = {};
const store = {
  async get(k) { try { if (window.storage) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } } catch (e) {} return k in mem ? mem[k] : null; },
  async set(k, v) { mem[k] = v; try { if (window.storage) await window.storage.set(k, JSON.stringify(v)); } catch (e) {} },
};

/* ============================ Seed ============================ */
function baseChecklist() {
  return [
    { key: "contract", label: "Contrat de travail signé" }, { key: "rules", label: "Règlement intérieur signé" },
    { key: "jobdesc", label: "Fiche de poste signée" }, { key: "nda", label: "Accord de confidentialité signé" },
    { key: "cin", label: "Copie CIN / pièce d'identité" }, { key: "photo", label: "Photo d'identité" },
    { key: "bank", label: "Coordonnées de paiement" }, { key: "medical", label: "Visite médicale d'embauche" },
  ];
}
function seedCountries() {
  const mk = (o) => ({ minTax: 0, validated: false, leaveAccrual: 2.5, checklist: baseChecklist(), holidays: [], ...o });
  return [
    mk({ code: "MG", name: "Madagascar", currency: "MGA", flag: "🇲🇬", employee: [{ label: "CNaPS", rate: 1 }, { label: "OSTIE", rate: 1 }], employer: [{ label: "CNaPS", rate: 13 }, { label: "OSTIE", rate: 5 }], tax: [{ upTo: 350000, rate: 0 }, { upTo: 400000, rate: 5 }, { upTo: 500000, rate: 10 }, { upTo: 600000, rate: 15 }, { upTo: null, rate: 20 }], minTax: 3000, holidays: [{ date: "2026-01-01", name: "Jour de l'an" }, { date: "2026-03-29", name: "Journée des Martyrs" }, { date: "2026-06-26", name: "Fête de l'Indépendance" }] }),
    mk({ code: "CM", name: "Cameroun", currency: "XAF", flag: "🇨🇲", employee: [{ label: "CNPS (pension)", rate: 4.2 }], employer: [{ label: "CNPS (pension+PF+AT)", rate: 11.2 }], tax: [{ upTo: 166667, rate: 10 }, { upTo: 250000, rate: 15 }, { upTo: 416667, rate: 25 }, { upTo: null, rate: 35 }], holidays: [{ date: "2026-01-01", name: "Jour de l'an" }, { date: "2026-05-20", name: "Fête nationale" }] }),
    mk({ code: "CI", name: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮", employee: [{ label: "CNPS (retraite)", rate: 6.3 }], employer: [{ label: "CNPS (retraite+PF+AT)", rate: 15.75 }], tax: [{ upTo: 75000, rate: 0 }, { upTo: 240000, rate: 16 }, { upTo: 800000, rate: 21 }, { upTo: null, rate: 32 }] }),
    mk({ code: "TD", name: "Tchad", currency: "XAF", flag: "🇹🇩", employee: [{ label: "CNPS", rate: 3.5 }], employer: [{ label: "CNPS + risques pro", rate: 16.5 }], tax: [{ upTo: 250000, rate: 0 }, { upTo: 500000, rate: 10 }, { upTo: 1000000, rate: 20 }, { upTo: null, rate: 30 }] }),
    mk({ code: "GA", name: "Gabon", currency: "XAF", flag: "🇬🇦", employee: [{ label: "CNSS", rate: 2.5 }, { label: "CNAMGS", rate: 1 }], employer: [{ label: "CNSS+CNAMGS+PF", rate: 20.1 }], tax: [{ upTo: 150000, rate: 0 }, { upTo: 1500000, rate: 5 }, { upTo: 1920000, rate: 10 }, { upTo: null, rate: 20 }] }),
    mk({ code: "ML", name: "Mali", currency: "XOF", flag: "🇲🇱", employee: [{ label: "INPS", rate: 3.6 }], employer: [{ label: "INPS+AMO+PF", rate: 17.4 }], tax: [{ upTo: 175000, rate: 0 }, { upTo: 600000, rate: 15 }, { upTo: 1200000, rate: 25 }, { upTo: null, rate: 33 }] }),
  ];
}
function seedData() {
  const c1 = "cmp-thara", c2 = "cmp-ads", c3 = "cmp-care";
  const today = new Date(), iso = (d) => d.toISOString().slice(0, 10);
  const ago = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const done = Object.fromEntries(baseChecklist().map((c) => [c.key, true]));
  const part = { ...done, jobdesc: false, medical: false, photo: false };
  const mkEmp = (companyId, last, first, poste, contract, hire, brut, cl, lastEval, warns) => ({
    id: uid("emp"), companyId, firstName: first, lastName: last, poste, contractType: contract, hireDate: hire, contractEndDate: "",
    salaryBrut: brut, probationMonths: 3, status: contract === "Période d'essai" ? "Période d'essai" : "Actif",
    matricule: "", gender: "", maritalStatus: "", dependents: 0, nationality: "", birthDate: "", cin: "", socialNumber: "",
    phone: "", email: "", address: "", bankAccount: "", mobileMoney: "", managerId: "", department: "", site: "", category: "",
    emergencyContacts: [], custom: {}, checklist: { ...cl },
    evaluations: lastEval ? [{ id: uid("ev"), templateId: "", date: lastEval, scores: {}, total: null, decision: "Confirmation", notes: "", evaluator: "" }] : [],
    warnings: warns || [], documents: [], onboarding: { templateId: "", steps: {}, decision: "" },
    leaveBalance: 30, overtime: {}, payVars: {},
  });
  return {
    settings: {
      refCurrency: "EUR", rates: { MGA: 5100, XAF: 655.957, XOF: 655.957 }, legalMonthlyHours: 173.33,
      contractTypes: ["Période d'essai", "CDI", "CDD", "Stage", "Prestation", "Apprentissage"],
      leaveTypes: [{ name: "Congé payé", paid: true, accrual: 2.5 }, { name: "Maladie", paid: true, accrual: 0 }, { name: "Sans solde", paid: false, accrual: 0 }, { name: "Maternité / paternité", paid: true, accrual: 0 }, { name: "Événement familial", paid: true, accrual: 0 }],
      warningTypes: ["Rappel à l'ordre", "Avertissement", "Blâme", "Mise à pied"],
      evalDecisions: ["Confirmation", "Renouvellement essai", "Plan d'amélioration", "Rupture"],
      documentCategories: [{ name: "Contrat", expires: false }, { name: "CIN / Pièce d'identité", expires: true }, { name: "Diplôme", expires: false }, { name: "Visite médicale", expires: true }, { name: "Permis de conduire", expires: true }, { name: "Attestation", expires: false }, { name: "Autre", expires: false }],
      departments: ["Direction", "Technique / Terrain", "Control Room", "ADS360", "Administration & RH", "Commercial"],
      sites: ["Siège Talatamaty", "Terrain / Province", "Douala"],
      postes: ["Technicien Support & Maintenance", "Opérateur Control Room", "Opérateur Monitoring ADS360", "Superviseur", "Consultant RH", "Assistant administratif"],
      categories: ["Cadre", "Agent de maîtrise", "Employé", "Ouvrier"],
      payElements: [
        { id: "pe1", label: "Prime de déplacement", kind: "gain", taxable: true, cotisable: true },
        { id: "pe2", label: "Prime d'astreinte", kind: "gain", taxable: true, cotisable: true },
        { id: "pe3", label: "Indemnité de transport", kind: "gain", taxable: false, cotisable: false },
        { id: "pe4", label: "Avance sur salaire", kind: "retenue", taxable: false, cotisable: false },
        { id: "pe5", label: "Retenue diverse", kind: "retenue", taxable: false, cotisable: false },
      ],
      customFields: [{ id: "cf1", label: "Taille uniforme", type: "select", options: ["S", "M", "L", "XL"] }, { id: "cf2", label: "N° permis de conduire", type: "text", options: [] }],
      evalTemplates: [{ id: "et1", name: "Technicien / Opérateur terrain", criteria: [{ label: "Qualité technique", weight: 30 }, { label: "Respect des délais", weight: 20 }, { label: "Qualité du reporting", weight: 20 }, { label: "Respect des consignes de sécurité", weight: 15 }, { label: "Satisfaction client", weight: 15 }] }, { id: "et2", name: "Control Room", criteria: [{ label: "Réactivité sur alertes/incidents", weight: 30 }, { label: "Respect des procédures et SLA", weight: 25 }, { label: "Qualité et régularité des rapports", weight: 20 }, { label: "Assiduité et ponctualité", weight: 15 }, { label: "Communication client", weight: 10 }] }],
      onboardingTemplates: [{ id: "ot1", name: "Intégration Control Room (3 semaines)", steps: [{ phase: "Semaine 1", label: "Découverte environnement & règles" }, { phase: "Semaine 1", label: "Prise en main des systèmes (supervision)" }, { phase: "Semaine 2", label: "Procédures de relève et passation" }, { phase: "Semaine 2", label: "Gestion des requêtes clients" }, { phase: "Semaine 3", label: "Mise en autonomie supervisée" }, { phase: "Décision", label: "Décision J+30 (confirmation / plan / alerte)" }] }],
      maxEmergencyContacts: 2,
    },
    users: [
      { id: "u1", name: "Direction Groupe", email: "direction@groupe.mg", role: "Admin", scope: "all", active: true },
      { id: "u2", name: "RH Madagascar", email: "rh.mg@groupe.mg", role: "RH", scope: [c1, c2], active: true },
      { id: "u3", name: "Responsable ADS360", email: "ads360@groupe.mg", role: "Manager", scope: [c2], active: true },
    ],
    notifications: { adminEmails: ["direction@groupe.mg", "rh.mg@groupe.mg"], driveFolderUrl: "https://drive.google.com/drive/folders/1CvA4-FYDj6uiOTejbU7johRtHNzDwLFx", rules: { incompleteDossier: true, probationEnd: true, evalDue: true, docExpiry: true, contractEnd: true }, frequency: "Hebdomadaire (lundi matin)" },
    countries: seedCountries(),
    companies: [
      { id: c1, name: "Thara Services Sarl", countryCode: "MG", nif: "2018100907", rcs: "2023B00920", employerNumber: "", address: "Ankadivory, Talatamaty — Antananarivo", documents: [] },
      { id: c2, name: "ADS360", countryCode: "MG", nif: "", rcs: "", employerNumber: "", address: "Antananarivo", documents: [] },
      { id: c3, name: "CareBusiness Consulting", countryCode: "CM", nif: "", rcs: "", employerNumber: "", address: "Douala", documents: [] },
    ],
    employees: [
      mkEmp(c1, "Rakoto", "Jean", "Technicien Support & Maintenance", "CDI", ago(400), 200000, done, ago(35), []),
      mkEmp(c1, "Randria", "Miora", "Opérateur Control Room", "Période d'essai", ago(70), 350000, part, null, []),
      mkEmp(c1, "Andrianina", "Tovo", "Superviseur", "CDI", ago(700), 600000, done, ago(200), []),
      mkEmp(c2, "Ravel", "Hanta", "Opérateur Monitoring ADS360", "CDI", ago(320), 400000, done, ago(20), [{ id: uid("w"), date: ago(30), type: "Avertissement", reason: "Retard répété de rapport", notes: "" }]),
      mkEmp(c2, "Solofo", "Naina", "Opérateur Monitoring ADS360", "Période d'essai", ago(80), 400000, part, null, []),
      mkEmp(c3, "Mballa", "Sandrine", "Consultant RH", "CDI", ago(150), 350000, done, ago(60), []),
      mkEmp(c3, "Nguema", "Éric", "Assistant administratif", "Période d'essai", ago(75), 180000, part, null, []),
    ],
    leaves: [], payments: {},
  };
}

/* ============================ Calculs ============================ */
const addMonths = (s, m) => { const d = new Date(s); d.setMonth(d.getMonth() + m); return d; };
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const contribTotal = (list, base) => list.reduce((s, c) => s + (c.ceiling ? Math.min(base, c.ceiling) : base) * (c.rate / 100), 0);
function progressiveTax(taxable, brackets, minTax) {
  let tax = 0, prev = 0;
  for (const b of brackets) { const cap = b.upTo == null ? Infinity : b.upTo; if (taxable > prev) tax += (Math.min(taxable, cap) - prev) * (b.rate / 100); prev = cap; if (taxable <= cap) break; }
  if (minTax && tax > 0 && tax < minTax) tax = minTax;
  return tax;
}
function overtimeTotal(e, month, legalHours) {
  const list = e.overtime?.[month] || [];
  return list.reduce((s, o) => {
    if (o.method === "forfait") return s + (Number(o.amount) || 0);
    const hourly = e.salaryBrut / (legalHours || 173.33);
    return s + (Number(o.hours) || 0) * hourly * (1 + (Number(o.rate) || 0) / 100);
  }, 0);
}
function computePay(e, country, month, settings) {
  const brut = e.salaryBrut || 0;
  const ot = overtimeTotal(e, month, settings?.legalMonthlyHours);
  const vars = (e.payVars?.[month] || []);
  let gainTax = ot, gainCot = ot, gainAll = ot, retenues = 0; // heures supp : imposables + cotisables par défaut
  vars.forEach((v) => { const a = Number(v.amount) || 0; if (v.kind === "retenue") retenues += a; else { gainAll += a; if (v.taxable) gainTax += a; if (v.cotisable) gainCot += a; } });
  const cotBase = brut + gainCot;
  const empContrib = country ? contribTotal(country.employee, cotBase) : 0;
  const taxable = brut + gainTax - empContrib;
  const tax = country ? progressiveTax(taxable, country.tax, country.minTax) : 0;
  const emrContrib = country ? contribTotal(country.employer, cotBase) : 0;
  const net = brut + gainAll - empContrib - tax - retenues;
  const cost = brut + gainAll + emrContrib;
  return { brut, ot, gainAll, retenues, empContrib, tax, net, emrContrib, cost };
}
function fmt(a, c) { try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(a || 0); } catch (e) { return Math.round(a || 0).toLocaleString("fr-FR") + " " + c; } }
const toRef = (a, c, s) => (a || 0) / (s.rates[c] || 1);
const monthNow = () => new Date().toISOString().slice(0, 7);

/* ============================ UI primitives ============================ */
const Card = ({ children, className = "", style }) => <div className={"bg-white rounded-xl border border-slate-200 " + className} style={style}>{children}</div>;
const Field = ({ label, children }) => <label className="block"><span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>{children}</label>;
function Badge({ children, tone = "slate" }) {
  const t = { slate: "bg-slate-100 text-slate-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", teal: "bg-teal-50 text-teal-700" };
  return <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium " + t[tone]}>{children}</span>;
}
function Btn({ children, onClick, variant = "primary", className = "", type = "button", disabled }) {
  const s = { primary: { c: "text-white", st: { background: BRAND } }, dark: { c: "text-white", st: { background: INK } }, ghost: { c: "text-slate-700 bg-slate-100 hover:bg-slate-200", st: {} }, danger: { c: "text-white", st: { background: ROSE } }, outline: { c: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50", st: {} } }[variant];
  return <button type={type} disabled={disabled} onClick={onClick} className={"inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 hover:brightness-110 " + s.c + " " + className} style={s.st}>{children}</button>;
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto" style={{ background: "rgba(15,27,45,.55)" }} onClick={onClose}>
    <div className={"bg-white rounded-2xl shadow-2xl w-full " + (wide ? "max-w-4xl" : "max-w-xl")} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-900">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
      <div className="p-6">{children}</div>
    </div>
  </div>;
}
/* Éditeur générique de listes de chaînes */
function StringListEditor({ items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  return <div>
    <div className="flex flex-wrap gap-2 mb-2">{items.map((it, i) => <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-sm text-slate-700">{it}<button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-500"><X size={13} /></button></span>)}{items.length === 0 && <span className="text-xs text-slate-400">Aucun élément.</span>}</div>
    <div className="flex gap-2"><input className={inputCls} placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }} /><Btn variant="outline" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}><Plus size={15} /></Btn></div>
  </div>;
}

/* ============================ App ============================ */
export default function App() {
  const [data, setData] = useState(null);
  useEffect(() => { (async () => { const s = await store.get("hrgroup:data:v2"); setData(s || seedData()); })(); }, []);
  const update = (m) => setData((p) => { const n = typeof m === "function" ? m(structuredClone(p)) : m; store.set("hrgroup:data:v2", n); return n; });
  const [view, setView] = useState("dashboard");
  const [companyFilter, setCompanyFilter] = useState(null);
  if (!data) return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Chargement…</div>;

  const countryOf = (code) => data.countries.find((c) => c.code === code);
  const companyById = (id) => data.companies.find((c) => c.id === id);
  const activeEmployees = data.employees.filter((e) => e.status !== "Sorti");
  const alerts = computeAlerts(data, companyById);
  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard }, { id: "companies", label: "Sociétés", icon: Building2 },
    { id: "employees", label: "Salariés", icon: Users }, { id: "payroll", label: "Paie & masse salariale", icon: Wallet },
    { id: "leaves", label: "Congés", icon: CalendarDays }, { id: "fiscalite", label: "Pays & fiscalité", icon: Percent },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex text-slate-800" style={{ background: "#F4F6F8", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" }}>
      <aside className="w-64 shrink-0 flex flex-col text-slate-300" style={{ background: INK }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-lg grid place-items-center font-bold text-white" style={{ background: BRAND }}>G</div><div><div className="text-white font-semibold leading-tight">Gestion RH Groupe</div><div className="text-[11px] text-slate-400">Multi-pays · multi-société</div></div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => { const a = view === n.id, I = n.icon; return <button key={n.id} onClick={() => { setView(n.id); setCompanyFilter(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition" style={a ? { background: INK_SOFT, color: "#fff", boxShadow: `inset 3px 0 0 ${BRAND}` } : {}}><I size={18} className={a ? "text-teal-400" : "text-slate-400"} /><span>{n.label}</span>{n.id === "dashboard" && alerts.length > 0 && <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: AMBER }}>{alerts.length}</span>}</button>; })}
        </nav>
        <div className="p-4 text-[11px] text-slate-500 border-t" style={{ borderColor: "rgba(255,255,255,.08)" }}>Enregistrement automatique.</div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <h1 className="text-lg font-semibold text-slate-900">{nav.find((n) => n.id === view)?.label}</h1>
          <div className="ml-auto"><ConsolidatedPill data={data} activeEmployees={activeEmployees} countryOf={countryOf} companyById={companyById} /></div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && <Dashboard data={data} alerts={alerts} countryOf={countryOf} companyById={companyById} activeEmployees={activeEmployees} onGoto={(id, cf) => { setView(id); if (cf !== undefined) setCompanyFilter(cf); }} />}
          {view === "companies" && <Companies data={data} update={update} countryOf={countryOf} onOpen={(id) => { setCompanyFilter(id); setView("employees"); }} />}
          {view === "employees" && <Employees data={data} update={update} countryOf={countryOf} companyById={companyById} companyFilter={companyFilter} setCompanyFilter={setCompanyFilter} />}
          {view === "payroll" && <Payroll data={data} update={update} countryOf={countryOf} companyById={companyById} activeEmployees={activeEmployees} />}
          {view === "leaves" && <Leaves data={data} update={update} countryOf={countryOf} companyById={companyById} />}
          {view === "fiscalite" && <Fiscalite data={data} update={update} />}
          {view === "settings" && <SettingsView data={data} update={update} />}
        </div>
      </main>
    </div>
  );
}

/* ============================ Alertes ============================ */
function computeAlerts(data, companyById) {
  const now = new Date(), out = [];
  data.employees.filter((e) => e.status !== "Sorti").forEach((e) => {
    const comp = companyById(e.companyId), who = `${e.firstName} ${e.lastName}`;
    if (e.status === "Période d'essai" && e.hireDate) { const d = daysBetween(now, addMonths(e.hireDate, e.probationMonths || 3)); if (d <= 21) out.push({ type: "essai", tone: d < 0 ? "rose" : "amber", who, company: comp?.name, text: d < 0 ? `Période d'essai dépassée de ${-d} j — décision requise` : `Fin de période d'essai dans ${d} j` }); }
    let ed = e.evaluations.length ? addMonths(e.evaluations[e.evaluations.length - 1].date, 12) : (e.hireDate ? addMonths(e.hireDate, e.probationMonths || 3) : null);
    if (ed) { const d = daysBetween(now, ed); if (d <= 21) out.push({ type: "eval", tone: d < 0 ? "rose" : "teal", who, company: comp?.name, text: d < 0 ? `Évaluation en retard de ${-d} j` : `Évaluation à réaliser dans ${d} j` }); }
    const missing = (data.countries.find((c) => c.code === comp?.countryCode)?.checklist || []).filter((c) => !e.checklist[c.key]);
    if (missing.length) out.push({ type: "dossier", tone: "amber", who, company: comp?.name, text: `Dossier incomplet : ${missing.map((m) => m.label).join(", ")}` });
    if (e.contractEndDate) { const d = daysBetween(now, new Date(e.contractEndDate)); if (d >= 0 && d <= 30) out.push({ type: "contrat", tone: "amber", who, company: comp?.name, text: `Fin de CDD dans ${d} j` }); }
    (e.documents || []).forEach((doc) => { if (doc.expiryDate) { const d = daysBetween(now, new Date(doc.expiryDate)); if (d <= 30) out.push({ type: "doc", tone: d < 0 ? "rose" : "amber", who, company: comp?.name, text: d < 0 ? `${doc.name} expiré` : `${doc.name} expire dans ${d} j` }); } });
  });
  return out;
}

function ConsolidatedPill({ data, activeEmployees, countryOf, companyById }) {
  const t = useMemo(() => { let cost = 0; const m = monthNow(); activeEmployees.forEach((e) => { const c = companyById(e.companyId); if (!c) return; const ct = countryOf(c.countryCode); cost += toRef(computePay(e, ct, m, data.settings).cost, ct.currency, data.settings); }); return cost; }, [data, activeEmployees]);
  return <div className="hidden md:flex items-center gap-4 text-sm">
    <div className="text-right"><div className="text-[11px] text-slate-400 leading-none">Coût employeur / mois (consolidé)</div><div className="font-semibold text-slate-900 tabular-nums">≈ {fmt(t, data.settings.refCurrency)}</div></div>
    <div className="w-px h-8 bg-slate-200" /><div className="text-right"><div className="text-[11px] text-slate-400 leading-none">Effectif actif</div><div className="font-semibold text-slate-900 tabular-nums">{activeEmployees.length}</div></div>
  </div>;
}

/* ============================ Dashboard ============================ */
function Kpi({ label, value, icon: Icon, hint, accent, tone }) {
  return <Card className="p-5" style={accent ? { background: INK, borderColor: INK } : {}}>
    <div className="flex items-start justify-between"><div className="min-w-0"><div className={"text-xs font-medium " + (accent ? "text-slate-300" : "text-slate-500")}>{label}</div><div className={"text-2xl font-semibold mt-1 tabular-nums " + (accent ? "text-white" : "text-slate-900")}>{value}</div>{hint && <div className="text-[11px] mt-1 text-slate-400">{hint}</div>}</div>
      <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: accent ? "rgba(255,255,255,.1)" : tone === "amber" ? "#FEF3C7" : "#E6F2EF" }}><Icon size={18} style={{ color: accent ? "#fff" : tone === "amber" ? AMBER : BRAND }} /></div></div>
  </Card>;
}
const MiniStat = ({ label, value, strong }) => <div className={"rounded-lg px-3 py-2 " + (strong ? "" : "bg-slate-50")} style={strong ? { background: "#E6F2EF" } : {}}><div className="text-[11px] text-slate-500">{label}</div><div className="text-sm font-semibold tabular-nums" style={strong ? { color: BRAND_DK } : {}}>{value}</div></div>;
function Dashboard({ data, alerts, countryOf, companyById, activeEmployees, onGoto }) {
  const m = monthNow();
  const byCompany = useMemo(() => data.companies.map((comp) => { const ct = countryOf(comp.countryCode); const emps = activeEmployees.filter((e) => e.companyId === comp.id); let brut = 0, net = 0, cost = 0; emps.forEach((e) => { const p = computePay(e, ct, m, data.settings); brut += e.salaryBrut; net += p.net; cost += p.cost; }); return { comp, ct, count: emps.length, brut, net, cost }; }), [data, activeEmployees]);
  const byCountry = useMemo(() => { const map = {}; activeEmployees.forEach((e) => { const c = companyById(e.companyId); if (c) map[c.countryCode] = (map[c.countryCode] || 0) + 1; }); return Object.entries(map).map(([code, count]) => ({ name: countryOf(code)?.name || code, count })); }, [data, activeEmployees]);
  const costRef = byCompany.reduce((s, r) => s + toRef(r.cost, r.ct.currency, data.settings), 0);
  const brutRef = byCompany.reduce((s, r) => s + toRef(r.brut, r.ct.currency, data.settings), 0);
  const PIE = [BRAND, "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6"];
  return <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi label="Effectif actif" value={activeEmployees.length} icon={Users} hint={`${data.companies.length} sociétés · ${byCountry.length} pays`} />
      <Kpi label="Masse salariale brute / mois" value={"≈ " + fmt(brutRef, data.settings.refCurrency)} icon={Wallet} hint="consolidé, taux indicatif" />
      <Kpi label="Coût employeur / mois" value={"≈ " + fmt(costRef, data.settings.refCurrency)} icon={Landmark} hint="brut + charges patronales" accent />
      <Kpi label="Alertes à traiter" value={alerts.length} icon={Bell} hint="essais, évaluations, dossiers, documents" tone={alerts.length ? "amber" : "slate"} />
    </div>
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-5">
        <div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-slate-900">Coût par structure</h3><span className="text-xs text-slate-400">devise locale</span></div>
        <p className="text-xs text-slate-500 mb-4">Effectif, masse salariale brute, nette et coût employeur — par société.</p>
        <div className="space-y-3">{byCompany.map((r) => <button key={r.comp.id} onClick={() => onGoto("employees", r.comp.id)} className="w-full text-left rounded-xl border border-slate-200 p-4 hover:border-teal-400 transition">
          <div className="flex items-center gap-3 mb-3"><span className="text-lg">{r.ct?.flag}</span><div><div className="font-medium text-slate-900">{r.comp.name}</div><div className="text-xs text-slate-500">{r.ct?.name} · {r.count} salarié{r.count > 1 ? "s" : ""}</div></div><ChevronRight size={16} className="ml-auto text-slate-300" /></div>
          <div className="grid grid-cols-3 gap-3"><MiniStat label="Brut" value={fmt(r.brut, r.ct.currency)} /><MiniStat label="Net" value={fmt(r.net, r.ct.currency)} /><MiniStat label="Coût employeur" value={fmt(r.cost, r.ct.currency)} strong /></div>
        </button>)}</div>
      </Card>
      <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-3">Effectif par pays</h3>
        <div style={{ height: 170 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byCountry} dataKey="count" nameKey="name" innerRadius={42} outerRadius={65} paddingAngle={2}>{byCountry.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="space-y-1.5 mt-2">{byCountry.map((c, i) => <div key={c.name} className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} /><span className="text-slate-600">{c.name}</span><span className="ml-auto font-medium tabular-nums">{c.count}</span></div>)}</div>
      </Card>
    </div>
    <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-4">Masse salariale brute vs coût employeur (consolidé, {data.settings.refCurrency})</h3>
      <div style={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={byCompany.map((r) => ({ name: r.comp.name, Brut: Math.round(toRef(r.brut, r.ct.currency, data.settings)), "Coût employeur": Math.round(toRef(r.cost, r.ct.currency, data.settings)) }))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F4" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} /><YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} /><Tooltip formatter={(v) => fmt(v, data.settings.refCurrency)} /><Bar dataKey="Brut" fill="#94A3B8" radius={[4, 4, 0, 0]} /><Bar dataKey="Coût employeur" fill={BRAND} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </Card>
    <Card className="p-5"><div className="flex items-center gap-2 mb-4"><Bell size={18} style={{ color: AMBER }} /><h3 className="font-semibold text-slate-900">Alertes RH</h3><span className="text-xs text-slate-400">({alerts.length})</span></div>
      {alerts.length === 0 ? <div className="text-sm text-slate-400 py-6 text-center">Aucune alerte. Tout est à jour.</div> : <div className="space-y-2">{alerts.map((a, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
        <span className="shrink-0">{a.type === "essai" ? <Clock size={16} style={{ color: a.tone === "rose" ? ROSE : AMBER }} /> : a.type === "eval" ? <ClipboardCheck size={16} style={{ color: a.tone === "rose" ? ROSE : BRAND }} /> : a.type === "doc" ? <FileText size={16} style={{ color: a.tone === "rose" ? ROSE : AMBER }} /> : <FileText size={16} style={{ color: AMBER }} />}</span>
        <div className="min-w-0"><div className="text-sm font-medium text-slate-800">{a.who} <span className="text-slate-400 font-normal">· {a.company}</span></div><div className="text-xs text-slate-500">{a.text}</div></div>
        <Badge tone={a.tone}>{a.type === "essai" ? "Essai" : a.type === "eval" ? "Évaluation" : a.type === "doc" ? "Document" : a.type === "contrat" ? "Contrat" : "Dossier"}</Badge></div>)}</div>}
    </Card>
  </div>;
}

/* ============================ Sociétés ============================ */
function Companies({ data, update, countryOf, onOpen }) {
  const [modal, setModal] = useState(null), blank = { name: "", countryCode: "MG", nif: "", rcs: "", employerNumber: "", address: "", documents: [] };
  const [form, setForm] = useState(blank), [docsFor, setDocsFor] = useState(null);
  const save = () => { if (!form.name.trim()) return; if (modal === "new") update((d) => { d.companies.push({ ...form, id: uid("cmp") }); return d; }); else update((d) => { const i = d.companies.findIndex((c) => c.id === form.id); d.companies[i] = form; return d; }); setModal(null); };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><p className="text-sm text-slate-500">Chaque société est rattachée à un pays qui porte sa devise et ses règles.</p><Btn onClick={() => { setForm(blank); setModal("new"); }}><Plus size={16} />Nouvelle société</Btn></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.companies.map((c) => { const ct = countryOf(c.countryCode), n = data.employees.filter((e) => e.companyId === c.id && e.status !== "Sorti").length; return <Card key={c.id} className="p-5">
      <div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="text-2xl">{ct?.flag}</span><div><div className="font-semibold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{ct?.name} · {ct?.currency}</div></div></div><button onClick={() => { setForm(c); setModal("edit"); }} className="text-slate-400 hover:text-slate-700"><Pencil size={15} /></button></div>
      {c.nif && <div className="mt-3 text-sm text-slate-600">NIF : <span className="text-slate-800">{c.nif}</span></div>}{c.address && <div className="text-slate-500 text-xs mt-1">{c.address}</div>}
      <div className="mt-4 flex items-center justify-between"><Badge tone="teal"><Users size={12} />{n} salarié{n > 1 ? "s" : ""}</Badge><div className="flex items-center gap-2"><button onClick={() => setDocsFor(c.id)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"><FileText size={13} />Docs ({(c.documents || []).length})</button><button onClick={() => onOpen(c.id)} className="text-sm font-medium flex items-center gap-1" style={{ color: BRAND }}>Équipe <ChevronRight size={14} /></button></div></div>
    </Card>; })}</div>
    <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nouvelle société" : "Modifier la société"}>
      <div className="space-y-4">
        <Field label="Nom de la société"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4"><Field label="Pays"><select className={inputCls} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })}>{data.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}</select></Field><Field label="NIF"><input className={inputCls} value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} /></Field></div>
        <div className="grid grid-cols-2 gap-4"><Field label="RCS"><input className={inputCls} value={form.rcs} onChange={(e) => setForm({ ...form, rcs: e.target.value })} /></Field><Field label="N° employeur"><input className={inputCls} value={form.employerNumber} onChange={(e) => setForm({ ...form, employerNumber: e.target.value })} /></Field></div>
        <Field label="Adresse"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setModal(null)}>Annuler</Btn><Btn onClick={save}>Enregistrer</Btn></div>
      </div>
    </Modal>
    {docsFor && <Modal open onClose={() => setDocsFor(null)} title="Documents de la société"><DocList categories={data.settings.documentCategories} items={data.companies.find((c) => c.id === docsFor).documents || []} onChange={(docs) => update((d) => { const i = d.companies.findIndex((c) => c.id === docsFor); d.companies[i].documents = docs; return d; })} /></Modal>}
  </div>;
}

/* ============================ Documents (réutilisable) ============================ */
function DocList({ items, categories, onChange }) {
  const fileRef = useRef();
  const [cat, setCat] = useState(categories[0]?.name || "Autre"), [exp, setExp] = useState("");
  const catExpires = categories.find((c) => c.name === cat)?.expires;
  const onFile = (ev) => { const f = ev.target.files[0]; if (!f) return; if (f.size > 4 * 1024 * 1024) { alert("Max 4 Mo en démo. En production : hébergement serveur / Drive."); return; } const r = new FileReader(); r.onload = () => onChange([...items, { id: uid("doc"), name: f.name, category: cat, expiryDate: exp || "", dataUrl: r.result, uploadedAt: new Date().toISOString() }]); r.readAsDataURL(f); ev.target.value = ""; setExp(""); };
  const dl = (doc) => { const a = document.createElement("a"); a.href = doc.dataUrl; a.download = doc.name; a.click(); };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-slate-50">
      <Field label="Catégorie"><select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>{categories.map((c) => <option key={c.name}>{c.name}</option>)}</select></Field>
      {catExpires && <Field label="Date d'expiration"><input type="date" className={inputCls} value={exp} onChange={(e) => setExp(e.target.value)} /></Field>}
      <Btn variant="outline" onClick={() => fileRef.current.click()}><Upload size={16} />Ajouter un scan</Btn><input ref={fileRef} type="file" className="hidden" onChange={onFile} />
    </div>
    <div className="space-y-2">{items.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">Aucun document.</div>}
      {items.map((doc) => { const exp = doc.expiryDate ? daysBetween(new Date(), new Date(doc.expiryDate)) : null; return <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100"><FileText size={18} className="text-slate-400" />
        <div className="min-w-0"><div className="text-sm font-medium text-slate-800 truncate">{doc.name}</div><div className="text-xs text-slate-400 flex items-center gap-2"><Badge>{doc.category}</Badge>{doc.expiryDate && <span className={exp < 0 ? "text-rose-600" : exp <= 30 ? "text-amber-600" : ""}>Expire le {new Date(doc.expiryDate).toLocaleDateString("fr-FR")}</span>}</div></div>
        <div className="ml-auto flex gap-1"><button onClick={() => dl(doc)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Download size={16} /></button><button onClick={() => onChange(items.filter((x) => x.id !== doc.id))} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={16} /></button></div>
      </div>; })}</div>
  </div>;
}

/* ============================ Salariés ============================ */
function Employees({ data, update, countryOf, companyById, companyFilter, setCompanyFilter }) {
  const [search, setSearch] = useState(""), [detail, setDetail] = useState(null), [addOpen, setAddOpen] = useState(false);
  const list = data.employees.filter((e) => { if (companyFilter && e.companyId !== companyFilter) return false; const q = search.toLowerCase(); return !q || `${e.firstName} ${e.lastName} ${e.poste}`.toLowerCase().includes(q); });
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + " pl-9 w-64"} placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <select className={inputCls + " w-56"} value={companyFilter || ""} onChange={(e) => setCompanyFilter(e.target.value || null)}><option value="">Toutes les sociétés</option>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <div className="ml-auto"><Btn onClick={() => setAddOpen(true)}><Plus size={16} />Embaucher</Btn></div>
    </div>
    <Card className="overflow-hidden"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60"><th className="px-4 py-3 font-medium">Salarié</th><th className="px-4 py-3 font-medium">Société</th><th className="px-4 py-3 font-medium">Contrat</th><th className="px-4 py-3 font-medium text-right">Brut / mois</th><th className="px-4 py-3 font-medium">Dossier</th><th className="px-4 py-3 font-medium">Statut</th></tr></thead>
      <tbody>{list.map((e) => { const comp = companyById(e.companyId), ct = countryOf(comp?.countryCode); const missing = (ct?.checklist || []).filter((c) => !e.checklist[c.key]).length; return <tr key={e.id} onClick={() => setDetail(e.id)} className="border-b border-slate-100 hover:bg-teal-50/30 cursor-pointer">
        <td className="px-4 py-3"><div className="font-medium text-slate-900">{e.firstName} {e.lastName}</div><div className="text-xs text-slate-500">{e.poste}</div></td>
        <td className="px-4 py-3 text-slate-600">{ct?.flag} {comp?.name}</td><td className="px-4 py-3"><Badge>{e.contractType}</Badge></td>
        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(e.salaryBrut, ct?.currency || "")}</td>
        <td className="px-4 py-3">{missing === 0 ? <Badge tone="green"><Check size={12} />Complet</Badge> : <Badge tone="amber"><AlertTriangle size={12} />{missing} manquant{missing > 1 ? "s" : ""}</Badge>}</td>
        <td className="px-4 py-3">{e.status === "Période d'essai" ? <Badge tone="amber">Essai</Badge> : <Badge tone="green">Actif</Badge>}</td></tr>; })}
        {list.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Aucun salarié.</td></tr>}</tbody></table></Card>
    {detail && <EmployeeDetail employee={data.employees.find((e) => e.id === detail)} data={data} update={update} countryOf={countryOf} companyById={companyById} onClose={() => setDetail(null)} />}
    {addOpen && <AddEmployee data={data} update={update} onClose={() => setAddOpen(false)} defaultCompany={companyFilter} />}
  </div>;
}
function AddEmployee({ data, update, onClose, defaultCompany }) {
  const s = data.settings;
  const [f, setF] = useState({ firstName: "", lastName: "", poste: s.postes[0] || "", companyId: defaultCompany || data.companies[0]?.id, contractType: "Période d'essai", hireDate: new Date().toISOString().slice(0, 10), salaryBrut: 0, probationMonths: 3, department: "", site: "", category: "" });
  const save = () => { if (!f.firstName.trim() || !f.lastName.trim()) return; update((d) => { d.employees.push({ ...f, id: uid("emp"), salaryBrut: Number(f.salaryBrut) || 0, status: f.contractType === "Période d'essai" ? "Période d'essai" : "Actif", matricule: "", gender: "", maritalStatus: "", dependents: 0, nationality: "", birthDate: "", cin: "", socialNumber: "", phone: "", email: "", address: "", bankAccount: "", mobileMoney: "", managerId: "", contractEndDate: "", emergencyContacts: [], custom: {}, checklist: {}, evaluations: [], warnings: [], documents: [], onboarding: { templateId: "", steps: {}, decision: "" }, leaveBalance: 0, overtime: {}, payVars: {} }); return d; }); onClose(); };
  return <Modal open onClose={onClose} title="Nouvelle embauche" wide><div className="grid grid-cols-2 gap-4">
    <Field label="Prénom"><input className={inputCls} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></Field>
    <Field label="Nom"><input className={inputCls} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
    <Field label="Société"><select className={inputCls} value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value })}>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Poste"><select className={inputCls} value={f.poste} onChange={(e) => setF({ ...f, poste: e.target.value })}>{s.postes.map((p) => <option key={p}>{p}</option>)}</select></Field>
    <Field label="Type de contrat"><select className={inputCls} value={f.contractType} onChange={(e) => setF({ ...f, contractType: e.target.value })}>{s.contractTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Date d'embauche"><input type="date" className={inputCls} value={f.hireDate} onChange={(e) => setF({ ...f, hireDate: e.target.value })} /></Field>
    <Field label="Salaire brut mensuel"><input type="number" className={inputCls} value={f.salaryBrut} onChange={(e) => setF({ ...f, salaryBrut: e.target.value })} /></Field>
    <Field label="Période d'essai (mois)"><input type="number" className={inputCls} value={f.probationMonths} onChange={(e) => setF({ ...f, probationMonths: Number(e.target.value) })} /></Field>
    <Field label="Département"><select className={inputCls} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}><option value="">—</option>{s.departments.map((p) => <option key={p}>{p}</option>)}</select></Field>
    <Field label="Site"><select className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })}><option value="">—</option>{s.sites.map((p) => <option key={p}>{p}</option>)}</select></Field>
  </div><div className="flex justify-end gap-2 pt-5"><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn onClick={save}>Créer le dossier</Btn></div></Modal>;
}

function EmployeeDetail({ employee: e, data, update, countryOf, companyById, onClose }) {
  const [tab, setTab] = useState("infos");
  const s = data.settings, comp = companyById(e.companyId), ct = countryOf(comp?.countryCode), m = monthNow();
  const mut = (fn) => update((d) => { const i = d.employees.findIndex((x) => x.id === e.id); fn(d.employees[i]); return d; });
  const tabs = [{ id: "infos", label: "Informations" }, { id: "dossier", label: "Dossier & pièces" }, { id: "onboard", label: "Intégration" }, { id: "eval", label: "Évaluations" }, { id: "warn", label: "Avertissements" }, { id: "docs", label: "Archivage" }, { id: "pay", label: "Rémunération" }];
  return <Modal open onClose={onClose} wide title={`${e.firstName} ${e.lastName} — ${e.poste}`}>
    <div className="flex items-center gap-2 flex-wrap mb-4"><Badge tone="teal">{ct?.flag} {comp?.name}</Badge><Badge>{e.contractType}</Badge>{e.status === "Période d'essai" && e.hireDate && <Badge tone="amber"><Clock size={12} />Essai → {addMonths(e.hireDate, e.probationMonths || 3).toLocaleDateString("fr-FR")}</Badge>}<div className="ml-auto text-sm text-slate-500">Embauché le {e.hireDate ? new Date(e.hireDate).toLocaleDateString("fr-FR") : "—"}</div></div>
    <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">{tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition" style={tab === t.id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}>{t.label}</button>)}</div>

    {tab === "infos" && <InfosTab e={e} s={s} data={data} mut={mut} />}
    {tab === "dossier" && <div className="space-y-2"><p className="text-xs text-slate-500 mb-3">Checklist du pays <strong>{ct?.name}</strong>. Elle se configure dans « Pays & fiscalité ».</p>{(ct?.checklist || []).map((c) => <label key={c.key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={!!e.checklist[c.key]} onChange={(ev) => mut((emp) => { emp.checklist[c.key] = ev.target.checked; })} /><span className={"text-sm " + (e.checklist[c.key] ? "text-slate-800" : "text-slate-500")}>{c.label}</span>{e.checklist[c.key] && <Check size={15} className="ml-auto text-emerald-600" />}</label>)}</div>}
    {tab === "onboard" && <OnboardTab e={e} s={s} mut={mut} />}
    {tab === "eval" && <EvalTab e={e} s={s} mut={mut} />}
    {tab === "warn" && <WarnTab e={e} s={s} mut={mut} />}
    {tab === "docs" && <DocList items={e.documents || []} categories={s.documentCategories} onChange={(docs) => mut((emp) => { emp.documents = docs; })} />}
    {tab === "pay" && <PayTab e={e} s={s} ct={ct} m={m} mut={mut} />}
  </Modal>;
}

function InfosTab({ e, s, data, mut }) {
  const set = (k, v) => mut((emp) => { emp[k] = v; });
  const cnt = e.emergencyContacts || [];
  return <div className="space-y-6">
    <div><h4 className="text-sm font-semibold text-slate-700 mb-3">État civil & administratif</h4><div className="grid grid-cols-3 gap-3">
      <Field label="Matricule"><input className={inputCls} value={e.matricule} onChange={(ev) => set("matricule", ev.target.value)} /></Field>
      <Field label="Sexe"><select className={inputCls} value={e.gender} onChange={(ev) => set("gender", ev.target.value)}><option value="">—</option><option>Masculin</option><option>Féminin</option></select></Field>
      <Field label="Date de naissance"><input type="date" className={inputCls} value={e.birthDate} onChange={(ev) => set("birthDate", ev.target.value)} /></Field>
      <Field label="Situation familiale"><select className={inputCls} value={e.maritalStatus} onChange={(ev) => set("maritalStatus", ev.target.value)}><option value="">—</option><option>Célibataire</option><option>Marié(e)</option><option>Divorcé(e)</option><option>Veuf(ve)</option></select></Field>
      <Field label="Personnes à charge"><input type="number" className={inputCls} value={e.dependents} onChange={(ev) => set("dependents", Number(ev.target.value))} /></Field>
      <Field label="Nationalité"><input className={inputCls} value={e.nationality} onChange={(ev) => set("nationality", ev.target.value)} /></Field>
      <Field label="CIN / pièce d'identité"><input className={inputCls} value={e.cin} onChange={(ev) => set("cin", ev.target.value)} /></Field>
      <Field label="N° CNaPS / CNPS"><input className={inputCls} value={e.socialNumber} onChange={(ev) => set("socialNumber", ev.target.value)} /></Field>
      <Field label="Catégorie"><select className={inputCls} value={e.category} onChange={(ev) => set("category", ev.target.value)}><option value="">—</option>{s.categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
    </div></div>
    <div><h4 className="text-sm font-semibold text-slate-700 mb-3">Coordonnées & paiement</h4><div className="grid grid-cols-3 gap-3">
      <Field label="Téléphone"><input className={inputCls} value={e.phone} onChange={(ev) => set("phone", ev.target.value)} /></Field>
      <Field label="E-mail"><input className={inputCls} value={e.email} onChange={(ev) => set("email", ev.target.value)} /></Field>
      <Field label="Adresse"><input className={inputCls} value={e.address} onChange={(ev) => set("address", ev.target.value)} /></Field>
      <Field label="Compte bancaire"><input className={inputCls} value={e.bankAccount} onChange={(ev) => set("bankAccount", ev.target.value)} /></Field>
      <Field label="Mobile Money"><input className={inputCls} value={e.mobileMoney} onChange={(ev) => set("mobileMoney", ev.target.value)} /></Field>
    </div></div>
    <div><h4 className="text-sm font-semibold text-slate-700 mb-3">Poste & rattachement</h4><div className="grid grid-cols-3 gap-3">
      <Field label="Type de contrat"><select className={inputCls} value={e.contractType} onChange={(ev) => set("contractType", ev.target.value)}>{s.contractTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
      {e.contractType === "CDD" && <Field label="Fin de CDD"><input type="date" className={inputCls} value={e.contractEndDate} onChange={(ev) => set("contractEndDate", ev.target.value)} /></Field>}
      <Field label="Département"><select className={inputCls} value={e.department} onChange={(ev) => set("department", ev.target.value)}><option value="">—</option>{s.departments.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Site"><select className={inputCls} value={e.site} onChange={(ev) => set("site", ev.target.value)}><option value="">—</option>{s.sites.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Responsable (N+1)"><select className={inputCls} value={e.managerId} onChange={(ev) => set("managerId", ev.target.value)}><option value="">—</option>{data.employees.filter((x) => x.id !== e.id).map((x) => <option key={x.id} value={x.id}>{x.firstName} {x.lastName}</option>)}</select></Field>
    </div></div>
    <div><div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Phone size={15} />Contacts d'urgence</h4>{cnt.length < (s.maxEmergencyContacts || 2) && <Btn variant="outline" onClick={() => mut((emp) => { emp.emergencyContacts = [...(emp.emergencyContacts || []), { name: "", relationship: "", phone: "", phone2: "", address: "" }]; })}><Plus size={14} />Ajouter</Btn>}</div>
      {cnt.length === 0 && <div className="text-sm text-slate-400">Aucun contact d'urgence.</div>}
      <div className="space-y-3">{cnt.map((c, i) => <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50"><div className="grid grid-cols-2 gap-3">
        <Field label="Nom complet"><input className={inputCls} value={c.name} onChange={(ev) => mut((emp) => { emp.emergencyContacts[i].name = ev.target.value; })} /></Field>
        <Field label="Lien de parenté"><input className={inputCls} value={c.relationship} onChange={(ev) => mut((emp) => { emp.emergencyContacts[i].relationship = ev.target.value; })} /></Field>
        <Field label="Téléphone"><input className={inputCls} value={c.phone} onChange={(ev) => mut((emp) => { emp.emergencyContacts[i].phone = ev.target.value; })} /></Field>
        <Field label="Téléphone 2"><input className={inputCls} value={c.phone2} onChange={(ev) => mut((emp) => { emp.emergencyContacts[i].phone2 = ev.target.value; })} /></Field>
        <div className="col-span-2 flex items-end gap-2"><div className="flex-1"><Field label="Adresse"><input className={inputCls} value={c.address} onChange={(ev) => mut((emp) => { emp.emergencyContacts[i].address = ev.target.value; })} /></Field></div><button onClick={() => mut((emp) => { emp.emergencyContacts.splice(i, 1); })} className="p-2 mb-0.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button></div>
      </div></div>)}</div>
    </div>
    {s.customFields.length > 0 && <div><h4 className="text-sm font-semibold text-slate-700 mb-3">Informations complémentaires</h4><div className="grid grid-cols-3 gap-3">{s.customFields.map((cf) => <Field key={cf.id} label={cf.label}>{cf.type === "select" ? <select className={inputCls} value={e.custom?.[cf.id] || ""} onChange={(ev) => mut((emp) => { emp.custom = { ...(emp.custom || {}), [cf.id]: ev.target.value }; })}><option value="">—</option>{cf.options.map((o) => <option key={o}>{o}</option>)}</select> : <input type={cf.type === "number" ? "number" : cf.type === "date" ? "date" : "text"} className={inputCls} value={e.custom?.[cf.id] || ""} onChange={(ev) => mut((emp) => { emp.custom = { ...(emp.custom || {}), [cf.id]: ev.target.value }; })} />}</Field>)}</div><p className="text-xs text-slate-400 mt-2">Ces champs se gèrent dans « Paramètres → Champs personnalisés ».</p></div>}
  </div>;
}

function OnboardTab({ e, s, mut }) {
  const tpl = s.onboardingTemplates.find((t) => t.id === e.onboarding?.templateId);
  return <div className="space-y-4">
    <Field label="Parcours d'intégration"><select className={inputCls} value={e.onboarding?.templateId || ""} onChange={(ev) => mut((emp) => { emp.onboarding = { templateId: ev.target.value, steps: {}, decision: "" }; })}><option value="">— Choisir un parcours —</option>{s.onboardingTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    {!tpl && <p className="text-sm text-slate-400">Sélectionnez un parcours. Les modèles se créent dans « Paramètres → Parcours d'intégration ».</p>}
    {tpl && <div className="space-y-2">{tpl.steps.map((st, i) => { const done = e.onboarding.steps?.[i]?.done; return <div key={i} className="p-3 rounded-lg border border-slate-100"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={!!done} onChange={(ev) => mut((emp) => { emp.onboarding.steps = { ...(emp.onboarding.steps || {}), [i]: { done: ev.target.checked, date: ev.target.checked ? new Date().toISOString().slice(0, 10) : "" } }; })} /><span className="text-xs text-slate-400 w-24">{st.phase}</span><span className={"text-sm " + (done ? "text-slate-800" : "text-slate-500")}>{st.label}</span>{done && <span className="ml-auto text-xs text-emerald-600">validé le {new Date(e.onboarding.steps[i].date).toLocaleDateString("fr-FR")}</span>}</label></div>; })}
      <div className="pt-2"><Field label="Décision de fin de parcours"><select className={inputCls} value={e.onboarding.decision || ""} onChange={(ev) => mut((emp) => { emp.onboarding.decision = ev.target.value; if (ev.target.value === "Confirmation" && emp.status === "Période d'essai") emp.status = "Actif"; })}><option value="">—</option><option>Confirmation — poursuite du contrat</option><option>Poursuite avec plan d'amélioration</option><option>Alerte Direction</option></select></Field></div>
    </div>}
  </div>;
}
function EvalTab({ e, s, mut }) {
  const [tplId, setTplId] = useState(s.evalTemplates[0]?.id || ""), tpl = s.evalTemplates.find((t) => t.id === tplId);
  const [scores, setScores] = useState({}), [dec, setDec] = useState(s.evalDecisions[0]), [notes, setNotes] = useState("");
  const total = tpl ? Math.round(tpl.criteria.reduce((sum, c) => sum + ((Number(scores[c.label]) || 0) / 5) * c.weight, 0)) : 0;
  const add = () => { mut((emp) => { emp.evaluations.push({ id: uid("ev"), templateId: tplId, date: new Date().toISOString().slice(0, 10), scores: { ...scores }, total, decision: dec, notes, evaluator: "" }); if (dec === "Confirmation" && emp.status === "Période d'essai") emp.status = "Actif"; }); setScores({}); setNotes(""); };
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3"><Field label="Grille d'évaluation"><select className={inputCls} value={tplId} onChange={(ev) => { setTplId(ev.target.value); setScores({}); }}>{s.evalTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field><Field label="Décision"><select className={inputCls} value={dec} onChange={(ev) => setDec(ev.target.value)}>{s.evalDecisions.map((d) => <option key={d}>{d}</option>)}</select></Field></div>
    {tpl && <div className="rounded-lg border border-slate-100 p-3 space-y-2">{tpl.criteria.map((c) => <div key={c.label} className="flex items-center gap-3"><span className="text-sm text-slate-700 flex-1">{c.label} <span className="text-xs text-slate-400">({c.weight}%)</span></span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setScores({ ...scores, [c.label]: n })} className="w-7 h-7 rounded-md text-xs font-medium" style={(scores[c.label] || 0) >= n ? { background: BRAND, color: "#fff" } : { background: "#F1F5F9", color: "#94A3B8" }}>{n}</button>)}</div></div>)}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100"><span className="text-sm font-medium text-slate-700">Note globale</span><span className="text-lg font-bold tabular-nums" style={{ color: BRAND_DK }}>{total}/100</span></div></div>}
    <Field label="Observations"><textarea className={inputCls} rows={2} value={notes} onChange={(ev) => setNotes(ev.target.value)} /></Field>
    <div className="flex justify-end"><Btn onClick={add}><Plus size={16} />Enregistrer l'évaluation</Btn></div>
    <div className="space-y-2 pt-2">{e.evaluations.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Aucune évaluation.</div>}{[...e.evaluations].reverse().map((ev) => { const t = s.evalTemplates.find((x) => x.id === ev.templateId); return <div key={ev.id} className="p-3 rounded-lg border border-slate-100"><div className="flex items-center gap-2"><Badge tone="teal">{t?.name || "Évaluation"}</Badge><span className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString("fr-FR")}</span><Badge tone={ev.decision === "Rupture" ? "rose" : ev.decision === "Confirmation" ? "green" : "amber"}>{ev.decision}</Badge>{ev.total != null && <span className="ml-auto text-sm font-semibold tabular-nums" style={{ color: BRAND_DK }}>{ev.total}/100</span>}</div>{ev.notes && <p className="text-sm text-slate-600 mt-2">{ev.notes}</p>}</div>; })}</div>
  </div>;
}
function WarnTab({ e, s, mut }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), type: s.warningTypes[0], reason: "", notes: "" });
  const add = () => { if (!f.reason.trim()) return; mut((emp) => { emp.warnings.push({ id: uid("w"), ...f }); }); setF({ ...f, reason: "", notes: "" }); };
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} /></Field><Field label="Type"><select className={inputCls} value={f.type} onChange={(ev) => setF({ ...f, type: ev.target.value })}>{s.warningTypes.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
    <Field label="Motif"><input className={inputCls} value={f.reason} onChange={(ev) => setF({ ...f, reason: ev.target.value })} placeholder="Ex. retard répété de rapport" /></Field>
    <Field label="Détails / suites"><textarea className={inputCls} rows={2} value={f.notes} onChange={(ev) => setF({ ...f, notes: ev.target.value })} /></Field>
    <div className="flex justify-end"><Btn variant="danger" onClick={add}><Plus size={16} />Documenter</Btn></div>
    <div className="space-y-2 pt-2">{e.warnings.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Aucun avertissement.</div>}{[...e.warnings].reverse().map((w) => <div key={w.id} className="p-3 rounded-lg border border-rose-100 bg-rose-50/40"><div className="flex items-center gap-2"><Badge tone="rose">{w.type}</Badge><span className="text-xs text-slate-500">{new Date(w.date).toLocaleDateString("fr-FR")}</span></div><p className="text-sm text-slate-800 mt-1 font-medium">{w.reason}</p>{w.notes && <p className="text-sm text-slate-600 mt-1">{w.notes}</p>}</div>)}</div>
  </div>;
}
function PayTab({ e, s, ct, m, mut }) {
  const p = computePay(e, ct, m, s);
  const [ot, setOt] = useState({ date: new Date().toISOString().slice(0, 10), method: "hourly", hours: 0, rate: 30, amount: 0 });
  const addOt = () => mut((emp) => { emp.overtime = { ...(emp.overtime || {}) }; emp.overtime[m] = [...(emp.overtime[m] || []), { id: uid("ot"), ...ot }]; });
  const [pv, setPv] = useState(s.payElements[0]?.id || "");
  const addPv = () => { const el = s.payElements.find((x) => x.id === pv); if (!el) return; mut((emp) => { emp.payVars = { ...(emp.payVars || {}) }; emp.payVars[m] = [...(emp.payVars[m] || []), { id: uid("pv"), label: el.label, kind: el.kind, taxable: el.taxable, cotisable: el.cotisable, amount: 0 }]; }); };
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3"><Field label="Salaire brut mensuel de base"><input type="number" className={inputCls} value={e.salaryBrut} onChange={(ev) => mut((emp) => { emp.salaryBrut = Number(ev.target.value) || 0; })} /></Field><div className="text-xs text-slate-500 self-end pb-2">Devise : {ct?.currency} · Mois : {m}</div></div>

    <div><h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Timer size={15} />Heures supplémentaires ({m})</h4>
      <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-slate-50">
        <Field label="Date"><input type="date" className={inputCls + " w-40"} value={ot.date} onChange={(ev) => setOt({ ...ot, date: ev.target.value })} /></Field>
        <Field label="Méthode"><select className={inputCls} value={ot.method} onChange={(ev) => setOt({ ...ot, method: ev.target.value })}><option value="hourly">Au taux horaire</option><option value="forfait">Forfait</option></select></Field>
        {ot.method === "hourly" ? <><Field label="Heures"><input type="number" className={inputCls + " w-24"} value={ot.hours} onChange={(ev) => setOt({ ...ot, hours: Number(ev.target.value) })} /></Field><Field label="Majoration %"><input type="number" className={inputCls + " w-24"} value={ot.rate} onChange={(ev) => setOt({ ...ot, rate: Number(ev.target.value) })} /></Field></> : <Field label="Montant"><input type="number" className={inputCls + " w-32"} value={ot.amount} onChange={(ev) => setOt({ ...ot, amount: Number(ev.target.value) })} /></Field>}
        <Btn variant="outline" onClick={addOt}><Plus size={15} />Ajouter</Btn>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Taux horaire = brut ÷ {s.legalMonthlyHours} h. Majoration paramétrable (souvent +30 / +50 / +100 % selon l'heure et le pays).</p>
      <div className="space-y-1 mt-2">{(e.overtime?.[m] || []).map((o) => <div key={o.id} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-100"><span className="text-slate-500">{new Date(o.date).toLocaleDateString("fr-FR")}</span><span>{o.method === "forfait" ? `Forfait` : `${o.hours} h à +${o.rate}%`}</span><span className="ml-auto tabular-nums font-medium">{fmt(o.method === "forfait" ? o.amount : o.hours * (e.salaryBrut / s.legalMonthlyHours) * (1 + o.rate / 100), ct?.currency)}</span><button onClick={() => mut((emp) => { emp.overtime[m] = emp.overtime[m].filter((x) => x.id !== o.id); })} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}</div>
    </div>

    <div><h4 className="text-sm font-semibold text-slate-700 mb-2">Primes, indemnités & retenues ({m})</h4>
      <div className="flex items-end gap-2 p-3 rounded-lg bg-slate-50"><Field label="Élément de paie"><select className={inputCls} value={pv} onChange={(ev) => setPv(ev.target.value)}>{s.payElements.map((x) => <option key={x.id} value={x.id}>{x.label} ({x.kind})</option>)}</select></Field><Btn variant="outline" onClick={addPv}><Plus size={15} />Ajouter</Btn></div>
      <div className="space-y-1 mt-2">{(e.payVars?.[m] || []).map((v, i) => <div key={v.id} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-100"><Badge tone={v.kind === "retenue" ? "rose" : "green"}>{v.kind}</Badge><span className="flex-1">{v.label}</span>{!v.taxable && <span className="text-[10px] text-slate-400">non imposable</span>}<input type="number" className={inputCls + " w-32"} value={v.amount} onChange={(ev) => mut((emp) => { emp.payVars[m][i].amount = Number(ev.target.value) || 0; })} /><button onClick={() => mut((emp) => { emp.payVars[m] = emp.payVars[m].filter((x) => x.id !== v.id); })} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}</div>
    </div>

    <Card className="p-4 bg-slate-50/60"><div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Info size={12} />Simulation {ct?.name} {ct?.validated ? "" : "(profil provisoire)"}</div>
      <PayLine label="Salaire brut de base" value={fmt(p.brut, ct?.currency)} /><PayLine label="Heures supplémentaires" value={"+ " + fmt(p.ot, ct?.currency)} /><PayLine label="Primes / indemnités" value={"+ " + fmt(p.gainAll - p.ot, ct?.currency)} />
      <PayLine label="Cotisations salariales" value={"– " + fmt(p.empContrib, ct?.currency)} /><PayLine label="Impôt sur salaire" value={"– " + fmt(p.tax, ct?.currency)} /><PayLine label="Retenues" value={"– " + fmt(p.retenues, ct?.currency)} />
      <div className="border-t border-slate-200 my-2" /><PayLine label="Salaire net à payer" value={fmt(p.net, ct?.currency)} strong /><div className="border-t border-slate-200 my-2" /><PayLine label="Charges patronales" value={"+ " + fmt(p.emrContrib, ct?.currency)} /><PayLine label="Coût employeur total" value={fmt(p.cost, ct?.currency)} cost />
    </Card>
  </div>;
}
const PayLine = ({ label, value, strong, cost }) => <div className="flex items-center justify-between py-1"><span className={"text-sm " + (strong || cost ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span><span className={"text-sm tabular-nums " + (strong || cost ? "font-semibold" : "text-slate-700")} style={cost ? { color: BRAND_DK } : {}}>{value}</span></div>;

/* ============================ Paie ============================ */
function Payroll({ data, update, countryOf, companyById, activeEmployees }) {
  const [month, setMonth] = useState(monthNow()), [comp, setComp] = useState(data.companies[0]?.id || "");
  const rows = activeEmployees.filter((e) => e.companyId === comp).map((e) => { const ct = countryOf(companyById(e.companyId)?.countryCode); const p = computePay(e, ct, month, data.settings); const key = `${month}|${e.id}`; const st = data.payments[key] || { validated: false, paid: false }; return { e, ct, p, key, st }; });
  const currency = countryOf(companyById(comp)?.countryCode)?.currency || "";
  const tot = rows.reduce((a, r) => ({ brut: a.brut + r.p.brut, net: a.net + r.p.net, cost: a.cost + r.p.cost }), { brut: 0, net: 0, cost: 0 });
  const setStatus = (key, patch) => update((d) => { d.payments[key] = { ...(d.payments[key] || { validated: false, paid: false }), ...patch }; return d; });
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><select className={inputCls + " w-56"} value={comp} onChange={(e) => setComp(e.target.value)}>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="month" className={inputCls + " w-44"} value={month} onChange={(e) => setMonth(e.target.value)} /><div className="ml-auto flex gap-2"><Btn variant="outline" onClick={() => rows.forEach((r) => setStatus(r.key, { validated: true }))}><Check size={16} />Tout valider</Btn><Btn onClick={() => rows.forEach((r) => setStatus(r.key, { validated: true, paid: true }))}><Wallet size={16} />Marquer tout payé</Btn></div></div>
    <div className="grid grid-cols-3 gap-4"><Kpi label="Masse salariale brute" value={fmt(tot.brut, currency)} icon={Wallet} hint={month} /><Kpi label="Total net à payer" value={fmt(tot.net, currency)} icon={Landmark} hint={`${rows.length} salariés`} /><Kpi label="Coût employeur total" value={fmt(tot.cost, currency)} icon={Building2} hint="brut + charges" accent /></div>
    <Card className="overflow-hidden"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60"><th className="px-4 py-3 font-medium">Salarié</th><th className="px-4 py-3 font-medium text-right">Brut + variable</th><th className="px-4 py-3 font-medium text-right">Cotis. + impôt</th><th className="px-4 py-3 font-medium text-right">Net</th><th className="px-4 py-3 font-medium text-right">Coût employeur</th><th className="px-4 py-3 font-medium text-center">Statut</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.e.id} className="border-b border-slate-100"><td className="px-4 py-3"><div className="font-medium text-slate-900">{r.e.firstName} {r.e.lastName}</div><div className="text-xs text-slate-500">{r.e.poste}</div></td>
        <td className="px-4 py-3 text-right tabular-nums">{fmt(r.p.brut + r.p.gainAll, r.ct?.currency)}</td><td className="px-4 py-3 text-right tabular-nums text-slate-500">– {fmt(r.p.empContrib + r.p.tax, r.ct?.currency)}</td>
        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(r.p.net, r.ct?.currency)}</td><td className="px-4 py-3 text-right tabular-nums" style={{ color: BRAND_DK }}>{fmt(r.p.cost, r.ct?.currency)}</td>
        <td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => setStatus(r.key, { validated: !r.st.validated })} className="px-2 py-1 rounded-md text-xs font-medium" style={r.st.validated ? { background: "#E6F2EF", color: BRAND_DK } : { background: "#F1F5F9", color: "#64748B" }}>{r.st.validated ? "Validé" : "À valider"}</button><button onClick={() => setStatus(r.key, { paid: !r.st.paid, validated: true })} className="px-2 py-1 rounded-md text-xs font-medium" style={r.st.paid ? { background: "#DCFCE7", color: "#15803D" } : { background: "#FEF3C7", color: AMBER }}>{r.st.paid ? "Payé" : "À payer"}</button></div></td>
      </tr>)}{rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Aucun salarié actif.</td></tr>}</tbody></table></Card>
    <p className="text-xs text-slate-400 flex items-center gap-1"><Info size={12} />Net et charges calculés depuis le profil fiscal du pays (heures supp. et variables inclus). À faire valider par votre comptable local.</p>
  </div>;
}

/* ============================ Congés ============================ */
function Leaves({ data, update, countryOf, companyById }) {
  const [open, setOpen] = useState(false), s = data.settings;
  const [f, setF] = useState({ employeeId: data.employees[0]?.id || "", type: s.leaveTypes[0]?.name || "", start: "", end: "", notes: "" });
  const emp = (id) => data.employees.find((x) => x.id === id);
  const daysOf = (a, b) => a && b ? Math.max(0, daysBetween(new Date(a), new Date(b)) + 1) : 0;
  const add = () => { if (!f.start || !f.end) return; update((d) => { d.leaves.push({ ...f, id: uid("lv"), days: daysOf(f.start, f.end), status: "Demandé" }); return d; }); setOpen(false); };
  const setStatus = (id, status) => update((d) => { const i = d.leaves.findIndex((l) => l.id === id); const lv = d.leaves[i]; lv.status = status; if (status === "Validé") { const e = d.employees.find((x) => x.id === lv.employeeId); const lt = s.leaveTypes.find((t) => t.name === lv.type); if (e && lt?.paid) e.leaveBalance = Math.max(0, (e.leaveBalance || 0) - lv.days); } return d; });
  return <div className="space-y-4">
    <div className="flex justify-between items-center"><p className="text-sm text-slate-500">Demandes, validation et décompte du solde. Types et acquisition configurables dans « Paramètres ».</p><Btn onClick={() => setOpen(true)}><Plus size={16} />Nouvelle demande</Btn></div>
    <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-3">Soldes de congés</h3><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{data.employees.filter((e) => e.status !== "Sorti").map((e) => <div key={e.id} className="rounded-lg border border-slate-100 p-3"><div className="text-sm font-medium text-slate-800">{e.firstName} {e.lastName}</div><div className="flex items-center justify-between mt-1"><span className="text-xs text-slate-500">Solde</span><span className="text-lg font-bold tabular-nums" style={{ color: BRAND_DK }}>{(e.leaveBalance || 0).toFixed(1)} j</span></div></div>)}</div></Card>
    <Card className="overflow-hidden"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60"><th className="px-4 py-3 font-medium">Salarié</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Période</th><th className="px-4 py-3 font-medium text-right">Jours</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3"></th></tr></thead>
      <tbody>{data.leaves.map((l) => { const e = emp(l.employeeId); return <tr key={l.id} className="border-b border-slate-100"><td className="px-4 py-3 font-medium text-slate-800">{e ? `${e.firstName} ${e.lastName}` : "—"}</td><td className="px-4 py-3"><Badge>{l.type}</Badge></td><td className="px-4 py-3 text-slate-600">{l.start && new Date(l.start).toLocaleDateString("fr-FR")} → {l.end && new Date(l.end).toLocaleDateString("fr-FR")}</td><td className="px-4 py-3 text-right tabular-nums">{l.days}</td><td className="px-4 py-3"><Badge tone={l.status === "Validé" ? "green" : l.status === "Refusé" ? "rose" : "amber"}>{l.status}</Badge></td><td className="px-4 py-3 text-right">{l.status === "Demandé" && <div className="flex gap-1 justify-end"><button onClick={() => setStatus(l.id, "Validé")} className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"><Check size={15} /></button><button onClick={() => setStatus(l.id, "Refusé")} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"><X size={15} /></button></div>}</td></tr>; })}
        {data.leaves.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Aucune demande.</td></tr>}</tbody></table></Card>
    <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle demande de congé"><div className="space-y-4">
      <Field label="Salarié"><select className={inputCls} value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}>{data.employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></Field>
      <Field label="Type"><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{s.leaveTypes.map((t) => <option key={t.name}>{t.name}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-4"><Field label="Du"><input type="date" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field><Field label="Au"><input type="date" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field></div>
      <div className="text-xs text-slate-500">Durée : {daysOf(f.start, f.end)} jour(s)</div>
      <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setOpen(false)}>Annuler</Btn><Btn onClick={add}>Enregistrer</Btn></div>
    </div></Modal>
  </div>;
}

/* ============================ Pays & fiscalité ============================ */
function Fiscalite({ data, update }) {
  const [sel, setSel] = useState(data.countries[0].code), [subtab, setSubtab] = useState("paie");
  const country = data.countries.find((c) => c.code === sel);
  const mut = (fn) => update((d) => { const i = d.countries.findIndex((c) => c.code === sel); fn(d.countries[i]); return d; });
  const [hol, setHol] = useState({ date: "", name: "" });
  return <div className="space-y-4">
    <Card className="p-4 flex items-start gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}><AlertTriangle size={18} style={{ color: AMBER }} className="shrink-0 mt-0.5" /><div className="text-sm text-amber-900"><strong>Valeurs par défaut provisoires.</strong> Faites vérifier taux, barèmes et checklist par votre gestionnaire de paie de chaque pays, puis marquez le pays « validé ».</div></Card>
    <div className="flex gap-2 flex-wrap">{data.countries.map((c) => <button key={c.code} onClick={() => setSel(c.code)} className="px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2" style={sel === c.code ? { background: INK, color: "#fff", borderColor: INK } : { background: "#fff", borderColor: "#E2E8F0", color: "#475569" }}><span>{c.flag}</span>{c.name}{c.validated ? <ShieldCheck size={14} className="text-emerald-400" /> : <Clock size={14} className={sel === c.code ? "text-amber-300" : "text-amber-500"} />}</button>)}</div>
    <div className="flex gap-1 border-b border-slate-200">{[["paie", "Cotisations & impôt"], ["checklist", "Checklist d'embauche"], ["holidays", "Jours fériés"]].map(([id, l]) => <button key={id} onClick={() => setSubtab(id)} className="px-3 py-2 text-sm font-medium border-b-2 -mb-px" style={subtab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}>{l}</button>)}</div>

    {subtab === "paie" && <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Globe size={16} />{country.name}</h3><span className="font-medium text-sm">{country.currency}</span></div>
        <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={country.validated} onChange={(e) => mut((c) => { c.validated = e.target.checked; })} /><span className="text-sm text-slate-700">Profil validé par le comptable local</span>{country.validated && <Badge tone="green"><ShieldCheck size={12} />Validé</Badge>}</label>
        <ContribBlock title="Cotisations salariales (retenues)" list="employee" country={country} mut={mut} />
        <ContribBlock title="Cotisations patronales (charges employeur)" list="employer" country={country} mut={mut} />
        <div className="mt-4"><Field label="Acquisition congés (jours/mois)"><input type="number" step="0.1" className={inputCls + " w-32"} value={country.leaveAccrual} onChange={(e) => mut((c) => { c.leaveAccrual = Number(e.target.value); })} /></Field></div>
      </Card>
      <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-1">Barème de l'impôt sur salaire</h3><p className="text-xs text-slate-500 mb-3">Par tranches sur le salaire imposable. Dernière tranche vide = « au-delà ».</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 px-1 mb-1"><span>Jusqu'à ({country.currency})</span><span>Taux (%)</span></div>
        <div className="space-y-2">{country.tax.map((b, i) => <div key={i} className="grid grid-cols-2 gap-2"><input className={inputCls} type="number" placeholder="au-delà" value={b.upTo == null ? "" : b.upTo} onChange={(e) => mut((c) => { c.tax[i].upTo = e.target.value === "" ? null : Number(e.target.value); })} /><input className={inputCls} type="number" value={b.rate} onChange={(e) => mut((c) => { c.tax[i].rate = Number(e.target.value); })} /></div>)}</div>
        <div className="flex gap-2 mt-3"><Btn variant="ghost" onClick={() => mut((c) => { c.tax.splice(c.tax.length - 1, 0, { upTo: 0, rate: 0 }); })}><Plus size={14} />Tranche</Btn>{country.tax.length > 1 && <Btn variant="ghost" onClick={() => mut((c) => { c.tax.pop(); })}><Trash2 size={14} />Retirer</Btn>}</div>
        <div className="mt-4"><Field label={`Impôt minimum (${country.currency}, 0 si aucun)`}><input className={inputCls} type="number" value={country.minTax || 0} onChange={(e) => mut((c) => { c.minTax = Number(e.target.value); })} /></Field></div>
      </Card>
      <Card className="p-5 lg:col-span-2"><h3 className="font-semibold text-slate-900 mb-1">Taux de conversion (vue consolidée)</h3><p className="text-xs text-slate-500 mb-3">Pour additionner les masses salariales de plusieurs pays. Indicatif.</p><div className="flex flex-wrap gap-4 items-end"><Field label="Devise de référence"><input className={inputCls + " w-28"} value={data.settings.refCurrency} onChange={(e) => update((d) => { d.settings.refCurrency = e.target.value.toUpperCase(); return d; })} /></Field>{Object.keys(data.settings.rates).map((cur) => <Field key={cur} label={`1 ${data.settings.refCurrency} = ? ${cur}`}><input className={inputCls + " w-32"} type="number" value={data.settings.rates[cur]} onChange={(e) => update((d) => { d.settings.rates[cur] = Number(e.target.value); return d; })} /></Field>)}</div></Card>
    </div>}

    {subtab === "checklist" && <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-1">Checklist d'embauche — {country.name}</h3><p className="text-xs text-slate-500 mb-4">Les pièces exigées à l'embauche dans ce pays. Chaque salarié du pays hérite de cette liste.</p>
      <div className="space-y-2">{country.checklist.map((it, i) => <div key={i} className="flex items-center gap-2"><input className={inputCls + " flex-1"} value={it.label} onChange={(e) => mut((c) => { c.checklist[i].label = e.target.value; })} /><button onClick={() => mut((c) => { c.checklist.splice(i, 1); })} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button></div>)}</div>
      <Btn variant="outline" className="mt-3" onClick={() => mut((c) => { c.checklist.push({ key: uid("ck"), label: "Nouvelle pièce" }); })}><Plus size={15} />Ajouter une pièce</Btn>
    </Card>}

    {subtab === "holidays" && <Card className="p-5"><h3 className="font-semibold text-slate-900 mb-1">Jours fériés — {country.name}</h3><p className="text-xs text-slate-500 mb-4">Utilisés pour le décompte des congés et la planification.</p>
      <div className="flex items-end gap-2 mb-4 p-3 rounded-lg bg-slate-50"><Field label="Date"><input type="date" className={inputCls} value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} /></Field><Field label="Libellé"><input className={inputCls} value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} /></Field><Btn variant="outline" onClick={() => { if (hol.date && hol.name) { mut((c) => { c.holidays = [...(c.holidays || []), { ...hol }].sort((a, b) => a.date.localeCompare(b.date)); }); setHol({ date: "", name: "" }); } }}><Plus size={15} />Ajouter</Btn></div>
      <div className="space-y-1">{(country.holidays || []).map((h, i) => <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 text-sm"><CalendarDays size={15} className="text-slate-400" /><span className="text-slate-500 w-28">{new Date(h.date).toLocaleDateString("fr-FR")}</span><span className="text-slate-800">{h.name}</span><button onClick={() => mut((c) => { c.holidays.splice(i, 1); })} className="ml-auto text-rose-400 hover:text-rose-600"><X size={15} /></button></div>)}{(country.holidays || []).length === 0 && <div className="text-sm text-slate-400">Aucun jour férié enregistré.</div>}</div>
    </Card>}
  </div>;
}
function ContribBlock({ title, list, country, mut }) {
  return <div className="mt-4"><div className="flex items-center justify-between mb-2"><h4 className="text-sm font-medium text-slate-700">{title}</h4><button onClick={() => mut((c) => { c[list].push({ label: "Nouvelle cotisation", rate: 0 }); })} className="text-xs flex items-center gap-1" style={{ color: BRAND }}><Plus size={12} />Ajouter</button></div>
    <div className="space-y-2">{country[list].map((c, i) => <div key={i} className="flex items-center gap-2"><input className={inputCls + " flex-1"} value={c.label} onChange={(e) => mut((co) => { co[list][i].label = e.target.value; })} /><div className="relative w-20"><input className={inputCls + " pr-6"} type="number" step="0.1" value={c.rate} onChange={(e) => mut((co) => { co[list][i].rate = Number(e.target.value); })} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div><button onClick={() => mut((co) => { co[list].splice(i, 1); })} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}{country[list].length === 0 && <div className="text-xs text-slate-400">Aucune cotisation.</div>}</div>
  </div>;
}

/* ============================ Paramètres ============================ */
function SettingsView({ data, update }) {
  const [tab, setTab] = useState("lists");
  const s = data.settings;
  const setS = (fn) => update((d) => { fn(d.settings); return d; });
  const tabs = [["lists", "Listes", ListChecks], ["pay", "Éléments de paie", Wallet], ["custom", "Champs personnalisés", Pencil], ["eval", "Grilles d'évaluation", ClipboardCheck], ["onboard", "Parcours d'intégration", GraduationCap], ["users", "Comptes & rôles", UserCog], ["notif", "Notifications & Drive", Bell], ["data", "Données", Info]];
  return <div className="space-y-4">
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">{tabs.map(([id, l, I]) => <button key={id} onClick={() => setTab(id)} className="px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5" style={tab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}><I size={15} />{l}</button>)}</div>

    {tab === "lists" && <div className="grid md:grid-cols-2 gap-4">
      <SettingCard title="Types de contrat"><StringListEditor items={s.contractTypes} placeholder="Ex. CDI" onChange={(v) => setS((x) => { x.contractTypes = v; })} /></SettingCard>
      <SettingCard title="Types d'avertissement"><StringListEditor items={s.warningTypes} placeholder="Ex. Blâme" onChange={(v) => setS((x) => { x.warningTypes = v; })} /></SettingCard>
      <SettingCard title="Décisions d'évaluation"><StringListEditor items={s.evalDecisions} placeholder="Ex. Confirmation" onChange={(v) => setS((x) => { x.evalDecisions = v; })} /></SettingCard>
      <SettingCard title="Départements"><StringListEditor items={s.departments} placeholder="Ex. Control Room" onChange={(v) => setS((x) => { x.departments = v; })} /></SettingCard>
      <SettingCard title="Sites"><StringListEditor items={s.sites} placeholder="Ex. Siège" onChange={(v) => setS((x) => { x.sites = v; })} /></SettingCard>
      <SettingCard title="Postes"><StringListEditor items={s.postes} placeholder="Ex. Technicien" onChange={(v) => setS((x) => { x.postes = v; })} /></SettingCard>
      <SettingCard title="Catégories socio-professionnelles"><StringListEditor items={s.categories} placeholder="Ex. Cadre" onChange={(v) => setS((x) => { x.categories = v; })} /></SettingCard>
      <SettingCard title="Types de congé (avec acquisition)"><div className="space-y-2">{s.leaveTypes.map((t, i) => <div key={i} className="flex items-center gap-2"><input className={inputCls + " flex-1"} value={t.name} onChange={(e) => setS((x) => { x.leaveTypes[i].name = e.target.value; })} /><label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" className="accent-teal-600" checked={t.paid} onChange={(e) => setS((x) => { x.leaveTypes[i].paid = e.target.checked; })} />payé</label><input type="number" step="0.1" title="jours/mois acquis" className={inputCls + " w-20"} value={t.accrual} onChange={(e) => setS((x) => { x.leaveTypes[i].accrual = Number(e.target.value); })} /><button onClick={() => setS((x) => { x.leaveTypes.splice(i, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}<Btn variant="outline" onClick={() => setS((x) => { x.leaveTypes.push({ name: "Nouveau type", paid: true, accrual: 0 }); })}><Plus size={14} />Ajouter</Btn></div></SettingCard>
      <SettingCard title="Catégories de documents"><div className="space-y-2">{s.documentCategories.map((t, i) => <div key={i} className="flex items-center gap-2"><input className={inputCls + " flex-1"} value={t.name} onChange={(e) => setS((x) => { x.documentCategories[i].name = e.target.value; })} /><label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" className="accent-teal-600" checked={t.expires} onChange={(e) => setS((x) => { x.documentCategories[i].expires = e.target.checked; })} />expire</label><button onClick={() => setS((x) => { x.documentCategories.splice(i, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}<Btn variant="outline" onClick={() => setS((x) => { x.documentCategories.push({ name: "Nouvelle catégorie", expires: false }); })}><Plus size={14} />Ajouter</Btn></div></SettingCard>
    </div>}

    {tab === "pay" && <SettingCard title="Éléments de paie réutilisables"><p className="text-xs text-slate-500 mb-3">Primes, indemnités, avances, retenues appliquées ensuite par salarié et par mois. « Imposable » et « cotisable » déterminent l'impact sur l'impôt et les cotisations.</p>
      <div className="space-y-2">{s.payElements.map((p, i) => <div key={p.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100"><input className={inputCls + " flex-1 min-w-40"} value={p.label} onChange={(e) => setS((x) => { x.payElements[i].label = e.target.value; })} /><select className={inputCls + " w-28"} value={p.kind} onChange={(e) => setS((x) => { x.payElements[i].kind = e.target.value; })}><option value="gain">Gain</option><option value="retenue">Retenue</option></select><label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" className="accent-teal-600" checked={p.taxable} onChange={(e) => setS((x) => { x.payElements[i].taxable = e.target.checked; })} />imposable</label><label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" className="accent-teal-600" checked={p.cotisable} onChange={(e) => setS((x) => { x.payElements[i].cotisable = e.target.checked; })} />cotisable</label><button onClick={() => setS((x) => { x.payElements.splice(i, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button></div>)}</div>
      <Btn variant="outline" className="mt-3" onClick={() => setS((x) => { x.payElements.push({ id: uid("pe"), label: "Nouvel élément", kind: "gain", taxable: true, cotisable: true }); })}><Plus size={15} />Ajouter un élément</Btn>
      <div className="mt-5 pt-4 border-t border-slate-100"><Field label="Heures légales mensuelles (base du taux horaire)"><input type="number" step="0.01" className={inputCls + " w-40"} value={s.legalMonthlyHours} onChange={(e) => setS((x) => { x.legalMonthlyHours = Number(e.target.value); })} /></Field></div>
    </SettingCard>}

    {tab === "custom" && <SettingCard title="Champs personnalisés du dossier salarié"><p className="text-xs text-slate-500 mb-3">Ajoutez librement des champs qui apparaîtront dans « Informations complémentaires » de chaque salarié.</p>
      <div className="space-y-2">{s.customFields.map((c, i) => <div key={c.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100"><input className={inputCls + " flex-1 min-w-40"} value={c.label} onChange={(e) => setS((x) => { x.customFields[i].label = e.target.value; })} /><select className={inputCls + " w-32"} value={c.type} onChange={(e) => setS((x) => { x.customFields[i].type = e.target.value; })}><option value="text">Texte</option><option value="number">Nombre</option><option value="date">Date</option><option value="select">Liste</option></select>{c.type === "select" && <input className={inputCls + " flex-1 min-w-40"} placeholder="options séparées par des virgules" value={c.options.join(", ")} onChange={(e) => setS((x) => { x.customFields[i].options = e.target.value.split(",").map((o) => o.trim()).filter(Boolean); })} />}<button onClick={() => setS((x) => { x.customFields.splice(i, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button></div>)}</div>
      <Btn variant="outline" className="mt-3" onClick={() => setS((x) => { x.customFields.push({ id: uid("cf"), label: "Nouveau champ", type: "text", options: [] }); })}><Plus size={15} />Ajouter un champ</Btn>
    </SettingCard>}

    {tab === "eval" && <div className="space-y-4">{s.evalTemplates.map((t, ti) => <SettingCard key={t.id} title={<input className="font-semibold bg-transparent focus:outline-none" value={t.name} onChange={(e) => setS((x) => { x.evalTemplates[ti].name = e.target.value; })} />} onDelete={() => setS((x) => { x.evalTemplates.splice(ti, 1); })}>
      <div className="space-y-2">{t.criteria.map((c, ci) => <div key={ci} className="flex items-center gap-2"><input className={inputCls + " flex-1"} value={c.label} onChange={(e) => setS((x) => { x.evalTemplates[ti].criteria[ci].label = e.target.value; })} /><div className="relative w-24"><input type="number" className={inputCls + " pr-6"} value={c.weight} onChange={(e) => setS((x) => { x.evalTemplates[ti].criteria[ci].weight = Number(e.target.value); })} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div><button onClick={() => setS((x) => { x.evalTemplates[ti].criteria.splice(ci, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}</div>
      <div className="flex items-center justify-between mt-2"><Btn variant="outline" onClick={() => setS((x) => { x.evalTemplates[ti].criteria.push({ label: "Nouveau critère", weight: 0 }); })}><Plus size={14} />Critère</Btn><span className="text-xs text-slate-400">Total : {t.criteria.reduce((a, c) => a + c.weight, 0)}% (viser 100)</span></div>
    </SettingCard>)}<Btn variant="outline" onClick={() => setS((x) => { x.evalTemplates.push({ id: uid("et"), name: "Nouvelle grille", criteria: [] }); })}><Plus size={15} />Nouvelle grille</Btn></div>}

    {tab === "onboard" && <div className="space-y-4">{s.onboardingTemplates.map((t, ti) => <SettingCard key={t.id} title={<input className="font-semibold bg-transparent focus:outline-none" value={t.name} onChange={(e) => setS((x) => { x.onboardingTemplates[ti].name = e.target.value; })} />} onDelete={() => setS((x) => { x.onboardingTemplates.splice(ti, 1); })}>
      <div className="space-y-2">{t.steps.map((st, si) => <div key={si} className="flex items-center gap-2"><input className={inputCls + " w-32"} value={st.phase} onChange={(e) => setS((x) => { x.onboardingTemplates[ti].steps[si].phase = e.target.value; })} /><input className={inputCls + " flex-1"} value={st.label} onChange={(e) => setS((x) => { x.onboardingTemplates[ti].steps[si].label = e.target.value; })} /><button onClick={() => setS((x) => { x.onboardingTemplates[ti].steps.splice(si, 1); })} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}</div>
      <Btn variant="outline" className="mt-2" onClick={() => setS((x) => { x.onboardingTemplates[ti].steps.push({ phase: "Phase", label: "Nouvelle étape" }); })}><Plus size={14} />Étape</Btn>
    </SettingCard>)}<Btn variant="outline" onClick={() => setS((x) => { x.onboardingTemplates.push({ id: uid("ot"), name: "Nouveau parcours", steps: [] }); })}><Plus size={15} />Nouveau parcours</Btn></div>}

    {tab === "users" && <SettingCard title="Comptes utilisateurs & droits par entité"><p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><Info size={12} />La connexion réelle et le cloisonnement des accès seront gérés par le serveur. Ici vous définissez qui a accès à quoi.</p>
      <div className="space-y-2">{data.users.map((u, i) => <div key={u.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100"><input className={inputCls + " w-40"} value={u.name} onChange={(e) => update((d) => { d.users[i].name = e.target.value; return d; })} /><input className={inputCls + " flex-1 min-w-48"} value={u.email} onChange={(e) => update((d) => { d.users[i].email = e.target.value; return d; })} /><select className={inputCls + " w-32"} value={u.role} onChange={(e) => update((d) => { d.users[i].role = e.target.value; return d; })}>{["Admin", "RH", "Manager", "Lecture"].map((r) => <option key={r}>{r}</option>)}</select>
        <select className={inputCls + " w-44"} value={u.scope === "all" ? "all" : "custom"} onChange={(e) => update((d) => { d.users[i].scope = e.target.value === "all" ? "all" : []; return d; })}><option value="all">Toutes les sociétés</option><option value="custom">Sociétés choisies</option></select>
        <button onClick={() => update((d) => { d.users.splice(i, 1); return d; })} className="text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button>
        {u.scope !== "all" && <div className="w-full flex flex-wrap gap-2 pl-1">{data.companies.map((c) => <label key={c.id} className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" className="accent-teal-600" checked={(u.scope || []).includes(c.id)} onChange={(e) => update((d) => { const sc = new Set(d.users[i].scope || []); e.target.checked ? sc.add(c.id) : sc.delete(c.id); d.users[i].scope = [...sc]; return d; })} />{c.name}</label>)}</div>}
      </div>)}</div>
      <Btn variant="outline" className="mt-3" onClick={() => update((d) => { d.users.push({ id: uid("u"), name: "Nouvel utilisateur", email: "", role: "Lecture", scope: [], active: true }); return d; })}><Plus size={15} />Ajouter un compte</Btn>
    </SettingCard>}

    {tab === "notif" && <div className="space-y-4">
      <SettingCard title="Alertes e-mail aux administrateurs"><p className="text-xs text-slate-500 mb-3">Le serveur enverra ces e-mails de suivi. Choisissez les déclencheurs et les destinataires.</p>
        <div className="space-y-2 mb-4">{[["incompleteDossier", "Dossier incomplet (l'e-mail précise les pièces manquantes)"], ["probationEnd", "Fin de période d'essai approchant"], ["evalDue", "Évaluation à réaliser"], ["docExpiry", "Document arrivant à expiration"], ["contractEnd", "Fin de CDD approchant"]].map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={s.notifications ? data.notifications.rules[k] : false} onChange={(e) => update((d) => { d.notifications.rules[k] = e.target.checked; return d; })} />{l}</label>)}</div>
        <Field label="Destinataires (e-mails séparés par des virgules)"><input className={inputCls} value={data.notifications.adminEmails.join(", ")} onChange={(e) => update((d) => { d.notifications.adminEmails = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); return d; })} /></Field>
        <div className="mt-3"><Field label="Fréquence du récapitulatif"><select className={inputCls} value={data.notifications.frequency} onChange={(e) => update((d) => { d.notifications.frequency = e.target.value; return d; })}>{["Quotidienne", "Hebdomadaire (lundi matin)", "Immédiate + hebdomadaire"].map((f) => <option key={f}>{f}</option>)}</select></Field></div>
        <NotifPreview data={data} />
      </SettingCard>
      <SettingCard title="Hébergement des documents (Google Drive)"><p className="text-xs text-slate-500 mb-3">Collez le lien du dossier Drive où le serveur déposera les scans. En attendant, les dépôts restent locaux à cette démo.</p>
        <Field label="Lien du dossier Google Drive"><input className={inputCls} placeholder="https://drive.google.com/drive/folders/…" value={data.notifications.driveFolderUrl} onChange={(e) => update((d) => { d.notifications.driveFolderUrl = e.target.value; return d; })} /></Field>
        <div className="mt-2 flex items-center gap-2 text-xs">{data.notifications.driveFolderUrl ? <Badge tone="green"><Check size={12} />Lien enregistré — à connecter côté serveur</Badge> : <Badge tone="amber"><AlertTriangle size={12} />En attente du lien</Badge>}</div>
      </SettingCard>
    </div>}

    {tab === "data" && <SettingCard title="Données de démonstration"><p className="text-sm text-slate-600 mb-3">Réinitialise toutes les données (sociétés, salariés, paramètres) à l'exemple de départ. Action irréversible.</p><Btn variant="danger" onClick={() => { if (confirm("Réinitialiser toutes les données de démonstration ?")) update(seedData()); }}><Trash2 size={16} />Réinitialiser les données</Btn></SettingCard>}
  </div>;
}
function SettingCard({ title, children, onDelete }) {
  return <Card className="p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-900">{title}</h3>{onDelete && <button onClick={onDelete} className="text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>}</div>{children}</Card>;
}
function NotifPreview({ data }) {
  const first = computeAlerts(data, (id) => data.companies.find((c) => c.id === id)).find((a) => a.type === "dossier");
  return <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden"><div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 flex items-center gap-1"><Mail size={13} />Aperçu de l'e-mail envoyé par le serveur</div>
    <div className="p-4 text-sm text-slate-700"><div className="text-slate-400 text-xs mb-2">À : {data.notifications.adminEmails.join(", ") || "—"}</div><div className="font-medium mb-1">Objet : Suivi RH — dossiers à compléter</div>
      <p className="text-slate-600">{first ? <>Le dossier de <strong>{first.who}</strong> ({first.company}) est incomplet. {first.text.replace("Dossier incomplet : ", "Pièces manquantes : ")}.</> : "Aucun dossier incomplet à ce jour."}</p>
    </div></div>;
}
