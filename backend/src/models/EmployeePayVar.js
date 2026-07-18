module.exports = (sequelize, DataTypes) => {
  const EmployeePayVar = sequelize.define(
    "EmployeePayVar",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      // "YYYY-MM" payroll month bucket, matching e.payVars[month] in App.jsx
      month: { type: DataTypes.STRING(7), allowNull: false },
      label: { type: DataTypes.STRING(150), allowNull: false },
      kind: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "gain" }, // "gain" | "retenue"
      taxable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      cotisable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "employee_pay_vars",
      timestamps: true,
      indexes: [{ fields: ["employee_id", "month"] }],
    }
  );

  EmployeePayVar.associate = (models) => {
    EmployeePayVar.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeePayVar;
};
