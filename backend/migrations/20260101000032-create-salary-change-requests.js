"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("salary_change_requests", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      employee_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      requested_by: { type: Sequelize.STRING(40), allowNull: true },
      requested_by_name: { type: Sequelize.STRING(150), allowNull: false },
      previous_salary: { type: Sequelize.DOUBLE, allowNull: false },
      requested_salary: { type: Sequelize.DOUBLE, allowNull: false },
      status: { type: Sequelize.ENUM("En attente", "Validé", "Refusé"), allowNull: false, defaultValue: "En attente" },
      reviewed_by: { type: Sequelize.STRING(40), allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("salary_change_requests", ["employee_id", "status"], {
      name: "salary_change_requests_employee_status_idx",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("salary_change_requests");
  },
};
