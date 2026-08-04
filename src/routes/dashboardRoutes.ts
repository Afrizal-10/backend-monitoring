import express from "express";
import {
  getAverageRack,
  getLatestTemperature,
  getRecentActivity,
  getSummary,
  getTemperatureTrend,
} from "../controller/dashboardController.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/temperature-trend", getTemperatureTrend);
dashboardRouter.get("/latest-temperature", getLatestTemperature);
dashboardRouter.get("/average-rack", getAverageRack);
dashboardRouter.get("/recent-activity", getRecentActivity);

export default dashboardRouter;
