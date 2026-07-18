"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_evaluations", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      template_id: { type: Sequelize.STRING(40), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      scores_json: { type: Sequelize.JSON, allowNull: false },
      total: { type: Sequelize.INTEGER, allowNull: true },
      decision: { type: Sequelize.STRING(60), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      evaluator: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_evaluations");
  },
};
