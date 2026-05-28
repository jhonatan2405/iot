# SISTEMA IoT DE MONITOREO CLIMATICO CON RECOMENDACION INTELIGENTE DE CULTIVOS EN TIEMPO REAL

Este repositorio contiene la plataforma web profesional de agricultura de precision y monitoreo climatico disenada para interactuar con un dispositivo ESP32 y una base de datos en tiempo real de Supabase.

La aplicacion esta optimizada para funcionar exclusivamente en **Modo Oscuro Permanente** (Estetica Cosmic-Obsidian), asegurando una experiencia visual premium, uniforme y libre de molestos parpadeos de luz al cargar, ideales para presentaciones universitarias y de ingenieria.

Tanto el codigo de la plataforma como esta documentacion estan libres de emojis para mantener un rigor academico y profesional de alto nivel.

---

## 1. Arquitectura y Estructura de Archivos

El sistema esta estructurado de forma modular y eficiente en tres archivos de frontend puro en la raiz del espacio de trabajo:

*   **index.html**: Estructura semantica y contenedores HTML5 del dashboard. Carga las fuentes modernas (Outfit y Plus Jakarta Sans) desde Google Fonts, Chart.js para las graficas vectoriales, y FontAwesome v6 para la iconografia tecnica, ademas del SDK de Supabase.
*   **style.css**: Hoja de estilos que implementa variables personalizadas en CSS3 para la paleta Obsidian, maquetacion de cuadriculas responsivas usando CSS Grid/Flexbox, resplandores degradados de fondo y las nuevas tarjetas de cultivos con barras de progreso.
*   **app.js**: Cerebro de la aplicacion que contiene las credenciales reales de tu base de datos Supabase, realiza consultas asincronas cada 5 segundos, gestiona las 4 graficas de Chart.js, ejecuta el evaluador de alertas criticas y genera el motor dinamico de recomendacion agrometeorologica individualizada.

---

## 2. Conexion Real Directa y Credenciales

