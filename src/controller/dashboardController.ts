import type {Request, Response} from "express";
import prisma from "../lib/prisma.js";
import {
  getAverageHumidity,
  getAverageTemperature,
  getHighestTemperature,
  getHumidityStatus,
  getTemperatureStatus,
} from "../utils/temperature.js";

// Summary
export const getSummary = async (req: Request, res: Response) => {
  try {
    const current = await prisma.temperatureCurrent.findMany();

    const totalRack = current.length;

    let minimumTemperature = 0;
    let maximumTemperature = 0;
    let averageTemperature = 0;

    let minimumHumidity = 0;
    let maximumHumidity = 0;
    let averageHumidity = 0;

    if (current.length > 0) {
      // Temperature
      const temperatures = current
        .flatMap((item) => [
          item.topTemperature,
          item.middleTemperature,
          item.bottomTemperature,
        ])
        .filter((value) => value > 0);

      if (temperatures.length > 0) {
        minimumTemperature = Math.min(...temperatures);

        maximumTemperature = Math.max(...temperatures);

        averageTemperature = Number(
          (
            temperatures.reduce((sum, value) => sum + value, 0) /
            temperatures.length
          ).toFixed(2),
        );
      }

      // Humidity
      const humidities = current
        .flatMap((item) => [
          item.topHumidity,
          item.middleHumidity,
          item.bottomHumidity,
        ])
        .filter((value) => value > 0);

      if (humidities.length > 0) {
        minimumHumidity = Math.min(...humidities);
        maximumHumidity = Math.max(...humidities);
        averageHumidity = Number(
          (
            humidities.reduce((sum, value) => sum + value, 0) /
            humidities.length
          ).toFixed(2),
        );
      }
    }

    const topSensor = current.some((item) => item.topTemperature > 0)
      ? "ONLINE"
      : "OFFLINE";

    const middleSensor = current.some((item) => item.middleTemperature > 0)
      ? "ONLINE"
      : "OFFLINE";

    const bottomSensor = current.some((item) => item.bottomTemperature > 0)
      ? "ONLINE"
      : "OFFLINE";

    return res.json({
      message: "Summary data",
      data: {
        totalRack,

        minimumTemperature,
        maximumTemperature,
        averageTemperature,

        minimumHumidity,
        maximumHumidity,
        averageHumidity,

        topSensor,
        middleSensor,
        bottomSensor,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed get summary",
    });
  }
};

// Temperature trend
export const getTemperatureTrend = async (req: Request, res: Response) => {
  try {
    const racks = await prisma.temperatureCurrent.findMany({
      select: {
        rack: true,
      },
      orderBy: {
        rack: "asc",
      },
    });

    const result: any[] = [];

    for (const item of racks) {
      const histories = await prisma.temperatureHistory.findMany({
        where: {
          rack: item.rack,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 10,
      });

      histories.forEach((history) => {
        result.push({
          rack: history.rack,

          time: history.createdAt.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),

          // Temperature
          topTemperature: history.topTemperature,
          middleTemperature: history.middleTemperature,
          bottomTemperature: history.bottomTemperature,

          // Humidity
          topHumidity: history.topHumidity,
          middleHumidity: history.middleHumidity,
          bottomHumidity: history.bottomHumidity,
        });
      });
    }

    return res.json({
      message: "Temperature & Humidity trend",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get trend",
    });
  }
};

// Latest temperature
export const getLatestTemperature = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.temperatureCurrent.count(),
      prisma.temperatureCurrent.findMany({
        orderBy: {
          rack: "asc",
        },
        skip,
        take: limit,
      }),
    ]);

    const data = rows.map((item) => ({
      ...item,

      temperatureStatus: getTemperatureStatus(
        item.topTemperature,
        item.middleTemperature,
        item.bottomTemperature,
      ),

      humidityStatus: getHumidityStatus(
        item.topHumidity,
        item.middleHumidity,
        item.bottomHumidity,
      ),
    }));

    return res.json({
      message: "Latest temperature",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed get latest temperature",
    });
  }
};

// Average rack
export const getAverageRack = async (req: Request, res: Response) => {
  try {
    const data = await prisma.temperatureCurrent.findMany({
      orderBy: {
        rack: "asc",
      },
    });

    const result = data.map((item) => ({
      rack: item.rack,

      // Temperature Average
      averageTemperature: Number(
        getAverageTemperature(
          item.topTemperature,
          item.middleTemperature,
          item.bottomTemperature,
        ).toFixed(2),
      ),

      // Humidity Average
      averageHumidity: Number(
        getAverageHumidity(
          item.topHumidity,
          item.middleHumidity,
          item.bottomHumidity,
        ).toFixed(2),
      ),

      // Detail Temperature
      temperature: {
        top: item.topTemperature,
        middle: item.middleTemperature,
        bottom: item.bottomTemperature,
      },

      // Detail Humidity
      humidity: {
        top: item.topHumidity,
        middle: item.middleHumidity,
        bottom: item.bottomHumidity,
      },
    }));

    return res.json({
      message: "Average rack temperature and humidity",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get average rack",
    });
  }
};

// Recent activity
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 30);

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.temperatureHistory.count(),

      prisma.temperatureHistory.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const result = data.map((item) => ({
      id: item.id,
      packet: item.packet,
      rack: item.rack,

      message: "Temperature & Humidity Updated",

      temperature: {
        top: item.topTemperature,
        middle: item.middleTemperature,
        bottom: item.bottomTemperature,
      },

      humidity: {
        top: item.topHumidity,
        middle: item.middleHumidity,
        bottom: item.bottomHumidity,
      },

      temperatureStatus: getTemperatureStatus(
        item.topTemperature,
        item.middleTemperature,
        item.bottomTemperature,
      ),

      humidityStatus: getHumidityStatus(
        item.topHumidity,
        item.middleHumidity,
        item.bottomHumidity,
      ),

      time: item.createdAt,
    }));

    return res.json({
      message: "Recent activity",
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get activity",
    });
  }
};
