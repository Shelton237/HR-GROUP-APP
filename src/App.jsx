import { useEffect, useState } from "react";
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
import Planning from "./pages/planning/Planning";
import AgentApp from "./pages/agent/AgentApp";
import Users from "./pages/Users";
import { NAV } from "./lib/nav";

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [view, setView] = useState("dashboard");
  const [companyFilter, setCompanyFilter] = useState(null);
  const [openEmployeeId, setOpenEmployeeId] = useState(null);

  // "Operateur" has no Dashboard (consolidated multi-company view) and no
  // Planning module at all, and Utilisateurs is Admin-only (matches the
  // backend's requireRole()/blockOperateur gates) — bounce off any of these
  // the moment we know the role, since `view` was initialized before the
  // user (and their role) had loaded.
  useEffect(() => {
    if (user?.role === "Operateur" && (view === "dashboard" || view === "planning")) setView("employees");
    if (user?.role !== "Admin" && view === "users") setView("employees");
  }, [user, view]);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Chargement…</div>;
  }
  if (!isAuthenticated) {
    return <Login />;
  }
  if (user?.role === "Agent") {
    return <AgentApp />;
  }

  const navigate = (id) => {
    setView(id);
    setCompanyFilter(null);
    setOpenEmployeeId(null);
  };
  const goto = (id, cf, employeeId) => {
    setView(id);
    if (cf !== undefined) setCompanyFilter(cf);
    if (employeeId !== undefined) setOpenEmployeeId(employeeId);
  };

  return (
    <div
      className="min-h-screen flex text-slate-800"
      style={{ background: "#F4F6F8", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" }}
    >
      <Sidebar
        view={view}
        onNavigate={navigate}
        nav={NAV.filter((n) => {
          if (user?.role === "Operateur" && (n.id === "dashboard" || n.id === "planning")) return false;
          if (n.id === "users" && user?.role !== "Admin") return false;
          return true;
        })}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        <Header view={view} onGoto={goto} />
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
          {view === "employees" && (
            <Employees
              companyFilter={companyFilter}
              setCompanyFilter={setCompanyFilter}
              openEmployeeId={openEmployeeId}
              onOpenedEmployee={() => setOpenEmployeeId(null)}
            />
          )}
          {view === "payroll" && <Payroll onGoto={goto} />}
          {view === "leaves" && <Leaves />}
          {view === "planning" && <Planning />}
          {view === "fiscalite" && <Fiscalite />}
          {view === "users" && <Users />}
          {view === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}
