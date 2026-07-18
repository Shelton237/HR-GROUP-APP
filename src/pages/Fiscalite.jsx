import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Clock, Globe, Plus, Trash2, CalendarDays, X } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { inputCls, uid, INK, BRAND, BRAND_DK, AMBER } from "../lib/tokens";
import { listCountries, updateCountryBase, updateContributions, updateTax, updateChecklist, updateHolidays } from "../api/countries";
import { getSettings, updateSettings } from "../api/settings";

function ContribBlock({ title, list, country, mut }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <button
          onClick={() => mut((c) => { c[list].push({ label: "Nouvelle cotisation", rate: 0 }); })}
          className="text-xs flex items-center gap-1"
          style={{ color: BRAND }}
        >
          <Plus size={12} />
          Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {country[list].map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={inputCls + " flex-1"}
              value={c.label}
              onChange={(e) => mut((co) => { co[list][i].label = e.target.value; })}
            />
            <div className="relative w-20">
              <input
                className={inputCls + " pr-6"}
                type="number"
                step="0.1"
                value={c.rate}
                onChange={(e) => mut((co) => { co[list][i].rate = Number(e.target.value); })}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
            </div>
            <button onClick={() => mut((co) => { co[list].splice(i, 1); })} className="p-1.5 text-slate-400 hover:text-rose-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {country[list].length === 0 && <div className="text-xs text-slate-400">Aucune cotisation.</div>}
      </div>
    </div>
  );
}

