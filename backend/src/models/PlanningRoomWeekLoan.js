module.exports = (sequelize, DataTypes) => {
  const PlanningRoomWeekLoan = sequelize.define(
    "PlanningRoomWeekLoan",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      roomId: { type: DataTypes.STRING(40), allowNull: false, field: "room_id" },
      weekStart: { type: DataTypes.DATEONLY, allowNull: false, field: "week_start" },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
    },
    {
      tableName: "planning_room_week_loans",
      timestamps: true,
    }
  );

  PlanningRoomWeekLoan.associate = (models) => {
    PlanningRoomWeekLoan.belongsTo(models.PlanningRoom, { foreignKey: "roomId", as: "room" });
    PlanningRoomWeekLoan.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return PlanningRoomWeekLoan;
};
