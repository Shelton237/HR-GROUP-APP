module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    "Company",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      countryCode: { type: DataTypes.STRING(4), allowNull: false, field: "country_code" },
      nif: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
      rcs: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
      employerNumber: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "", field: "employer_number" },
      address: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    },
    {
      tableName: "companies",
      timestamps: true,
    }
  );

  Company.associate = (models) => {
    Company.belongsTo(models.Country, { foreignKey: "countryCode", targetKey: "code" });
    Company.hasMany(models.CompanyDocument, { foreignKey: "companyId", as: "documents" });
    Company.hasMany(models.Employee, { foreignKey: "companyId" });
  };

  return Company;
};
