import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { BRAND, BRAND_DK } from "../../lib/tokens";
import logo from "../../assets/logo.png";
import AgentWeek from "./AgentWeek";
import AgentMonth from "./AgentMonth";
import AgentRequests from "./AgentRequests";

const TABS = [
  ["semaine", "Ma semaine"],
  ["mois", "Mon mois"],
  ["demandes", "Mes demandes"],
];

export default function AgentApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("semaine");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F4F6F8", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" }}>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
        <img src={logo} alt="Thara Services" className="h-9 w-auto" />
        <h1 className="text-lg font-semibold text-slate-900">Mon planning</h1>
        <div className="ml-auto flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</div>
            <div className="text-[11px] text-slate-400 leading-tight">Agent Control Room</div>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="w-9 h-9 rounded-lg grid place-items-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto">
        <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap"
              style={tab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "semaine" && <AgentWeek />}
        {tab === "mois" && <AgentMonth />}
        {tab === "demandes" && <AgentRequests />}
      </main>
    </div>
  );
}
