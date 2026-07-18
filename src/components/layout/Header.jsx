import { useEffect, useState } from "react";
import { fmt } from "../../lib/format";
import { getSummary } from "../../api/dashboard";
import { NAV } from "../../lib/nav";

function ConsolidatedPill({ refreshKey }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSummary()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!summary) return null;
  return (
    <div className="hidden md:flex items-center gap-4 text-sm">
      <div className="text-right">
        <div className="text-[11px] text-slate-400 leading-none">Coût employeur / mois (consolidé)</div>
        <div className="font-semibold text-slate-900 tabular-nums">≈ {fmt(summary.costRef, summary.refCurrency)}</div>
      </div>
      <div className="w-px h-8 bg-slate-200" />
      <div className="text-right">
        <div className="text-[11px] text-slate-400 leading-none">Effectif actif</div>
        <div className="font-semibold text-slate-900 tabular-nums">{summary.activeEmployees}</div>
      </div>
    </div>
  );
}

export function Header({ view }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <h1 className="text-lg font-semibold text-slate-900">{NAV.find((n) => n.id === view)?.label}</h1>
      <div className="ml-auto">
        <ConsolidatedPill refreshKey={view} />
      </div>
    </header>
  );
}
