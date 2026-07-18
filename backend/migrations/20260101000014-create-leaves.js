"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("leaves", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: { type: Sequelize.STRING(80), allowNull: false },
      start: { type: Sequelize.DATEONLY, allowNull: false },
      end: { type: Sequelize.DATEONLY, allowNull: false },
      days: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "Demandé" },
      notes: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("leaves");
  },
};
