import { useRef, useState } from "react";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Field } from "./ui/Field";
import { Btn } from "./ui/Btn";
import { Badge } from "./ui/Badge";
import { inputCls, uid } from "../lib/tokens";
import { daysBetween } from "../lib/format";

/* ============================ Documents (réutilisable) ============================
 * Same UI as the original monolith's DocList, rewired to call onAdd/onRemove
 * instead of mutating a shared items array in place — callers decide how a
 * doc gets persisted (nested /employees/:id/documents endpoints, or a full
 * PUT /companies/:id for company-level documents).
 */
export function DocList({ items, categories, onAdd, onRemove }) {
  const fileRef = useRef();
  const [cat, setCat] = useState(categories[0]?.name || "Autre");
  const [exp, setExp] = useState("");
  const catExpires = categories.find((c) => c.name === cat)?.expires;

  const onFile = (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      alert("Max 4 Mo. Pensez à héberger les scans volumineux sur le Drive de la société.");
      return;
    }
    const r = new FileReader();
    r.onload = () =>
      onAdd({ id: uid("doc"), name: f.name, category: cat, expiryDate: exp || "", dataUrl: r.result, uploadedAt: new Date().toISOString() });
    r.readAsDataURL(f);
    ev.target.value = "";
    setExp("");
  };

  const dl = (doc) => {
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = doc.name;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-slate-50">
        <Field label="Catégorie">
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        {catExpires && (
          <Field label="Date d'expiration">
            <input type="date" className={inputCls} value={exp} onChange={(e) => setExp(e.target.value)} />
          </Field>
        )}
        <Btn variant="outline" onClick={() => fileRef.current.click()}>
          <Upload size={16} />
          Ajouter un scan
        </Btn>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
            Aucun document.
          </div>
        )}
        {items.map((doc) => {
          const expDays = doc.expiryDate ? daysBetween(new Date(), new Date(doc.expiryDate)) : null;
          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
              <FileText size={18} className="text-slate-400" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{doc.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Badge>{doc.category}</Badge>
                  {doc.expiryDate && (
                    <span className={expDays < 0 ? "text-rose-600" : expDays <= 30 ? "text-amber-600" : ""}>
                      Expire le {new Date(doc.expiryDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto flex gap-1">
                <button onClick={() => dl(doc)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Download size={16} />
                </button>
                <button onClick={() => onRemove(doc.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
