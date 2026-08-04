import {Router} from "express";
import {
  getHumidityByRack,
  getHumidityHistory,
  getHumidityStatistics,
  getLatestHumidity,
  getRackOverview,
} from "../controller/humidityController.js";

const humidityRouter = Router();

humidityRouter.get("/overview", getRackOverview);
humidityRouter.get("/latest", getLatestHumidity);
humidityRouter.get("/history", getHumidityHistory);
humidityRouter.get("/statistics", getHumidityStatistics);
humidityRouter.get("/rack/:rack", getHumidityByRack);

export default humidityRouter;
