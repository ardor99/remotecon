# Remote Elevator Control - ESP32 Firmware

ESP32 firmware that polls the backend server and controls a LED (representing the elevator relay) based on switch state.

## Features

- ✅ WiFi connection with auto-reconnect
- ✅ Server polling every 1 second
- ✅ Device authentication via deviceKey
- ✅ JSON parsing of switch state
- ✅ PULSE mode implementation
- ✅ LED control on configurable GPIO pin
- ✅ Serial debugging output

## Hardware Requirements

- ESP32 development board (any variant)
- Yellow LED + 220Ω resistor (optional - most ESP32 boards have built-in LED)
- USB cable for programming

**LED Connection (if using external LED):**
```
ESP32 GPIO2 (or configured pin) --> Resistor (220Ω) --> LED Anode (+)
LED Cathode (-) --> GND
```

**Note**: Most ESP32 boards have a built-in LED on GPIO2, so you can test without additional hardware.

## Software Requirements

### Option 1: PlatformIO (Recommended)

- [PlatformIO IDE](https://platformio.org/install/ide?install=vscode) (VS Code extension)
- Or PlatformIO Core CLI

### Option 2: Arduino IDE

- [Arduino IDE](https://www.arduino.cc/en/software) 1.8.19 or newer
- ESP32 board support
- ArduinoJson library

## Configuration

Before uploading, edit `src/config.h` and configure:

```cpp
// WiFi credentials
#define WIFI_SSID "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// Server URL (your backend API)
#define SERVER_URL "http://192.168.1.100:3000/api"

// Device credentials (from database seed or admin panel)
#define DEVICE_ID "default"
#define DEVICE_KEY "test-device-key-12345"

// LED pin (GPIO2 is built-in LED on most boards)
#define LED_PIN 2
```

**Important**:
- `DEVICE_ID` and `DEVICE_KEY` must match a device in your backend database
- Use the seeded test device or create a new one via backend
- Server URL should be accessible from ESP32 (same network or public IP)

## Building and Uploading

### Using PlatformIO

1. **Open project in VS Code**
   ```bash
   cd esp32
   code .
   ```

2. **Edit configuration**
   - Modify `src/config.h` with your settings

3. **Build**
   ```bash
   pio run
   ```

4. **Upload to ESP32**
   - Connect ESP32 via USB
   ```bash
   pio run --target upload
   ```

5. **Monitor serial output**
   ```bash
   pio device monitor
   ```

### Using Arduino IDE

1. **Install ESP32 board support**
   - File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "esp32" and install "esp32 by Espressif Systems"

2. **Install ArduinoJson library**
   - Sketch → Include Library → Manage Libraries
   - Search "ArduinoJson" and install version 6.x

3. **Open sketch**
   - Copy `src/main.cpp` to a new sketch
   - Copy `src/config.h` to sketch directory

4. **Configure settings**
   - Edit `config.h` with your credentials

5. **Select board and port**
   - Tools → Board → ESP32 Dev Module (or your specific board)
   - Tools → Port → (select your ESP32 port)

6. **Upload**
   - Click "Upload" button

## Serial Monitor Output

After upload, open Serial Monitor (115200 baud) to see:

```
=== Remote Elevator Control - ESP32 ===
Connecting to WiFi: YourWiFiSSID
.....
WiFi connected!
IP address: 192.168.1.123
Poll success - Mode: OFF, Interval: 10s, Pulse: 500ms
Poll success - Mode: PULSE, Interval: 10s, Pulse: 500ms
Mode changed, resetting pulse state
LED ON (pulse start)
LED OFF (pulse end)
...
```

## How It Works

1. **Startup**: ESP32 connects to WiFi
2. **Polling**: Every 1 second, sends POST request to `/api/devices/:id/poll` with `deviceKey`
3. **Response**: Server returns current switch state as JSON:
   ```json
   {
     "mode": "PULSE",
     "pulseIntervalSeconds": 10,
     "pulseOnMillis": 500,
     "validUntil": "2024-01-01T12:00:00.000Z"
   }
   ```
4. **LED Control**:
   - **OFF mode**: LED stays off
   - **PULSE mode**: LED turns on for `pulseOnMillis` every `pulseIntervalSeconds`
   - **CONTINUOUS mode**: LED stays on (not used in current implementation)

## Pulse Mode Example

With default settings (interval: 10s, pulse: 500ms):
```
Time:  0s  -  LED ON
Time: 0.5s  -  LED OFF
Time: 10s  -  LED ON
Time: 10.5s -  LED OFF
Time: 20s  -  LED ON
...
```

## Troubleshooting

### WiFi won't connect
- Check SSID and password in `config.h`
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

### HTTP errors
- Verify `SERVER_URL` is correct
- Check ESP32 can reach server (ping from same network)
- Ensure backend is running
- Try with IP address instead of hostname

### Authentication errors (401)
- Verify `DEVICE_KEY` matches database
- Check `DEVICE_ID` exists in database
- Run database seed script if using test device

### LED doesn't light up
- Check `LED_PIN` matches your board's LED pin
- Try different GPIO pin
- Verify LED polarity if using external LED
- Check serial monitor for "LED ON" messages

### JSON parse errors
- Update ArduinoJson library to 6.21.0+
- Check serial output for unexpected response format
- Verify backend is returning valid JSON

## Production Deployment

For real elevator control:

1. **Replace LED with relay module**
   ```cpp
   #define RELAY_PIN 2  // Use appropriate GPIO
   ```

2. **Update main.cpp LED control code**
   - Change `digitalWrite(LED_PIN, ...)` to `digitalWrite(RELAY_PIN, ...)`

3. **Wire relay**
   - ESP32 GPIO → Relay IN
   - Relay COM/NO → Elevator unlock circuit

4. **Add safety features**
   - Watchdog timer
   - Error handling for network failures
   - Manual override button

5. **Secure credentials**
   - Store deviceKey in EEPROM or SPIFFS
   - Use HTTPS for production server

6. **Power supply**
   - Use reliable 5V power adapter
   - Consider backup battery

## Wiring Diagram (External LED)

```
     ESP32
    ┌─────┐
    │ GPIO2├───┬───[220Ω]───►|───┐
    │      │                LED  │
    │  GND ├────────────────────┘
    └─────┘
```

## License

MIT
