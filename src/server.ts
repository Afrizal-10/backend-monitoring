import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import temperatureRouter from "./routes/temperatureRoutes.js";
import humidityRouter from "./routes/humidityRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import historyRouter from "./routes/historyRoutes.js";

import "./mqtt/subscriber.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

console.log("========== ENV CHECK ==========");
console.log("PORT:", process.env.PORT);
console.log("MQTT_BROKER:", process.env.MQTT_BROKER);
console.log("MQTT_USERNAME:", process.env.MQTT_USERNAME);
console.log("MQTT_CLIENT_ID:", process.env.MQTT_CLIENT_ID);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Loaded " : "Missing ");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded " : "Missing ");
console.log("================================");

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://pc58r4w0-3001.asse.devtunnels.ms",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    status: "OK",
    service: "Data Center Monitoring API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/temperatures", temperatureRouter);
app.use("/api/humidities", humidityRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/histories", historyRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
