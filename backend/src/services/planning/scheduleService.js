/*
 * Port fidèle de CONTROL-ROOM-PLANNING/backend/app/Support/ScheduleService.php :
 * construit le planning effectif d'une salle pour une semaine donnée (roster,
 * grid, coverage), à partir des données natives RH (PlanningProfile + Employee).
 */
const { Op } = require("sequelize");
const db = require("../../models");
const engine = require("./planningEngine");

function fullName(employee) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function toRosterEntry(profile, { cross = false } = {}) {
  return {
    id: profile.employeeId,
    profileId: profile.id,
    name: fullName(profile.Employee),
    email: profile.Employee.email || null,
    type: profile.type,
    offset: profile.offset,
    binome: profile.binome,
    daySpec: profile.daySpecJson,
    altParity: profile.altParity,
    cross,
  };
}

async function rosterFor(room, monIso) {
  const profiles = await db.PlanningProfile.findAll({
    where: { roomId: room.id },
    include: [{ model: db.Employee }],
    order: [["createdAt", "ASC"]],
  });

  let base = profiles.map((p) => toRosterEntry(p));
  base = base.slice().sort((a, b) => {
    const fixedA = a.type === "fixed_day" ? 0 : 1;
    const fixedB = b.type === "fixed_day" ? 0 : 1;
    if (fixedA !== fixedB) return fixedA - fixedB;
    return (a.binome ?? 0) - (b.binome ?? 0);
  });

  const loans = await db.PlanningRoomWeekLoan.findAll({ where: { roomId: room.id, weekStart: monIso } });
  const loanedIds = loans.map((l) => l.employeeId);
  let cross = [];
  if (loanedIds.length) {
    const crossProfiles = await db.PlanningProfile.findAll({
      where: { employeeId: { [Op.in]: loanedIds } },
      include: [{ model: db.Employee }],
    });
    cross = crossProfiles.map((p) => toRosterEntry(p, { cross: true }));
  }

  return base.concat(cross);
}

async function awayDaysFor(employee, homeRoom, monIso) {
  const loans = await db.PlanningRoomWeekLoan.findAll({
    where: { employeeId: employee.id, weekStart: monIso, roomId: { [Op.ne]: homeRoom.id } },
  });
  const loanRoomIds = loans.map((l) => l.roomId);
  if (!loanRoomIds.length) return [];

  const overrides = await db.PlanningScheduleOverride.findAll({
    where: { roomId: { [Op.in]: loanRoomIds }, weekStart: monIso, employeeId: employee.id, value: { [Op.ne]: "" } },
  });
  return overrides.map((o) => o.dayIndex);
}

/**
 * Valeur effective d'une cellule : ABS > prêté ailleurs ce jour-là > override
 * manuel (y compris value="") > statut auto (ou '' si prêté sans override).
 */
function effectiveCell(employee, iso, monIso, dayIndex, overridesByDay, absences, precomputedAuto, isAway) {
  const isAbsent = absences.some((a) => a.coversDate(iso));
  if (isAbsent) return "ABS";
  if (isAway) return "";

  const override = overridesByDay.get(dayIndex);
  if (override !== undefined) return override.value ?? "";

  if (employee.cross) return "";
  if (employee.type === "fixed_day") return engine.autoStatus(employee, iso, monIso);

  return precomputedAuto ?? engine.autoStatus(employee, iso, monIso);
}

