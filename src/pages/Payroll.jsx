import { useEffect, useState } from "react";
import { Check, Wallet, Landmark, Building2, Info } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Kpi } from "../components/ui/Kpi";
import { Btn } from "../components/ui/Btn";
import { inputCls, BRAND_DK, AMBER } from "../lib/tokens";
import { fmt, monthNow } from "../lib/format";
import { listCompanies } from "../api/companies";
import { getPayrollSummary, setPaymentStatus } from "../api/payroll";

export default function Payroll() {
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
                        style={r.status?.validated ? { background: "#E6F2EF", color: BRAND_DK } : { background: "#F1F5F9", color: "#64748B" }}
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
