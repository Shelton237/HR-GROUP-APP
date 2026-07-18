import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { fmt } from "../../lib/format";
import { getSummary } from "../../api/dashboard";
import { NAV } from "../../lib/nav";
import { useAuth } from "../../auth/useAuth";

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

function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
      <div className="text-right">
        <div className="text-sm font-medium text-slate-900 leading-tight">{user.name}</div>
        <div className="text-[11px] text-slate-400 leading-tight">{user.role}</div>
      </div>
      <button
        onClick={logout}
        title="Se déconnecter"
        className="w-9 h-9 rounded-lg grid place-items-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
      >
        <LogOut size={17} />
      </button>
    </div>
  );
}

export function Header({ view }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <h1 className="text-lg font-semibold text-slate-900">{NAV.find((n) => n.id === view)?.label}</h1>
      <div className="ml-auto flex items-center gap-4">
        <ConsolidatedPill refreshKey={view} />
        <UserMenu />
      </div>
    </header>
  );
}
