import "dotenv/config";
import client from "./client.js";

const payload = {
  rack: "Rack J",
  packet: 10,
  suhu_atas: 24.8,
  suhu_tengah: 26.1,
  suhu_bawah: 25.9,
};

client.on("connect", () => {
  client.publish(process.env.MQTT_TOPIC!, JSON.stringify(payload), (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Data berhasil dikirim");
    }

    client.end();
  });
});
