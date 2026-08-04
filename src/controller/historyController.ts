import type {Request, Response} from "express";
import prisma from "../lib/prisma.js";

type Metric = "temperature" | "humidity";
type Status = "normal" | "warning" | "critical";

const RACK_PER_PAGE = 5;
const LIMIT_PER_RACK = 10;

function getMetric(metric?: string): Metric {
  return metric === "humidity" ? "humidity" : "temperature";
}

function getAverage(item: any, metric: Metric) {
  if (metric === "temperature") {
    return (
      (item.topTemperature + item.middleTemperature + item.bottomTemperature) /
      3
    );
  }

  return (item.topHumidity + item.middleHumidity + item.bottomHumidity) / 3;
}

function getStatus(avg: number, metric: Metric): Status {
  if (metric === "temperature") {
    if (avg >= 35) return "critical";
    if (avg >= 27) return "warning";
    return "normal";
  }

  // Humidity 40-70%
  if (avg >= 80 || avg < 30) return "critical";
  if ((avg >= 70 && avg < 80) || (avg >= 30 && avg < 40)) return "warning";

  return "normal";
}

function mapHistory(item: any, metric: Metric) {
  const average = Number(getAverage(item, metric).toFixed(2));

  return {
    id: item.id,
    rack: item.rack,
    packet: item.packet,

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

    average,
    status: getStatus(average, metric),

    createdAt: item.createdAt,
  };
}

// Get History
export const getHistory = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);

    const rack = req.query.rack as string | undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as Status | undefined;
    const date = req.query.date as string | undefined;
    const metric = getMetric(req.query.metric as string);

    // Satu Rack
    if (rack) {
      let history = await prisma.temperatureHistory.findMany({
        where: {
          rack,
        },
        orderBy: {
          packet: "desc",
        },
      });

      // Search
      if (search) {
        history = history.filter(
          (item) =>
            item.rack.toLowerCase().includes(search.toLowerCase()) ||
            item.packet.toString().includes(search),
        );
      }

      // Date
      if (date) {
        history = history.filter((item) => {
          return item.createdAt.toISOString().slice(0, 10) === date;
        });
      }

      // Status
      if (status) {
        history = history.filter((item) => {
          return getStatus(getAverage(item, metric), metric) === status;
        });
      }

      history = history.slice(0, LIMIT_PER_RACK);

      return res.json({
        message: "History",
        metric,

        data: history.map((item) => mapHistory(item, metric)),

        pagination: {
          page: 1,
          totalPages: 1,
        },
      });
    }

    // Semua Rack
    const racks = await prisma.temperatureCurrent.findMany({
      select: {
        rack: true,
      },
      orderBy: {
        rack: "asc",
      },
    });

    const start = (page - 1) * RACK_PER_PAGE;

    const rackPage = racks.slice(start, start + RACK_PER_PAGE);

    let result: any[] = [];

    for (const rack of rackPage) {
      let history = await prisma.temperatureHistory.findMany({
        where: {
          rack: rack.rack,
        },
        orderBy: {
          packet: "desc",
        },
      });

      if (search) {
        history = history.filter(
          (item) =>
            item.rack.toLowerCase().includes(search.toLowerCase()) ||
            item.packet.toString().includes(search),
        );
      }

      if (date) {
        history = history.filter(
          (item) => item.createdAt.toISOString().slice(0, 10) === date,
        );
      }

      if (status) {
        history = history.filter(
          (item) => getStatus(getAverage(item, metric), metric) === status,
        );
      }

      result.push(...history.slice(0, LIMIT_PER_RACK));
    }

    result.sort((a, b) => b.packet - a.packet);

    return res.json({
      message: "History",
      metric,

      data: result.map((item) => mapHistory(item, metric)),

      pagination: {
        page,
        totalPages: Math.ceil(racks.length / RACK_PER_PAGE),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get history",
    });
  }
};

// Get rack list
export const getRackList = async (req: Request, res: Response) => {
  try {
    const racks = await prisma.temperatureCurrent.findMany({
      select: {
        rack: true,
      },
      orderBy: {
        rack: "asc",
      },
    });

    return res.json({
      message: "Rack list",
      total: racks.length,
      data: racks,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get rack list",
    });
  }
};

// Get Detail History
export const getHistoryDetail = async (
  req: Request<{id: string}>,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const metric = getMetric(req.query.metric as string);
    const history = await prisma.temperatureHistory.findUnique({
      where: {
        id,
      },
    });

    if (!history) {
      return res.status(404).json({
        message: "History tidak ditemukan",
      });
    }

    return res.json({
      message: "Detail history",
      metric,

      data: mapHistory(history, metric),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed get detail history",
    });
  }
};

// Get history by rack
export const getHistoryByRack = async (
  req: Request<{rack: string}>,
  res: Response,
) => {
  try {
    const rack = req.params.rack.toUpperCase();
    const limit = Number(req.query.limit ?? 10);
    const metric = getMetric(req.query.metric as string);
    const history = await prisma.temperatureHistory.findMany({
      where: {
        rack,
      },
      orderBy: {
        packet: "desc",
      },
      take: limit,
    });

    return res.json({
      message: `History ${rack}`,
      metric,
      total: history.length,

      data: history.map((item) => mapHistory(item, metric)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get history rack",
    });
  }
};

// Get history summary
export const getHistorySummary = async (req: Request, res: Response) => {
  try {
    const metric = getMetric(req.query.metric as string);

    const totalHistory = await prisma.temperatureHistory.count();

    const totalRack = await prisma.temperatureCurrent.count();

    const latest = await prisma.temperatureHistory.findFirst({
      orderBy: {
        packet: "desc",
      },
    });

    // Average seluruh history
    const histories = await prisma.temperatureHistory.findMany();

    const average =
      histories.length === 0
        ? 0
        : Number(
            (
              histories.reduce(
                (sum, item) => sum + getAverage(item, metric),
                0,
              ) / histories.length
            ).toFixed(2),
          );

    return res.json({
      message: "History summary",
      metric,
      data: {
        totalHistory,
        totalRack,
        average,

        latest: latest ? mapHistory(latest, metric) : null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed get summary",
    });
  }
};
