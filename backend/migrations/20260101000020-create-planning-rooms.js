"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("planning_rooms", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      mode: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "quart" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("planning_rooms");
  },
};
