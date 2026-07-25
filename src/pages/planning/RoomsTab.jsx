import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls } from "../../lib/tokens";
import { createRoom, deleteRoom, listPlanningEmployees, updateRoom } from "../../api/planning";
import { ApiError } from "../../api/client";

export default function RoomsTab({ rooms, loading, error: loadError, reload }) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({});
  const [hasFixed, setHasFixed] = useState({});

  useEffect(() => {
    listPlanningEmployees()
      .then((employees) => {
        const nextCounts = {};
        const nextHasFixed = {};
        for (const e of employees) {
          nextCounts[e.room_id] = (nextCounts[e.room_id] || 0) + 1;
          if (e.type === "fixed_day") nextHasFixed[e.room_id] = true;
        }
        setCounts(nextCounts);
        setHasFixed(nextHasFixed);
      })
      .catch(() => {});
  }, [rooms]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createRoom(name);
      setNewName("");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la création de la salle.");
    }
  };

  const handleRename = async (id, current) => {
    const name = prompt("Nouveau nom de la salle", current);
    if (!name || !name.trim()) return;
    try {
      await updateRoom(id, name.trim());
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du renommage.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette salle ?")) return;
    try {
      await deleteRoom(id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la suppression.");
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-1 text-slate-900">Salles de contrôle</h2>
      <p className="text-sm text-slate-500 mb-3">
        Format verrouillé : <b>service de quart 24/7</b>, rotation stricte Jour · Nuit · Repos pour les agents tournants (3
        binômes), plus l&apos;agent jour fixe qui rejoint un seul agent en Jour le temps que ça coïncide. Jamais plus de 2
        agents simultanément en Jour, ni plus de 2 en Nuit. Chaque salle doit avoir un agent fixe.
      </p>

      {(error || loadError) && (
        <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">
          {error || loadError}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        <table className="border-collapse w-full text-sm mb-4">
          <thead>
            <tr>
              {["Salle", "Mode", "Effectif", ""].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 text-sm p-3 border border-slate-200">
                  Aucune salle
                </td>
              </tr>
            ) : (
              rooms.map((r) => (
                <tr key={r.id}>
                  <td className="border border-slate-200 px-2 py-1.5 font-semibold">
                    {r.name}
                    {!hasFixed[r.id] && (
                      <span className="ml-2">
                        <Badge tone="rose">Aucun agent fixe</Badge>
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">Quart 24/7 – J · N · R</td>
                  <td className="border border-slate-200 px-2 py-1.5">{counts[r.id] || 0} employés</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                    <button className="text-[#E31E3D] underline text-xs mr-3" onClick={() => handleRename(r.id, r.name)}>
                      Renommer
                    </button>
                    <button className="text-[#E31E3D] underline text-xs" onClick={() => handleDelete(r.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h3 className="text-sm font-semibold mb-2 text-slate-900">Ajouter une salle</h3>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Nom</label>
          <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex : Talatamaty" />
        </div>
        <Btn onClick={handleAdd}>+ Ajouter</Btn>
      </div>
    </Card>
  );
}
