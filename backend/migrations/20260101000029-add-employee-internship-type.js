"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("employees", "internship_type", {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("employees", "internship_type");
  },
};
