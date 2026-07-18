import { useEffect, useState } from "react";
import { Plus, Pencil, Users, FileText, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { DocList } from "../components/DocList";
import { inputCls, BRAND } from "../lib/tokens";
import { listCompanies, createCompany, updateCompany, addCompanyDocument, deleteCompanyDocument } from "../api/companies";
import { listCountries } from "../api/countries";
import { listEmployees } from "../api/employees";
import { getSettings } from "../api/settings";

const BLANK = { name: "", countryCode: "MG", nif: "", rcs: "", employerNumber: "", address: "", documents: [] };

export default function Companies({ onOpen }) {
  const [companies, setCompanies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [docsFor, setDocsFor] = useState(null);

  const load = () => {
    setLoading(true);
    return Promise.all([listCompanies(), listCountries(), listEmployees(), getSettings()])
      .then(([c, ct, e, s]) => {
        setCompanies(c || []);
        setCountries(ct || []);
        setEmployees(e || []);
        setSettings(s || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const countryOf = (code) => countries.find((c) => c.code === code);

  const save = async () => {
    if (!form.name.trim()) return;
    if (modal === "new") await createCompany(form);
    else await updateCompany(form.id, form);
    setModal(null);
    load();
  };

  const addDoc = async (doc) => {
    await addCompanyDocument(docsFor, doc);
    load();
  };
  const removeDoc = async (docId) => {
    await deleteCompanyDocument(docsFor, docId);
    load();
  };

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Chaque société est rattachée à un pays qui porte sa devise et ses règles.</p>
        <Btn
          onClick={() => {
            setForm(BLANK);
            setModal("new");
          }}
        >
          <Plus size={16} />
          Nouvelle société
        </Btn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => {
          const ct = countryOf(c.countryCode);
          const n = employees.filter((e) => e.companyId === c.id && e.status !== "Sorti").length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ct?.flag}</span>
                  <div>
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {ct?.name} · {ct?.currency}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setForm(c);
                    setModal("edit");
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <Pencil size={15} />
                </button>
              </div>
              {c.nif && (
                <div className="mt-3 text-sm text-slate-600">
                  NIF : <span className="text-slate-800">{c.nif}</span>
                </div>
              )}
              {c.address && <div className="text-slate-500 text-xs mt-1">{c.address}</div>}
              <div className="mt-4 flex items-center justify-between">
                <Badge tone="teal">
                  <Users size={12} />
                  {n} salarié{n > 1 ? "s" : ""}
                </Badge>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDocsFor(c.id)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
                    <FileText size={13} />
                    Docs ({(c.documents || []).length})
                  </button>
                  <button onClick={() => onOpen(c.id)} className="text-sm font-medium flex items-center gap-1" style={{ color: BRAND }}>
                    Équipe <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nouvelle société" : "Modifier la société"}>
        <div className="space-y-4">
          <Field label="Nom de la société">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pays">
              <select className={inputCls} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })}>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="NIF">
              <input className={inputCls} value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="RCS">
              <input className={inputCls} value={form.rcs} onChange={(e) => setForm({ ...form, rcs: e.target.value })} />
            </Field>
            <Field label="N° employeur">
              <input className={inputCls} value={form.employerNumber} onChange={(e) => setForm({ ...form, employerNumber: e.target.value })} />
            </Field>
          </div>
          <Field label="Adresse">
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Annuler
            </Btn>
            <Btn onClick={save}>Enregistrer</Btn>
          </div>
        </div>
      </Modal>
      {docsFor && (
        <Modal open onClose={() => setDocsFor(null)} title="Documents de la société">
          <DocList
            categories={settings?.documentCategories || []}
            items={companies.find((c) => c.id === docsFor)?.documents || []}
            onAdd={addDoc}
            onRemove={removeDoc}
          />
        </Modal>
      )}
    </div>
  );
}
