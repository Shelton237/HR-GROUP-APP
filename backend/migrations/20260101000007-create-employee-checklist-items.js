"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_checklist_items", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      key: { type: Sequelize.STRING(60), allowNull: false },
      done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("employee_checklist_items", ["employee_id", "key"], {
      unique: true,
      name: "employee_checklist_items_employee_id_key_unique",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("employee_checklist_items");
  },
};
