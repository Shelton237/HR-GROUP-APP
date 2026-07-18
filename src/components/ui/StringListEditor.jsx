import { useState } from "react";
import { Plus, X } from "lucide-react";
import { inputCls } from "../../lib/tokens";
import { Btn } from "./Btn";

/* Éditeur générique de listes de chaînes */
export function StringListEditor({ items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-sm text-slate-700">
            {it}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-500">
              <X size={13} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-slate-400">Aucun élément.</span>}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        />
        <Btn
          variant="outline"
          onClick={() => {
            if (val.trim()) {
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        >
          <Plus size={15} />
        </Btn>
      </div>
    </div>
  );
}
