import "dotenv/config";
import mqtt from "mqtt";

const client = mqtt.connect(process.env.MQTT_BROKER!, {
  clientId:
    process.env.MQTT_CLIENT_ID ||
    `publisher-${Math.random().toString(16).slice(2)}`,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

client.on("connect", () => {
  console.log("MQTT Connected");
});

client.on("error", (err) => {
  console.error("MQTT Error:", err);
});

export default client;
