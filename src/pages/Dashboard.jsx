import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Users, Wallet, Landmark, Bell, ChevronRight, Clock, ClipboardCheck, FileText } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Kpi } from "../components/ui/Kpi";
import { BRAND, BRAND_DK, BRAND_WASH, AMBER, ROSE } from "../lib/tokens";
import { fmt } from "../lib/format";
import { getAlerts, getSummary } from "../api/dashboard";

const MiniStat = ({ label, value, strong }) => (
  <div className={"rounded-lg px-3 py-2 " + (strong ? "" : "bg-slate-50")} style={strong ? { background: BRAND_WASH } : {}}>
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className="text-sm font-semibold tabular-nums" style={strong ? { color: BRAND_DK } : {}}>
      {value}
    </div>
  </div>
);

const PIE = [BRAND, "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6"];

export default function Dashboard({ onGoto }) {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getSummary(), getAlerts()])
      .then(([s, a]) => {
        if (cancelled) return;
        setSummary(s);
        setAlerts(Array.isArray(a) ? a : []);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Impossible de charger le tableau de bord.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;
  if (error) return <div className="text-sm text-rose-600 py-10 text-center">{error}</div>;
  if (!summary) return null;

  const byCompany = summary.byCompany || [];
  const byCountry = summary.byCountry || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Effectif actif"
          value={summary.activeEmployees}
          icon={Users}
          hint={`${summary.companiesCount} sociétés · ${summary.countriesCount} pays`}
        />
        <Kpi
          label="Masse salariale brute / mois"
          value={"≈ " + fmt(summary.brutRef, summary.refCurrency)}
          icon={Wallet}
          hint="consolidé, taux indicatif"
        />
        <Kpi
          label="Coût employeur / mois"
          value={"≈ " + fmt(summary.costRef, summary.refCurrency)}
          icon={Landmark}
          hint="brut + charges patronales"
          accent
        />
        <Kpi
          label="Alertes à traiter"
          value={alerts.length}
          icon={Bell}
          hint="essais, évaluations, dossiers, documents"
          tone={alerts.length ? "amber" : "slate"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900">Coût par structure</h3>
            <span className="text-xs text-slate-400">devise locale</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Effectif, masse salariale brute, nette et coût employeur — par société.
          </p>
          <div className="space-y-3">
            {byCompany.map((r) => (
              <button
                key={r.companyId}
                onClick={() => onGoto("employees", r.companyId)}
                className="w-full text-left rounded-xl border border-slate-200 p-4 hover:border-[#E31E3D] transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">{r.flag}</span>
                  <div>
                    <div className="font-medium text-slate-900">{r.companyName}</div>
                    <div className="text-xs text-slate-500">
                      {r.countryName} · {r.count} salarié{r.count > 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-300" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Brut" value={fmt(r.brut, r.currency)} />
                  <MiniStat label="Net" value={fmt(r.net, r.currency)} />
                  <MiniStat label="Coût employeur" value={fmt(r.cost, r.currency)} strong />
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Effectif par pays</h3>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCountry} dataKey="count" nameKey="name" innerRadius={42} outerRadius={65} paddingAngle={2}>
                  {byCountry.map((_, i) => (
                    <Cell key={i} fill={PIE[i % PIE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {byCountry.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                <span className="text-slate-600">{c.name}</span>
                <span className="ml-auto font-medium tabular-nums">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">
          Masse salariale brute vs coût employeur (consolidé, {summary.refCurrency})
        </h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byCompany.map((r) => ({
                name: r.companyName,
                Brut: Math.round(r.brutRef),
                "Coût employeur": Math.round(r.costRef),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F4" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip formatter={(v) => fmt(v, summary.refCurrency)} />
              <Bar dataKey="Brut" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Coût employeur" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} style={{ color: AMBER }} />
          <h3 className="font-semibold text-slate-900">Alertes RH</h3>
          <span className="text-xs text-slate-400">({alerts.length})</span>
        </div>
        {alerts.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">Aucune alerte. Tout est à jour.</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <span className="shrink-0">
                  {a.type === "essai" ? (
                    <Clock size={16} style={{ color: a.tone === "rose" ? ROSE : AMBER }} />
                  ) : a.type === "eval" ? (
                    <ClipboardCheck size={16} style={{ color: a.tone === "rose" ? ROSE : BRAND }} />
                  ) : a.type === "doc" ? (
                    <FileText size={16} style={{ color: a.tone === "rose" ? ROSE : AMBER }} />
                  ) : (
                    <FileText size={16} style={{ color: AMBER }} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {a.who} <span className="text-slate-400 font-normal">· {a.company}</span>
                  </div>
                  <div className="text-xs text-slate-500">{a.text}</div>
                </div>
                <Badge tone={a.tone}>
                  {a.type === "essai" ? "Essai" : a.type === "eval" ? "Évaluation" : a.type === "doc" ? "Document" : a.type === "contrat" ? "Contrat" : "Dossier"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
