import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { addDaysISO, DSHORT, fmtShort, isoWeekNum, mondayISOof, todayISO } from "../../lib/planningDates";
import { getMySchedule } from "../../api/planning";
import { ApiError } from "../../api/client";

const LABEL = { J: "Jour", N: "Nuit", R: "Repos", ABS: "Absence", "": "—" };
const HOURS = { J: "07h30 – 17h30", N: "17h30 – 07h30" };

export default function AgentWeek() {
  const [weekStart, setWeekStart] = useState(() => mondayISOof(todayISO()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getMySchedule(weekStart));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement du planning.");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    reload();
  }, [reload]);

  const employee = data?.roster?.[0];
  const employeeId = employee?.id;
  const values = employeeId ? data.grid[employeeId] || [] : [];
  const rooms = data?.rooms || [];
  const homeRoomId = employee?.room_id;
  const distinctRoomNames = [...new Set(rooms.filter((r) => r).map((r) => r.name))];
  const isMultiRoom = distinctRoomNames.length > 1;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Ma semaine</h2>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-md border border-slate-300 text-sm" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>
            ‹
          </button>
          <b className="min-w-[190px] text-center inline-block text-sm">
            {fmtShort(weekStart)} – {fmtShort(addDaysISO(weekStart, 6))} · S{isoWeekNum(weekStart)}
          </b>
          <button className="w-8 h-8 rounded-md border border-slate-300 text-sm" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>
            ›
          </button>
          <Btn variant="outline" onClick={() => setWeekStart(mondayISOof(todayISO()))}>
            Cette semaine
          </Btn>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {isMultiRoom && (
        <div className="mb-3 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">
          Cette semaine, tu es réparti(e) entre plusieurs salles : {distinctRoomNames.join(" · ")}.
        </div>
      )}

      {loading || !data ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {data.dates.map((iso, d) => {
            const val = values[d] || "";
            const room = rooms[d];
            const away = room && homeRoomId && room.id !== homeRoomId;
            return (
              <div key={iso} className="border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{DSHORT[d]}</div>
                <div className="text-xs text-slate-500 mb-2">{fmtShort(iso)}</div>
                <div
                  className={
                    "text-lg font-bold rounded-md py-1.5 " +
                    (val === "J"
                      ? "bg-[#e6f5ec] text-[#1f9d55]"
                      : val === "N"
                        ? "bg-[#e6e9f2] text-[#2b3a67]"
                        : val === "ABS"
                          ? "bg-[#fce8ea] text-[#E31E3D]"
                          : "bg-slate-50 text-slate-400")
                  }
                >
                  {val || "·"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{LABEL[val] || "—"}</div>
                {HOURS[val] && <div className="text-[10px] text-slate-400">{HOURS[val]}</div>}
                {away && room && <div className="text-[10px] text-[#E31E3D] mt-1">Salle {room.name}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
