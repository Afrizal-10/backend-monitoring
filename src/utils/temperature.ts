export const getHighestTemperature = (
  top: number,
  middle: number,
  bottom: number,
): number => {
  return Math.max(top, middle, bottom);
};

export const getLowestTemperature = (
  top: number,
  middle: number,
  bottom: number,
): number => {
  return Math.min(top, middle, bottom);
};

export const getAverageTemperature = (
  top: number,
  middle: number,
  bottom: number,
): number => {
  return Number(((top + middle + bottom) / 3).toFixed(2));
};

export const getAverageHumidity = (
  top: number,
  middle: number,
  bottom: number,
): number => {
  return Number(((top + middle + bottom) / 3).toFixed(2));
};

export type TemperatureStatus = "Normal" | "Warning" | "Critical";

export interface TemperatureStatusResult {
  status: TemperatureStatus;
  color: "green" | "yellow" | "red";
  message: string;
}

export const getTemperatureStatus = (
  top: number,
  middle: number,
  bottom: number,
): TemperatureStatusResult => {
  const highest = getHighestTemperature(top, middle, bottom);

  if (highest > 30) {
    return {
      status: "Critical",
      color: "red",
      message: "Temperature exceeds safe limit.",
    };
  }

  if (highest >= 27) {
    return {
      status: "Warning",
      color: "yellow",
      message: "Temperature is approaching the safe limit.",
    };
  }

  return {
    status: "Normal",
    color: "green",
    message: "Temperature is within the safe range.",
  };
};

export const getHighestSensor = (
  top: number,
  middle: number,
  bottom: number,
) => {
  if (top >= middle && top >= bottom) {
    return {
      sensor: "TOP",
      temperature: top,
    };
  }

  if (middle >= top && middle >= bottom) {
    return {
      sensor: "MIDDLE",
      temperature: middle,
    };
  }

  return {
    sensor: "BOTTOM",
    temperature: bottom,
  };
};

export type HumidityStatus = "Normal" | "Warning" | "Critical";

export interface HumidityStatusResult {
  status: HumidityStatus;
  color: "green" | "yellow" | "red";
  message: string;
}

export const getHighestHumidity = (
  top: number,
  middle: number,
  bottom: number,
): number => {
  return Math.max(top, middle, bottom);
};

export const getHumidityStatus = (
  top: number,
  middle: number,
  bottom: number,
): HumidityStatusResult => {
  const highest = getHighestHumidity(top, middle, bottom);

  if (highest > 85) {
    return {
      status: "Critical",
      color: "red",
      message: "Humidity exceeds safe limit.",
    };
  }

  if (highest >= 70) {
    return {
      status: "Warning",
      color: "yellow",
      message: "Humidity is approaching the safe limit.",
    };
  }

  return {
    status: "Normal",
    color: "green",
    message: "Humidity is within the safe range.",
  };
};
