module.exports = (sequelize, DataTypes) => {
  const EmployeeOnboarding = sequelize.define(
    "EmployeeOnboarding",
    {
      employeeId: { type: DataTypes.STRING(40), primaryKey: true, field: "employee_id" },
      // References Settings.onboardingTemplates[].id (config JSON), not a hard FK.
      templateId: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "", field: "template_id" },
      // { [stepIndex]: { done: bool, date: "YYYY-MM-DD" } }
      stepsJson: { type: DataTypes.JSON, allowNull: false, defaultValue: {}, field: "steps_json" },
      decision: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "" },
    },
    {
      tableName: "employee_onboarding",
      timestamps: true,
    }
  );

  EmployeeOnboarding.associate = (models) => {
    EmployeeOnboarding.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeOnboarding;
};
