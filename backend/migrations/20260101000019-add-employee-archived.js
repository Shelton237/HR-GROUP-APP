"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("employees", "archived", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("employees", "archived_at", { type: Sequelize.DATE, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("employees", "archived");
    await queryInterface.removeColumn("employees", "archived_at");
  },
};
