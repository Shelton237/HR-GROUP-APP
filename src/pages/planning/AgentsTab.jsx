import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { inputCls } from "../../lib/tokens";
import {
  listPlanningAgents,
  createPlanningAgent,
  updatePlanningAgent,
  deletePlanningAgent,
  createAgentAccount,
  listEmployeeCandidates,
} from "../../api/planning";
import { ApiError } from "../../api/client";

export default function AgentsTab({ rooms }) {
  const [agents, setAgents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState("rotation");

  const [accountResult, setAccountResult] = useState(null); // { name, password, emailSent } | null

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const [ag, emps] = await Promise.all([listPlanningAgents(), listEmployeeCandidates()]);
      setAgents(ag);
      setEmployees(emps);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement des agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agentEmployeeIds = new Set(agents.map((a) => a.id));
  const availableEmployees = employees.filter((e) => !agentEmployeeIds.has(e.id));

  const handleAdd = async () => {
    if (!employeeId || !roomId) return;
    setError("");
    try {
      await createPlanningAgent({ employee_id: employeeId, room_id: roomId, type });
      setEmployeeId("");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'ajout de l'agent.");
    }
  };

  const handleRoomChange = async (agent, newRoomId) => {
    try {
      await updatePlanningAgent(agent.profile_id, { room_id: newRoomId });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du changement de salle.");
    }
  };

  const handleTypeChange = async (agent, newType) => {
    try {
      await updatePlanningAgent(agent.profile_id, { type: newType });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du changement de type.");
    }
  };

  const handleRemove = async (agent) => {
    if (!confirm(`Retirer ${agent.name} du planning Control Room ? (son dossier salarié RH n'est pas affecté)`)) return;
    try {
      await deletePlanningAgent(agent.profile_id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du retrait.");
    }
  };

  const handleCreateAccount = async (agent) => {
    setError("");
    try {
      const result = await createAgentAccount(agent.profile_id);
      if (result.reason === "no_email") {
        setError(`${agent.name} n'a pas d'e-mail renseigné dans son dossier RH — impossible de créer un accès.`);
      } else if (result.reason === "email_already_used") {
        setError(`L'e-mail de ${agent.name} est déjà utilisé par un autre compte.`);
      } else {
        setAccountResult({ name: agent.name, email: agent.email, password: result.password, emailSent: result.email_sent });
      }
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la création de l'accès.");
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-1 text-slate-900">Agents du planning</h2>
      <p className="text-sm text-slate-500 mb-3">
        Un agent Control Room est un salarié RH existant, avec un profil planning (salle, type, cycle). Retirer un agent d'ici
        n'affecte pas son dossier salarié.
      </p>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        <table className="border-collapse w-full text-sm mb-4">
          <thead>
            <tr>
              {["Agent", "Salle", "Type", "Compte", ""].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 text-sm p-3 border border-slate-200">
                  Aucun agent
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr key={a.profile_id}>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-slate-400">{a.email || "e-mail manquant"}</div>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <select className={inputCls} value={a.room_id} onChange={(e) => handleRoomChange(a, e.target.value)}>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <select className={inputCls} value={a.type} onChange={(e) => handleTypeChange(a, e.target.value)}>
                      <option value="rotation">Rotation (J/N/R)</option>
                      <option value="fixed_day">Jour fixe (contrôle)</option>
                    </select>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {a.has_account ? (
                      <Badge tone="green">Actif</Badge>
                    ) : (
                      <button className="text-[#E31E3D] underline text-xs" onClick={() => handleCreateAccount(a)}>
                        Créer un accès agent
                      </button>
                    )}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                    <button className="text-[#E31E3D] underline text-xs" onClick={() => handleRemove(a)}>
                      Retirer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h3 className="text-sm font-semibold mb-2 text-slate-900">Ajouter un agent</h3>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-[2] min-w-[220px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Salarié</label>
          <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Choisir…</option>
            {availableEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Salle</label>
          <select className={inputCls} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">Choisir…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="rotation">Rotation (J/N/R)</option>
            <option value="fixed_day">Jour fixe (contrôle)</option>
          </select>
        </div>
        <Btn disabled={!employeeId || !roomId} onClick={handleAdd}>
          + Ajouter
        </Btn>
      </div>

      <Modal open={!!accountResult} onClose={() => setAccountResult(null)} title="Accès agent créé">
        {accountResult && (
          <div className="space-y-3 text-sm">
            <p>
              Compte créé pour <b>{accountResult.name}</b> ({accountResult.email}).
            </p>
            <p className={accountResult.emailSent ? "text-emerald-700" : "text-[#E31E3D]"}>
              {accountResult.emailSent
                ? "L'e-mail de bienvenue avec les identifiants a été envoyé."
                : "L'envoi de l'e-mail a échoué — communique le mot de passe ci-dessous manuellement."}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <div className="text-xs text-slate-500 mb-1">Mot de passe provisoire (affiché une seule fois)</div>
              <div className="font-mono text-base font-semibold">{accountResult.password}</div>
            </div>
            <Btn onClick={() => setAccountResult(null)}>Fermer</Btn>
          </div>
        )}
      </Modal>
    </Card>
  );
}
