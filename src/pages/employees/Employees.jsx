import { useEffect, useState } from "react";
import { Search, Plus, Check, AlertTriangle, UserX, UserCheck, Trash2, Wallet, Building2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { Badge } from "../../components/ui/Badge";
import { inputClsAuto } from "../../lib/tokens";
import { fmt } from "../../lib/format";
import { listEmployees, updateEmployee, archiveEmployee } from "../../api/employees";
import { listCompanies } from "../../api/companies";
import { listCountries } from "../../api/countries";
import { getSettings } from "../../api/settings";
import { DeactivateModal } from "../../components/DeactivateModal";
import { ArchiveEmployeeModal } from "../../components/ArchiveEmployeeModal";
import EmployeeDetail from "./EmployeeDetail";
import AddEmployee from "./AddEmployee";

export default function Employees({ companyFilter, setCompanyFilter, openEmployeeId, onOpenedEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = (includeArchived = showArchived) => {
    setLoading(true);
    return Promise.all([listEmployees({ includeArchived }), listCompanies(), listCountries(), getSettings()])
      .then(([e, c, ct, s]) => {
        setEmployees(e || []);
        setCompanies(c || []);
        setCountries(ct || []);
        setSettings(s || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(showArchived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  // Deep-link from elsewhere (e.g. clicking a Dashboard alert) — open that
  // employee's fiche directly, then clear the request so it doesn't reopen.
  useEffect(() => {
    if (!openEmployeeId) return;
    setDetail(openEmployeeId);
    onOpenedEmployee?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEmployeeId]);

  const companyById = (id) => companies.find((c) => c.id === id);
  const countryOf = (code) => countries.find((c) => c.code === code);

  const toggleActive = (ev, e) => {
    ev.stopPropagation();
    if (e.status === "Sorti") {
      if (!confirm(`Confirmer : réactiver ${e.firstName} ${e.lastName} ?`)) return;
      updateEmployee(e.id, { status: "Actif", exitDate: null, exitReason: null, exitNotes: null }).then(load);
    } else {
      setDeactivateTarget(e);
    }
  };
  const confirmDeactivate = async (fields) => {
    await updateEmployee(deactivateTarget.id, { status: "Sorti", ...fields });
    setDeactivateTarget(null);
    load();
  };
  const confirmArchive = async () => {
    await archiveEmployee(archiveTarget.id);
    setArchiveTarget(null);
    load();
  };

  const list = employees.filter((e) => {
    if (companyFilter && e.companyId !== companyFilter) return false;
    const q = search.toLowerCase();
    return !q || `${e.firstName} ${e.lastName} ${e.poste}`.toLowerCase().includes(q);
  });

  // Only gate on the very first load: any subsequent load() call (e.g. the
  // onChanged→refresh chain from an open employee profile — accepting a
  // leave, adding a warning, etc.) must not unmount this whole page, or the
  // profile modal it's currently showing would unmount with it and lose its
  // selected tab.
  if (!settings) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={inputClsAuto + " pl-9 w-64"}
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className={inputClsAuto + " pl-8 w-56"}
            value={companyFilter || ""}
            onChange={(e) => setCompanyFilter(e.target.value || null)}
          >
            <option value="">Toutes les sociétés</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="accent-[#E31E3D]" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Afficher les salariés supprimés
        </label>
        <div className="ml-auto">
          <Btn onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Embaucher
          </Btn>
        </div>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 font-medium">Salarié</th>
              <th className="px-4 py-3 font-medium">Société</th>
              <th className="px-4 py-3 font-medium">Contrat</th>
              <th className="px-4 py-3 font-medium text-right">Brut / mois</th>
              <th className="px-4 py-3 font-medium">Dossier</th>
              <th className="px-4 py-3 font-medium">Paiement</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const comp = companyById(e.companyId);
              const ct = countryOf(comp?.countryCode);
              const checklistTotal = (ct?.checklist || []).length;
              const missing = (ct?.checklist || []).filter((c) => !e.checklist?.[c.key]).length;
              const pct = checklistTotal ? Math.round(((checklistTotal - missing) / checklistTotal) * 100) : 100;
              return (
                <tr
                  key={e.id}
                  onClick={() => setDetail(e.id)}
                  className={"border-b border-slate-100 cursor-pointer " + (e.archived ? "opacity-60 hover:bg-slate-50" : "hover:bg-[#E31E3D]/5")}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {e.firstName} {e.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{e.poste}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ct?.flag} {comp?.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{e.contractType}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(e.salaryBrut, ct?.currency || "")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      {missing === 0 ? (
                        <Badge tone="green">
                          <Check size={12} />
                          Complet
                        </Badge>
                      ) : (
                        <Badge tone="amber">
                          <AlertTriangle size={12} />
                          {missing} manquant{missing > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-500 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1 w-20 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#E31E3D" }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {e.payments?.[0]?.paid ? (
                      <Badge tone="green">
                        <Check size={12} />
                        Payé
                      </Badge>
                    ) : (
                      <Badge tone="rose">
                        <Wallet size={12} />
                        Non payé
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.archived ? (
                      <Badge>Supprimé</Badge>
                    ) : e.status === "Période d'essai" ? (
                      <Badge tone="amber">Essai</Badge>
                    ) : e.status === "Sorti" ? (
                      <Badge tone="rose">Sorti</Badge>
                    ) : (
                      <Badge tone="green">Actif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!e.archived && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(ev) => toggleActive(ev, e)}
                          title={e.status === "Sorti" ? "Réactiver" : "Désactiver"}
                          className={
                            "p-1.5 rounded-md " +
                            (e.status === "Sorti" ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50")
                          }
                        >
                          {e.status === "Sorti" ? <UserCheck size={15} /> : <UserX size={15} />}
                        </button>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setArchiveTarget(e);
                          }}
                          title="Supprimer (archivage définitif)"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Aucun salarié.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      {detail && (
        <EmployeeDetail
          employeeId={detail}
          settings={settings}
          countryOf={countryOf}
          companyById={companyById}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      )}
      {addOpen && (
        <AddEmployee
          companies={companies}
          settings={settings}
          onClose={() => setAddOpen(false)}
          onCreated={load}
          defaultCompany={companyFilter}
        />
      )}
      {deactivateTarget && (
        <DeactivateModal
          employee={deactivateTarget}
          exitReasons={settings.exitReasons}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={confirmDeactivate}
        />
      )}
      {archiveTarget && (
        <ArchiveEmployeeModal employee={archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={confirmArchive} />
      )}
    </div>
  );
}
