import { useEffect, useState } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { BRAND_DK } from "../../lib/tokens";
import { listLeaves, patchLeaveStatus } from "../../api/leaves";

export default function LeavesTab({ e, employeeId, onChanged }) {
  const [leaves, setLeaves] = useState(null);

  const reload = () => listLeaves({ employeeId }).then((l) => setLeaves(l || []));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const setStatus = async (id, status) => {
    await patchLeaveStatus(id, status);
    await reload();
    onChanged?.();
  };

  if (!leaves) return <div className="text-sm text-slate-400 py-6 text-center">Chargement…</div>;

  const sorted = [...leaves].sort((a, b) => (b.start || "").localeCompare(a.start || ""));

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays size={15} />
          Solde de congés
        </div>
        <div className="text-lg font-bold tabular-nums" style={{ color: BRAND_DK }}>
          {(e.leaveBalance || 0).toFixed(1)} j
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Période</th>
              <th className="px-4 py-3 font-medium text-right">Jours</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <Badge>{l.type}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {l.start && new Date(l.start).toLocaleDateString("fr-FR")} → {l.end && new Date(l.end).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{l.days}</td>
                <td className="px-4 py-3">
                  <Badge tone={l.status === "Validé" ? "green" : l.status === "Refusé" ? "rose" : "amber"}>{l.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{l.notes || "—"}</td>
                <td className="px-4 py-3 text-right">
                  {l.status === "Demandé" && (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setStatus(l.id, "Validé")}
                        title="Accepter"
                        className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setStatus(l.id, "Refusé")}
                        title="Refuser"
                        className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Aucune demande de congé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
