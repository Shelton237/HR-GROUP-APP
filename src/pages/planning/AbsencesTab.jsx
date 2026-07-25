import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls } from "../../lib/tokens";
import {
  listAbsences,
  createAbsence,
  createPermission,
  deleteAbsence,
  approveAbsence,
  rejectAbsence,
  listPlanningAgents,
} from "../../api/planning";
import { ApiError } from "../../api/client";

const STATUS_BADGE = {
  enregistree: ["green", "Enregistrée"],
  en_attente: ["amber", "En attente"],
  refusee: ["rose", "Refusée"],
};

export default function AbsencesTab() {
  const [absences, setAbsences] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [kind, setKind] = useState("absence"); // "absence" | "permission"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const [abs, ags] = await Promise.all([listAbsences(), listPlanningAgents()]);
      setAbsences(abs);
      setAgents(ags);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement des absences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async () => {
    if (!employeeId || !startDate) return;
    setError("");
    try {
      const payload = { employee_id: employeeId, start_date: startDate, end_date: endDate || undefined, reason: reason || undefined };
      if (kind === "absence") await createAbsence(payload);
      else await createPermission(payload);
      setEmployeeId("");
      setStartDate("");
      setEndDate("");
      setReason("");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la création.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    try {
      await deleteAbsence(id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la suppression.");
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveAbsence(id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la validation.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectAbsence(id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du rejet.");
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-1 text-slate-900">Absences &amp; permissions</h2>
      <p className="text-sm text-slate-500 mb-3">
        Les demandes soumises par un agent lui-même restent « en attente » jusqu'à validation ou rejet ici. Toute permission à
        moins de 48h de son début est refusée automatiquement, saisie manager comme agent.
      </p>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        <table className="border-collapse w-full text-sm mb-4">
          <thead>
            <tr>
              {["Salarié", "Période", "Type", "Motif", "Statut", ""].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {absences.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 text-sm p-3 border border-slate-200">
                  Aucune entrée
                </td>
              </tr>
            ) : (
              absences.map((a) => {
                const [tone, label] = STATUS_BADGE[a.status] || ["slate", a.status];
                return (
                  <tr key={a.id}>
                    <td className="border border-slate-200 px-2 py-1.5 font-semibold">
                      {a.Employee ? `${a.Employee.firstName} ${a.Employee.lastName}` : a.employeeId}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5">
                      {a.startDate}
                      {a.endDate !== a.startDate ? ` → ${a.endDate}` : ""}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5">{a.type === "absence" ? "Absence" : "Permission"}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-slate-500">{a.reason || "—"}</td>
                    <td className="border border-slate-200 px-2 py-1.5">
                      <Badge tone={tone}>{label}</Badge>
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                      {a.status === "en_attente" && (
                        <>
                          <button className="text-emerald-600 underline text-xs mr-3" onClick={() => handleApprove(a.id)}>
                            Approuver
                          </button>
                          <button className="text-[#E31E3D] underline text-xs mr-3" onClick={() => handleReject(a.id)}>
                            Rejeter
                          </button>
                        </>
                      )}
                      <button className="text-slate-400 underline text-xs" onClick={() => handleDelete(a.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      <h3 className="text-sm font-semibold mb-2 text-slate-900">Nouvelle entrée</h3>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-[2] min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Agent</label>
          <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Choisir…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="absence">Absence (immédiate)</option>
            <option value="permission">Permission (règle 48h)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Début</label>
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Fin (optionnel)</label>
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Motif</label>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Btn disabled={!employeeId || !startDate} onClick={handleCreate}>
          + Ajouter
        </Btn>
      </div>
    </Card>
  );
}
