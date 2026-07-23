module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "Employee",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      companyId: { type: DataTypes.STRING(40), allowNull: false, field: "company_id" },
      firstName: { type: DataTypes.STRING(100), allowNull: false, field: "first_name" },
      lastName: { type: DataTypes.STRING(100), allowNull: false, field: "last_name" },
      poste: { type: DataTypes.STRING(150), allowNull: true, defaultValue: "" },
      contractType: { type: DataTypes.STRING(60), allowNull: true, field: "contract_type" },
      hireDate: { type: DataTypes.DATEONLY, allowNull: true, field: "hire_date" },
      contractEndDate: { type: DataTypes.DATEONLY, allowNull: true, field: "contract_end_date" },
      salaryBrut: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0, field: "salary_brut" },
      probationMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3, field: "probation_months" },
      // "Actif" | "Période d'essai" | "Sorti" — kept as STRING (not ENUM) because
      // contract/status vocab is meant to stay admin-configurable like contractTypes.
      status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Actif" },
      matricule: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
      gender: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "" },
      maritalStatus: { type: DataTypes.STRING(30), allowNull: true, defaultValue: "", field: "marital_status" },
      dependents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      nationality: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "" },
      birthDate: { type: DataTypes.DATEONLY, allowNull: true, field: "birth_date" },
      cin: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
      socialNumber: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "", field: "social_number" },
      phone: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "" },
      email: { type: DataTypes.STRING(180), allowNull: true, defaultValue: "" },
      address: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
      bankAccount: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "", field: "bank_account" },
      mobileMoney: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "", field: "mobile_money" },
      managerId: { type: DataTypes.STRING(40), allowNull: true, field: "manager_id" },
      department: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "" },
      site: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "" },
      category: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "" },
      leaveBalance: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, field: "leave_balance" },
      // Customizable fields (Settings.customFields), keyed by custom field id.
      customJson: { type: DataTypes.JSON, allowNull: false, defaultValue: {}, field: "custom_json" },
      // Set when status is switched to "Sorti" — captures why (démission,
      // licenciement, fin d'essai, etc.), not just that it happened.
      exitDate: { type: DataTypes.DATEONLY, allowNull: true, field: "exit_date" },
      exitReason: { type: DataTypes.STRING(100), allowNull: true, field: "exit_reason" },
      exitNotes: { type: DataTypes.TEXT, allowNull: true, field: "exit_notes" },
    },
    {
      tableName: "employees",
      timestamps: true,
    }
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.Company, { foreignKey: "companyId" });
    Employee.belongsTo(models.Employee, { foreignKey: "managerId", as: "manager" });
    Employee.hasMany(models.EmergencyContact, { foreignKey: "employeeId", as: "emergencyContacts" });
    Employee.hasMany(models.EmployeeChecklistItem, { foreignKey: "employeeId", as: "checklist" });
    Employee.hasMany(models.EmployeeEvaluation, { foreignKey: "employeeId", as: "evaluations" });
    Employee.hasMany(models.EmployeeWarning, { foreignKey: "employeeId", as: "warnings" });
    Employee.hasMany(models.EmployeeDocument, { foreignKey: "employeeId", as: "documents" });
    Employee.hasOne(models.EmployeeOnboarding, { foreignKey: "employeeId", as: "onboarding" });
    Employee.hasMany(models.EmployeeOvertime, { foreignKey: "employeeId", as: "overtimeEntries" });
    Employee.hasMany(models.EmployeePayVar, { foreignKey: "employeeId", as: "payVarEntries" });
    Employee.hasMany(models.Leave, { foreignKey: "employeeId" });
    Employee.hasMany(models.Payment, { foreignKey: "employeeId" });
  };

  return Employee;
};
