const { Sequelize } = require("sequelize");

require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

const sequelize = new Sequelize(
  process.env.DB_NAME || "hr_group_db_dev",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || undefined,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;
