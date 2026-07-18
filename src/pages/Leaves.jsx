import { useEffect, useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { inputCls, BRAND_DK } from "../lib/tokens";
import { daysBetween } from "../lib/format";
import { listEmployees } from "../api/employees";
import { getSettings } from "../api/settings";
import { listLeaves, createLeave, patchLeaveStatus } from "../api/leaves";

export default function Leaves() {
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ employeeId: "", type: "", start: "", end: "", notes: "" });

  const load = () => {
    setLoading(true);
    return Promise.all([listEmployees(), getSettings(), listLeaves()])
      .then(([e, s, l]) => {
        setEmployees(e || []);
        setSettings(s || null);
        setLeaves(l || []);
        setF((prev) => ({
          ...prev,
          employeeId: prev.employeeId || e?.[0]?.id || "",
          type: prev.type || s?.leaveTypes?.[0]?.name || "",
        }));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const emp = (id) => employees.find((x) => x.id === id);
  const daysOf = (a, b) => (a && b ? Math.max(0, daysBetween(new Date(a), new Date(b)) + 1) : 0);

  const add = async () => {
    if (!f.start || !f.end) return;
    await createLeave(f);
    setOpen(false);
    load();
  };

  const setStatus = async (id, status) => {
    await patchLeaveStatus(id, status);
    load();
  };

  if (loading && !settings) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  const s = settings || { leaveTypes: [] };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Demandes, validation et décompte du solde. Types et acquisition configurables dans « Paramètres ».
        </p>
        <Btn onClick={() => setOpen(true)}>
          <Plus size={16} />
          Nouvelle demande
        </Btn>
      </div>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Soldes de congés</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {employees
            .filter((e) => e.status !== "Sorti")
            .map((e) => (
              <div key={e.id} className="rounded-lg border border-slate-100 p-3">
                <div className="text-sm font-medium text-slate-800">
                  {e.firstName} {e.lastName}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">Solde</span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: BRAND_DK }}>
                    {(e.leaveBalance || 0).toFixed(1)} j
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 font-medium">Salarié</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Période</th>
              <th className="px-4 py-3 font-medium text-right">Jours</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => {
              const e = emp(l.employeeId);
              return (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{e ? `${e.firstName} ${e.lastName}` : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge>{l.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {l.start && new Date(l.start).toLocaleDateString("fr-FR")} → {l.end && new Date(l.end).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.days}</td>
                  <td className="px-4 py-3">
                    <Badge tone={l.status === "Validé" ? "green" : l.status === "Refusé" ? "rose" : "amber"}>{l.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.status === "Demandé" && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setStatus(l.id, "Validé")} className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setStatus(l.id, "Refusé")} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600">
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Aucune demande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle demande de congé">
        <div className="space-y-4">
          <Field label="Salarié">
            <select className={inputCls} value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {s.leaveTypes.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Du">
              <input type="date" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
            </Field>
            <Field label="Au">
              <input type="date" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
            </Field>
          </div>
          <div className="text-xs text-slate-500">Durée : {daysOf(f.start, f.end)} jour(s)</div>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Btn>
            <Btn onClick={add}>Enregistrer</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
