"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("companies", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      country_code: {
        type: Sequelize.STRING(4),
        allowNull: false,
        references: { model: "countries", key: "code" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      nif: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      rcs: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      employer_number: { type: Sequelize.STRING(60), allowNull: true, defaultValue: "" },
      address: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("companies");
  },
};
