module.exports = (sequelize, DataTypes) => {
  // Singleton table (single row, id = 1). Mirrors data.notifications in App.jsx.
  const Notifications = sequelize.define(
    "Notifications",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
      adminEmails: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: "admin_emails" },
      driveFolderUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "",
        field: "drive_folder_url",
      },
      rules: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      frequency: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "Hebdomadaire (lundi matin)" },
    },
    {
      tableName: "notifications",
      timestamps: true,
    }
  );

  return Notifications;
};
