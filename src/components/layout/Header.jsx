import { useEffect, useRef, useState } from "react";
import { LogOut, Bell, Clock, ClipboardCheck, FileText, ChevronRight } from "lucide-react";
import { fmt } from "../../lib/format";
import { getSummary, getAlerts } from "../../api/dashboard";
import { NAV } from "../../lib/nav";
import { useAuth } from "../../auth/useAuth";
import { BRAND, AMBER, ROSE } from "../../lib/tokens";

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

const ALERT_ICON = { essai: Clock, eval: ClipboardCheck, doc: FileText };
const ALERT_LABEL = { essai: "Essai", eval: "Évaluation", doc: "Document", contrat: "Contrat", dossier: "Dossier" };

function NotificationBell({ view, onGoto }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const reload = () => {
    // Operateur has no access to /api/dashboard/* — skip the call entirely
    // rather than surface a 403 in the console.
    if (user?.role === "Operateur") {
      setAlerts([]);
      return;
    }
    getAlerts()
      .then((a) => setAlerts(Array.isArray(a) ? a : []))
      .catch(() => setAlerts([]));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, user?.role]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (user?.role === "Operateur") return null;

  const handleSelect = (a) => {
    setOpen(false);
    if (a.employeeId) onGoto?.("employees", undefined, a.employeeId);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative w-9 h-9 rounded-lg grid place-items-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
      >
        <Bell size={18} />
        {alerts.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold text-white grid place-items-center"
            style={{ background: ROSE }}
          >
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-96 max-h-[28rem] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-900">
            Alertes RH {alerts.length > 0 && <span className="text-slate-400 font-normal">({alerts.length})</span>}
          </div>
          {alerts.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">Aucune alerte. Tout est à jour.</div>
          ) : (
            <div className="p-2 space-y-1">
              {alerts.map((a, i) => {
                const Icon = ALERT_ICON[a.type] || FileText;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(a)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left hover:bg-slate-50 transition"
                  >
                    <Icon size={15} className="shrink-0" style={{ color: a.tone === "rose" ? ROSE : a.tone === "teal" ? BRAND : AMBER }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {a.who} <span className="text-slate-400 font-normal">· {a.company}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{a.text}</div>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-slate-400">{ALERT_LABEL[a.type] || ""}</span>
                    <ChevronRight size={13} className="shrink-0 text-slate-300" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
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

export function Header({ view, onGoto }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <h1 className="text-lg font-semibold text-slate-900">{NAV.find((n) => n.id === view)?.label}</h1>
      <div className="ml-auto flex items-center gap-4">
        <ConsolidatedPill refreshKey={view} />
        <NotificationBell view={view} onGoto={onGoto} />
        <UserMenu />
      </div>
    </header>
  );
}
