import { useEffect, useState } from "react";
import { Timer, Plus, X, Info } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls, BRAND_DK } from "../../lib/tokens";
import { fmt } from "../../lib/format";
import {
  getEmployeePayroll,
  listOvertime,
  addOvertime,
  deleteOvertime,
  listPayVars,
  addPayVar,
  updatePayVar,
  deletePayVar,
} from "../../api/employees";

const PayLine = ({ label, value, strong, cost }) => (
  <div className="flex items-center justify-between py-1">
    <span className={"text-sm " + (strong || cost ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span>
    <span className={"text-sm tabular-nums " + (strong || cost ? "font-semibold" : "text-slate-700")} style={cost ? { color: BRAND_DK } : {}}>
      {value}
    </span>
  </div>
);

// Purely for the per-line overtime display below the entry list; the
// authoritative net/cost simulation comes from GET /employees/:id/payroll.
const overtimeLineAmount = (o, salaryBrut, legalHours) =>
  o.method === "forfait" ? o.amount || 0 : (o.hours || 0) * (salaryBrut / (legalHours || 173.33)) * (1 + (o.rate || 0) / 100);

export default function PayTab({ e, s, ct, m, patch, employeeId, onChanged }) {
  const [pay, setPay] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getEmployeePayroll(employeeId, m).then((p) => {
      if (!cancelled) setPay(p);
    });
    return () => {
      cancelled = true;
    };
  }, [employeeId, m, e]);

  // The employee record from getEmployee() does not embed overtime/pay-var
  // entries (they're month-scoped, fetched separately here) — see api/employees.js.
  const [overtimeList, setOvertimeList] = useState([]);
  const [payVarsList, setPayVarsList] = useState([]);
  const reloadLists = () => {
    listOvertime(employeeId, m).then((l) => setOvertimeList(l || []));
    listPayVars(employeeId, m).then((l) => setPayVarsList(l || []));
  };
  useEffect(() => {
    reloadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, m]);

  const [ot, setOt] = useState({ date: new Date().toISOString().slice(0, 10), method: "hourly", hours: 0, rate: 30, amount: 0 });
  const addOt = () => addOvertime(employeeId, { month: m, ...ot }).then(() => { reloadLists(); onChanged(); });
  const removeOt = (id) => deleteOvertime(employeeId, id).then(() => { reloadLists(); onChanged(); });

  const [pv, setPv] = useState(s.payElements[0]?.id || "");
  const addPv = () => {
    const el = s.payElements.find((x) => x.id === pv);
    if (!el) return;
    addPayVar(employeeId, { month: m, label: el.label, kind: el.kind, taxable: el.taxable, cotisable: el.cotisable, amount: 0 }).then(() => {
      reloadLists();
      onChanged();
    });
  };
  const setPvAmount = (id, amount) => updatePayVar(employeeId, id, { amount }).then(() => { reloadLists(); onChanged(); }).catch(() => {});
  const removePv = (id) => deletePayVar(employeeId, id).then(() => { reloadLists(); onChanged(); });

  const p = pay || { brut: e.salaryBrut || 0, ot: 0, gainAll: 0, retenues: 0, empContrib: 0, tax: 0, net: 0, emrContrib: 0, cost: 0 };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Salaire brut mensuel de base">
          <input type="number" className={inputCls} value={e.salaryBrut} onChange={(ev) => patch({ salaryBrut: Number(ev.target.value) || 0 })} />
        </Field>
        <div className="text-xs text-slate-500 self-end pb-2">
          Devise : {ct?.currency} · Mois : {m}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Timer size={15} />
          Heures supplémentaires ({m})
        </h4>
        <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-slate-50">
          <Field label="Date">
            <input type="date" className={inputCls + " w-40"} value={ot.date} onChange={(ev) => setOt({ ...ot, date: ev.target.value })} />
          </Field>
          <Field label="Méthode">
            <select className={inputCls} value={ot.method} onChange={(ev) => setOt({ ...ot, method: ev.target.value })}>
              <option value="hourly">Au taux horaire</option>
              <option value="forfait">Forfait</option>
            </select>
          </Field>
          {ot.method === "hourly" ? (
            <>
              <Field label="Heures">
                <input type="number" className={inputCls + " w-24"} value={ot.hours} onChange={(ev) => setOt({ ...ot, hours: Number(ev.target.value) })} />
              </Field>
              <Field label="Majoration %">
                <input type="number" className={inputCls + " w-24"} value={ot.rate} onChange={(ev) => setOt({ ...ot, rate: Number(ev.target.value) })} />
              </Field>
            </>
          ) : (
            <Field label="Montant">
              <input type="number" className={inputCls + " w-32"} value={ot.amount} onChange={(ev) => setOt({ ...ot, amount: Number(ev.target.value) })} />
            </Field>
          )}
          <Btn variant="outline" onClick={addOt}>
            <Plus size={15} />
            Ajouter
          </Btn>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Taux horaire = brut ÷ {s.legalMonthlyHours} h. Majoration paramétrable (souvent +30 / +50 / +100 % selon l'heure et le pays).
        </p>
        <div className="space-y-1 mt-2">
          {overtimeList.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-500">{new Date(o.date).toLocaleDateString("fr-FR")}</span>
              <span>{o.method === "forfait" ? `Forfait` : `${o.hours} h à +${o.rate}%`}</span>
              <span className="ml-auto tabular-nums font-medium">
                {fmt(overtimeLineAmount(o, e.salaryBrut, s.legalMonthlyHours), ct?.currency)}
              </span>
              <button onClick={() => removeOt(o.id)} className="text-rose-400 hover:text-rose-600">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Primes, indemnités & retenues ({m})</h4>
        <div className="flex items-end gap-2 p-3 rounded-lg bg-slate-50">
          <Field label="Élément de paie">
            <select className={inputCls} value={pv} onChange={(ev) => setPv(ev.target.value)}>
              {s.payElements.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label} ({x.kind})
                </option>
              ))}
            </select>
          </Field>
          <Btn variant="outline" onClick={addPv}>
            <Plus size={15} />
            Ajouter
          </Btn>
        </div>
        <div className="space-y-1 mt-2">
          {payVarsList.map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-slate-100">
              <Badge tone={v.kind === "retenue" ? "rose" : "green"}>{v.kind}</Badge>
              <span className="flex-1">{v.label}</span>
              {!v.taxable && <span className="text-[10px] text-slate-400">non imposable</span>}
              <input
                type="number"
                className={inputCls + " w-32"}
                defaultValue={v.amount}
                onBlur={(ev) => setPvAmount(v.id, Number(ev.target.value) || 0)}
              />
              <button onClick={() => removePv(v.id)} className="text-rose-400 hover:text-rose-600">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-slate-50/60">
        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Info size={12} />
          Simulation {ct?.name} {ct?.validated ? "" : "(profil provisoire)"}
        </div>
        <PayLine label="Salaire brut de base" value={fmt(p.brut, ct?.currency)} />
        <PayLine label="Heures supplémentaires" value={"+ " + fmt(p.ot, ct?.currency)} />
        <PayLine label="Primes / indemnités" value={"+ " + fmt(p.gainAll - p.ot, ct?.currency)} />
        <PayLine label="Cotisations salariales" value={"– " + fmt(p.empContrib, ct?.currency)} />
        <PayLine label="Impôt sur salaire" value={"– " + fmt(p.tax, ct?.currency)} />
        <PayLine label="Retenues" value={"– " + fmt(p.retenues, ct?.currency)} />
        <div className="border-t border-slate-200 my-2" />
        <PayLine label="Salaire net à payer" value={fmt(p.net, ct?.currency)} strong />
        <div className="border-t border-slate-200 my-2" />
        <PayLine label="Charges patronales" value={"+ " + fmt(p.emrContrib, ct?.currency)} />
        <PayLine label="Coût employeur total" value={fmt(p.cost, ct?.currency)} cost />
      </Card>
    </div>
  );
}
