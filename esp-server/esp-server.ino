/**
 * Adapted from example ESP8266WebServer/HelloServer
 * https://github.com/esp8266/Arduino/blob/master/libraries/ESP8266WebServer/examples/HelloServer/HelloServer.ino
 */

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <DHT.h>
#include "arduino_secrets.h"

#define DHT_TYPE DHT22

const int DHT_PIN = 5;
DHT dht(DHT_PIN, DHT_TYPE);

const char* ssid = STASSID;
const char* password = STAPSK;

IPAddress local_IP(192, 168, 0, 204);
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);

ESP8266WebServer server(80);

const int led = 13;

void handleRoot() {
  digitalWrite(led, 1);
  server.send(200, "text/plain", "hello from esp8266! ;)\r\n");
  digitalWrite(led, 0);
}

void handleNotFound() {
  digitalWrite(led, 1);
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
  digitalWrite(led, 0);
}

void setup(void) {
  pinMode(led, OUTPUT);
  digitalWrite(led, 0);

  Serial.begin(9600);
  dht.begin();
  
  // Configures static IP address
  if (!WiFi.config(local_IP, gateway, subnet)) {
    Serial.println("STA Failed to configure");
  }
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin("esp8266")) {
    Serial.println("MDNS responder started");
  }

  server.on("/", handleRoot);

  server.on("/temperature", []() {
    float t = dht.readTemperature();
    
    Serial.print("Temperature: ");
    Serial.print(t);
    Serial.println(" Celsius");

    server.send(200, "text/plain", String(t));
  });

  server.on("/humidity", []() {
    float h = dht.readHumidity();
    
    Serial.print("Humidity: ");
    Serial.print(h);
    Serial.println(" %");

    server.send(200, "text/plain", String(h));
  });

  server.on("/weather", []() {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    String json = "{\"temperature\": " + String(t) +  ", \"humidity\": " + String(h) + "}";

    server.send(200, "application/json", json);
  });

  server.on("/metrics", []() {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    String message =
      "# HELP weather_temperature Temperature\n"
      "# TYPE weather_temperature gauge\n"
      "weather_temperature " + String(t) + "\n"
      "# HELP weather_humidity Humidity\n"
      "# TYPE weather_humidity gauge\n"
      "weather_humidity " + String(h) + "\n";

    server.send(200, "text/plain", message);
  });

  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

void loop(void) {
  server.handleClient();
  MDNS.update();
}
