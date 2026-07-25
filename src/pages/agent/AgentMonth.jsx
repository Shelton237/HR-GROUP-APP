import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { DSHORT, fmtShort, isoWeekNum, monthWeeks, shiftMonthAnchor, todayISO } from "../../lib/planningDates";
import { getMySchedule } from "../../api/planning";
import { ApiError } from "../../api/client";

const CELL_STYLE = {
  J: "bg-[#e6f5ec] text-[#1f9d55]",
  N: "bg-[#e6e9f2] text-[#2b3a67]",
  R: "bg-[#f0f0f2] text-[#9aa0a6]",
  ABS: "bg-[#fce8ea] text-[#E31E3D]",
  "": "bg-white text-slate-300",
};

export default function AgentMonth() {
  const [monthAnchor, setMonthAnchor] = useState(() => todayISO());
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { weeks, monthName } = monthWeeks(monthAnchor);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(weeks.map((w) => getMySchedule(w)));
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
  }, [monthAnchor]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Mon mois</h2>
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

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : (
        weeks.map((w) => {
          const sched = schedules[w];
          if (!sched) return null;
          const employee = sched.roster?.[0];
          const values = employee ? sched.grid[employee.id] || [] : [];
          return (
            <div key={w} className="mb-4">
              <h4 className="text-[13.5px] font-semibold mb-1.5 text-slate-800">
                Semaine du {fmtShort(sched.dates[0])} (S{isoWeekNum(w)})
              </h4>
              <div className="overflow-x-auto">
                <table className="border-collapse w-full text-sm">
                  <thead>
                    <tr>
                      {sched.dates.map((iso, i) => (
                        <th key={iso} className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
                          {DSHORT[i]} <span className="font-normal">{fmtShort(iso)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {values.map((val, d) => (
                        <td key={d} className={"border border-slate-200 px-2 py-1.5 text-center font-bold " + CELL_STYLE[val]}>
                          {val || "·"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
