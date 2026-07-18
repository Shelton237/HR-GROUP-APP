module.exports = (sequelize, DataTypes) => {
  const EmployeeDocument = sequelize.define(
    "EmployeeDocument",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      name: { type: DataTypes.STRING(255), allowNull: false },
      category: { type: DataTypes.STRING(80), allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: "expiry_date" },
      dataUrl: { type: DataTypes.TEXT("long"), allowNull: true, field: "data_url" },
      uploadedAt: { type: DataTypes.DATE, allowNull: true, field: "uploaded_at" },
    },
    {
      tableName: "employee_documents",
      timestamps: true,
    }
  );

  EmployeeDocument.associate = (models) => {
    EmployeeDocument.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeDocument;
};
