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
      // "Operateur" has the exact same permissions as "RH" (see requireRole in
      // middlewares/auth.js, which treats it as an RH alias) — the only
      // difference is it never sees the consolidated Dashboard, only its
      // scoped companies' day-to-day data.
      // "Planificateur" is the mirror image: access to the Planning module
      // ONLY, blocked from every other module (Salariés, Paie, Congés,
      // Paramètres, Dashboard, Utilisateurs...) — see blockPlanificateur in
      // middlewares/auth.js, applied to every non-Planning router.
      role: {
        type: DataTypes.ENUM("Admin", "RH", "Manager", "Lecture", "Agent", "Operateur", "Planificateur"),
        allowNull: false,
        defaultValue: "Lecture",
      },
      // "all" (string) or an array of company ids, matching the front-end shape exactly.
      scope: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      phone: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "" },
      // Set for role "Agent" — links the login to the RH employee it acts as
      // (self-service Planning access). Never trust a URL param for this scoping.
      employeeId: { type: DataTypes.STRING(40), allowNull: true, field: "employee_id" },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Employee, { foreignKey: "employeeId" });
  };

  return User;
};
