module.exports = (sequelize, DataTypes) => {
  const EmployeeChecklistItem = sequelize.define(
    "EmployeeChecklistItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      // Matches the country checklist template item key (Country.checklistJson[].key)
      key: { type: DataTypes.STRING(60), allowNull: false },
      done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: "employee_checklist_items",
      timestamps: true,
      indexes: [{ unique: true, fields: ["employee_id", "key"] }],
    }
  );

  EmployeeChecklistItem.associate = (models) => {
    EmployeeChecklistItem.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeChecklistItem;
};
