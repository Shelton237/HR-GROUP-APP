import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Btn } from "./ui/Btn";
import { inputCls } from "../lib/tokens";

/**
 * "Supprimer" a employee: a permanent archive (see api/employees.js
 * archiveEmployee), not a hard delete. There is no undo, so this asks the
 * admin to type the employee's full name before enabling the action —
 * a stronger gate than the plain confirm() used for the reversible
 * Désactiver/Réactiver toggle.
 */
export function ArchiveEmployeeModal({ employee, onClose, onConfirm }) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const canConfirm = typed.trim().toLowerCase() === fullName.trim().toLowerCase();

  const submit = async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      await onConfirm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Supprimer ${fullName}`}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 bg-rose-50">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">
            <strong>Action définitive.</strong> Le salarié sera archivé et retiré de toutes les listes actives
            (effectif, paie, alertes). Contrairement à « Désactiver », il n'y a{" "}
            <strong>aucune possibilité de réactivation</strong>. L'historique (évaluations, congés, paie) est
            conservé mais ne sera plus consultable depuis les listes courantes.
          </div>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 mb-1 block">
            Tapez <strong>{fullName}</strong> pour confirmer
          </span>
          <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>
            Annuler
          </Btn>
          <Btn variant="danger" disabled={!canConfirm || saving} onClick={submit}>
            {saving ? "Suppression…" : "Supprimer définitivement"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
