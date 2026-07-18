module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.STRING(40), primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
      mustChangePassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "must_change_password",
      },
      role: {
        type: DataTypes.ENUM("Admin", "RH", "Manager", "Lecture"),
        allowNull: false,
        defaultValue: "Lecture",
      },
      // "all" (string) or an array of company ids, matching the front-end shape exactly.
      scope: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};
