"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("planning_absences", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      type: { type: Sequelize.ENUM("absence", "permission"), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM("enregistree", "refusee", "en_attente"), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("planning_absences");
  },
};
