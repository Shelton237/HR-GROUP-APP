"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_emergency_contacts", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
      relationship: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "" },
      phone: { type: Sequelize.STRING(40), allowNull: true, defaultValue: "" },
      phone2: { type: Sequelize.STRING(40), allowNull: true, defaultValue: "" },
      address: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_emergency_contacts");
  },
};
