"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      month: { type: Sequelize.STRING(7), allowNull: false },
      validated: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      paid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("payments", ["employee_id", "month"], {
      unique: true,
      name: "payments_employee_id_month_unique",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("payments");
  },
};
