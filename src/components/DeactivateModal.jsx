import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Btn } from "./ui/Btn";
import { inputCls } from "../lib/tokens";

/**
 * Captures why an employee is being deactivated (démission, licenciement,
 * rupture de période d'essai, etc.) — used wherever a "Désactiver" action
 * is offered, so a departure is never recorded without a reason on file.
 */
export function DeactivateModal({ employee, exitReasons, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState(exitReasons?.[0] || "Démission");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const canSave = reason && notes.trim();

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onConfirm({ exitDate: date, exitReason: reason, exitNotes: notes.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Désactiver ${employee.firstName} ${employee.lastName}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date de sortie">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Motif">
            <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
              {(exitReasons?.length ? exitReasons : ["Démission", "Licenciement", "Autre"]).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Détails (obligatoire)">
          <textarea
            className={inputCls + (!notes.trim() ? " border-rose-300" : "")}
            rows={4}
            placeholder="Précisez les circonstances : contexte, échanges avec le salarié, décision finale…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>
            Annuler
          </Btn>
          <Btn variant="danger" disabled={!canSave || saving} onClick={submit}>
            {saving ? "Enregistrement…" : "Confirmer la sortie"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
