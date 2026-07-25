import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputCls } from "../../lib/tokens";
import { getMyAbsences, requestMyPermission } from "../../api/planning";
import { ApiError } from "../../api/client";

const STATUS_BADGE = {
  enregistree: ["green", "Enregistrée"],
  en_attente: ["amber", "En attente"],
  refusee: ["rose", "Refusée"],
};

function hoursUntil(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00").getTime();
  return (start - Date.now()) / 3600000;
}

export default function AgentRequests() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      setHistory(await getMyAbsences());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const hours = hoursUntil(startDate);
  const willBeRefused = hours !== null && hours < 48;

  const handleSubmit = async () => {
    if (!startDate) return;
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const absence = await requestMyPermission({ start_date: startDate, end_date: endDate || undefined, reason: reason || undefined });
      setResult(absence);
      setStartDate("");
      setEndDate("");
      setReason("");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-1 text-slate-900">Mes demandes de permission</h2>
      <p className="text-sm text-slate-500 mb-3">
        Toute demande soumise à moins de 48h de son début est refusée automatiquement. Une demande valable reste « en attente »
        jusqu'à validation par ton responsable.
      </p>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {result && (
        <div
          className={
            "mb-4 text-sm rounded-md px-3 py-2 border " +
            (result.status === "refusee"
              ? "text-[#E31E3D] bg-[#fce8ea] border-[#E31E3D]/30"
              : "text-amber-900 bg-amber-50 border-amber-200")
          }
        >
          {result.status === "refusee"
            ? "Demande refusée automatiquement : elle a été soumise à moins de 48h du début."
            : "Demande envoyée, en attente de validation par ton responsable."}
        </div>
      )}

      <div className="flex gap-3 items-end flex-wrap mb-2">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Début</label>
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Fin (optionnel)</label>
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Motif</label>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Btn disabled={!startDate || submitting} onClick={handleSubmit}>
          {submitting ? "Envoi…" : "Envoyer la demande"}
        </Btn>
      </div>
      {willBeRefused && (
        <div className="mb-4 text-xs text-[#E31E3D]">
          ⚠ Moins de 48h avant le début — cette demande sera automatiquement refusée si tu l'envoies maintenant.
        </div>
      )}

      <h3 className="text-sm font-semibold mt-5 mb-2 text-slate-900">Historique</h3>
      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : history.length === 0 ? (
        <div className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-md p-4">
          Aucune demande
        </div>
      ) : (
        <table className="border-collapse w-full text-sm">
          <thead>
            <tr>
              {["Période", "Motif", "Statut"].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((a) => {
              const [tone, label] = STATUS_BADGE[a.status] || ["slate", a.status];
              return (
                <tr key={a.id}>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {a.startDate}
                    {a.endDate !== a.startDate ? ` → ${a.endDate}` : ""}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-500">{a.reason || "—"}</td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <Badge tone={tone}>{label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
