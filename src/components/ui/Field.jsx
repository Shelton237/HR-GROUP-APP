export const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
    {children}
  </label>
);
