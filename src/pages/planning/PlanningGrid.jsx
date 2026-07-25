import { DSHORT, fmtShort } from "../../lib/planningDates";

// Charte graphique du module Planning (CONTROL-ROOM-PLANNING/docs/CONTRACT.md) —
// le rouge "abs" est aligné sur le rouge de marque RH (#E31E3D), quasi identique
// à l'original (#d32027), pour une seule couleur d'alerte cohérente dans l'appli.
const CELL_STYLE = {
  J: "bg-[#e6f5ec] text-[#1f9d55]",
  N: "bg-[#e6e9f2] text-[#2b3a67]",
  R: "bg-[#f0f0f2] text-[#9aa0a6]",
  ABS: "bg-[#fce8ea] text-[#E31E3D]",
  "": "bg-white text-slate-300",
};

export function CellTag({ cross, type, binome }) {
  if (cross) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fce8ea] text-[#E31E3D] border border-dashed border-[#E31E3D] ml-1.5">
        prêté
      </span>
    );
  }
  if (type === "fixed_day") {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 ml-1.5">
        fixe
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 ml-1.5">
      B{binome ?? ""}
    </span>
  );
}

export function Legend() {
  const items = [
    { label: "J Jour", cls: "bg-[#e6f5ec] border-[#1f9d55]" },
    { label: "N Nuit", cls: "bg-[#e6e9f2] border-[#2b3a67]" },
    { label: "R Repos", cls: "bg-[#f0f0f2] border-[#9aa0a6]" },
    { label: "Absent", cls: "bg-[#fce8ea] border-[#E31E3D]" },
  ];
  return (
    <div className="flex gap-4 flex-wrap text-xs text-slate-500 my-2.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <i className={"w-3.5 h-3.5 rounded-sm inline-block border " + it.cls} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function PlanningGrid({ schedule, onCellClick, onUnassign, readOnly }) {
  const { dates, roster, grid, coverage } = schedule;

  if (!roster.length) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center border border-dashed border-slate-200 rounded-md">
        Aucun agent dans cette salle.
      </div>
    );
  }

  return (
    <table className="border-collapse w-full text-sm">
      <thead>
        <tr>
          <th className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500">
            Agent
          </th>
          {dates.map((iso, i) => (
            <th
              key={iso}
              className="border border-slate-200 px-2 py-1.5 text-left bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-500"
            >
              {DSHORT[i]}
              <br />
              <span className="text-xs font-normal">{fmtShort(iso)}</span>
            </th>
          ))}
          <th className="border border-slate-200 bg-slate-50" />
        </tr>
      </thead>
      <tbody>
        {roster.map((e) => {
          const row = grid[String(e.id)] ?? Array(7).fill("");
          return (
            <tr key={e.id}>
              <td className="border border-slate-200 px-2 py-1.5 font-semibold whitespace-nowrap">
                {e.name}
                <CellTag cross={e.cross} type={e.type} binome={e.binome} />
              </td>
              {row.map((val, d) => {
                const isAbs = val === "ABS";
                const clickable = !readOnly && !isAbs && onCellClick;
                return (
                  <td
                    key={d}
                    className={
                      "border border-slate-200 px-2 py-1.5 text-center font-bold min-w-[48px] select-none " +
                      CELL_STYLE[val] +
                      " " +
                      (clickable ? "cursor-pointer" : isAbs ? "cursor-not-allowed" : "")
                    }
                    title={isAbs ? "Absence — modifier dans le module Planning" : "Cliquer pour changer"}
                    onClick={() => {
                      if (clickable) onCellClick(e.id, d, val);
                    }}
                  >
                    {val || "·"}
                  </td>
                );
              })}
              <td className="border border-slate-200 px-2 py-1.5 text-center">
                {e.cross && onUnassign ? (
                  <button type="button" className="text-[#E31E3D] underline text-xs" onClick={() => onUnassign(e.id)}>
                    retirer
                  </button>
                ) : null}
              </td>
            </tr>
          );
        })}
        <tr>
          <td className="border border-slate-200 px-2 py-1.5 font-bold text-xs text-left">Couverture Jour</td>
          {coverage.J.map((j, i) => (
            <td
              key={i}
              className={
                "border border-slate-200 px-2 py-1.5 text-center font-bold text-xs " +
                (j >= 2 ? "text-[#1f9d55]" : "bg-[#fce8ea] text-[#E31E3D]")
              }
            >
              {j}
            </td>
          ))}
          <td className="border border-slate-200" />
        </tr>
        <tr>
          <td className="border border-slate-200 px-2 py-1.5 font-bold text-xs text-left">Couverture Nuit</td>
          {coverage.N.map((n, i) => (
            <td
              key={i}
              className={
                "border border-slate-200 px-2 py-1.5 text-center font-bold text-xs " +
                (n >= 2 ? "text-[#1f9d55]" : "bg-[#fce8ea] text-[#E31E3D]")
              }
            >
              {n}
            </td>
          ))}
          <td className="border border-slate-200" />
        </tr>
      </tbody>
    </table>
  );
}
