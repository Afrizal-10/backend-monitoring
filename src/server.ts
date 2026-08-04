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

// Health check
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
