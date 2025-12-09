// Configuration file for ESP32
// Modify these values for your setup

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// Server Configuration
// Prefer HTTPS in production; for self-signed certs the firmware uses an insecure TLS client.
#define SERVER_URL "http://192.168.1.100:3000/api"  // Replace with your server IP/domain (https://your-domain/api)
#define DEVICE_ID "default"  // Replace with actual device ID from database
#define DEVICE_KEY "test-device-key-12345"  // Replace with actual device key from database

// LED Pin Configuration
#define LED_PIN 2  // Built-in LED on most ESP32 boards (GPIO2)

// Polling Configuration
#define POLL_INTERVAL_MS 1000  // Poll server every 1 second

#endif
