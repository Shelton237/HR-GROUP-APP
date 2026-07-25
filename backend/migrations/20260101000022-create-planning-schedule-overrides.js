"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("planning_schedule_overrides", {
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
      day_index: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      value: { type: Sequelize.STRING(1), allowNull: false, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("planning_schedule_overrides", ["room_id", "week_start", "employee_id", "day_index"], {
      unique: true,
      name: "sched_override_unique",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("planning_schedule_overrides");
  },
};
