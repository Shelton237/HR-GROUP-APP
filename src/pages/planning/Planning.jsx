import { useEffect, useState, useCallback } from "react";
import { BRAND, BRAND_DK } from "../../lib/tokens";
import { mondayISOof, todayISO } from "../../lib/planningDates";
import { listRooms } from "../../api/planning";
import { ApiError } from "../../api/client";
import WeekTab from "./WeekTab";
import MonthTab from "./MonthTab";
import DiffusionTab from "./DiffusionTab";
import RoomsTab from "./RoomsTab";
import AgentsTab from "./AgentsTab";
import AbsencesTab from "./AbsencesTab";

// Salle/semaine/mois partagés entre les onglets (évite de re-choisir la
// salle à chaque changement d'onglet) — équivalent de PlanningContext côté
// CONTROL-ROOM-PLANNING, ramené à un simple state ici puisque tout vit sur
// une seule page RH plutôt que des routes Next.js séparées.
export default function Planning() {
  const [tab, setTab] = useState("semaine");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => mondayISOof(todayISO()));
  const [monthAnchor, setMonthAnchor] = useState(() => todayISO());

  const reloadRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError("");
    try {
      setRooms(await listRooms());
    } catch (e) {
      setRoomsError(e instanceof ApiError ? e.message : "Erreur de chargement des salles.");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadRooms();
  }, [reloadRooms]);

  useEffect(() => {
    if (!currentRoomId && rooms.length) setCurrentRoomId(rooms[0].id);
  }, [rooms, currentRoomId]);

  const tabs = [
    ["semaine", "Planning"],
    ["mois", "Mois"],
    ["diffusion", "Diffusion"],
    ["salles", "Salles"],
    ["agents", "Agents"],
    ["absences", "Absences"],
  ];

  if (roomsLoading) return <div className="text-sm text-slate-400 py-10 text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Planification des salles de contrôle 24/7 (cycle Jour/Nuit/Repos) — module Control Room Planning, intégré ici.
      </p>
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap"
            style={tab === id ? { borderColor: BRAND, color: BRAND_DK } : { borderColor: "transparent", color: "#64748B" }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "semaine" && (
        <WeekTab rooms={rooms} currentRoomId={currentRoomId} setCurrentRoomId={setCurrentRoomId} weekStart={weekStart} setWeekStart={setWeekStart} />
      )}
      {tab === "mois" && (
        <MonthTab rooms={rooms} currentRoomId={currentRoomId} setCurrentRoomId={setCurrentRoomId} monthAnchor={monthAnchor} setMonthAnchor={setMonthAnchor} />
      )}
      {tab === "diffusion" && (
        <DiffusionTab rooms={rooms} currentRoomId={currentRoomId} setCurrentRoomId={setCurrentRoomId} weekStart={weekStart} setWeekStart={setWeekStart} />
      )}
      {tab === "salles" && <RoomsTab rooms={rooms} loading={roomsLoading} error={roomsError} reload={reloadRooms} />}
      {tab === "agents" && <AgentsTab rooms={rooms} />}
      {tab === "absences" && <AbsencesTab />}
    </div>
  );
}
