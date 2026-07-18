module.exports = (sequelize, DataTypes) => {
  const EmergencyContact = sequelize.define(
    "EmergencyContact",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      name: { type: DataTypes.STRING(150), allowNull: true, defaultValue: "" },
      relationship: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "" },
      phone: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "" },
      phone2: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "" },
      address: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    },
    {
      tableName: "employee_emergency_contacts",
      timestamps: true,
    }
  );

  EmergencyContact.associate = (models) => {
    EmergencyContact.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return EmergencyContact;
};
