import { useEffect, useMemo, useState } from "react";
import { Search, Plus, KeyRound, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field } from "../components/ui/Field";
import { inputCls } from "../lib/tokens";
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from "../api/users";
import { listCompanies } from "../api/companies";
import { ApiError } from "../api/client";

const ROLES = ["Admin", "RH", "Operateur", "Manager", "Lecture", "Agent"];
const ROLE_BADGE = {
  Admin: "rose",
  RH: "green",
  Operateur: "blue",
  Manager: "amber",
  Lecture: "slate",
  Agent: "teal",
};

function emptyForm() {
  return { name: "", email: "", phone: "", role: "Lecture", scope: "all", companyIds: [] };
}

function userToForm(u) {
  return {
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    scope: u.scope === "all" ? "all" : "custom",
    companyIds: Array.isArray(u.scope) ? u.scope : [],
  };
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalUser, setModalUser] = useState(null); // { id, ...form } | null ; id undefined = create
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [revealPassword, setRevealPassword] = useState(null); // { name, email, tempPassword } | null

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const [u, c] = await Promise.all([listUsers(), listCompanies()]);
      setUsers(u || []);
      setCompanies(c || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const companyName = (id) => companies.find((c) => c.id === id)?.name || id;

  const openCreate = () => {
    setModalUser({});
    setForm(emptyForm());
  };
  const openEdit = (u) => {
    setModalUser(u);
    setForm(userToForm(u));
  };
  const closeModal = () => setModalUser(null);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      scope: form.scope === "all" ? "all" : form.companyIds,
    };
    try {
      if (modalUser?.id) {
        await updateUser(modalUser.id, payload);
        closeModal();
      } else {
        const created = await createUser(payload);
        closeModal();
        setRevealPassword({ name: created.name, email: created.email, tempPassword: created.tempPassword, emailSent: created.emailSent });
      }
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (u) => {
    if (!confirm(`Réinitialiser le mot de passe de ${u.name} ?`)) return;
    try {
      const res = await resetUserPassword(u.id);
      setRevealPassword({ name: u.name, email: u.email, tempPassword: res.tempPassword });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la réinitialisation.");
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Supprimer le compte de ${u.name} ? Cette action est irréversible.`)) return;
    try {
      await deleteUser(u.id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-500">{users.length} utilisateur(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={inputCls + " pl-8 w-56"}
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Btn onClick={openCreate}>
            <Plus size={15} />
            Nouvel utilisateur
          </Btn>
        </div>
      </div>

      {error && <div className="text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      <Card>
        {loading ? (
          <div className="text-slate-400 text-sm p-6 text-center">Chargement…</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["Nom", "Email", "Téléphone", "Rôle", "Sociétés", "Statut", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 text-sm p-6">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(u)}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2.5 text-slate-500">{u.phone || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={ROLE_BADGE[u.role] || "slate"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {u.scope === "all" ? "Toutes" : (u.scope || []).map(companyName).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={u.active ? "green" : "slate"}>{u.active ? "Actif" : "Inactif"}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleResetPassword(u)}
                        title="Réinitialiser le mot de passe"
                        className="text-slate-400 hover:text-amber-600 p-1"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button onClick={() => handleDelete(u)} title="Supprimer" className="text-slate-400 hover:text-rose-500 p-1">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!modalUser} onClose={closeModal} title={modalUser?.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
        <div className="space-y-3">
          <Field label="Nom">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Téléphone">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Rôle">
            <select className={inputCls} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Périmètre">
            <select
              className={inputCls}
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
            >
              <option value="all">Toutes les sociétés</option>
              <option value="custom">Sociétés choisies</option>
            </select>
          </Field>
          {form.scope === "custom" && (
            <div className="flex flex-wrap gap-2">
              {companies.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-md px-2 py-1">
                  <input
                    type="checkbox"
                    className="accent-[#E31E3D]"
                    checked={form.companyIds.includes(c.id)}
                    onChange={(e) => {
                      setForm((f) => {
                        const set = new Set(f.companyIds);
                        if (e.target.checked) set.add(c.id);
                        else set.delete(c.id);
                        return { ...f, companyIds: [...set] };
                      });
                    }}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
          <Btn className="w-full" disabled={saving || !form.name.trim() || !form.email.trim()} onClick={handleSave}>
            {saving ? "Enregistrement…" : modalUser?.id ? "Enregistrer" : "Créer le compte"}
          </Btn>
        </div>
      </Modal>

      <Modal open={!!revealPassword} onClose={() => setRevealPassword(null)} title="Mot de passe provisoire">
        {revealPassword && (
          <div className="space-y-3 text-sm">
            <p>
              Pour <b>{revealPassword.name}</b> ({revealPassword.email}) — affiché une seule fois, à transmettre maintenant.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <div className="font-mono text-base font-semibold">{revealPassword.tempPassword}</div>
            </div>
            {revealPassword.emailSent !== undefined && (
              <Badge tone={revealPassword.emailSent ? "green" : "amber"}>
                {revealPassword.emailSent
                  ? "E-mail de bienvenue envoyé à l'utilisateur"
                  : "Échec de l'envoi automatique — transmettez ce mot de passe vous-même"}
              </Badge>
            )}
            <Btn className="w-full" onClick={() => setRevealPassword(null)}>
              Fermer
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
