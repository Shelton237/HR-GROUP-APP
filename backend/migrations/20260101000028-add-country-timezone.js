"use strict";

const TIMEZONE_BY_CODE = {
  MG: "Indian/Antananarivo",
  CM: "Africa/Douala",
  CI: "Africa/Abidjan",
  TD: "Africa/Ndjamena",
  GA: "Africa/Libreville",
  ML: "Africa/Bamako",
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("countries", "timezone", {
      type: Sequelize.STRING(60),
      allowNull: false,
      defaultValue: "UTC",
    });
    for (const [code, timezone] of Object.entries(TIMEZONE_BY_CODE)) {
      await queryInterface.sequelize.query("UPDATE countries SET timezone = :timezone WHERE code = :code", {
        replacements: { timezone, code },
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("countries", "timezone");
  },
};
