import { inputCls } from "../../lib/tokens";
import { Field } from "../../components/ui/Field";
import { updateOnboarding, updateEmployee } from "../../api/employees";

export default function OnboardTab({ e, s, employeeId, onChanged }) {
  const onboarding = e.onboarding || { templateId: "", steps: {}, decision: "" };
  const tpl = s.onboardingTemplates.find((t) => t.id === onboarding.templateId);

  const selectTemplate = (templateId) => updateOnboarding(employeeId, { templateId, steps: {}, decision: "" }).then(onChanged);

  const toggleStep = (i, done) => {
    const steps = { ...(onboarding.steps || {}), [i]: { done, date: done ? new Date().toISOString().slice(0, 10) : "" } };
    updateOnboarding(employeeId, { ...onboarding, steps }).then(onChanged);
  };

  const setDecision = async (decision) => {
    await updateOnboarding(employeeId, { ...onboarding, decision });
    if (decision === "Confirmation" && e.status === "Période d'essai") {
      await updateEmployee(employeeId, { status: "Actif" });
    }
    onChanged();
  };

  return (
    <div className="space-y-4">
      <Field label="Parcours d'intégration">
        <select className={inputCls} value={onboarding.templateId || ""} onChange={(ev) => selectTemplate(ev.target.value)}>
          <option value="">— Choisir un parcours —</option>
          {s.onboardingTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      {!tpl && (
        <p className="text-sm text-slate-400">
          Sélectionnez un parcours. Les modèles se créent dans « Paramètres → Parcours d'intégration ».
        </p>
      )}
      {tpl && (
        <div className="space-y-2">
          {tpl.steps.map((st, i) => {
            const done = onboarding.steps?.[i]?.done;
            return (
              <div key={i} className="p-3 rounded-lg border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={!!done} onChange={(ev) => toggleStep(i, ev.target.checked)} />
                  <span className="text-xs text-slate-400 w-24">{st.phase}</span>
                  <span className={"text-sm " + (done ? "text-slate-800" : "text-slate-500")}>{st.label}</span>
                  {done && (
                    <span className="ml-auto text-xs text-emerald-600">
                      validé le {new Date(onboarding.steps[i].date).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </label>
              </div>
            );
          })}
          <div className="pt-2">
            <Field label="Décision de fin de parcours">
              <select className={inputCls} value={onboarding.decision || ""} onChange={(ev) => setDecision(ev.target.value)}>
                <option value="">—</option>
                <option>Confirmation — poursuite du contrat</option>
                <option>Poursuite avec plan d'amélioration</option>
                <option>Alerte Direction</option>
              </select>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
