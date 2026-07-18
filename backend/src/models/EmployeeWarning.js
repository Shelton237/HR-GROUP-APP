module.exports = (sequelize, DataTypes) => {
  const EmployeeWarning = sequelize.define(
    "EmployeeWarning",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      type: { type: DataTypes.STRING(60), allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "employee_warnings",
      timestamps: true,
    }
  );

  EmployeeWarning.associate = (models) => {
    EmployeeWarning.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeWarning;
};
