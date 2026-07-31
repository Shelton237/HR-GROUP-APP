import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { inputCls, inputClsAuto } from "../../lib/tokens";
import { addDaysISO, fmtShort, isoWeekNum, mondayISOof, todayISO, weekParity } from "../../lib/planningDates";
import { getRoomSchedule, listPlanningAgents, patchScheduleCell, resetWeek, addLoan, removeLoan } from "../../api/planning";
import { PlanningGrid, Legend } from "./PlanningGrid";
import { ApiError } from "../../api/client";

const CYCLE_ORDER = ["", "J", "N", "R"];
const nextValue = (current) => CYCLE_ORDER[(CYCLE_ORDER.indexOf(current) + 1) % CYCLE_ORDER.length];

function WeekNav({ weekStart, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={inputClsAuto + " px-3 py-1.5"} onClick={() => onChange(addDaysISO(weekStart, -7))}>
        ‹
      </button>
      <b className="min-w-[230px] text-center inline-block text-sm">
        {fmtShort(weekStart)} – {fmtShort(addDaysISO(weekStart, 6))} · S{isoWeekNum(weekStart)} (
        {weekParity(weekStart) ? "impaire" : "paire"})
      </b>
      <button type="button" className={inputClsAuto + " px-3 py-1.5"} onClick={() => onChange(addDaysISO(weekStart, 7))}>
        ›
      </button>
      <Btn variant="outline" onClick={() => onChange(mondayISOof(todayISO()))}>
        Cette semaine
      </Btn>
    </div>
  );
}

export default function WeekTab({ rooms, currentRoomId, setCurrentRoomId, weekStart, setWeekStart }) {
  const [schedule, setSchedule] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [crossEmployeeId, setCrossEmployeeId] = useState("");

  const reload = useCallback(async () => {
    if (!currentRoomId) return;
    setLoading(true);
    setError("");
    try {
      const [sched, emps] = await Promise.all([getRoomSchedule(currentRoomId, weekStart), listPlanningAgents()]);
      setSchedule(sched);
      setAllEmployees(emps);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement du planning.");
    } finally {
      setLoading(false);
    }
  }, [currentRoomId, weekStart]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCellClick = async (employeeId, dayIndex, current) => {
    if (!currentRoomId) return;
    try {
      const updated = await patchScheduleCell(currentRoomId, weekStart, employeeId, dayIndex, nextValue(current));
      setSchedule(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la mise à jour de la cellule.");
    }
  };

  const handleReset = async () => {
    if (!currentRoomId) return;
    if (!confirm("Réinitialiser cette semaine sur la proposition automatique ?")) return;
    try {
      await resetWeek(currentRoomId, weekStart);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la réinitialisation.");
    }
  };

  const handleAssignCross = async () => {
    if (!currentRoomId || !crossEmployeeId) return;
    try {
      await addLoan(currentRoomId, weekStart, crossEmployeeId);
      setCrossEmployeeId("");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'affectation du renfort.");
    }
  };

  const handleUnassign = async (employeeId) => {
    if (!currentRoomId) return;
    try {
      await removeLoan(currentRoomId, weekStart, employeeId);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors du retrait du renfort.");
    }
  };

  if (!rooms.length) {
    return (
      <Card className="p-4">
        <div className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-md p-4">
          Crée une salle dans l'onglet « Salles ».
        </div>
      </Card>
    );
  }

  const otherEmployees = allEmployees.filter(
    (e) => e.room_id !== currentRoomId && !schedule?.roster.some((r) => r.id === e.id)
  );

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">Planning de la semaine</h2>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {schedule && !schedule.roster.some((e) => e.type === "fixed_day") && (
        <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">
          Aucun agent fixe dans cette salle — chaque salle doit en avoir un (rôle de contrôle).
        </div>
      )}

      <div className="flex gap-3 items-end flex-wrap mb-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Salle</label>
          <select className={inputCls} value={currentRoomId ?? ""} onChange={(e) => setCurrentRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Semaine</label>
          <WeekNav weekStart={weekStart} onChange={setWeekStart} />
        </div>
        <Btn variant="outline" onClick={handleReset}>
          ↺ Réinitialiser (proposition auto)
        </Btn>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 text-sm mb-3 text-amber-900">
        Le planning J-N-R est <b>proposé automatiquement</b> chaque semaine. Les absences validées apparaissent en rouge et
        creusent la couverture → comble alors le trou avec un renfort ci-dessous. Clique une cellule pour ajuster (J→N→R→vide).
      </div>

      <Legend />

      {loading || !schedule ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        <div className="overflow-x-auto">
          <PlanningGrid schedule={schedule} onCellClick={handleCellClick} onUnassign={handleUnassign} />
        </div>
      )}

      <h3 className="text-sm font-semibold mt-5 mb-2 text-slate-900">Affecter un renfort (absence)</h3>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-[2] min-w-[220px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Agent d&apos;une autre salle</label>
          <select className={inputCls} value={crossEmployeeId} onChange={(e) => setCrossEmployeeId(e.target.value)}>
            <option value="">Aucun</option>
            {otherEmployees.map((e) => {
              const r = rooms.find((rm) => rm.id === e.room_id);
              return (
                <option key={e.id} value={e.id}>
                  {e.name} ({r ? r.name : "?"})
                </option>
              );
            })}
          </select>
        </div>
        <Btn disabled={!crossEmployeeId} onClick={handleAssignCross}>
          + Affecter cette semaine
        </Btn>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Le renfort apparaît « prêté » pour cette semaine ; clique ses cellules pour le positionner (Jour/Nuit). Fonctionne dans
        les deux sens entre salles.
      </p>
    </Card>
  );
}
