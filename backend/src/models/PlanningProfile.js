module.exports = (sequelize, DataTypes) => {
  const PlanningProfile = sequelize.define(
    "PlanningProfile",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, unique: true, field: "employee_id" },
      roomId: { type: DataTypes.STRING(40), allowNull: false, field: "room_id" },
      type: { type: DataTypes.ENUM("rotation", "fixed_day"), allowNull: false },
      offset: { type: DataTypes.INTEGER, allowNull: true },
      binome: { type: DataTypes.INTEGER, allowNull: true },
      daySpecJson: { type: DataTypes.JSON, allowNull: true, field: "day_spec_json" },
      altParity: { type: DataTypes.INTEGER, allowNull: true, field: "alt_parity" },
    },
    {
      tableName: "planning_profiles",
      timestamps: true,
    }
  );

  PlanningProfile.associate = (models) => {
    PlanningProfile.belongsTo(models.Employee, { foreignKey: "employeeId" });
    PlanningProfile.belongsTo(models.PlanningRoom, { foreignKey: "roomId", as: "room" });
  };

  PlanningProfile.prototype.isRotation = function () {
    return this.type === "rotation";
  };
  PlanningProfile.prototype.isFixedDay = function () {
    return this.type === "fixed_day";
  };

  return PlanningProfile;
};
