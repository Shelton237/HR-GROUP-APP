module.exports = (sequelize, DataTypes) => {
  const PlanningScheduleOverride = sequelize.define(
    "PlanningScheduleOverride",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      roomId: { type: DataTypes.STRING(40), allowNull: false, field: "room_id" },
      weekStart: { type: DataTypes.DATEONLY, allowNull: false, field: "week_start" },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      dayIndex: { type: DataTypes.INTEGER, allowNull: false, field: "day_index" },
      value: { type: DataTypes.STRING(1), allowNull: false, defaultValue: "" },
    },
    {
      tableName: "planning_schedule_overrides",
      timestamps: true,
    }
  );

  PlanningScheduleOverride.associate = (models) => {
    PlanningScheduleOverride.belongsTo(models.PlanningRoom, { foreignKey: "roomId", as: "room" });
    PlanningScheduleOverride.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return PlanningScheduleOverride;
};