El sistema esta conectado directamente a tu base de datos productiva de Supabase:
*   **Supabase URL:** `https://ohvtbtqjkkknieovdmln.supabase.co`
*   **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnRidHFqa2trbmllb3ZkbWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjI5MzAsImV4cCI6MjA5NTQ5ODkzMH0.hfByu2-k9nwzpl-XvUKKJjjjm8n36tB6My-uf16s2I8`

Se ha eliminado por completo todo codigo y componente visual relacionado al simulador local o controles de sliders manuales para ofrecer una demostracion 100% real. El sistema inicia en modo de produccion, consultando directamente la tabla `lecturas_climaticas` cada 5 segundos.

---

## 3. Funcionalidades Detalladas del Sistema

### A. Dashboard Principal en Tiempo Real
*   **Tarjetas Metricas (Cards):** Temperatura actual DHT22, Temperatura del sensor barometrico BMP280, Humedad Relativa (% UR), Presion Atmosferica (hPa) y Estado de Lluvia actual.
*   **Iconografia Climatica:** Las tarjetas se actualizan con iconos vectoriales de FontAwesome dependiendo del estado del clima (Soleado, Llovizna, Lluvia Fuerte o Tormenta).
*   **Resplandores en Hover:** Cada tarjeta posee un degradado semitransparente con desenfoque de fondo y un halo de luz trasera (`.card-glow`) personalizado segun la variable climatica que aumenta de intensidad con el cursor.

### B. Graficas Dinamicas de Chart.js
Se implementan 4 graficas lineales en tiempo real:
1.  **Variacion Termica Reciente (Dashboard):** Muestra el comportamiento reciente de la temperatura aerea DHT22 de forma compacta.
2.  **Grafica Comparativa de Temperatura (Panel Graficas):** Compara en un mismo grafico lineal el sensor aereo DHT22 (linea naranja) frente al sensor de precision BMP280 (linea carmesi).
3.  **Grafica de Humedad Relativa (Panel Graficas):** Trazo dinamico azul cian con relleno semitransparente.
4.  **Grafica de Presion Atmosferica (Panel Graficas):** Trazo dinamico verde esmeralda para registrar tendencias barometricas.

### C. Motor de Recomendacion Inteligente de Precision (Mejorado)
El sistema analiza constantemente las variables ambientales actuales y genera **3 tarjetas individuales detalladas** en vivo, una para cada cultivo correspondiente al grupo optimo:

*   **Regla 1 (Caluroso y Humedo):** Si Temperatura > 25 C y Humedad > 70% -> Cultivos: **Arroz, Platano y Cana de Azucar** (grupo tropical).
*   **Regla 2 (Caluroso y Seco):** Si Temperatura > 30 C y Humedad < 50% -> Cultivos: **Yuca, Sorgo y Algodon** (grupo arido).
*   **Regla 3 (Templado y Humedo):** Si Temperatura [18 C - 25 C] y Humedad >= 60% -> Cultivos: **Cafe, Cacao y Aguacate** (grupo templado).
*   **Regla 4 (Por Defecto):** En cualquier otro caso -> Cultivos: **Maiz, Tomate y Frijol** (grupo estandar).

#### Atributos de cada Tarjeta de Cultivo:
1.  **Afinidad Climatica Real:** Se calcula un porcentaje de correspondencia dinamico (entre 55% y 99%) en base a la desviacion absoluta entre la temperatura/humedad actual frente al rango ideal del cultivo especifico.
2.  **Barra de Compatibilidad:** Una barra con degradado cian-verde que ilustra graficamente la afinidad del clima actual con el cultivo.
3.  **Requerimientos del Cultivo:** Rango termico ideal, rango hidrico ideal, demanda hidrica general y metodo de riego aconsejado.
4.  **Smart Tip Agronomico:** Cuadro de consejo en tiempo real que le indica al agricultor que acciones de precision tomar si las variables estan fuera del optimo (ej. si la humedad es baja: "Humedad actual es baja para esta planta. Se recomienda activar microaspersores foliares", o si el calor es excesivo: "Calor excesivo. Incrementar frecuencias de riego de enfriamiento y habilitar mallas de sombreado").

### D. Central de Alertas Inteligentes
El sistema evalua cada 5 segundos si las lecturas de los sensores superan rangos tolerables de seguridad fisica, activando notificaciones y estados en el panel:

*   **Alerta Roja (Critica):** 
    *   Temperatura Extrema: Mayor a 38 C o Menor a 5 C.
    *   Humedad Critica: Menor a 20% UR o Mayor a 95% UR.
    *   Precipitaciones Severas: Sensor analogo FC-37 por debajo de 1000 unidades ADC (Tormenta / Lluvia intensa).
    *   Presion Critica: Presion menor a 985 hPa o mayor a 1040 hPa.
*   **Alerta Amarilla (Advertencia):**
    *   Lecturas fuera del optimo estandar pero no criticas (ej. Temperatura entre 28.1 C y 38 C, o Humedad menor a 50% UR).
*   **Alerta Verde (Normal):**
    *   Todos los parametros operan dentro de los margenes optimos de desarrollo fisiologico.

Las alertas se reportan en la interfaz mediante un banner dinamico superior con animaciones pulsantes, un panel descriptivo con sugerencias fisicas de mitigacion (riego, calefaccion, ventilacion), y un Registro Historico de Eventos de la Sesion donde cada anomalia detectada se agrega cronologicamente con su hora exacta.

---

## 4. Instrucciones de Configuracion en Supabase

Para preparar tu base de datos de Supabase, abre el panel de control del proyecto de Supabase, navega hasta **SQL Editor** y ejecuta la siguiente consulta para crear la estructura identica requerida por el ESP32 y el Dashboard Web:

```sql
CREATE TABLE lecturas_climaticas (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  temperatura_dht numeric NOT NULL,
  humedad numeric NOT NULL,
  temperatura_bmp numeric NOT NULL,
  presion numeric NOT NULL,
  lluvia numeric NOT NULL,
  estado_lluvia text NOT NULL,
  fecha timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar politicas publicas de seguridad para lectura e insercion rapida
ALTER TABLE lecturas_climaticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica" ON lecturas_climaticas FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica" ON lecturas_climaticas FOR INSERT WITH CHECK (true);
```

---

## 5. Como Ejecutar y Presentar el Proyecto

1.  **Abrir el Dashboard:** Abre el archivo `index.html` en tu navegador web.
2.  **Verificacion de Conexion:** Al cargar la pagina, veras la pantalla de bienvenida y, una vez cargado, el indicador en la barra superior pasara a brillar en verde como `SUPABASE: CONECTADO`.
3.  **Monitoreo Activo:** El sistema realizara consultas cada 5 segundos. Las tarjetas de Inicio, los medidores detallados de la pestana Sensores y las graficas en la pestana Graficas se poblaran de forma instantanea.
4.  **Verificar Recomendaciones Inteligentes:** Al hacer click en la pestana **Recomendaciones**, podras ver el resumen climatico y las 3 tarjetas de cultivo de precision autogeneradas con sus barras de afinidad, requerimientos y los consejos especificos en vivo ("Smart Tip").
5.  **Verificar Historial:** En la pestana **Historial** podras buscar registros especificos filtrando en tiempo real por fecha, lluvia o valores termicos al escribir en el buscador.
