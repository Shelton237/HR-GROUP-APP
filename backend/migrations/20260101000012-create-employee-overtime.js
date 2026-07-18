"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_overtime", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      month: { type: Sequelize.STRING(7), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: true },
      method: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "hourly" },
      hours: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      rate: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      amount: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("employee_overtime", ["employee_id", "month"], {
      name: "employee_overtime_employee_id_month",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_overtime");
  },
};
