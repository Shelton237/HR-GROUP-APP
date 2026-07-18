module.exports = (sequelize, DataTypes) => {
  const CompanyDocument = sequelize.define(
    "CompanyDocument",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      companyId: { type: DataTypes.STRING(40), allowNull: false, field: "company_id" },
      name: { type: DataTypes.STRING(255), allowNull: false },
      category: { type: DataTypes.STRING(80), allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: "expiry_date" },
      dataUrl: { type: DataTypes.TEXT("long"), allowNull: true, field: "data_url" },
      uploadedAt: { type: DataTypes.DATE, allowNull: true, field: "uploaded_at" },
    },
    {
      tableName: "company_documents",
      timestamps: true,
    }
  );

  CompanyDocument.associate = (models) => {
    CompanyDocument.belongsTo(models.Company, { foreignKey: "companyId" });
  };

  return CompanyDocument;
};
