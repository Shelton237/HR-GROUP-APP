// Config file consumed by sequelize-cli (migrations/seeders). Kept separate from
// src/config/db.js (the runtime Sequelize instance used by the app itself),
// because sequelize-cli requires a CommonJS module exporting plain objects
// keyed by environment, loaded before any app code runs.
require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

const base = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || "hr_group_db_dev",
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
