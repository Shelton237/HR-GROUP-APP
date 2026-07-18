import { Card } from "./Card";
import { INK, BRAND, BRAND_WASH, AMBER } from "../../lib/tokens";

/* Shared KPI tile — used by Dashboard and Payroll views. */
export function Kpi({ label, value, icon: Icon, hint, accent, tone }) {
  return (
    <Card className="p-5" style={accent ? { background: INK, borderColor: INK } : {}}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className={"text-xs font-medium " + (accent ? "text-slate-300" : "text-slate-500")}>{label}</div>
          <div className={"text-2xl font-semibold mt-1 tabular-nums " + (accent ? "text-white" : "text-slate-900")}>
            {value}
          </div>
          {hint && <div className="text-[11px] mt-1 text-slate-400">{hint}</div>}
        </div>
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: accent ? "rgba(255,255,255,.1)" : tone === "amber" ? "#FEF3C7" : BRAND_WASH }}
        >
          <Icon size={18} style={{ color: accent ? "#fff" : tone === "amber" ? AMBER : BRAND }} />
        </div>
      </div>
    </Card>
  );
}
