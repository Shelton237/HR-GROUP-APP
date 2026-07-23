"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("employees", "exit_date", { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn("employees", "exit_reason", { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn("employees", "exit_notes", { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn("settings", "exit_reasons", { type: Sequelize.JSON, allowNull: true });
    await queryInterface.bulkUpdate(
      "settings",
      {
        exit_reasons: JSON.stringify([
          "Démission",
          "Licenciement",
          "Rupture période d'essai",
          "Fin de contrat (CDD)",
          "Rupture conventionnelle",
          "Décès",
          "Autre",
        ]),
      },
      { id: 1 }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("employees", "exit_date");
    await queryInterface.removeColumn("employees", "exit_reason");
    await queryInterface.removeColumn("employees", "exit_notes");
    await queryInterface.removeColumn("settings", "exit_reasons");
  },
};
