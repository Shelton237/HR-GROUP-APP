"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('Admin','RH','Manager','Lecture','Agent') NOT NULL DEFAULT 'Lecture'"
    );
    await queryInterface.addColumn("users", "employee_id", {
      type: Sequelize.STRING(40),
      allowNull: true,
      references: { model: "employees", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "employee_id");
    await queryInterface.sequelize.query("ALTER TABLE users MODIFY role ENUM('Admin','RH','Manager','Lecture') NOT NULL DEFAULT 'Lecture'");
  },
};
