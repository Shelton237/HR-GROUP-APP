module.exports = (sequelize, DataTypes) => {
  // Singleton table (single row, id = 1). Mirrors data.settings in App.jsx almost
  // entirely as JSON since it is config-shaped and rarely queried by field.
  const Settings = sequelize.define(
    "Settings",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
      refCurrency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EUR", field: "ref_currency" },
      rates: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      legalMonthlyHours: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 173.33,
        field: "legal_monthly_hours",
      },
      contractTypes: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "contract_types" },
      leaveTypes: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "leave_types" },
      warningTypes: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "warning_types" },
      evalDecisions: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "eval_decisions" },
      documentCategories: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "document_categories",
      },
      departments: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      sites: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      postes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      categories: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      payElements: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "pay_elements" },
      customFields: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "custom_fields" },
      evalTemplates: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "eval_templates" },
      onboardingTemplates: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "onboarding_templates",
      },
      maxEmergencyContacts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        field: "max_emergency_contacts",
      },
    },
    {
      tableName: "settings",
      timestamps: true,
    }
  );

  return Settings;
};
