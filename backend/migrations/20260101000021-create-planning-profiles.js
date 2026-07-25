"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("planning_profiles", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      room_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "planning_rooms", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: { type: Sequelize.ENUM("rotation", "fixed_day"), allowNull: false },
      offset: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      binome: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      day_spec_json: { type: Sequelize.JSON, allowNull: true },
      alt_parity: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("planning_profiles");
  },
};
