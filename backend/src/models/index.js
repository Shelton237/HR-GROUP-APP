const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const modelDefiners = [
  require("./Country"),
  require("./Company"),
  require("./CompanyDocument"),
  require("./User"),
  require("./Employee"),
  require("./EmergencyContact"),
  require("./EmployeeChecklistItem"),
  require("./EmployeeEvaluation"),
  require("./EmployeeWarning"),
  require("./EmployeeDocument"),
  require("./EmployeeOnboarding"),
  require("./EmployeeOvertime"),
  require("./EmployeePayVar"),
  require("./Leave"),
  require("./Payment"),
  require("./Settings"),
  require("./Notifications"),
];

const db = { sequelize, Sequelize: require("sequelize") };

modelDefiners.forEach((define) => {
  const model = define(sequelize, DataTypes);
  db[model.name] = model;
});

Object.values(db).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(db);
  }
});

module.exports = db;
