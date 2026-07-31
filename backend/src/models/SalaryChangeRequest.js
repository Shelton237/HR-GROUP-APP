module.exports = (sequelize, DataTypes) => {
  const SalaryChangeRequest = sequelize.define(
    "SalaryChangeRequest",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      requestedBy: { type: DataTypes.STRING(40), allowNull: true, field: "requested_by" },
      // Denormalized so the request stays readable even if the requesting
      // account is later deleted.
      requestedByName: { type: DataTypes.STRING(150), allowNull: false, field: "requested_by_name" },
      previousSalary: { type: DataTypes.DOUBLE, allowNull: false, field: "previous_salary" },
      requestedSalary: { type: DataTypes.DOUBLE, allowNull: false, field: "requested_salary" },
      status: {
        type: DataTypes.ENUM("En attente", "Validé", "Refusé"),
        allowNull: false,
        defaultValue: "En attente",
      },
      reviewedBy: { type: DataTypes.STRING(40), allowNull: true, field: "reviewed_by" },
      reviewedAt: { type: DataTypes.DATE, allowNull: true, field: "reviewed_at" },
    },
    {
      tableName: "salary_change_requests",
      timestamps: true,
    }
  );

  SalaryChangeRequest.associate = (models) => {
    SalaryChangeRequest.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return SalaryChangeRequest;
};
