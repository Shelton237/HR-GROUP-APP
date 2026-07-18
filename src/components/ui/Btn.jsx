import { BRAND, INK, ROSE } from "../../lib/tokens";

export function Btn({ children, onClick, variant = "primary", className = "", type = "button", disabled }) {
  const s = {
    primary: { c: "text-white", st: { background: BRAND } },
    dark: { c: "text-white", st: { background: INK } },
    ghost: { c: "text-slate-700 bg-slate-100 hover:bg-slate-200", st: {} },
    danger: { c: "text-white", st: { background: ROSE } },
    outline: { c: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50", st: {} },
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 hover:brightness-110 " +
        s.c +
        " " +
        className
      }
      style={s.st}
    >
      {children}
    </button>
  );
}
