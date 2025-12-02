/*
 * Remote Elevator Control - ESP32 Firmware
 * 
 * This firmware polls the backend server for switch state and controls a LED
 * (representing the elevator relay) based on PULSE mode timing.
 * 
 * Features:
 * - WiFi connection with auto-reconnect
 * - HTTPS polling every 1 second
 * - JSON parsing of switch state
 * - PULSE mode implementation with timing
 * - LED control (GPIO pin configurable)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// State variables
String currentMode = "OFF";
int pulseIntervalSeconds = 10;
int pulseOnMillis = 500;
String validUntil = "";

// Pulse timing variables
unsigned long lastPulseTime = 0;
bool pulseState = false;
unsigned long pulseStartTime = 0;

// Network status
bool wifiConnected = false;
unsigned long lastPollTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Remote Elevator Control - ESP32 ===");
  
  // Configure LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Connect to WiFi
  connectWiFi();
}

void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
    return;
  }
  
  // Poll server every POLL_INTERVAL_MS
  if (millis() - lastPollTime >= POLL_INTERVAL_MS) {
    lastPollTime = millis();
    pollServer();
  }
  
  // Handle LED control based on mode
  handleLEDControl();
  
  delay(10);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void pollServer() {
  if (!wifiConnected) {
    return;
  }
  
  HTTPClient http;
  
  // Construct poll URL
  String url = String(SERVER_URL) + "/devices/" + String(DEVICE_ID) + "/poll";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload with deviceKey
  StaticJsonDocument<200> requestDoc;
  requestDoc["deviceKey"] = DEVICE_KEY;
  
  String requestBody;
  serializeJson(requestDoc, requestBody);
  
  // Send POST request
  int httpCode = http.POST(requestBody);
  
  if (httpCode > 0) {
    String payload = http.getString();
    
    if (httpCode == 200) {
      // Parse JSON response
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, payload);
      
      if (!error) {
        // Extract switch state
        currentMode = responseDoc["mode"].as<String>();
        pulseIntervalSeconds = responseDoc["pulseIntervalSeconds"].as<int>();
        pulseOnMillis = responseDoc["pulseOnMillis"].as<int>();
        
        if (responseDoc["validUntil"].isNull()) {
          validUntil = "";
        } else {
          validUntil = responseDoc["validUntil"].as<String>();
        }
        
        Serial.print("Poll success - Mode: ");
        Serial.print(currentMode);
        Serial.print(", Interval: ");
        Serial.print(pulseIntervalSeconds);
        Serial.print("s, Pulse: ");
        Serial.print(pulseOnMillis);
        Serial.println("ms");
        
        // Reset pulse state when mode changes
        static String lastMode = "";
        if (currentMode != lastMode) {
          lastMode = currentMode;
          pulseState = false;
          lastPulseTime = 0;
          Serial.println("Mode changed, resetting pulse state");
        }
      } else {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print("HTTP error code: ");
      Serial.println(httpCode);
      Serial.println(payload);
    }
  } else {
    Serial.print("HTTP request failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

void handleLEDControl() {
  if (currentMode == "OFF") {
    // Turn LED off
    digitalWrite(LED_PIN, LOW);
    pulseState = false;
    return;
  }
  
  if (currentMode == "PULSE") {
    unsigned long now = millis();
    
    if (!pulseState) {
      // Check if it's time to start a new pulse
      if (now - lastPulseTime >= (pulseIntervalSeconds * 1000)) {
        // Start pulse
        pulseState = true;
        pulseStartTime = now;
        lastPulseTime = now;
        digitalWrite(LED_PIN, HIGH);
        Serial.println("LED ON (pulse start)");
      }
    } else {
      // Check if pulse duration is over
      if (now - pulseStartTime >= pulseOnMillis) {
        // End pulse
        pulseState = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("LED OFF (pulse end)");
      }
    }
  }
  
  if (currentMode == "CONTINUOUS") {
    // Turn LED on continuously
    digitalWrite(LED_PIN, HIGH);
  }
}
