"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("countries", {
      code: { type: Sequelize.STRING(4), primaryKey: true },
      name: { type: Sequelize.STRING(80), allowNull: false },
      currency: { type: Sequelize.STRING(8), allowNull: false },
      flag: { type: Sequelize.STRING(8), allowNull: true },
      validated: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      leaveAccrual: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 2.5, field: "leaveAccrual" },
      minTax: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      contributions_json: { type: Sequelize.JSON, allowNull: false },
      tax_brackets_json: { type: Sequelize.JSON, allowNull: false },
      checklist_json: { type: Sequelize.JSON, allowNull: false },
      holidays_json: { type: Sequelize.JSON, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("countries");
  },
};
