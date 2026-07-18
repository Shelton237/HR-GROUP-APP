import { useEffect, useState } from "react";
import { Clock, Check } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { DocList } from "../../components/DocList";
import { BRAND, BRAND_DK } from "../../lib/tokens";
import { addMonths, monthNow } from "../../lib/format";
import { getEmployee, updateEmployee, setChecklistItem, addDocument, deleteDocument } from "../../api/employees";
import InfosTab from "./InfosTab";
import OnboardTab from "./OnboardTab";
import EvalTab from "./EvalTab";
import WarnTab from "./WarnTab";
import PayTab from "./PayTab";

export default function EmployeeDetail({ employeeId, settings: s, countryOf, companyById, onClose, onChanged }) {
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState("infos");

  const refresh = () =>
    getEmployee(employeeId).then((e) => {
      setEmployee(e);
      onChanged();
    });

  useEffect(() => {
    getEmployee(employeeId).then(setEmployee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  if (!employee) return null;
  const e = employee;
  const comp = companyById(e.companyId);
  const ct = countryOf(comp?.countryCode);
  const m = monthNow();

  // Optimistic field patch for free-typing inputs: update locally right away,
  // persist to the API in the background (no forced refetch, so focus/caret
  // position in text inputs isn't disturbed on every keystroke).
  const patch = (fields) => {
    setEmployee((prev) => ({ ...prev, ...fields }));
    updateEmployee(e.id, fields).catch(() => {});
  };

  const tabs = [
    { id: "infos", label: "Informations" },
    { id: "dossier", label: "Dossier & pièces" },
    { id: "onboard", label: "Intégration" },
    { id: "eval", label: "Évaluations" },
    { id: "warn", label: "Avertissements" },
    { id: "docs", label: "Archivage" },
    { id: "pay", label: "Rémunération" },
  ];

  return (
    <Modal open onClose={onClose} wide title={`${e.firstName} ${e.lastName} — ${e.poste}`}>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Badge tone="teal">
          {ct?.flag} {comp?.name}
        </Badge>
        <Badge>{e.contractType}</Badge>
        {e.status === "Période d'essai" && e.hireDate && (
          <Badge tone="amber">
            <Clock size={12} />
            Essai → {addMonths(e.hireDate, e.probationMonths || 3).toLocaleDateString("fr-FR")}
          </Badge>
        )}
        <div className="ml-auto text-sm text-slate-500">
          Embauché le {e.hireDate ? new Date(e.hireDate).toLocaleDateString("fr-FR") : "—"}
        </div>
      </div>
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "infos" && <InfosTab e={e} s={s} patch={patch} employeeId={e.id} onChanged={refresh} />}
      {tab === "dossier" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">
            Checklist du pays <strong>{ct?.name}</strong>. Elle se configure dans « Pays & fiscalité ».
          </p>
          {(ct?.checklist || []).map((c) => (
            <label key={c.key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#E31E3D]"
                checked={!!e.checklist?.[c.key]}
                onChange={(ev) => {
                  const checked = ev.target.checked;
                  setEmployee((prev) => ({ ...prev, checklist: { ...(prev.checklist || {}), [c.key]: checked } }));
                  setChecklistItem(e.id, c.key, checked).catch(() => {});
                }}
              />
              <span className={"text-sm " + (e.checklist?.[c.key] ? "text-slate-800" : "text-slate-500")}>{c.label}</span>
              {e.checklist?.[c.key] && <Check size={15} className="ml-auto text-emerald-600" />}
            </label>
          ))}
        </div>
      )}
      {tab === "onboard" && <OnboardTab e={e} s={s} employeeId={e.id} onChanged={refresh} />}
      {tab === "eval" && <EvalTab e={e} s={s} employeeId={e.id} onChanged={refresh} />}
      {tab === "warn" && <WarnTab e={e} s={s} employeeId={e.id} onChanged={refresh} />}
      {tab === "docs" && (
        <DocList
          items={e.documents || []}
          categories={s.documentCategories}
          onAdd={(doc) => addDocument(e.id, doc).then(refresh)}
          onRemove={(docId) => deleteDocument(e.id, docId).then(refresh)}
        />
      )}
      {tab === "pay" && <PayTab e={e} s={s} ct={ct} m={m} patch={patch} employeeId={e.id} onChanged={refresh} />}
    </Modal>
  );
}
