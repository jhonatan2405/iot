#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>

// =====================================
// WIFI
// =====================================
const char* ssid = "HOME 2.4G";
const char* password = "CL435egu";

// =====================================
// SUPABASE
// =====================================
const char* supabaseUrl =
"https://ohvtbtqjkkknieovdmln.supabase.co/rest/v1/lecturas_climaticas";

const char* supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnRidHFqa2trbmllb3ZkbWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjI5MzAsImV4cCI6MjA5NTQ5ODkzMH0.hfByu2-k9nwzpl-XvUKKJjjjm8n36tB6My-uf16s2I8";

// =====================================
// DHT11
// =====================================
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

// =====================================
// SENSOR LLUVIA
// =====================================
#define LLUVIA_PIN 34

// =====================================
// BMP280
// =====================================
Adafruit_BMP280 bmp;
bool bmpOK = false;

// =====================================
// SETUP
// =====================================
void setup() {

  Serial.begin(115200);
  delay(1000);

  Serial.println("==================================");
  Serial.println(" SISTEMA IoT CLIMATICO");
  Serial.println("==================================");

  // =================================
  // WIFI
  // =================================
  WiFi.begin(ssid, password);

  Serial.print("Conectando WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // =================================
  // DHT11
  // =================================
  dht.begin();

  // =================================
  // BMP280
  // =================================
  if (bmp.begin(0x76)) {

    bmpOK = true;
    Serial.println("BMP280 OK 0x76");

  } else if (bmp.begin(0x77)) {

    bmpOK = true;
    Serial.println("BMP280 OK 0x77");

  } else {

    Serial.println("BMP280 NO DETECTADO");
  }
}

// =====================================
// LOOP
// =====================================
void loop() {

  Serial.println("\n==============================");
  Serial.println("LEYENDO SENSORES");
  Serial.println("==============================");

  // =================================
  // DHT11
  // =================================
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();

  // =================================
  // BMP280
  // =================================
  float tempBMP = 0;
  float presion = 0;

  if (bmpOK) {
    tempBMP = bmp.readTemperature();
    presion = bmp.readPressure() / 100.0;
  }

  // =================================
  // LLUVIA
  // =================================
  int lluvia = analogRead(LLUVIA_PIN);

  String estadoLluvia;

  // 0 = seco
  // valores altos = lluvia

  if (lluvia < 1200) {

    estadoLluvia = "No presencia de lluvia";

  } else if (lluvia >= 1200 && lluvia <= 2500) {

    estadoLluvia = "Llovizna";

  } else {

    estadoLluvia = "Lluvia fuerte";
  }

  // =================================
  // MOSTRAR DATOS
  // =================================
  Serial.print("Temperatura: ");
  Serial.println(temperatura);

  Serial.print("Humedad: ");
  Serial.println(humedad);

  Serial.print("Lluvia ADC: ");
  Serial.println(lluvia);

  Serial.print("Estado lluvia: ");
  Serial.println(estadoLluvia);

  // =================================
  // VALIDAR WIFI
  // =================================
  if (WiFi.status() == WL_CONNECTED) {

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;

    http.begin(client, supabaseUrl);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Prefer", "return=minimal");

    // =================================
    // JSON
    // =================================
    String json = "{";

    json += "\"temperatura_dht\":" + String(temperatura, 2) + ",";
    json += "\"humedad\":" + String(humedad, 2) + ",";
    json += "\"temperatura_bmp\":" + String(tempBMP, 2) + ",";
    json += "\"presion\":" + String(presion, 2) + ",";
    json += "\"lluvia\":" + String(lluvia) + ",";
    json += "\"estado_lluvia\":\"" + estadoLluvia + "\"";

    json += "}";

    Serial.println("\nENVIANDO A SUPABASE...");
    Serial.println(json);

    // =================================
    // POST
    // =================================
    int httpResponseCode = http.POST(json);

    Serial.print("HTTP CODE: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode > 0) {

      String response = http.getString();

      Serial.println("RESPUESTA:");
      Serial.println(response);

      if (httpResponseCode == 201) {

        Serial.println("DATOS ENVIADOS");

      } else {

        Serial.println("SUPABASE RESPONDIO ERROR");
      }

    } else {

      Serial.println("ERROR DE CONEXION HTTPS");
    }

    http.end();

  } else {

    Serial.println("WIFI DESCONECTADO");
  }

  delay(10000);
}