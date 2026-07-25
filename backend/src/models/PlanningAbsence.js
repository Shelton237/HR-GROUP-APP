module.exports = (sequelize, DataTypes) => {
  const PlanningAbsence = sequelize.define(
    "PlanningAbsence",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: "start_date" },
      endDate: { type: DataTypes.DATEONLY, allowNull: false, field: "end_date" },
      type: { type: DataTypes.ENUM("absence", "permission"), allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM("enregistree", "refusee", "en_attente"), allowNull: false },
    },
    {
      tableName: "planning_absences",
      timestamps: true,
    }
  );

  PlanningAbsence.associate = (models) => {
    PlanningAbsence.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  PlanningAbsence.prototype.isEnregistree = function () {
    return this.status === "enregistree";
  };

  // True if this recorded absence/permission covers the given ISO date.
  PlanningAbsence.prototype.coversDate = function (iso) {
    return this.isEnregistree() && iso >= this.startDate && iso <= this.endDate;
  };

  return PlanningAbsence;
};
