module.exports = (sequelize, DataTypes) => {
  const EmployeeOvertime = sequelize.define(
    "EmployeeOvertime",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      // "YYYY-MM" payroll month bucket, matching e.overtime[month] in App.jsx
      month: { type: DataTypes.STRING(7), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: true },
      method: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "hourly" }, // "hourly" | "forfait"
      hours: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      rate: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      amount: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    },
    {
      tableName: "employee_overtime",
      timestamps: true,
      indexes: [{ fields: ["employee_id", "month"] }],
    }
  );

  EmployeeOvertime.associate = (models) => {
    EmployeeOvertime.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeOvertime;
};
