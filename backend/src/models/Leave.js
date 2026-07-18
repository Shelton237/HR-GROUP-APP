module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define(
    "Leave",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      type: { type: DataTypes.STRING(80), allowNull: false },
      start: { type: DataTypes.DATEONLY, allowNull: false },
      end: { type: DataTypes.DATEONLY, allowNull: false },
      days: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Demandé" },
      notes: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    },
    {
      tableName: "leaves",
      timestamps: true,
    }
  );

  Leave.associate = (models) => {
    Leave.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return Leave;
};
