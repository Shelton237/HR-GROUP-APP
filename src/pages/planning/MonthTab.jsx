import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { inputCls } from "../../lib/tokens";
import { fmtShort, isoWeekNum, monthWeeks, shiftMonthAnchor } from "../../lib/planningDates";
import { getRoomSchedule } from "../../api/planning";
import { PlanningGrid } from "./PlanningGrid";
import { ApiError } from "../../api/client";

export default function MonthTab({ rooms, currentRoomId, setCurrentRoomId, monthAnchor, setMonthAnchor }) {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { weeks, monthName } = monthWeeks(monthAnchor);

  const reload = useCallback(async () => {
    if (!currentRoomId) return;
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(weeks.map((w) => getRoomSchedule(currentRoomId, w)));
      const map = {};
      weeks.forEach((w, i) => {
        map[w] = results[i];
      });
      setSchedules(map);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement du mois.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoomId, monthAnchor]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!rooms.length) {
    return (
      <Card className="p-4">
        <div className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-md p-4">
          Crée une salle dans l'onglet « Salles ».
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3 items-end flex-wrap mb-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Salle</label>
          <select className={inputCls} value={currentRoomId ?? ""} onChange={(e) => setCurrentRoomId(Number(e.target.value))}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Mois</label>
          <div className="flex items-center gap-2">
            <Btn variant="outline" onClick={() => setMonthAnchor(shiftMonthAnchor(monthAnchor, -1))}>
              ‹
            </Btn>
            <b className="capitalize min-w-[160px] inline-block text-center text-sm">{monthName}</b>
            <Btn variant="outline" onClick={() => setMonthAnchor(shiftMonthAnchor(monthAnchor, 1))}>
              ›
            </Btn>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-3">
        Vue mensuelle, proposée automatiquement semaine par semaine. Couverture Jour/Nuit en bas de chaque semaine.
      </p>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        weeks.map((w) => {
          const sched = schedules[w];
          if (!sched) return null;
          return (
            <div key={w} className="mb-4">
              <h4 className="text-[13.5px] font-semibold mb-1.5 text-slate-800">
                Semaine du {fmtShort(sched.dates[0])} (S{isoWeekNum(w)})
              </h4>
              <div className="overflow-x-auto">
                <PlanningGrid schedule={sched} readOnly />
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
