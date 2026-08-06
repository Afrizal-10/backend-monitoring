import type {Request, Response} from "express";
import {prisma} from "../lib/prisma.js";
import {getHumidityStatus, getTemperatureStatus} from "../utils/temperature.js";

// Rack overview
export const getRackOverview = async (req: Request, res: Response) => {
  try {
    const data = await prisma.temperatureCurrent.findMany({
      orderBy: {
        rack: "asc",
      },
      select: {
        rack: true,
        packet: true,

        topTemperature: true,
        middleTemperature: true,
        bottomTemperature: true,

        topHumidity: true,
        middleHumidity: true,
        bottomHumidity: true,

        updatedAt: true,
      },
    });

    const result = data.map((item) => ({
      rack: item.rack,
      packet: item.packet,

      topTemperature: item.topTemperature,
      middleTemperature: item.middleTemperature,
      bottomTemperature: item.bottomTemperature,

      topHumidity: item.topHumidity,
      middleHumidity: item.middleHumidity,
      bottomHumidity: item.bottomHumidity,

      updatedAt: item.updatedAt,

      // Status Temperature keseluruhan
      temperatureStatus: getTemperatureStatus(
        item.topTemperature,
        item.middleTemperature,
        item.bottomTemperature,
      ),

      // Status masing-masing sensor
      topTemperatureStatus: getTemperatureStatus(
        item.topTemperature,
        item.topTemperature,
        item.topTemperature,
      ),

      middleTemperatureStatus: getTemperatureStatus(
        item.middleTemperature,
        item.middleTemperature,
        item.middleTemperature,
      ),

      bottomTemperatureStatus: getTemperatureStatus(
        item.bottomTemperature,
        item.bottomTemperature,
        item.bottomTemperature,
      ),

      // Status Humidity
      humidityStatus: getHumidityStatus(
        item.topHumidity,
        item.middleHumidity,
        item.bottomHumidity,
      ),
    }));

    return res.status(200).json({
      message: "Temperature overview",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil overview temperature",
    });
  }
};

// Get latest temperature
export const getLatestTemperature = async (req: Request, res: Response) => {
  try {
    const latest = await prisma.temperatureHistory.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!latest) {
      return res.status(200).json({
        data: null,
        message: "Belum ada data temperature.",
      });
    }

    return res.status(200).json({
      message: "Data terakhir berhasil diterima",
      data: {
        rack: latest.rack,
        packet: latest.packet,

        temperature: {
          top: latest.topTemperature,
          middle: latest.middleTemperature,
          bottom: latest.bottomTemperature,
        },

        receivedAt: latest.createdAt,

        source: {
          protocol: "MQTT",
          broker: "EMQX Cloud",
          topic: process.env.MQTT_TOPIC,
        },
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil data terbaru.",
    });
  }
};

// Riwayat suhu
export const getTemperatureHistory = async (req: Request, res: Response) => {
  try {
    const temperatures = await prisma.temperatureHistory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Riwayat suhu",
      data: temperatures,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil riwayat suhu",
    });
  }
};

// Riwayat suhu berdasarkan rack
export const getTemperatureByRack = async (
  req: Request<{rack: string}>,
  res: Response,
) => {
  try {
    const {rack} = req.params;

    const temperatures = await prisma.temperatureHistory.findMany({
      where: {
        rack: {
          equals: rack,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 20,
    });

    const chartData = temperatures.map((item) => ({
      time: new Date(item.createdAt).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }),

      topTemperature: item.topTemperature,
      middleTemperature: item.middleTemperature,
      bottomTemperature: item.bottomTemperature,
    }));

    return res.status(200).json({
      message: `Data suhu untuk ${rack}`,
      data: chartData,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil data rack",
    });
  }
};

// Dashboard - Mengambil statistik
export const getTemperatureStatistics = async (req: Request, res: Response) => {
  try {
    const totalData = await prisma.temperatureHistory.count();

    const totalRack = await prisma.temperatureCurrent.count();

    const latest = await prisma.temperatureHistory.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    const averages = await prisma.temperatureCurrent.findMany();

    const averageTemperature =
      averages.length > 0
        ? averages.reduce(
            (sum, item) =>
              sum +
              (item.topTemperature +
                item.middleTemperature +
                item.bottomTemperature) /
                3,
            0,
          ) / averages.length
        : 0;

    return res.status(200).json({
      message: "Statistik suhu",
      data: {
        totalRack,
        totalData,
        averageTemperature: Number(averageTemperature.toFixed(2)),
        latest,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil statistik",
    });
  }
};
