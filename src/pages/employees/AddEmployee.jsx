import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Btn } from "../../components/ui/Btn";
import { inputCls } from "../../lib/tokens";
import { createEmployee } from "../../api/employees";

export default function AddEmployee({ companies, settings: s, onClose, onCreated, defaultCompany }) {
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    poste: s.postes[0] || "",
    companyId: defaultCompany || companies[0]?.id,
    contractType: "Période d'essai",
    hireDate: new Date().toISOString().slice(0, 10),
    salaryBrut: 0,
    probationMonths: 3,
    department: "",
    site: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!f.firstName.trim() || !f.lastName.trim()) return;
    setSaving(true);
    try {
      await createEmployee({ ...f, salaryBrut: Number(f.salaryBrut) || 0 });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle embauche" wide>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom">
          <input className={inputCls} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
        </Field>
        <Field label="Nom">
          <input className={inputCls} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
        </Field>
        <Field label="Société">
          <select className={inputCls} value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value })}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Poste">
          <select className={inputCls} value={f.poste} onChange={(e) => setF({ ...f, poste: e.target.value })}>
            {s.postes.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Type de contrat">
          <select className={inputCls} value={f.contractType} onChange={(e) => setF({ ...f, contractType: e.target.value })}>
            {s.contractTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Date d'embauche">
          <input type="date" className={inputCls} value={f.hireDate} onChange={(e) => setF({ ...f, hireDate: e.target.value })} />
        </Field>
        <Field label="Salaire brut mensuel">
          <input type="number" className={inputCls} value={f.salaryBrut} onChange={(e) => setF({ ...f, salaryBrut: e.target.value })} />
        </Field>
        <Field label="Période d'essai (mois)">
          <input
            type="number"
            className={inputCls}
            value={f.probationMonths}
            onChange={(e) => setF({ ...f, probationMonths: Number(e.target.value) })}
          />
        </Field>
        <Field label="Département">
          <select className={inputCls} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}>
            <option value="">—</option>
            {s.departments.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Site">
          <select className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })}>
            <option value="">—</option>
            {s.sites.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <Btn variant="ghost" onClick={onClose}>
          Annuler
        </Btn>
        <Btn onClick={save} disabled={saving}>
          Créer le dossier
        </Btn>
      </div>
    </Modal>
  );
}
