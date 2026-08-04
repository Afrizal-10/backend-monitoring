import express from "express";
import {
  getLatestTemperature,
  getRackOverview,
  getTemperatureByRack,
  getTemperatureHistory,
  getTemperatureStatistics,
} from "../controller/temperatureController.js";

const temperatureRouter = express.Router();

temperatureRouter.get("/overview", getRackOverview);
temperatureRouter.get("/latest", getLatestTemperature);
temperatureRouter.get("/history", getTemperatureHistory);
temperatureRouter.get("/statistics", getTemperatureStatistics);
temperatureRouter.get("/rack/:rack", getTemperatureByRack);

export default temperatureRouter;
