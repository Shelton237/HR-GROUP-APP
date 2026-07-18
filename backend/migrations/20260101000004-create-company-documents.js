"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("company_documents", {
      id: { type: Sequelize.STRING(40), primaryKey: true },
      company_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      category: { type: Sequelize.STRING(80), allowNull: true },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      data_url: { type: Sequelize.TEXT("long"), allowNull: true },
      uploaded_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("company_documents");
  },
};
