module.exports = (sequelize, DataTypes) => {
  const EmployeeEvaluation = sequelize.define(
    "EmployeeEvaluation",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      // References Settings.evalTemplates[].id (config JSON), not a hard FK.
      templateId: { type: DataTypes.STRING(40), allowNull: true, field: "template_id" },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      scoresJson: { type: DataTypes.JSON, allowNull: false, defaultValue: {}, field: "scores_json" },
      total: { type: DataTypes.INTEGER, allowNull: true },
      decision: { type: DataTypes.STRING(60), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      evaluator: { type: DataTypes.STRING(150), allowNull: true, defaultValue: "" },
    },
    {
      tableName: "employee_evaluations",
      timestamps: true,
    }
  );

  EmployeeEvaluation.associate = (models) => {
    EmployeeEvaluation.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmployeeEvaluation;
};
