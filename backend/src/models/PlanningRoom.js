module.exports = (sequelize, DataTypes) => {
  const PlanningRoom = sequelize.define(
    "PlanningRoom",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      mode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "quart" },
    },
    {
      tableName: "planning_rooms",
      timestamps: true,
    }
  );

  PlanningRoom.associate = (models) => {
    PlanningRoom.hasMany(models.PlanningProfile, { foreignKey: "roomId", as: "profiles" });
    PlanningRoom.hasMany(models.PlanningScheduleOverride, { foreignKey: "roomId", as: "scheduleOverrides" });
    PlanningRoom.hasMany(models.PlanningRoomWeekLoan, { foreignKey: "roomId", as: "weekLoans" });
  };

  return PlanningRoom;
};
