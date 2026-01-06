const express = require("express");
const cors = require("cors");

const dailyRoutes = require("./routes/daily.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analysisRoutes = require("./routes/analysis.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/daily", dailyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", analysisRoutes);

module.exports = app;
