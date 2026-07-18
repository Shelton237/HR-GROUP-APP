require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

const app = require("./app");
const sequelize = require("./config/db");

const PORT = process.env.PORT || 3010;

async function start() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log("Database connection established.");
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`hr-group-api listening on port ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unable to start server:", err);
    process.exit(1);
  }
}

start();
