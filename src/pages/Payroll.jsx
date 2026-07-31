import { useEffect, useState } from "react";
import { Check, Wallet, Landmark, Building2, Info, Zap, Plus, Search } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Kpi } from "../components/ui/Kpi";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field } from "../components/ui/Field";
import { inputCls, BRAND_DK, BRAND_WASH, BRAND, AMBER } from "../lib/tokens";
import { fmt, monthNow } from "../lib/format";
import { listCompanies } from "../api/companies";
import { listEmployees } from "../api/employees";
import { getPayrollSummary, setPaymentStatus, getBulletins, generateBulletinsForPeriod } from "../api/payroll";

export default function Payroll({ onGoto }) {
  const [tab, setTab] = useState("summary");
  const tabs = [
    ["summary", "Masse salariale"],
    ["bulletins", "Bulletins de paie"],
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            style={tab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "summary" && <SummaryTab />}
      {tab === "bulletins" && <BulletinsTab onGoto={onGoto} />}
    </div>
  );
}

function SummaryTab() {
  const [companies, setCompanies] = useState([]);
  const [comp, setComp] = useState("");
  const [month, setMonth] = useState(monthNow());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCompanies().then((c) => {
      setCompanies(c || []);
      if (!comp && c && c[0]) setComp(c[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (!comp) return;
    setLoading(true);
    getPayrollSummary({ companyId: comp, month })
      .then((s) => setSummary(s))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp, month]);

  const rows = summary?.rows || [];
  const totals = summary?.totals || { brut: 0, net: 0, cost: 0 };
  const currency = summary?.currency || "";

  const setStatus = async (employeeId, patch) => {
    await setPaymentStatus(employeeId, month, patch);
    load();
  };

  const validateAll = async () => {
    await Promise.all(rows.map((r) => setPaymentStatus(r.employee.id, month, { validated: true })));
    load();
  };
  const payAll = async () => {
    await Promise.all(rows.map((r) => setPaymentStatus(r.employee.id, month, { validated: true, paid: true })));
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className={inputCls + " w-56"} value={comp} onChange={(e) => setComp(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input type="month" className={inputCls + " w-44"} value={month} onChange={(e) => setMonth(e.target.value)} />
        <div className="ml-auto flex gap-2">
          <Btn variant="outline" onClick={validateAll}>
            <Check size={16} />
            Tout valider
          </Btn>
          <Btn onClick={payAll}>
            <Wallet size={16} />
            Marquer tout payé
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Masse salariale brute" value={fmt(totals.brut, currency)} icon={Wallet} hint={month} />
        <Kpi label="Total net à payer" value={fmt(totals.net, currency)} icon={Landmark} hint={`${rows.length} salariés`} />
        <Kpi label="Coût employeur total" value={fmt(totals.cost, currency)} icon={Building2} hint="brut + charges" accent />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 font-medium">Salarié</th>
              <th className="px-4 py-3 font-medium text-right">Brut + variable</th>
              <th className="px-4 py-3 font-medium text-right">Cotis. + impôt</th>
              <th className="px-4 py-3 font-medium text-right">Net</th>
              <th className="px-4 py-3 font-medium text-right">Coût employeur</th>
              <th className="px-4 py-3 font-medium text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              rows.map((r) => (
                <tr key={r.employee.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {r.employee.firstName} {r.employee.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{r.employee.poste}</div>
                    {r.pay.absenceDays > 0 && (
                      <div className="text-xs text-[#E31E3D] mt-0.5">
                        {r.pay.absenceDays} j absence injustifiée (– {fmt(r.pay.absenceDeduction, currency)})
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(r.pay.brut + r.pay.gainAll, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">– {fmt(r.pay.empContrib + r.pay.tax, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(r.pay.net, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: BRAND_DK }}>
                    {fmt(r.pay.cost, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setStatus(r.employee.id, { validated: !r.status?.validated })}
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={r.status?.validated ? { background: BRAND_WASH, color: BRAND_DK } : { background: "#F1F5F9", color: "#64748B" }}
                      >
                        {r.status?.validated ? "Validé" : "À valider"}
                      </button>
                      <button
                        onClick={() => setStatus(r.employee.id, { paid: !r.status?.paid, validated: true })}
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={r.status?.paid ? { background: "#DCFCE7", color: "#15803D" } : { background: "#FEF3C7", color: AMBER }}
                      >
                        {r.status?.paid ? "Payé" : "À payer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Aucun salarié actif.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <Info size={12} />
        Net et charges calculés depuis le profil fiscal du pays (heures supp. et variables inclus). À faire valider par votre comptable local.
      </p>
    </div>
  );
}

function NewBulletinModal({ month, existingIds, onClose, onCreated }) {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listEmployees({}).then((list) => {
      const candidates = (list || []).filter((e) => e.status !== "Sorti" && !e.archived && !existingIds.has(e.id));
      setEmployees(candidates);
      if (candidates[0]) setEmployeeId(candidates[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    if (!employeeId) return;
    setSaving(true);
    try {
      await setPaymentStatus(employeeId, month, {});
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouveau bulletin">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Crée le bulletin de paie ({month}) d'un salarié qui n'en a pas encore.
        </p>
        <Field label="Salarié">
          <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </Field>
        {employees.length === 0 && (
          <p className="text-xs text-slate-400">Tous les salariés actifs ont déjà un bulletin pour ce mois.</p>
        )}
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={create} disabled={!employeeId || saving}>
            <Plus size={15} />
            Créer
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function BulletinsTab({ onGoto }) {
  const [month, setMonth] = useState(monthNow());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getBulletins(month)
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const bulletins = data?.bulletins || [];
  const filtered = bulletins.filter((b) => {
    if (status === "paid" && !b.paid) return false;
    if (status === "unpaid" && b.paid) return false;
    const q = search.toLowerCase();
    return !q || b.employeeName.toLowerCase().includes(q);
  });

  const generate = async () => {
    setGenerating(true);
    try {
      await generateBulletinsForPeriod(month);
      load();
    } finally {
      setGenerating(false);
    }
  };

  const pay = async (employeeId) => {
    await setPaymentStatus(employeeId, month, { paid: true, validated: true });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bulletins de paie</h2>
          <p className="text-sm text-slate-500">{bulletins.length} bulletin{bulletins.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" onClick={generate} disabled={generating}>
            <Zap size={15} />
            Générer auto période
          </Btn>
          <Btn onClick={() => setNewOpen(true)}>
            <Plus size={15} />
            Nouveau bulletin
          </Btn>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={inputCls + " pl-9 w-64"}
            placeholder="Rechercher un employé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={inputCls + " w-40"} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="paid">Payée</option>
          <option value="unpaid">À payer</option>
        </select>
        <input type="month" className={inputCls + " w-44"} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 font-medium">Période</th>
              <th className="px-4 py-3 font-medium">Employé</th>
              <th className="px-4 py-3 font-medium">Contrat</th>
              <th className="px-4 py-3 font-medium">Jours</th>
              <th className="px-4 py-3 font-medium text-right">Net à payer</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((b) => {
                const pct = b.joursTotal ? Math.round((b.joursTravailles / b.joursTotal) * 100) : 100;
                return (
                  <tr key={b.employeeId} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{month}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onGoto?.("employees", undefined, b.employeeId)}
                        className="font-medium hover:underline"
                        style={{ color: BRAND_DK }}
                      >
                        {b.employeeName}
                      </button>
                      <div className="text-xs text-slate-400">
                        {b.countryFlag} {b.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{b.contractType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {b.joursTravailles}/{b.joursTotal} ({pct}%)
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(b.net, b.currency)}</td>
                    <td className="px-4 py-3">
                      {b.paid ? <Badge tone="green">Payée</Badge> : <Badge tone="amber">À payer</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!b.paid && (
                        <Btn variant="outline" onClick={() => pay(b.employeeId)}>
                          Payer
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Aucun bulletin pour ce filtre.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {newOpen && (
        <NewBulletinModal
          month={month}
          existingIds={new Set(bulletins.filter((b) => b.exists).map((b) => b.employeeId))}
          onClose={() => setNewOpen(false)}
          onCreated={() => {
            setNewOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
