module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: DataTypes.STRING(40), allowNull: false, field: "employee_id" },
      // "YYYY-MM", mirrors the `${month}|${employeeId}` key used in App.jsx data.payments
      month: { type: DataTypes.STRING(7), allowNull: false },
      validated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: "payments",
      timestamps: true,
      indexes: [{ unique: true, fields: ["employee_id", "month"] }],
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return Payment;
};
