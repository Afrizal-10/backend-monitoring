import client from "../config/mqtt.js";
import {MQTT_TOPICS} from "./topics.js";
import {handleTemperature} from "./handlers/temperatureHandler.js";

client.on("connect", () => {
  console.log("MQTT Connected");

  client.subscribe(MQTT_TOPICS.TEMPERATURE);

  console.log("Subscribe:", MQTT_TOPICS.TEMPERATURE);
});

client.on("message", async (_topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    await handleTemperature(payload);
  } catch (error) {
    console.error("MQTT Message Error:", error);
  }
});
