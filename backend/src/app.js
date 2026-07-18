const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middlewares/error");

const authRoutes = require("./routes/auth.routes");
const companiesRoutes = require("./routes/companies.routes");
const employeesRoutes = require("./routes/employees.routes");
const countriesRoutes = require("./routes/countries.routes");
const leavesRoutes = require("./routes/leaves.routes");
const payrollRoutes = require("./routes/payroll.routes");
const paymentsRoutes = require("./routes/payments.routes");
const settingsRoutes = require("./routes/settings.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // documents are stored as base64 data URLs
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/countries", countriesRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
