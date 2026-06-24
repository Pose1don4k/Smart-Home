import paho.mqtt.client as mqtt
import json
import time

MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883
TOPIC_DATA = "sensor/data"
TOPIC_CONTROL = "device/control"
TOPIC_POWER = "device/power"

moisture = 0.0
valve_is_open = False
device_is_on = True


def on_connect(client, userdata, flags, rc):
    print(f"[*] Прибор подключен (код {rc})")
    client.subscribe([(TOPIC_CONTROL, 0), (TOPIC_POWER, 0)])


def on_message(client, userdata, msg):
    global valve_is_open, device_is_on
    payload = msg.payload.decode('utf-8').upper()

    if msg.topic == TOPIC_POWER:
        if payload == "ON":
            device_is_on = True
            print("[ПИТАНИЕ] Система включена")
        elif payload == "OFF":
            device_is_on = False
            print("[ПИТАНИЕ] Система обесточена")

    elif msg.topic == TOPIC_CONTROL:
        if not device_is_on:
            print("[ОТКАЗ] Нет питания! Команда игнорирована.")
            return

        if payload == "OPEN":
            valve_is_open = True
            print("[УПРАВЛЕНИЕ] Кран открыт")
        elif payload == "CLOSE":
            valve_is_open = False
            print("[УПРАВЛЕНИЕ] Кран закрыт")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "VirtualValveDevice")
client.on_connect = on_connect
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

print("Симуляция задвижки")

try:
    while True:

        if device_is_on and valve_is_open:
            moisture += 5.0
        else:
            moisture -= 5.0

        moisture = max(0.0, min(100.0, moisture))

        if device_is_on and moisture >= 60.0 and valve_is_open:
            print("[АВТОМАТИКА] Протечка! Кран перекрыт.")
            valve_is_open = False

        payload = {
            "moisture": round(moisture, 2),
            "valve_position": 1 if valve_is_open else 0,
            "power": "ON" if device_is_on else "OFF"
        }
        client.publish(TOPIC_DATA, json.dumps(payload))
        time.sleep(2)
except KeyboardInterrupt:
    client.loop_stop()