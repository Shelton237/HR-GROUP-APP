"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_onboarding", {
      employee_id: {
        type: Sequelize.STRING(40),
        primaryKey: true,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      template_id: { type: Sequelize.STRING(40), allowNull: true, defaultValue: "" },
      steps_json: { type: Sequelize.JSON, allowNull: false },
      decision: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_onboarding");
  },
};
