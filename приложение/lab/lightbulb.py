import paho.mqtt.client as mqtt
import json
import winsound
import tkinter as tk

MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883
TOPIC_INDICATOR = "sensor/indicator"


# Функция для конвертации RGB в понятный для tkinter формат HEX (например, #FF0000)
def rgb_to_hex(r, g, b):
    return f'#{r:02x}{g:02x}{b:02x}'


# Функция обновления графического интерфейса
def update_lamp_gui(r, g, b, brightness):
    # Учитываем яркость (затемняем цвет пропорционально)
    factor = brightness / 100.0
    r_adj = int(r * factor)
    g_adj = int(g * factor)
    b_adj = int(b * factor)

    hex_color = rgb_to_hex(r_adj, g_adj, b_adj)
    canvas.itemconfig(lamp_circle, fill=hex_color)


def on_connect(client, userdata, flags, rc):
    print(f"[*] Лампочка-индикатор подключена (код {rc})")
    client.subscribe(TOPIC_INDICATOR)


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode('utf-8'))
        r, g, b = data.get('r', 0), data.get('g', 0), data.get('b', 0)
        brightness = data.get('brightness', 100)

        print(f"[ИНДИКАТОР] Цвет: RGB({r},{g},{b}) | Яркость: {brightness}%")

        # Обновляем цвет в графическом окне
        update_lamp_gui(r, g, b, brightness)

        # Если цвет чисто красный - включаем сирену
        if r == 255 and g == 0 and b == 0:
            winsound.Beep(2000, 500)

    except Exception as e:
        print("Ошибка:", e)


# --- Настройка графического интерфейса (Tkinter) ---
root = tk.Tk()
root.title("Виртуальная лампа (IoT)")
root.geometry("300x300")
root.configure(bg="#2c3e50")

# Создаем холст и рисуем круг (лампочку)
canvas = tk.Canvas(root, width=200, height=200, bg="#2c3e50", highlightthickness=0)
canvas.pack(pady=50)
lamp_circle = canvas.create_oval(10, 10, 190, 190, fill="gray", outline="#34495e", width=5)

# --- Настройка MQTT ---
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "VirtualLightbulb")
client.on_connect = on_connect
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Запускаем MQTT в отдельном потоке, чтобы не блокировать графическое окно
client.loop_start()

# Запускаем главный цикл графического окна
root.mainloop()

# Останавливаем MQTT при закрытии окна
client.loop_stop()