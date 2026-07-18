"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notifications", {
      id: { type: Sequelize.INTEGER, primaryKey: true },
      admin_emails: { type: Sequelize.JSON, allowNull: false },
      drive_folder_url: { type: Sequelize.STRING(500), allowNull: true, defaultValue: "" },
      rules: { type: Sequelize.JSON, allowNull: false },
      frequency: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "Hebdomadaire (lundi matin)" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("notifications");
  },
};
