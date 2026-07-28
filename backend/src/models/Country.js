module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define(
    "Country",
    {
      code: { type: DataTypes.STRING(4), primaryKey: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
      currency: { type: DataTypes.STRING(8), allowNull: false },
      flag: { type: DataTypes.STRING(8), allowNull: true },
      validated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      leaveAccrual: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 2.5 },
      minTax: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      // IANA name — lets country-scoped scheduled jobs (HR alerts digest) fire
      // at the right local time instead of a single server-time schedule.
      timezone: { type: DataTypes.STRING(60), allowNull: false, defaultValue: "UTC" },
      // Config-shaped, rarely queried nested data kept as native JSON columns
      // rather than exploded into more tables (see spec).
      contributionsJson: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: { employee: [], employer: [] },
        field: "contributions_json",
      },
      taxBracketsJson: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "tax_brackets_json",
      },
      checklistJson: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "checklist_json",
      },
      holidaysJson: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "holidays_json",
      },
    },
    {
      tableName: "countries",
      timestamps: true,
    }
  );

  Country.associate = (models) => {
    Country.hasMany(models.Company, { foreignKey: "countryCode", sourceKey: "code" });
  };

  return Country;
};
