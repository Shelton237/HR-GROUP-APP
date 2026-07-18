"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employees", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      company_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      poste: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
      contract_type: { type: Sequelize.STRING(60), allowNull: true },
      hire_date: { type: Sequelize.DATEONLY, allowNull: true },
      contract_end_date: { type: Sequelize.DATEONLY, allowNull: true },
      salary_brut: { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 },
      probation_months: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "Actif" },
      matricule: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      gender: { type: Sequelize.STRING(20), allowNull: true, defaultValue: "" },
      marital_status: { type: Sequelize.STRING(30), allowNull: true, defaultValue: "" },
      dependents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      nationality: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "" },
      birth_date: { type: Sequelize.DATEONLY, allowNull: true },
      cin: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      social_number: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      phone: { type: Sequelize.STRING(40), allowNull: true, defaultValue: "" },
      email: { type: Sequelize.STRING(180), allowNull: true, defaultValue: "" },
      address: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "" },
      bank_account: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "" },
      mobile_money: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "" },
      manager_id: {
        type: Sequelize.STRING(40),
        allowNull: true,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      department: { type: Sequelize.STRING(100), allowNull: true, defaultValue: "" },
      site: { type: Sequelize.STRING(100), allowNull: true, defaultValue: "" },
      category: { type: Sequelize.STRING(100), allowNull: true, defaultValue: "" },
      leave_balance: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      custom_json: { type: Sequelize.JSON, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employees");
  },
};
