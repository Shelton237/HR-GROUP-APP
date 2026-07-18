import { useEffect, useState } from "react";
import { INK, INK_SOFT, BRAND, AMBER } from "../../lib/tokens";
import { NAV } from "../../lib/nav";
import { getAlerts } from "../../api/dashboard";
import logo from "../../assets/logo.png";

export function Sidebar({ view, onNavigate }) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAlerts()
      .then((list) => {
        if (!cancelled) setAlertCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {
        if (!cancelled) setAlertCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [view]);

  return (
    <aside className="w-64 shrink-0 flex flex-col text-slate-300" style={{ background: INK }}>
      <div className="px-5 py-5 border-b flex justify-center" style={{ borderColor: "rgba(255,255,255,.08)" }}>
        <img src={logo} alt="Thara Services" className="h-12 w-auto" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const a = view === n.id;
          const I = n.icon;
          return (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
              style={a ? { background: INK_SOFT, color: "#fff", boxShadow: `inset 3px 0 0 ${BRAND}` } : {}}
            >
              <I size={18} className={a ? "text-[#E31E3D]" : "text-slate-400"} />
              <span>{n.label}</span>
              {n.id === "dashboard" && alertCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: AMBER }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 text-[11px] text-slate-500 border-t" style={{ borderColor: "rgba(255,255,255,.08)" }}>
        Connecté à l'API — enregistrement côté serveur.
      </div>
    </aside>
  );
}
