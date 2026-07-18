"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      must_change_password: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      role: {
        type: Sequelize.ENUM("Admin", "RH", "Manager", "Lecture"),
        allowNull: false,
        defaultValue: "Lecture",
      },
      scope: { type: Sequelize.JSON, allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("users");
  },
};
