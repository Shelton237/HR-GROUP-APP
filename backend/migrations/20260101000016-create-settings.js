"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("settings", {
      id: { type: Sequelize.INTEGER, primaryKey: true },
      ref_currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "EUR" },
      rates: { type: Sequelize.JSON, allowNull: false },
      legal_monthly_hours: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 173.33 },
      contract_types: { type: Sequelize.JSON, allowNull: false },
      leave_types: { type: Sequelize.JSON, allowNull: false },
      warning_types: { type: Sequelize.JSON, allowNull: false },
      eval_decisions: { type: Sequelize.JSON, allowNull: false },
      document_categories: { type: Sequelize.JSON, allowNull: false },
      departments: { type: Sequelize.JSON, allowNull: false },
      sites: { type: Sequelize.JSON, allowNull: false },
      postes: { type: Sequelize.JSON, allowNull: false },
      categories: { type: Sequelize.JSON, allowNull: false },
      pay_elements: { type: Sequelize.JSON, allowNull: false },
      custom_fields: { type: Sequelize.JSON, allowNull: false },
      eval_templates: { type: Sequelize.JSON, allowNull: false },
      onboarding_templates: { type: Sequelize.JSON, allowNull: false },
      max_emergency_contacts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("settings");
  },
};
