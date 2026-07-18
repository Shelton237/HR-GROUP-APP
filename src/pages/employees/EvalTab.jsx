import { useState } from "react";
import { Plus } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls, BRAND, BRAND_DK } from "../../lib/tokens";
import { addEvaluation, updateEmployee } from "../../api/employees";

export default function EvalTab({ e, s, employeeId, onChanged }) {
  const [tplId, setTplId] = useState(s.evalTemplates[0]?.id || "");
  const tpl = s.evalTemplates.find((t) => t.id === tplId);
  const [scores, setScores] = useState({});
  const [dec, setDec] = useState(s.evalDecisions[0]);
  const [notes, setNotes] = useState("");

  const total = tpl ? Math.round(tpl.criteria.reduce((sum, c) => sum + ((Number(scores[c.label]) || 0) / 5) * c.weight, 0)) : 0;

  const add = async () => {
    await addEvaluation(employeeId, {
      templateId: tplId,
      date: new Date().toISOString().slice(0, 10),
      scores: { ...scores },
      total,
      decision: dec,
      notes,
      evaluator: "",
    });
    if (dec === "Confirmation" && e.status === "Période d'essai") {
      await updateEmployee(employeeId, { status: "Actif" });
    }
    setScores({});
    setNotes("");
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Grille d'évaluation">
          <select
            className={inputCls}
            value={tplId}
            onChange={(ev) => {
              setTplId(ev.target.value);
              setScores({});
            }}
          >
            {s.evalTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Décision">
          <select className={inputCls} value={dec} onChange={(ev) => setDec(ev.target.value)}>
            {s.evalDecisions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      {tpl && (
        <div className="rounded-lg border border-slate-100 p-3 space-y-2">
          {tpl.criteria.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 flex-1">
                {c.label} <span className="text-xs text-slate-400">({c.weight}%)</span>
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScores({ ...scores, [c.label]: n })}
                    className="w-7 h-7 rounded-md text-xs font-medium"
                    style={(scores[c.label] || 0) >= n ? { background: BRAND, color: "#fff" } : { background: "#F1F5F9", color: "#94A3B8" }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-700">Note globale</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: BRAND_DK }}>
              {total}/100
            </span>
          </div>
        </div>
      )}
      <Field label="Observations">
        <textarea className={inputCls} rows={2} value={notes} onChange={(ev) => setNotes(ev.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Btn onClick={add}>
          <Plus size={16} />
          Enregistrer l'évaluation
        </Btn>
      </div>
      <div className="space-y-2 pt-2">
        {(e.evaluations || []).length === 0 && <div className="text-sm text-slate-400 text-center py-4">Aucune évaluation.</div>}
        {[...(e.evaluations || [])].reverse().map((ev) => {
          const t = s.evalTemplates.find((x) => x.id === ev.templateId);
          return (
            <div key={ev.id} className="p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Badge tone="teal">{t?.name || "Évaluation"}</Badge>
                <span className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString("fr-FR")}</span>
                <Badge tone={ev.decision === "Rupture" ? "rose" : ev.decision === "Confirmation" ? "green" : "amber"}>{ev.decision}</Badge>
                {ev.total != null && (
                  <span className="ml-auto text-sm font-semibold tabular-nums" style={{ color: BRAND_DK }}>
                    {ev.total}/100
                  </span>
                )}
              </div>
              {ev.notes && <p className="text-sm text-slate-600 mt-2">{ev.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
