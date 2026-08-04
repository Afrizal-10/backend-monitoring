import type {Request, Response} from "express";
import {prisma} from "../lib/prisma.js";
import {getHumidityStatus} from "../utils/temperature.js";

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

        topHumidity: true,
        middleHumidity: true,
        bottomHumidity: true,

        updatedAt: true,
      },
    });

    const result = data.map((item) => ({
      rack: item.rack,
      packet: item.packet,

      topHumidity: item.topHumidity,
      middleHumidity: item.middleHumidity,
      bottomHumidity: item.bottomHumidity,

      updatedAt: item.updatedAt,

      // Status keseluruhan rack
      humidityStatus: getHumidityStatus(
        item.topHumidity,
        item.middleHumidity,
        item.bottomHumidity,
      ),

      // Status masing-masing sensor
      topHumidityStatus: getHumidityStatus(
        item.topHumidity,
        item.topHumidity,
        item.topHumidity,
      ),

      middleHumidityStatus: getHumidityStatus(
        item.middleHumidity,
        item.middleHumidity,
        item.middleHumidity,
      ),

      bottomHumidityStatus: getHumidityStatus(
        item.bottomHumidity,
        item.bottomHumidity,
        item.bottomHumidity,
      ),
    }));

    return res.status(200).json({
      message: "Humidity overview",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil overview humidity",
    });
  }
};

// Get latest humidity
export const getLatestHumidity = async (req: Request, res: Response) => {
  try {
    const latest = await prisma.temperatureHistory.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!latest) {
      return res.status(200).json({
        data: null,
        message: "Belum ada data humidity.",
      });
    }

    return res.status(200).json({
      message: "Data humidity terakhir berhasil diterima",
      data: {
        rack: latest.rack,
        packet: latest.packet,

        humidity: {
          top: latest.topHumidity,
          middle: latest.middleHumidity,
          bottom: latest.bottomHumidity,
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
      message: "Gagal mengambil data humidity terbaru.",
    });
  }
};

// History humidity
export const getHumidityHistory = async (req: Request, res: Response) => {
  try {
    const humidity = await prisma.temperatureHistory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Riwayat humidity",
      data: humidity,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil riwayat humidity",
    });
  }
};

// History humidity by rack
export const getHumidityByRack = async (
  req: Request<{rack: string}>,
  res: Response,
) => {
  try {
    const {rack} = req.params;

    const humidity = await prisma.temperatureHistory.findMany({
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

    const chartData = humidity.map((item) => ({
      time: new Date(item.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      topHumidity: item.topHumidity,
      middleHumidity: item.middleHumidity,
      bottomHumidity: item.bottomHumidity,
    }));

    return res.status(200).json({
      message: `Data humidity untuk ${rack}`,
      data: chartData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data humidity rack",
    });
  }
};

// Statistics humidity
export const getHumidityStatistics = async (req: Request, res: Response) => {
  try {
    const totalData = await prisma.temperatureHistory.count();
    const totalRack = await prisma.temperatureCurrent.count();
    const latest = await prisma.temperatureHistory.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    const averages = await prisma.temperatureCurrent.findMany();

    const averageHumidity =
      averages.length > 0
        ? averages.reduce(
            (sum, item) =>
              sum +
              (item.topHumidity + item.middleHumidity + item.bottomHumidity) /
                3,
            0,
          ) / averages.length
        : 0;

    return res.status(200).json({
      message: "Statistik humidity",
      data: {
        totalRack,
        totalData,
        averageHumidity: Number(averageHumidity.toFixed(2)),
        latest,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil statistik humidity",
    });
  }
};
