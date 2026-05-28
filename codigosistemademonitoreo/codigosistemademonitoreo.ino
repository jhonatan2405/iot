#include <WiFi.h>
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
"https://ohvtbtqjkkknieovdmln.supabase.co/rest/v1/datos_climaticos";

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
  // CONECTAR WIFI
  // =================================
  WiFi.begin(ssid, password);

  Serial.print("Conectando a WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado correctamente");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());

  // =================================
  // INICIAR DHT11
  // =================================
  dht.begin();

  Serial.println("DHT11 iniciado");

  // =================================
  // INICIAR BMP280
  // =================================
  if (!bmp.begin(0x76)) {

    if (!bmp.begin(0x77)) {
      Serial.println("ERROR: BMP280 no detectado");
    } else {
      bmpOK = true;
      Serial.println("BMP280 iniciado correctamente (0x77)");
    }

  } else {
    bmpOK = true;
    Serial.println("BMP280 iniciado correctamente (0x76)");
  }

  Serial.println("Sistema listo");
}

// =====================================
// LOOP
// =====================================
void loop() {

  Serial.println("\n==============================");
  Serial.println("LEYENDO SENSORES...");
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
  // SENSOR LLUVIA
  // =================================
  int lluvia = analogRead(LLUVIA_PIN);

  String estadoLluvia;

  if (lluvia == 0) {
    estadoLluvia = "No presencia de lluvia";
  } else {
    estadoLluvia = "Lluvia detectada";
  }

  // =================================
  // MOSTRAR EN SERIAL
  // =================================
  if (isnan(temperatura) || isnan(humedad)) {

    Serial.println("ERROR DHT11");

  } else {

    Serial.print("Temperatura DHT11: ");
    Serial.print(temperatura);
    Serial.println(" °C");

    Serial.print("Humedad: ");
    Serial.print(humedad);
    Serial.println(" %");
  }

  if (bmpOK) {

    Serial.print("Temperatura BMP280: ");
    Serial.print(tempBMP);
    Serial.println(" °C");

    Serial.print("Presion atmosferica: ");
    Serial.print(presion);
    Serial.println(" hPa");

  } else {

    Serial.println("BMP280 no disponible");
  }

  Serial.print("Valor lluvia: ");
  Serial.println(lluvia);

  Serial.print("Estado lluvia: ");
  Serial.println(estadoLluvia);

  // =================================
  // ENVIAR A SUPABASE
  // =================================
  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(supabaseUrl);

    // HEADERS
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Prefer", "return=minimal");

    // JSON
    String json = "{";
    json += "\"temperatura_dht\":" + String(temperatura) + ",";
    json += "\"humedad\":" + String(humedad) + ",";
    json += "\"temperatura_bmp\":" + String(tempBMP) + ",";
    json += "\"presion\":" + String(presion) + ",";
    json += "\"lluvia\":" + String(lluvia) + ",";
    json += "\"estado_lluvia\":\"" + estadoLluvia + "\"";
    json += "}";

    Serial.println("\nEnviando datos a Supabase...");
    Serial.println(json);

    // POST
    int httpResponseCode = http.POST(json);

    Serial.print("Codigo HTTP: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 201) {

      Serial.println("DATOS ENVIADOS CORRECTAMENTE A SUPABASE");

    } else {

      Serial.println("ERROR ENVIANDO DATOS");

      String response = http.getString();

      Serial.println("Respuesta servidor:");
      Serial.println(response);
    }

    http.end();

  } else {

    Serial.println("WiFi desconectado");
  }

  Serial.println("==============================");

  // ENVIAR CADA 10 SEGUNDOS
  delay(10000);
}