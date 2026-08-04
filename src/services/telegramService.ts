import TelegramBot, {type ChatId} from "node-telegram-bot-api";

export type TemperatureStatus = "Normal" | "Warning" | "Critical";

export interface TelegramAlertPayload {
  rack: string;
  sensor: string;
  temperature: number;
  status: TemperatureStatus;
  packet: number;

  top: number;
  middle: number;
  bottom: number;

  topHumidity: number;
  middleHumidity: number;
  bottomHumidity: number;
}

let cachedBot: TelegramBot | null = null;
let cachedChatId: ChatId | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} belum diisi pada file .env`);
  }

  return value;
}

function getTelegramClient(): {bot: TelegramBot; chatId: ChatId} {
  if (!cachedBot || !cachedChatId) {
    const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");

    cachedChatId = getRequiredEnv("TELEGRAM_CHAT_ID") as ChatId;
    cachedBot = new TelegramBot(token);
  }

  return {
    bot: cachedBot,
    chatId: cachedChatId,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTemp(value: number): string {
  return `${value.toFixed(1)} °C`;
}

function formatHumidity(value: number): string {
  return `${value.toFixed(1)} %`;
}

function formatDateTime(date: Date): string {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const waktu = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);

  return `${tanggal} ${waktu} WIB`;
}

function section(label: string, value: string | number): string {
  return `<b>${label}</b>\n${value}`;
}

function formatSensorRow(label: string, value: number): string {
  const WIDTH = 6;
  return `${label.padEnd(WIDTH)}: ${formatTemp(value)}`;
}

function formatHumidityRow(label: string, value: number): string {
  const WIDTH = 6;
  return `${label.padEnd(WIDTH)}: ${formatHumidity(value)}`;
}

function buildAlertMessage(payload: TelegramAlertPayload): string {
  const timestamp = formatDateTime(new Date());

  return [
    "<b>DATA CENTER ALERT</b>",
    "",

    section("Status", payload.status),
    "",

    section("Rack", escapeHtml(payload.rack)),
    "",

    section("Sensor", escapeHtml(payload.sensor)),
    "",

    section("Highest Temperature", formatTemp(payload.temperature)),
    "",

    section("Packet", payload.packet),
    "",

    "<b>🌡 Temperature</b>",
    formatSensorRow("Top", payload.top),
    formatSensorRow("Middle", payload.middle),
    formatSensorRow("Bottom", payload.bottom),
    "",

    "<b>💧 Humidity</b>",
    formatHumidityRow("Top", payload.topHumidity),
    formatHumidityRow("Middle", payload.middleHumidity),
    formatHumidityRow("Bottom", payload.bottomHumidity),
    "",

    section("Time", timestamp),
  ].join("\n");
}

// Kirim Alert ke Telegram
export async function sendTelegramAlert(
  payload: TelegramAlertPayload,
): Promise<void> {
  if (payload.status === "Normal") {
    return;
  }

  const {bot, chatId} = getTelegramClient();
  const message = buildAlertMessage(payload);

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
    });

    console.log(
      `Telegram alert terkirim untuk ${payload.rack} (${payload.sensor}).`,
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi Telegram:", error);
  }
}
