import { LayoutDashboard, Building2, Users, Wallet, CalendarDays, Percent, Settings } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "companies", label: "Sociétés", icon: Building2 },
  { id: "employees", label: "Salariés", icon: Users },
  { id: "payroll", label: "Paie & masse salariale", icon: Wallet },
  { id: "leaves", label: "Congés", icon: CalendarDays },
  { id: "fiscalite", label: "Pays & fiscalité", icon: Percent },
  { id: "settings", label: "Paramètres", icon: Settings },
];
