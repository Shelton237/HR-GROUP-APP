import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import Login from "./pages/Login";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Employees from "./pages/employees/Employees";
import Payroll from "./pages/Payroll";
import Leaves from "./pages/Leaves";
import Fiscalite from "./pages/Fiscalite";
import SettingsView from "./pages/Settings";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState("dashboard");
  const [companyFilter, setCompanyFilter] = useState(null);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Chargement…</div>;
  }
  if (!isAuthenticated) {
    return <Login />;
  }

  const navigate = (id) => {
    setView(id);
    setCompanyFilter(null);
  };
  const goto = (id, cf) => {
    setView(id);
    if (cf !== undefined) setCompanyFilter(cf);
  };

  return (
    <div
      className="min-h-screen flex text-slate-800"
      style={{ background: "#F4F6F8", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" }}
    >
      <Sidebar view={view} onNavigate={navigate} />
      <main className="flex-1 min-w-0 flex flex-col">
        <Header view={view} />
        <div className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && <Dashboard onGoto={goto} />}
          {view === "companies" && (
            <Companies
              onOpen={(id) => {
                setCompanyFilter(id);
                setView("employees");
              }}
            />
          )}
          {view === "employees" && <Employees companyFilter={companyFilter} setCompanyFilter={setCompanyFilter} />}
          {view === "payroll" && <Payroll />}
          {view === "leaves" && <Leaves />}
          {view === "fiscalite" && <Fiscalite />}
          {view === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}
