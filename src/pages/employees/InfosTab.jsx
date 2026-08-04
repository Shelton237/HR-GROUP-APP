import { useEffect, useState } from "react";
import { Phone, Plus, Trash2, Building2, AlertTriangle, ArrowRight } from "lucide-react";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { Modal } from "../../components/ui/Modal";
import { inputCls, AMBER, BRAND_DK } from "../../lib/tokens";
import { listEmployees, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "../../api/employees";
import { listCompanies } from "../../api/companies";
import { useAuth } from "../../auth/useAuth";

export default function InfosTab({ e, s, patch, employeeId, onChanged }) {
  const { user } = useAuth();
  const [colleagues, setColleagues] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pendingTransfer, setPendingTransfer] = useState(null); // { target, crossCountry } | null
  const [transferring, setTransferring] = useState(false);
  useEffect(() => {
    listEmployees().then((list) => setColleagues(list || []));
    if (user?.role === "Admin") listCompanies().then((list) => setCompanies(list || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => patch({ [k]: v });
  const cnt = e.emergencyContacts || [];

  const currentCompany = companies.find((c) => c.id === e.companyId);
  const requestTransfer = (newCompanyId) => {
    if (!newCompanyId || newCompanyId === e.companyId) return;
    const target = companies.find((c) => c.id === newCompanyId);
    if (!target) return;
    const crossCountry = !!(currentCompany && target.countryCode !== currentCompany.countryCode);
    setPendingTransfer({ target, crossCountry });
  };
  const confirmTransfer = async () => {
    if (!pendingTransfer) return;
    setTransferring(true);
    try {
      set("companyId", pendingTransfer.target.id);
      setPendingTransfer(null);
      // The transfer can also touch the checklist server-side — refetch the
      // full employee rather than trust the generic optimistic patch() here.
      setTimeout(() => onChanged?.(), 300);
    } finally {
      setTransferring(false);
    }
  };

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
          {user?.role === "Admin" && (
            <Field label="Société">
              <select className={inputCls} value={e.companyId} onChange={(ev) => requestTransfer(ev.target.value)}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.countryCode})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Building2 size={11} />
                Transfert immédiat, sans recréer le dossier — réservé aux administrateurs.
              </p>
            </Field>
          )}
          <Field label="Type de contrat">
            <select
              className={inputCls}
              value={e.contractType}
              onChange={(ev) => {
                set("contractType", ev.target.value);
                if (ev.target.value !== "Stage") set("internshipType", "");
              }}
            >
              {s.contractTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {e.contractType === "Stage" && (
            <Field label="Type de stage">
              <select className={inputCls} value={e.internshipType || ""} onChange={(ev) => set("internshipType", ev.target.value)}>
                <option value="">—</option>
                <option value="Académique">Académique</option>
                <option value="Professionnel">Professionnel</option>
              </select>
            </Field>
          )}
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

      <Modal open={!!pendingTransfer} onClose={() => setPendingTransfer(null)} title="Transférer ce salarié">
        {pendingTransfer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1 rounded-lg border border-slate-200 p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-0.5">Actuellement</div>
                <div className="font-semibold text-slate-800">{currentCompany?.name}</div>
                <div className="text-xs text-slate-500">{currentCompany?.countryCode}</div>
              </div>
              <ArrowRight size={18} className="text-slate-300 shrink-0" />
              <div className="flex-1 rounded-lg border-2 p-3 text-center" style={{ borderColor: BRAND_DK }}>
                <div className="text-[11px] text-slate-400 mb-0.5">Nouvelle société</div>
                <div className="font-semibold" style={{ color: BRAND_DK }}>
                  {pendingTransfer.target.name}
                </div>
                <div className="text-xs text-slate-500">{pendingTransfer.target.countryCode}</div>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              <strong>
                {e.firstName} {e.lastName}
              </strong>{" "}
              va être transféré{"·"}e vers <strong>{pendingTransfer.target.name}</strong>. Le dossier complet — évaluations,
              avertissements, documents, congés, heures sup., historique de paie — reste intact, seule la société change.
            </p>

            {pendingTransfer.crossCountry && (
              <div className="flex gap-2 p-3 rounded-lg border" style={{ borderColor: AMBER, background: "#FFFBEB" }}>
                <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div className="text-xs text-amber-900 space-y-1">
                  <p>
                    <strong>Changement de pays</strong> ({currentCompany?.countryCode} → {pendingTransfer.target.countryCode}) : le
                    salaire ({e.salaryBrut?.toLocaleString("fr-FR")}, dans la devise de {currentCompany?.countryCode}) reste
                    inchangé tel quel — pense à le corriger manuellement dans la devise du nouveau pays.
                  </p>
                  <p>La checklist de dossier sera complétée avec les pièces requises dans le nouveau pays, sans rien supprimer de l'existant.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setPendingTransfer(null)}>
                Annuler
              </Btn>
              <Btn onClick={confirmTransfer} disabled={transferring}>
                {transferring ? "Transfert…" : "Confirmer le transfert"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
