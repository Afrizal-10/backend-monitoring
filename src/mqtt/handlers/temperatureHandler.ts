import {z} from "zod";
import {prisma} from "../../lib/prisma.js";

import {sendTelegramAlert} from "../../services/telegramService.js";
import {
  getHighestSensor,
  getTemperatureStatus,
} from "../../utils/temperature.js";

const temperatureSchema = z.object({
  rack: z.string().min(1),
  packet: z.coerce.number().int().nonnegative(),

  suhu_atas: z.coerce.number().min(0).max(80),
  suhu_tengah: z.coerce.number().min(0).max(80),
  suhu_bawah: z.coerce.number().min(0).max(80),

  kelembapan_atas: z.coerce.number().min(0).max(100),
  kelembapan_tengah: z.coerce.number().min(0).max(100),
  kelembapan_bawah: z.coerce.number().min(0).max(100),
});

export const handleTemperature = async (payload: unknown) => {
  try {
    const data = temperatureSchema.parse(payload);

    // Ambil data rack sebelumnya
    const previous = await prisma.temperatureCurrent.findUnique({
      where: {
        rack: data.rack,
      },
    });

    const oldStatus = previous
      ? getTemperatureStatus(
          previous.topTemperature,
          previous.middleTemperature,
          previous.bottomTemperature,
        ).status
      : "Normal";

    const statusResult = getTemperatureStatus(
      data.suhu_atas,
      data.suhu_tengah,
      data.suhu_bawah,
    );

    const newStatus = statusResult.status;

    // Update current
    await prisma.temperatureCurrent.upsert({
      where: {
        rack: data.rack,
      },
      update: {
        packet: data.packet,

        topTemperature: data.suhu_atas,
        middleTemperature: data.suhu_tengah,
        bottomTemperature: data.suhu_bawah,

        topHumidity: data.kelembapan_atas,
        middleHumidity: data.kelembapan_tengah,
        bottomHumidity: data.kelembapan_bawah,
      },
      create: {
        rack: data.rack,
        packet: data.packet,

        topTemperature: data.suhu_atas,
        middleTemperature: data.suhu_tengah,
        bottomTemperature: data.suhu_bawah,

        topHumidity: data.kelembapan_atas,
        middleHumidity: data.kelembapan_tengah,
        bottomHumidity: data.kelembapan_bawah,
      },
    });

    // Simpan history
    await prisma.temperatureHistory.create({
      data: {
        rack: data.rack,
        packet: data.packet,

        topTemperature: data.suhu_atas,
        middleTemperature: data.suhu_tengah,
        bottomTemperature: data.suhu_bawah,

        topHumidity: data.kelembapan_atas,
        middleHumidity: data.kelembapan_tengah,
        bottomHumidity: data.kelembapan_bawah,
      },
    });

    // Jika status berubah dari Normal → Warning / Danger, kirim alert ke telegram
    if (oldStatus !== newStatus) {
      const highest = getHighestSensor(
        data.suhu_atas,
        data.suhu_tengah,
        data.suhu_bawah,
      );

      await sendTelegramAlert({
        rack: data.rack,
        packet: data.packet,

        top: data.suhu_atas,
        middle: data.suhu_tengah,
        bottom: data.suhu_bawah,

        topHumidity: data.kelembapan_atas,
        middleHumidity: data.kelembapan_tengah,
        bottomHumidity: data.kelembapan_bawah,

        status: newStatus,
        sensor: highest.sensor,
        temperature: highest.temperature,
      });

      console.log(`Telegram Alert: ${data.rack} ${oldStatus} → ${newStatus}`);
    }

    console.log(`Temperature & Humidity saved (${data.rack})`);
  } catch (error) {
    console.error(error);
  }
};