async function weekSchedule(room, weekStart) {
  const monIso = engine.mondayISOof(weekStart);
  const dates = engine.weekDates(monIso);
  const roster = await rosterFor(room, monIso);
  const employeeIds = roster.map((e) => e.id);

  const overrideRows = await db.PlanningScheduleOverride.findAll({ where: { roomId: room.id, weekStart: monIso } });
  const overridesByEmployee = new Map();
  for (const o of overrideRows) {
    if (!overridesByEmployee.has(o.employeeId)) overridesByEmployee.set(o.employeeId, new Map());
    overridesByEmployee.get(o.employeeId).set(o.dayIndex, o);
  }

  const absenceRows = employeeIds.length
    ? await db.PlanningAbsence.findAll({ where: { employeeId: { [Op.in]: employeeIds }, status: "enregistree" } })
    : [];
  const absencesByEmployee = new Map();
  for (const a of absenceRows) {
    if (!absencesByEmployee.has(a.employeeId)) absencesByEmployee.set(a.employeeId, []);
    absencesByEmployee.get(a.employeeId).push(a);
  }

  const control = roster.find((e) => e.type === "fixed_day" && !e.cross) || null;
  const rotating = roster.filter((e) => e.type === "rotation" && !e.cross);

  const grid = {};
  roster.forEach((e) => {
    grid[e.id] = [];
  });

  const awayDaysByEmployee = {};
  for (const employee of roster) {
    awayDaysByEmployee[employee.id] = employee.cross ? [] : await awayDaysFor(employee, room, monIso);
  }

  dates.forEach((iso, d) => {
    const awayThisDay = rotating
      .filter((employee) => {
        if (awayDaysByEmployee[employee.id].includes(d)) return true;
        return (absencesByEmployee.get(employee.id) || []).some((a) => a.coversDate(iso));
      })
      .map((e) => e.id);

    const autoForDay = engine.autoStatusesForRotation(rotating, control, iso, monIso, awayThisDay);

    for (const employee of roster) {
      const overridesByDay = overridesByEmployee.get(employee.id) || new Map();
      const absences = absencesByEmployee.get(employee.id) || [];
      const isAway = awayDaysByEmployee[employee.id].includes(d);

      grid[employee.id][d] = effectiveCell(
        employee,
        iso,
        monIso,
        d,
        overridesByDay,
        absences,
        autoForDay[employee.id] ?? null,
        isAway
      );
    }
  });

  const coverage = engine.coverage(grid, employeeIds);

  return { dates, roster, grid, coverage };
}

/**
 * Planning personnel d'un employé pour une semaine : pour chaque jour, la valeur
 * effective ET la salle d'où elle provient (un agent peut être prêté à une autre
 * salle certains jours de la semaine).
 */
async function meWeekSchedule(employeeId, weekStart) {
  const profile = await db.PlanningProfile.findOne({
    where: { employeeId },
    include: [{ model: db.PlanningRoom, as: "room" }],
  });
  if (!profile) return null;

  const monIso = engine.mondayISOof(weekStart);
  const dates = engine.weekDates(monIso);

  const homeResult = await weekSchedule(profile.room, monIso);
  const homeValues = homeResult.grid[employeeId] || Array(7).fill("");

  const loans = await db.PlanningRoomWeekLoan.findAll({
    where: { employeeId, weekStart: monIso, roomId: { [Op.ne]: profile.roomId } },
  });
  const loanRoomIds = [...new Set(loans.map((l) => l.roomId))];

  const loanRooms = loanRoomIds.length ? await db.PlanningRoom.findAll({ where: { id: { [Op.in]: loanRoomIds } } }) : [];
  const loanResults = [];
  for (const room of loanRooms) {
    loanResults.push({ room, result: await weekSchedule(room, monIso) });
  }

  const grid = [];
  const rooms = [];

  dates.forEach((iso, d) => {
    let value = homeValues[d] ?? "";
    let roomInfo = { id: profile.roomId, name: profile.room.name };

    for (const loan of loanResults) {
      const loanValue = (loan.result.grid[employeeId] || [])[d] ?? "";
      if (loanValue !== "") {
        value = loanValue;
        roomInfo = { id: loan.room.id, name: loan.room.name };
        break;
      }
    }

    grid[d] = value;
    rooms[d] = roomInfo;
  });

  return { dates, grid, rooms };
}

/** Recalcule offset/binome de tous les agents rotation d'une salle, par ordre de création. */
async function reassignOffsets(roomId) {
  const rotations = await db.PlanningProfile.findAll({ where: { roomId, type: "rotation" }, order: [["createdAt", "ASC"]] });
  for (let rank = 0; rank < rotations.length; rank++) {
    rotations[rank].offset = engine.offsetForRank(rank);
    rotations[rank].binome = engine.binomeForRank(rank);
    await rotations[rank].save();
  }
}

module.exports = { rosterFor, awayDaysFor, effectiveCell, weekSchedule, meWeekSchedule, reassignOffsets };
