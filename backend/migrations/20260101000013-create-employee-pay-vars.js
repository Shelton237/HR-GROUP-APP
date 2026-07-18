"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_pay_vars", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      month: { type: Sequelize.STRING(7), allowNull: false },
      label: { type: Sequelize.STRING(150), allowNull: false },
      kind: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "gain" },
      taxable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      cotisable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      amount: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("employee_pay_vars", ["employee_id", "month"], {
      name: "employee_pay_vars_employee_id_month",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_pay_vars");
  },
};
