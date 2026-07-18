import { useState } from "react";
import { Plus } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls } from "../../lib/tokens";
import { addWarning } from "../../api/employees";

export default function WarnTab({ e, s, employeeId, onChanged }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), type: s.warningTypes[0], reason: "", notes: "" });

  const add = async () => {
    if (!f.reason.trim()) return;
    await addWarning(employeeId, f);
    setF({ ...f, reason: "", notes: "" });
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" className={inputCls} value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} />
        </Field>
        <Field label="Type">
          <select className={inputCls} value={f.type} onChange={(ev) => setF({ ...f, type: ev.target.value })}>
            {s.warningTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Motif">
        <input className={inputCls} value={f.reason} onChange={(ev) => setF({ ...f, reason: ev.target.value })} placeholder="Ex. retard répété de rapport" />
      </Field>
      <Field label="Détails / suites">
        <textarea className={inputCls} rows={2} value={f.notes} onChange={(ev) => setF({ ...f, notes: ev.target.value })} />
      </Field>
      <div className="flex justify-end">
        <Btn variant="danger" onClick={add}>
          <Plus size={16} />
          Documenter
        </Btn>
      </div>
      <div className="space-y-2 pt-2">
        {(e.warnings || []).length === 0 && <div className="text-sm text-slate-400 text-center py-4">Aucun avertissement.</div>}
        {[...(e.warnings || [])].reverse().map((w) => (
          <div key={w.id} className="p-3 rounded-lg border border-rose-100 bg-rose-50/40">
            <div className="flex items-center gap-2">
              <Badge tone="rose">{w.type}</Badge>
              <span className="text-xs text-slate-500">{new Date(w.date).toLocaleDateString("fr-FR")}</span>
            </div>
            <p className="text-sm text-slate-800 mt-1 font-medium">{w.reason}</p>
            {w.notes && <p className="text-sm text-slate-600 mt-1">{w.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
