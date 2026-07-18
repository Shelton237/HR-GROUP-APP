import { useEffect, useState } from "react";
import { ListChecks, Wallet, Pencil, ClipboardCheck, GraduationCap, UserCog, Bell, Info, Plus, Trash2, Mail } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { StringListEditor } from "../components/ui/StringListEditor";
import { inputCls, uid, BRAND, BRAND_DK } from "../lib/tokens";
import { getSettings, updateSettings, getNotifications, updateNotifications } from "../api/settings";
import { listCompanies } from "../api/companies";
import { getAlerts } from "../api/dashboard";
import { listUsers, createUser, updateUser, deleteUser } from "../api/users";

function SettingCard({ title, children, onDelete }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {onDelete && (
          <button onClick={onDelete} className="text-slate-400 hover:text-rose-500">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {children}
    </Card>
  );
}

function NotifPreview({ notifications }) {
  const [first, setFirst] = useState(null);
  useEffect(() => {
    getAlerts()
      .then((list) => setFirst((list || []).find((a) => a.type === "dossier") || null))
      .catch(() => setFirst(null));
  }, []);
  return (
    <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 flex items-center gap-1">
        <Mail size={13} />
        Aperçu de l'e-mail envoyé par le serveur
      </div>
      <div className="p-4 text-sm text-slate-700">
        <div className="text-slate-400 text-xs mb-2">À : {notifications.adminEmails.join(", ") || "—"}</div>
        <div className="font-medium mb-1">Objet : Suivi RH — dossiers à compléter</div>
        <p className="text-slate-600">
          {first ? (
            <>
              Le dossier de <strong>{first.who}</strong> ({first.company}) est incomplet.{" "}
              {first.text.replace("Dossier incomplet : ", "Pièces manquantes : ")}.
            </>
          ) : (
            "Aucun dossier incomplet à ce jour."
          )}
        </p>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const [tab, setTab] = useState("lists");
  const [settings, setSettings] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSettings(), getNotifications(), listCompanies(), listUsers()])
      .then(([s, n, c, u]) => {
        setSettings(s || null);
        setNotifications(n || null);
        setCompanies(c || []);
        setUsers(u || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const patchUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    updateUser(id, patch).catch(() => {});
  };
  const removeUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteUser(id).catch(() => {});
  };
  const addUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const created = await createUser({ name: newUser.name.trim(), email: newUser.email.trim(), role: "Lecture", scope: [] });
    setUsers((prev) => [...prev, created]);
    setNewUser({ name: "", email: "" });
    if (created.tempPassword) {
      alert(`Compte créé pour ${created.email}. Mot de passe temporaire à lui transmettre : ${created.tempPassword}`);
    }
  };

  const setS = (fn) => {
    setSettings((prev) => {
      const next = structuredClone(prev);
      fn(next);
      updateSettings(next).catch(() => {});
      return next;
    });
  };

  const setN = (fn) => {
    setNotifications((prev) => {
      const next = structuredClone(prev);
      fn(next);
      updateNotifications(next).catch(() => {});
      return next;
    });
  };

  if (loading || !settings || !notifications) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  const s = settings;
  const tabs = [
    ["lists", "Listes", ListChecks],
    ["pay", "Éléments de paie", Wallet],
    ["custom", "Champs personnalisés", Pencil],
    ["eval", "Grilles d'évaluation", ClipboardCheck],
    ["onboard", "Parcours d'intégration", GraduationCap],
    ["users", "Comptes & rôles", UserCog],
    ["notif", "Notifications & Drive", Bell],
    ["data", "Données", Info],
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(([id, l, I]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5"
            style={tab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
          >
            <I size={15} />
            {l}
          </button>
        ))}
      </div>

      {tab === "lists" && (
        <div className="grid md:grid-cols-2 gap-4">
          <SettingCard title="Types de contrat">
            <StringListEditor items={s.contractTypes} placeholder="Ex. CDI" onChange={(v) => setS((x) => { x.contractTypes = v; })} />
          </SettingCard>
          <SettingCard title="Types d'avertissement">
            <StringListEditor items={s.warningTypes} placeholder="Ex. Blâme" onChange={(v) => setS((x) => { x.warningTypes = v; })} />
          </SettingCard>
          <SettingCard title="Décisions d'évaluation">
            <StringListEditor items={s.evalDecisions} placeholder="Ex. Confirmation" onChange={(v) => setS((x) => { x.evalDecisions = v; })} />
          </SettingCard>
          <SettingCard title="Départements">
            <StringListEditor items={s.departments} placeholder="Ex. Control Room" onChange={(v) => setS((x) => { x.departments = v; })} />
          </SettingCard>
          <SettingCard title="Sites">
            <StringListEditor items={s.sites} placeholder="Ex. Siège" onChange={(v) => setS((x) => { x.sites = v; })} />
          </SettingCard>
          <SettingCard title="Postes">
            <StringListEditor items={s.postes} placeholder="Ex. Technicien" onChange={(v) => setS((x) => { x.postes = v; })} />
          </SettingCard>
          <SettingCard title="Catégories socio-professionnelles">
            <StringListEditor items={s.categories} placeholder="Ex. Cadre" onChange={(v) => setS((x) => { x.categories = v; })} />
          </SettingCard>
          <SettingCard title="Types de congé (avec acquisition)">
            <div className="space-y-2">
              {s.leaveTypes.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls + " flex-1"}
                    value={t.name}
                    onChange={(e) => setS((x) => { x.leaveTypes[i].name = e.target.value; })}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      className="accent-teal-600"
                      checked={t.paid}
                      onChange={(e) => setS((x) => { x.leaveTypes[i].paid = e.target.checked; })}
                    />
                    payé
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    title="jours/mois acquis"
                    className={inputCls + " w-20"}
                    value={t.accrual}
                    onChange={(e) => setS((x) => { x.leaveTypes[i].accrual = Number(e.target.value); })}
                  />
                  <button onClick={() => setS((x) => { x.leaveTypes.splice(i, 1); })} className="text-slate-400 hover:text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Btn variant="outline" onClick={() => setS((x) => { x.leaveTypes.push({ name: "Nouveau type", paid: true, accrual: 0 }); })}>
                <Plus size={14} />
                Ajouter
              </Btn>
            </div>
          </SettingCard>
          <SettingCard title="Catégories de documents">
            <div className="space-y-2">
              {s.documentCategories.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls + " flex-1"}
                    value={t.name}
                    onChange={(e) => setS((x) => { x.documentCategories[i].name = e.target.value; })}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      className="accent-teal-600"
                      checked={t.expires}
                      onChange={(e) => setS((x) => { x.documentCategories[i].expires = e.target.checked; })}
                    />
                    expire
                  </label>
                  <button onClick={() => setS((x) => { x.documentCategories.splice(i, 1); })} className="text-slate-400 hover:text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Btn variant="outline" onClick={() => setS((x) => { x.documentCategories.push({ name: "Nouvelle catégorie", expires: false }); })}>
                <Plus size={14} />
                Ajouter
              </Btn>
            </div>
          </SettingCard>
        </div>
      )}

      {tab === "pay" && (
        <SettingCard title="Éléments de paie réutilisables">
          <p className="text-xs text-slate-500 mb-3">
            Primes, indemnités, avances, retenues appliquées ensuite par salarié et par mois. « Imposable » et « cotisable »
            déterminent l'impact sur l'impôt et les cotisations.
          </p>
          <div className="space-y-2">
            {s.payElements.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100">
                <input
                  className={inputCls + " flex-1 min-w-40"}
                  value={p.label}
                  onChange={(e) => setS((x) => { x.payElements[i].label = e.target.value; })}
                />
                <select className={inputCls + " w-28"} value={p.kind} onChange={(e) => setS((x) => { x.payElements[i].kind = e.target.value; })}>
                  <option value="gain">Gain</option>
                  <option value="retenue">Retenue</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    className="accent-teal-600"
                    checked={p.taxable}
                    onChange={(e) => setS((x) => { x.payElements[i].taxable = e.target.checked; })}
                  />
                  imposable
                </label>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    className="accent-teal-600"
                    checked={p.cotisable}
                    onChange={(e) => setS((x) => { x.payElements[i].cotisable = e.target.checked; })}
                  />
                  cotisable
                </label>
                <button onClick={() => setS((x) => { x.payElements.splice(i, 1); })} className="text-slate-400 hover:text-rose-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <Btn
            variant="outline"
            className="mt-3"
            onClick={() => setS((x) => { x.payElements.push({ id: uid("pe"), label: "Nouvel élément", kind: "gain", taxable: true, cotisable: true }); })}
          >
            <Plus size={15} />
            Ajouter un élément
          </Btn>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Field label="Heures légales mensuelles (base du taux horaire)">
              <input
                type="number"
                step="0.01"
                className={inputCls + " w-40"}
                value={s.legalMonthlyHours}
                onChange={(e) => setS((x) => { x.legalMonthlyHours = Number(e.target.value); })}
              />
            </Field>
          </div>
        </SettingCard>
      )}

      {tab === "custom" && (
        <SettingCard title="Champs personnalisés du dossier salarié">
          <p className="text-xs text-slate-500 mb-3">
            Ajoutez librement des champs qui apparaîtront dans « Informations complémentaires » de chaque salarié.
          </p>
          <div className="space-y-2">
            {s.customFields.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100">
                <input
                  className={inputCls + " flex-1 min-w-40"}
                  value={c.label}
                  onChange={(e) => setS((x) => { x.customFields[i].label = e.target.value; })}
                />
                <select className={inputCls + " w-32"} value={c.type} onChange={(e) => setS((x) => { x.customFields[i].type = e.target.value; })}>
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                  <option value="select">Liste</option>
                </select>
                {c.type === "select" && (
                  <input
                    className={inputCls + " flex-1 min-w-40"}
                    placeholder="options séparées par des virgules"
                    value={c.options.join(", ")}
                    onChange={(e) => setS((x) => { x.customFields[i].options = e.target.value.split(",").map((o) => o.trim()).filter(Boolean); })}
                  />
                )}
                <button onClick={() => setS((x) => { x.customFields.splice(i, 1); })} className="text-slate-400 hover:text-rose-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <Btn variant="outline" className="mt-3" onClick={() => setS((x) => { x.customFields.push({ id: uid("cf"), label: "Nouveau champ", type: "text", options: [] }); })}>
            <Plus size={15} />
            Ajouter un champ
          </Btn>
        </SettingCard>
      )}

      {tab === "eval" && (
        <div className="space-y-4">
          {s.evalTemplates.map((t, ti) => (
            <SettingCard
              key={t.id}
              title={<input className="font-semibold bg-transparent focus:outline-none" value={t.name} onChange={(e) => setS((x) => { x.evalTemplates[ti].name = e.target.value; })} />}
              onDelete={() => setS((x) => { x.evalTemplates.splice(ti, 1); })}
            >
              <div className="space-y-2">
                {t.criteria.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input
                      className={inputCls + " flex-1"}
                      value={c.label}
                      onChange={(e) => setS((x) => { x.evalTemplates[ti].criteria[ci].label = e.target.value; })}
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        className={inputCls + " pr-6"}
                        value={c.weight}
                        onChange={(e) => setS((x) => { x.evalTemplates[ti].criteria[ci].weight = Number(e.target.value); })}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <button onClick={() => setS((x) => { x.evalTemplates[ti].criteria.splice(ci, 1); })} className="text-slate-400 hover:text-rose-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Btn variant="outline" onClick={() => setS((x) => { x.evalTemplates[ti].criteria.push({ label: "Nouveau critère", weight: 0 }); })}>
                  <Plus size={14} />
                  Critère
                </Btn>
                <span className="text-xs text-slate-400">Total : {t.criteria.reduce((a, c) => a + c.weight, 0)}% (viser 100)</span>
              </div>
            </SettingCard>
          ))}
          <Btn variant="outline" onClick={() => setS((x) => { x.evalTemplates.push({ id: uid("et"), name: "Nouvelle grille", criteria: [] }); })}>
            <Plus size={15} />
            Nouvelle grille
          </Btn>
        </div>
      )}

      {tab === "onboard" && (
        <div className="space-y-4">
          {s.onboardingTemplates.map((t, ti) => (
            <SettingCard
              key={t.id}
              title={<input className="font-semibold bg-transparent focus:outline-none" value={t.name} onChange={(e) => setS((x) => { x.onboardingTemplates[ti].name = e.target.value; })} />}
              onDelete={() => setS((x) => { x.onboardingTemplates.splice(ti, 1); })}
            >
              <div className="space-y-2">
                {t.steps.map((st, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <input
                      className={inputCls + " w-32"}
                      value={st.phase}
                      onChange={(e) => setS((x) => { x.onboardingTemplates[ti].steps[si].phase = e.target.value; })}
                    />
                    <input
                      className={inputCls + " flex-1"}
                      value={st.label}
                      onChange={(e) => setS((x) => { x.onboardingTemplates[ti].steps[si].label = e.target.value; })}
                    />
                    <button onClick={() => setS((x) => { x.onboardingTemplates[ti].steps.splice(si, 1); })} className="text-slate-400 hover:text-rose-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <Btn variant="outline" className="mt-2" onClick={() => setS((x) => { x.onboardingTemplates[ti].steps.push({ phase: "Phase", label: "Nouvelle étape" }); })}>
                <Plus size={14} />
                Étape
              </Btn>
            </SettingCard>
          ))}
          <Btn variant="outline" onClick={() => setS((x) => { x.onboardingTemplates.push({ id: uid("ot"), name: "Nouveau parcours", steps: [] }); })}>
            <Plus size={15} />
            Nouveau parcours
          </Btn>
        </div>
      )}

      {tab === "users" && (
        <SettingCard title="Comptes utilisateurs & droits par entité">
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <Info size={12} />
            La connexion réelle et le cloisonnement des accès sont gérés par le serveur. Ici vous définissez qui a accès à quoi.
          </p>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-100">
                <input className={inputCls + " w-40"} value={u.name} onChange={(e) => patchUser(u.id, { name: e.target.value })} />
                <input className={inputCls + " flex-1 min-w-48"} value={u.email} onChange={(e) => patchUser(u.id, { email: e.target.value })} />
                <select className={inputCls + " w-32"} value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}>
                  {["Admin", "RH", "Manager", "Lecture"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  className={inputCls + " w-44"}
                  value={u.scope === "all" ? "all" : "custom"}
                  onChange={(e) => patchUser(u.id, { scope: e.target.value === "all" ? "all" : [] })}
                >
                  <option value="all">Toutes les sociétés</option>
                  <option value="custom">Sociétés choisies</option>
                </select>
                <button onClick={() => removeUser(u.id)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 size={15} />
                </button>
                {u.scope !== "all" && (
                  <div className="w-full flex flex-wrap gap-2 pl-1">
                    {companies.map((c) => (
                      <label key={c.id} className="flex items-center gap-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          className="accent-teal-600"
                          checked={(u.scope || []).includes(c.id)}
                          onChange={(e) => {
                            const sc = new Set(u.scope || []);
                            if (e.target.checked) sc.add(c.id);
                            else sc.delete(c.id);
                            patchUser(u.id, { scope: [...sc] });
                          }}
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 p-2 rounded-lg border border-dashed border-slate-200">
            <input
              className={inputCls + " w-40"}
              placeholder="Nom"
              value={newUser.name}
              onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className={inputCls + " flex-1 min-w-48"}
              placeholder="E-mail"
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
            />
            <Btn variant="outline" onClick={addUser}>
              <Plus size={15} />
              Ajouter un compte
            </Btn>
          </div>
        </SettingCard>
      )}

      {tab === "notif" && (
        <div className="space-y-4">
          <SettingCard title="Alertes e-mail aux administrateurs">
            <p className="text-xs text-slate-500 mb-3">
              Le serveur enverra ces e-mails de suivi. Choisissez les déclencheurs et les destinataires.
            </p>
            <div className="space-y-2 mb-4">
              {[
                ["incompleteDossier", "Dossier incomplet (l'e-mail précise les pièces manquantes)"],
                ["probationEnd", "Fin de période d'essai approchant"],
                ["evalDue", "Évaluation à réaliser"],
                ["docExpiry", "Document arrivant à expiration"],
                ["contractEnd", "Fin de CDD approchant"],
              ].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-teal-600"
                    checked={!!notifications.rules[k]}
                    onChange={(e) => setN((d) => { d.rules[k] = e.target.checked; })}
                  />
                  {l}
                </label>
              ))}
            </div>
            <Field label="Destinataires (e-mails séparés par des virgules)">
              <input
                className={inputCls}
                value={notifications.adminEmails.join(", ")}
                onChange={(e) => setN((d) => { d.adminEmails = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); })}
              />
            </Field>
            <div className="mt-3">
              <Field label="Fréquence du récapitulatif">
                <select className={inputCls} value={notifications.frequency} onChange={(e) => setN((d) => { d.frequency = e.target.value; })}>
                  {["Quotidienne", "Hebdomadaire (lundi matin)", "Immédiate + hebdomadaire"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
            </div>
            <NotifPreview notifications={notifications} />
          </SettingCard>
          <SettingCard title="Hébergement des documents (Google Drive)">
            <p className="text-xs text-slate-500 mb-3">
              Collez le lien du dossier Drive où le serveur déposera les scans.
            </p>
            <Field label="Lien du dossier Google Drive">
              <input
                className={inputCls}
                placeholder="https://drive.google.com/drive/folders/…"
                value={notifications.driveFolderUrl}
                onChange={(e) => setN((d) => { d.driveFolderUrl = e.target.value; })}
              />
            </Field>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {notifications.driveFolderUrl ? (
                <Badge tone="green">Lien enregistré</Badge>
              ) : (
                <Badge tone="amber">En attente du lien</Badge>
              )}
            </div>
          </SettingCard>
        </div>
      )}

      {tab === "data" && (
        <SettingCard title="Données de démonstration">
          <p className="text-sm text-slate-600 mb-3">
            La réinitialisation des données est désormais une opération côté serveur (elle n'est pas exposée par le contrat
            d'API actuel). Contactez l'équipe backend si un jeu de données de démonstration doit être régénéré.
          </p>
          <Btn variant="danger" disabled>
            <Trash2 size={16} />
            Réinitialiser les données
          </Btn>
        </SettingCard>
      )}
    </div>
  );
}
