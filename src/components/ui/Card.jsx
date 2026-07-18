export const Card = ({ children, className = "", style }) => (
  <div className={"bg-white rounded-xl border border-slate-200 " + className} style={style}>
    {children}
  </div>
);
