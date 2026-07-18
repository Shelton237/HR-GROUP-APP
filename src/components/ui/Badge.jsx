export function Badge({ children, tone = "slate" }) {
  const t = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    teal: "bg-teal-50 text-teal-700",
  };
  return (
    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium " + t[tone]}>
      {children}
    </span>
  );
}
