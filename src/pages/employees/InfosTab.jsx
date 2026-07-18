import { useEffect, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { inputCls } from "../../lib/tokens";
import { listEmployees, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "../../api/employees";

export default function InfosTab({ e, s, patch, employeeId, onChanged }) {
  const [colleagues, setColleagues] = useState([]);
  useEffect(() => {
    listEmployees().then((list) => setColleagues(list || []));
  }, []);

  const set = (k, v) => patch({ [k]: v });
  const cnt = e.emergencyContacts || [];

  const addContact = () => addEmergencyContact(employeeId, { name: "", relationship: "", phone: "", phone2: "", address: "" }).then(onChanged);
  const patchContact = (i, fields) => {
    const c = cnt[i];
    if (!c) return;
    updateEmergencyContact(employeeId, c.id, { ...c, ...fields }).catch(() => {});
  };
  const removeContact = (i) => {
    const c = cnt[i];
    if (!c) return;
    deleteEmergencyContact(employeeId, c.id).then(onChanged);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">État civil & administratif</h4>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Matricule">
            <input className={inputCls} value={e.matricule} onChange={(ev) => set("matricule", ev.target.value)} />
          </Field>
          <Field label="Sexe">
            <select className={inputCls} value={e.gender} onChange={(ev) => set("gender", ev.target.value)}>
              <option value="">—</option>
              <option>Masculin</option>
              <option>Féminin</option>
            </select>
          </Field>
          <Field label="Date de naissance">
            <input type="date" className={inputCls} value={e.birthDate} onChange={(ev) => set("birthDate", ev.target.value)} />
          </Field>
          <Field label="Situation familiale">
            <select className={inputCls} value={e.maritalStatus} onChange={(ev) => set("maritalStatus", ev.target.value)}>
              <option value="">—</option>
              <option>Célibataire</option>
              <option>Marié(e)</option>
              <option>Divorcé(e)</option>
              <option>Veuf(ve)</option>
            </select>
          </Field>
          <Field label="Personnes à charge">
            <input type="number" className={inputCls} value={e.dependents} onChange={(ev) => set("dependents", Number(ev.target.value))} />
          </Field>
          <Field label="Nationalité">
            <input className={inputCls} value={e.nationality} onChange={(ev) => set("nationality", ev.target.value)} />
          </Field>
          <Field label="CIN / pièce d'identité">
            <input className={inputCls} value={e.cin} onChange={(ev) => set("cin", ev.target.value)} />
          </Field>
          <Field label="N° CNaPS / CNPS">
            <input className={inputCls} value={e.socialNumber} onChange={(ev) => set("socialNumber", ev.target.value)} />
          </Field>
          <Field label="Catégorie">
            <select className={inputCls} value={e.category} onChange={(ev) => set("category", ev.target.value)}>
              <option value="">—</option>
              {s.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Coordonnées & paiement</h4>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Téléphone">
            <input className={inputCls} value={e.phone} onChange={(ev) => set("phone", ev.target.value)} />
          </Field>
          <Field label="E-mail">
            <input className={inputCls} value={e.email} onChange={(ev) => set("email", ev.target.value)} />
          </Field>
          <Field label="Adresse">
            <input className={inputCls} value={e.address} onChange={(ev) => set("address", ev.target.value)} />
          </Field>
          <Field label="Compte bancaire">
            <input className={inputCls} value={e.bankAccount} onChange={(ev) => set("bankAccount", ev.target.value)} />
          </Field>
          <Field label="Mobile Money">
            <input className={inputCls} value={e.mobileMoney} onChange={(ev) => set("mobileMoney", ev.target.value)} />
          </Field>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Poste & rattachement</h4>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type de contrat">
            <select className={inputCls} value={e.contractType} onChange={(ev) => set("contractType", ev.target.value)}>
              {s.contractTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {e.contractType === "CDD" && (
            <Field label="Fin de CDD">
              <input type="date" className={inputCls} value={e.contractEndDate} onChange={(ev) => set("contractEndDate", ev.target.value)} />
            </Field>
          )}
          <Field label="Département">
            <select className={inputCls} value={e.department} onChange={(ev) => set("department", ev.target.value)}>
              <option value="">—</option>
              {s.departments.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Site">
            <select className={inputCls} value={e.site} onChange={(ev) => set("site", ev.target.value)}>
              <option value="">—</option>
              {s.sites.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Responsable (N+1)">
            <select className={inputCls} value={e.managerId} onChange={(ev) => set("managerId", ev.target.value)}>
              <option value="">—</option>
              {colleagues
                .filter((x) => x.id !== e.id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.firstName} {x.lastName}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Phone size={15} />
            Contacts d'urgence
          </h4>
          {cnt.length < (s.maxEmergencyContacts || 2) && (
            <Btn variant="outline" onClick={addContact}>
              <Plus size={14} />
              Ajouter
            </Btn>
          )}
        </div>
        {cnt.length === 0 && <div className="text-sm text-slate-400">Aucun contact d'urgence.</div>}
        <div className="space-y-3">
          {cnt.map((c, i) => (
            <div key={c.id || i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom complet">
                  <input
                    className={inputCls}
                    defaultValue={c.name}
                    onBlur={(ev) => patchContact(i, { name: ev.target.value })}
                  />
                </Field>
                <Field label="Lien de parenté">
                  <input
                    className={inputCls}
                    defaultValue={c.relationship}
                    onBlur={(ev) => patchContact(i, { relationship: ev.target.value })}
                  />
                </Field>
                <Field label="Téléphone">
                  <input className={inputCls} defaultValue={c.phone} onBlur={(ev) => patchContact(i, { phone: ev.target.value })} />
                </Field>
                <Field label="Téléphone 2">
                  <input className={inputCls} defaultValue={c.phone2} onBlur={(ev) => patchContact(i, { phone2: ev.target.value })} />
                </Field>
                <div className="col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="Adresse">
                      <input className={inputCls} defaultValue={c.address} onBlur={(ev) => patchContact(i, { address: ev.target.value })} />
                    </Field>
                  </div>
                  <button onClick={() => removeContact(i)} className="p-2 mb-0.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {s.customFields.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Informations complémentaires</h4>
          <div className="grid grid-cols-3 gap-3">
            {s.customFields.map((cf) => (
              <Field key={cf.id} label={cf.label}>
                {cf.type === "select" ? (
                  <select
                    className={inputCls}
                    value={e.custom?.[cf.id] || ""}
                    onChange={(ev) => set("custom", { ...(e.custom || {}), [cf.id]: ev.target.value })}
                  >
                    <option value="">—</option>
                    {cf.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={cf.type === "number" ? "number" : cf.type === "date" ? "date" : "text"}
                    className={inputCls}
                    value={e.custom?.[cf.id] || ""}
                    onChange={(ev) => set("custom", { ...(e.custom || {}), [cf.id]: ev.target.value })}
                  />
                )}
              </Field>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Ces champs se gèrent dans « Paramètres → Champs personnalisés ».</p>
        </div>
      )}
    </div>
  );
}