export default function Fiscalite() {
  const [countries, setCountries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [subtab, setSubtab] = useState("paie");
  const [hol, setHol] = useState({ date: "", name: "" });

  useEffect(() => {
    Promise.all([listCountries(), getSettings()])
      .then(([cs, s]) => {
        setCountries(cs || []);
        setSettings(s || null);
        if (cs && cs[0]) setSel(cs[0].code);
      })
      .finally(() => setLoading(false));
  }, []);

  const country = countries.find((c) => c.code === sel);

  // Applies fn to a local draft of the selected country and updates state
  // immediately (optimistic); `persist` decides which dedicated sub-endpoint
  // to call with the resulting draft (the backend has no single "whole
  // country" write endpoint for the JSON-column fields — see api/countries.js).
  const applyLocal = (fn) => {
    const draft = structuredClone(country);
    fn(draft);
    setCountries((prev) => prev.map((c) => (c.code === sel ? draft : c)));
    return draft;
  };
  const mutBase = (fn) => {
    const t = applyLocal(fn);
    updateCountryBase(sel, { validated: t.validated, leaveAccrual: t.leaveAccrual }).catch(() => {});
  };
  const mutContrib = (fn) => {
    const t = applyLocal(fn);
    updateContributions(sel, { employee: t.employee, employer: t.employer }).catch(() => {});
  };
  const mutTax = (fn) => {
    const t = applyLocal(fn);
    updateTax(sel, { tax: t.tax, minTax: t.minTax }).catch(() => {});
  };
  const mutChecklist = (fn) => {
    const t = applyLocal(fn);
    updateChecklist(sel, t.checklist).catch(() => {});
  };
  const mutHolidays = (fn) => {
    const t = applyLocal(fn);
    updateHolidays(sel, t.holidays).catch(() => {});
  };

  const setSettingsField = (fn) => {
    setSettings((prev) => {
      const next = structuredClone(prev);
      fn(next);
      updateSettings(next).catch(() => {});
      return next;
    });
  };

  if (loading || !country || !settings) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-start gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
        <AlertTriangle size={18} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <strong>Valeurs par défaut provisoires.</strong> Faites vérifier taux, barèmes et checklist par votre gestionnaire de paie de
          chaque pays, puis marquez le pays « validé ».
        </div>
      </Card>
      <div className="flex gap-2 flex-wrap">
        {countries.map((c) => (
          <button
            key={c.code}
            onClick={() => setSel(c.code)}
            className="px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2"
            style={sel === c.code ? { background: INK, color: "#fff", borderColor: INK } : { background: "#fff", borderColor: "#E2E8F0", color: "#475569" }}
          >
            <span>{c.flag}</span>
            {c.name}
            {c.validated ? (
              <ShieldCheck size={14} className="text-emerald-400" />
            ) : (
              <Clock size={14} className={sel === c.code ? "text-amber-300" : "text-amber-500"} />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {[["paie", "Cotisations & impôt"], ["checklist", "Checklist d'embauche"], ["holidays", "Jours fériés"]].map(([id, l]) => (
          <button
            key={id}
            onClick={() => setSubtab(id)}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            style={subtab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
          >
            {l}
          </button>
        ))}
      </div>

      {subtab === "paie" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Globe size={16} />
                {country.name}
              </h3>
              <span className="font-medium text-sm">{country.currency}</span>
            </div>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#E31E3D]"
                checked={country.validated}
                onChange={(e) => mutBase((c) => { c.validated = e.target.checked; })}
              />
              <span className="text-sm text-slate-700">Profil validé par le comptable local</span>
              {country.validated && (
                <Badge tone="green">
                  <ShieldCheck size={12} />
                  Validé
                </Badge>
              )}
            </label>
            <ContribBlock title="Cotisations salariales (retenues)" list="employee" country={country} mut={mutContrib} />
            <ContribBlock title="Cotisations patronales (charges employeur)" list="employer" country={country} mut={mutContrib} />
            <div className="mt-4">
              <Field label="Acquisition congés (jours/mois)">
                <input
                  type="number"
                  step="0.1"
                  className={inputCls + " w-32"}
                  value={country.leaveAccrual}
                  onChange={(e) => mutBase((c) => { c.leaveAccrual = Number(e.target.value); })}
                />
              </Field>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Barème de l'impôt sur salaire</h3>
            <p className="text-xs text-slate-500 mb-3">Par tranches sur le salaire imposable. Dernière tranche vide = « au-delà ».</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 px-1 mb-1">
              <span>Jusqu'à ({country.currency})</span>
              <span>Taux (%)</span>
            </div>
            <div className="space-y-2">
              {country.tax.map((b, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="au-delà"
                    value={b.upTo == null ? "" : b.upTo}
                    onChange={(e) => mutTax((c) => { c.tax[i].upTo = e.target.value === "" ? null : Number(e.target.value); })}
                  />
                  <input
                    className={inputCls}
                    type="number"
                    value={b.rate}
                    onChange={(e) => mutTax((c) => { c.tax[i].rate = Number(e.target.value); })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Btn variant="ghost" onClick={() => mutTax((c) => { c.tax.splice(c.tax.length - 1, 0, { upTo: 0, rate: 0 }); })}>
                <Plus size={14} />
                Tranche
              </Btn>
              {country.tax.length > 1 && (
                <Btn variant="ghost" onClick={() => mutTax((c) => { c.tax.pop(); })}>
                  <Trash2 size={14} />
                  Retirer
                </Btn>
              )}
            </div>
            <div className="mt-4">
              <Field label={`Impôt minimum (${country.currency}, 0 si aucun)`}>
                <input
                  className={inputCls}
                  type="number"
                  value={country.minTax || 0}
                  onChange={(e) => mutTax((c) => { c.minTax = Number(e.target.value); })}
                />
              </Field>
            </div>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h3 className="font-semibold text-slate-900 mb-1">Taux de conversion (vue consolidée)</h3>
            <p className="text-xs text-slate-500 mb-3">Pour additionner les masses salariales de plusieurs pays. Indicatif.</p>
            <div className="flex flex-wrap gap-4 items-end">
              <Field label="Devise de référence">
                <input
                  className={inputCls + " w-28"}
                  value={settings.refCurrency}
                  onChange={(e) => setSettingsField((x) => { x.refCurrency = e.target.value.toUpperCase(); })}
                />
              </Field>
              {Object.keys(settings.rates).map((cur) => (
                <Field key={cur} label={`1 ${settings.refCurrency} = ? ${cur}`}>
                  <input
                    className={inputCls + " w-32"}
                    type="number"
                    value={settings.rates[cur]}
                    onChange={(e) => setSettingsField((x) => { x.rates[cur] = Number(e.target.value); })}
                  />
                </Field>
              ))}
            </div>
          </Card>
        </div>
      )}

      {subtab === "checklist" && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Checklist d'embauche — {country.name}</h3>
          <p className="text-xs text-slate-500 mb-4">
            Les pièces exigées à l'embauche dans ce pays. Chaque salarié du pays hérite de cette liste.
          </p>
          <div className="space-y-2">
            {country.checklist.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls + " flex-1"}
                  value={it.label}
                  onChange={(e) => mutChecklist((c) => { c.checklist[i].label = e.target.value; })}
                />
                <button onClick={() => mutChecklist((c) => { c.checklist.splice(i, 1); })} className="p-2 text-slate-400 hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <Btn variant="outline" className="mt-3" onClick={() => mutChecklist((c) => { c.checklist.push({ key: uid("ck"), label: "Nouvelle pièce" }); })}>
            <Plus size={15} />
            Ajouter une pièce
          </Btn>
        </Card>
      )}

      {subtab === "holidays" && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Jours fériés — {country.name}</h3>
          <p className="text-xs text-slate-500 mb-4">Utilisés pour le décompte des congés et la planification.</p>
          <div className="flex items-end gap-2 mb-4 p-3 rounded-lg bg-slate-50">
            <Field label="Date">
              <input type="date" className={inputCls} value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} />
            </Field>
            <Field label="Libellé">
              <input className={inputCls} value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} />
            </Field>
            <Btn
              variant="outline"
              onClick={() => {
                if (hol.date && hol.name) {
                  mutHolidays((c) => { c.holidays = [...(c.holidays || []), { ...hol }].sort((a, b) => a.date.localeCompare(b.date)); });
                  setHol({ date: "", name: "" });
                }
              }}
            >
              <Plus size={15} />
              Ajouter
            </Btn>
          </div>
          <div className="space-y-1">
            {(country.holidays || []).map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                <CalendarDays size={15} className="text-slate-400" />
                <span className="text-slate-500 w-28">{new Date(h.date).toLocaleDateString("fr-FR")}</span>
                <span className="text-slate-800">{h.name}</span>
                <button onClick={() => mutHolidays((c) => { c.holidays.splice(i, 1); })} className="ml-auto text-rose-400 hover:text-rose-600">
                  <X size={15} />
                </button>
              </div>
            ))}
            {(country.holidays || []).length === 0 && <div className="text-sm text-slate-400">Aucun jour férié enregistré.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}
