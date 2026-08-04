import {Router} from "express";
import {
  getHistory,
  getHistoryByRack,
  getHistoryDetail,
  getHistorySummary,
  getRackList,
} from "../controller/historyController.js";

const historyRouter = Router();

historyRouter.get("/", getHistory);
historyRouter.get("/summary", getHistorySummary);
historyRouter.get("/racks", getRackList);
historyRouter.get("/rack/:rack", getHistoryByRack);
historyRouter.get("/:id", getHistoryDetail);

export default historyRouter;
