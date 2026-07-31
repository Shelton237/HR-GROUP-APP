module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.STRING(40), allowNull: true, field: "user_id" },
      userName: { type: DataTypes.STRING(150), allowNull: false, field: "user_name" },
      action: { type: DataTypes.STRING(60), allowNull: false },
      entityType: { type: DataTypes.STRING(60), allowNull: false, field: "entity_type" },
      entityId: { type: DataTypes.STRING(40), allowNull: true, field: "entity_id" },
      detail: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: "audit_logs",
      timestamps: true,
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: "userId" });
  };

  return AuditLog;
};
