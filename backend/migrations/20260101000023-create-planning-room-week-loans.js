"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("planning_room_week_loans", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      room_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "planning_rooms", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      week_start: { type: Sequelize.DATEONLY, allowNull: false },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("planning_room_week_loans", ["room_id", "week_start", "employee_id"], {
      unique: true,
      name: "room_week_loan_unique",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("planning_room_week_loans");
  },
};
