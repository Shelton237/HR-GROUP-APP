"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("audit_logs", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.STRING(40),
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      // Denormalized so the log stays readable even if the user account is later deleted.
      user_name: { type: Sequelize.STRING(150), allowNull: false },
      action: { type: Sequelize.STRING(60), allowNull: false },
      entity_type: { type: Sequelize.STRING(60), allowNull: false },
      entity_id: { type: Sequelize.STRING(40), allowNull: true },
      detail: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("audit_logs", ["createdAt"], { name: "audit_logs_created_at_idx" });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("audit_logs");
  },
};
