"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "phone", {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "phone");
  },
};
