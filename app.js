/* -------------------------------------------------------------
   SISTEMA IoT CLIMÁTICO - APP.JS
   Lógica de Producción Real con Conectividad Supabase
   ------------------------------------------------------------- */

// Credenciales Reales del Proyecto Supabase
const config = {
    supabaseUrl: 'https://ohvtbtqjkkknieovdmln.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnRidHFqa2trbmllb3ZkbWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjI5MzAsImV4cCI6MjA5NTQ5ODkzMH0.hfByu2-k9nwzpl-XvUKKJjjjm8n36tB6My-uf16s2I8'
};

// Variables de Estado Global
let supabaseClient = null;
let updateIntervalId = null;

// Datos Climáticos del Sensor
const climateState = {
    tempDht: 0,
    humidity: 0,
    tempBmp: 0,
    pressure: 0,
    rainRaw: 0,
    rainStatus: 'Desconocido',
    timestamp: '',
    history: []
};

// Historial de Alertas de Sesión
const alertLogs = [];

// Instancias de Gráficas de Chart.js
const charts = {
    miniTemp: null,
    temperature: null,
    humidity: null,
    pressure: null
};

// Umbrales de Alerta Predeterminados y Dinámicos
const alertThresholds = {
    tempRedHigh: 38.0,
    tempRedLow: 5.0,
    tempYellowHigh: 28.1,
    tempYellowLow: 17.9,
    humRedHigh: 95,
    humRedLow: 20,
    humYellowHigh: 85,
    humYellowLow: 50,
    rainRed: 2500,
    rainYellow: 1200
};

// Base de Datos Detallada para Recomendación de Cultivos
const cropDatabase = {
    tropical: {
        categoryName: 'Clima Caluroso y Humedo',
        crops: [
            {
                name: 'Arroz',
                description: 'Excelente para zonas bajas inundables. Su tasa de transpiracion es muy elevada y requiere abundante retencion de humedad en el suelo.',
                tempRange: [25, 35],
                humRange: [70, 90],
                rainReq: 'Muy Alta',
                irrigation: 'Inundacion Controlada',
                icon: 'fa-wheat-awn'
            },
            {
                name: 'Platano',
                description: 'Gran absorcion foliar. Las altas temperaturas aceleran su desarrollo foliar y la rapida formacion del racimo de fruta.',
                tempRange: [26, 32],
                humRange: [75, 85],
                rainReq: 'Alta',
                irrigation: 'Frecuente / Aspercion',
                icon: 'fa-leaf'
            },
            {
                name: 'Cana de Azucar',
                description: 'Requiere alta luminosidad solar y abundante humedad ambiental en fases iniciales de crecimiento vegetativo continuo.',
                tempRange: [25, 38],
                humRange: [70, 80],
                rainReq: 'Alta',
                irrigation: 'Por Gravedad / Frecuente',
                icon: 'fa-seedling'
            }
        ]
    },
    arid: {
        categoryName: 'Clima Caluroso y Seco',
        crops: [
            {
                name: 'Yuca',
                description: 'Altamente rustico. Tolera largos periodos de sequia gracias a su sistema de raices tuberosas acumuladoras de almidon.',
                tempRange: [25, 35],
                humRange: [40, 60],
                rainReq: 'Escasa',
                irrigation: 'Bajo / Goteo Espaciado',
                icon: 'fa-seedling'
            },
            {
                name: 'Sorgo',
                description: 'Excelente adaptabilidad a la escasez de agua. Cierra estomas eficazmente reduciendo la perdida por transpiracion celular.',
                tempRange: [28, 35],
                humRange: [30, 50],
                rainReq: 'Escasa',
                irrigation: 'Minimo / Por Goteo',
                icon: 'fa-wheat-awn'
            },
            {
                name: 'Algodon',
                description: 'Prospera con calor extremo y poca humedad. Requiere sol pleno constante para madurar la capsula de fibra textil.',
                tempRange: [25, 35],
                humRange: [40, 50],
                rainReq: 'Escasa',
                irrigation: 'Controlado por Deficit',
                icon: 'fa-circle-dot'
            }
        ]
    },
    temperate: {
        categoryName: 'Clima Templado y Humedo',
        crops: [
            {
                name: 'Cafe',
                description: 'Prospera en laderas de montana con semisombra. El llenado lento del grano mejora sus caracteristicas organolepticas de aroma.',
                tempRange: [18, 22],
                humRange: [60, 80],
                rainReq: 'Moderada',
                irrigation: 'Moderado Regular',
                icon: 'fa-mug-hot'
            },
            {
                name: 'Cacao',
                description: 'Requiere microclimas calidos de bosque templado y sombreado con alta humedad para proteger la viabilidad floral.',
                tempRange: [20, 25],
                humRange: [70, 80],
                rainReq: 'Moderada-Alta',
                irrigation: 'Regular Sombreado',
                icon: 'fa-cubes-stacked'
            },
            {
                name: 'Aguacate',
                description: 'Sensible a heladas y encharcamientos. Requiere suelos francos de excelente drenaje y humedad ambiental moderada.',
                tempRange: [18, 24],
                humRange: [60, 75],
                rainReq: 'Moderada',
                irrigation: 'Goteo Localizado',
                icon: 'fa-tree'
            }
        ]
    },
    standard: {
        categoryName: 'Condiciones Estandar / Mixtas',
        crops: [
            {
                name: 'Maiz',
                description: 'Muy adaptable en transiciones templadas. Ciclo rapido, requiere calor intermedio y humedad constante durante la polinizacion.',
                tempRange: [18, 26],
                humRange: [50, 70],
                rainReq: 'Moderada',
                irrigation: 'Regular por Surcos',
                icon: 'fa-wheat-awn'
            },
            {
                name: 'Tomate',
                description: 'Altamente productivo en invernadero o campo abierto con temperaturas templadas. Sensible al exceso de humedad foliar.',
                tempRange: [18, 25],
                humRange: [50, 65],
                rainReq: 'Moderada',
                irrigation: 'Goteo Diario Ajustado',
                icon: 'fa-apple-whole'
            },
            {
                name: 'Frijol',
                description: 'Leguminosa fijadora de nitrogeno. Ideal para asociar con gramineas en epocas de transicion con clima intermedio.',
                tempRange: [18, 24],
                humRange: [50, 70],
                rainReq: 'Moderada',
                irrigation: 'Bajo a Demanda',
                icon: 'fa-seedling'
            }
        ]
    }
};

/* -------------------------------------------------------------
   INICIALIZACIÓN DEL SISTEMA
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Cliente Supabase con Credenciales Reales Directas
    initSupabaseClient();
    
    // 2. Configurar Controladores de Navegación entre Pestañas
    setupNavigation();
    
    // 3. Inicializar el Control de Temas (Por Defecto Blanco)
    initThemeManager();

    // 4. Cargar Umbrales de Alerta desde LocalStorage
    initAlertThresholds();

    // 5. Iniciar Reloj en Vivo
    startClock();
    
    // 6. Inicializar Gráficas de Chart.js
    initializeCharts();
    
    // 7. Iniciar la Consulta de Datos de Supabase en Tiempo Real
    startDataSync();

    // 8. Ocultar Loader de Bienvenida
    setTimeout(() => {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('fade-out');
        }
    }, 1200);
});

/* -------------------------------------------------------------
   INICIALIZAR SUPABASE CLIENT SDK
   ------------------------------------------------------------- */
function initSupabaseClient() {
    try {
        supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseKey);
    } catch (err) {
        console.error('Error instanciando Supabase client:', err);
    }
}

/* -------------------------------------------------------------
   GESTIÓN DE TEMAS (BLANCO POR DEFECTO / OSCURO OPCIONAL)
   ------------------------------------------------------------- */
function initThemeManager() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('app-theme');

    // Por defecto es Light Mode (Blanco)
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            localStorage.setItem('app-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            showAppNotification('Modo Oscuro', 'Tema Obsidian activado de forma permanente.', 'info');
        } else {
            localStorage.setItem('app-theme', 'light');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            showAppNotification('Modo Claro', 'Tema por defecto activado de forma permanente.', 'info');
        }
        
        // Redimensionar e implementar paletas de Chart.js
        setTimeout(resizeCharts, 150);
    });
}

/* -------------------------------------------------------------
   GESTIÓN DE CONFIGURACIÓN DE UMBRALES DE ALERTAS
   ------------------------------------------------------------- */
function initAlertThresholds() {
    const storedThresholds = localStorage.getItem('alert-thresholds');
    
    if (storedThresholds) {
        try {
            const parsed = JSON.parse(storedThresholds);
            // Copiar los valores del LocalStorage
            Object.assign(alertThresholds, parsed);
        } catch (e) {
            console.error('Error parseando umbrales locales:', e);
        }
    }

    // Poblar los campos de la interfaz
    populateThresholdFields();
    
    // Actualizar la tabla de umbrales del panel de alertas
    updateThresholdTableDisplay();

    // Configurar controladores de eventos del formulario
    const form = document.getElementById('threshold-config-form');
    const resetBtn = document.getElementById('reset-thresholds-btn');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extraer y validar valores
            const tempRedH = parseFloat(document.getElementById('cfg-temp-red-high').value);
            const tempYellowH = parseFloat(document.getElementById('cfg-temp-yellow-high').value);
            const tempYellowL = parseFloat(document.getElementById('cfg-temp-yellow-low').value);
            const tempRedL = parseFloat(document.getElementById('cfg-temp-red-low').value);

            const humRedH = parseInt(document.getElementById('cfg-hum-red-high').value);
            const humYellowH = parseInt(document.getElementById('cfg-hum-yellow-high').value);
            const humYellowL = parseInt(document.getElementById('cfg-hum-yellow-low').value);
            const humRedL = parseInt(document.getElementById('cfg-hum-red-low').value);

            const rainR = parseInt(document.getElementById('cfg-rain-red').value);
            const rainY = parseInt(document.getElementById('cfg-rain-yellow').value);

            // Validaciones lógicas básicas
            if (tempRedH <= tempYellowH || tempYellowH <= tempYellowL || tempYellowL <= tempRedL) {
                showAppNotification('Error de Validacion', 'Los limites termicos deben cumplir: Critica Alta > Advertencia Alta > Advertencia Baja > Critica Baja.', 'danger');
                return;
            }

            if (humRedH <= humYellowH || humYellowH <= humYellowL || humYellowL <= humRedL) {
                showAppNotification('Error de Validacion', 'Los limites hidricos deben cumplir: Critica Alta > Advertencia Alta > Advertencia Baja > Critica Baja.', 'danger');
                return;
            }

            if (rainR <= rainY) {
                showAppNotification('Error de Validacion', 'El umbral de Lluvia Fuerte (ADC) debe ser mayor al de Llovizna (ADC). A mayor valor, mas lluvia.', 'danger');
                return;
            }

            // Asignar al objeto global
            alertThresholds.tempRedHigh = tempRedH;
            alertThresholds.tempYellowHigh = tempYellowH;
            alertThresholds.tempYellowLow = tempYellowL;
            alertThresholds.tempRedLow = tempRedL;

            alertThresholds.humRedHigh = humRedH;
            alertThresholds.humYellowHigh = humYellowH;
            alertThresholds.humYellowLow = humYellowL;
            alertThresholds.humRedLow = humRedL;

            alertThresholds.rainRed = rainR;
            alertThresholds.rainYellow = rainY;

            // Almacenar en LocalStorage
            localStorage.setItem('alert-thresholds', JSON.stringify(alertThresholds));

            // Actualizar interfaz
            updateThresholdTableDisplay();
            evaluateAlertThresholds(climateState.tempDht, climateState.humidity, climateState.rainRaw, climateState.pressure);

            showAppNotification('Umbrales Guardados', 'Los limites de alerta dinamicos han sido configurados y aplicados.', 'success');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Predeterminados de fábrica
            alertThresholds.tempRedHigh = 38.0;
            alertThresholds.tempRedLow = 5.0;
            alertThresholds.tempYellowHigh = 28.1;
            alertThresholds.tempYellowLow = 17.9;
            alertThresholds.humRedHigh = 95;
            alertThresholds.humRedLow = 20;
            alertThresholds.humYellowHigh = 85;
            alertThresholds.humYellowLow = 50;
            alertThresholds.rainRed = 2500;
            alertThresholds.rainYellow = 1200;

            localStorage.removeItem('alert-thresholds');
            
            populateThresholdFields();
            updateThresholdTableDisplay();
            evaluateAlertThresholds(climateState.tempDht, climateState.humidity, climateState.rainRaw, climateState.pressure);

            showAppNotification('Valores de Fabrica', 'Se han restaurado los limites agrometeorologicos estandar.', 'info');
        });
    }
}

function populateThresholdFields() {
    document.getElementById('cfg-temp-red-high').value = alertThresholds.tempRedHigh;
    document.getElementById('cfg-temp-yellow-high').value = alertThresholds.tempYellowHigh;
    document.getElementById('cfg-temp-yellow-low').value = alertThresholds.tempYellowLow;
    document.getElementById('cfg-temp-red-low').value = alertThresholds.tempRedLow;

    document.getElementById('cfg-hum-red-high').value = alertThresholds.humRedHigh;
    document.getElementById('cfg-hum-yellow-high').value = alertThresholds.humYellowHigh;
    document.getElementById('cfg-hum-yellow-low').value = alertThresholds.humYellowLow;
    document.getElementById('cfg-hum-red-low').value = alertThresholds.humRedLow;

    document.getElementById('cfg-rain-red').value = alertThresholds.rainRed;
    document.getElementById('cfg-rain-yellow').value = alertThresholds.rainYellow;
}

function updateThresholdTableDisplay() {
    document.getElementById('table-val-t-normal').textContent = `${alertThresholds.tempYellowLow.toFixed(1)} °C a ${alertThresholds.tempYellowHigh.toFixed(1)} °C`;
    document.getElementById('table-val-t-warning').textContent = `${alertThresholds.tempYellowHigh.toFixed(1)} °C a ${alertThresholds.tempRedHigh.toFixed(1)} °C o ${alertThresholds.tempYellowLow.toFixed(1)} °C a ${alertThresholds.tempRedLow.toFixed(1)} °C`;
    document.getElementById('table-val-t-danger').textContent = `Mayor a ${alertThresholds.tempRedHigh.toFixed(1)} °C o Menor a ${alertThresholds.tempRedLow.toFixed(1)} °C`;

    document.getElementById('table-val-h-normal').textContent = `${alertThresholds.humYellowLow}% a ${alertThresholds.humYellowHigh}% UR`;
    document.getElementById('table-val-h-warning').textContent = `${alertThresholds.humYellowHigh}% a ${alertThresholds.humRedHigh}% UR o ${alertThresholds.humYellowLow}% a ${alertThresholds.humRedLow}% UR`;
    document.getElementById('table-val-h-danger').textContent = `Mayor a ${alertThresholds.humRedHigh}% UR o Menor a ${alertThresholds.humRedLow}% UR`;

    document.getElementById('table-val-r-normal').textContent = `Menor a ${alertThresholds.rainYellow} (Seco)`;
    document.getElementById('table-val-r-warning').textContent = `${alertThresholds.rainYellow} a ${alertThresholds.rainRed - 1} (Llovizna)`;
    document.getElementById('table-val-r-danger').textContent = `Mayor o igual a ${alertThresholds.rainRed} (Lluvia Fuerte)`;
}

/* -------------------------------------------------------------
   RELOJ Y TIEMPO
   ------------------------------------------------------------- */
function startClock() {
    const timeDisplay = document.getElementById('current-time');
    
    function updateClock() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false
        };
        timeDisplay.textContent = now.toLocaleDateString('es-ES', options).toUpperCase();
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

/* -------------------------------------------------------------
   NAVEGACIÓN MULTI-SECCIÓN (SIDEBAR / NAVBAR / MÓVIL)
   ------------------------------------------------------------- */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetSection = link.getAttribute('data-section');
            
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(`section-${targetSection}`).classList.add('active');

            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('mobile-open');

            if (targetSection === 'charts') {
                setTimeout(resizeCharts, 100);
            }
        });
    });

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('mobile-open');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('mobile-open');
    });
}

function resizeCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].resize();
        }
    });
}

/* -------------------------------------------------------------
   INICIALIZAR GRÁFICAS DE CHART.JS (ESTILO CONTEXTUAL DINÁMICO)
   ------------------------------------------------------------- */
function initializeCharts() {
    const gridColor = 'rgba(148, 163, 184, 0.15)';
    const labelColor = '#94a3b8';
    
    const baseChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    boxWidth: 12,
                    font: { family: 'Outfit', size: 11, weight: 600 },
                    color: labelColor
                }
            },
            tooltip: {
                backgroundColor: 'rgba(9, 14, 27, 0.95)',
                titleFont: { family: 'Outfit', size: 12, weight: 700 },
                bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                borderColor: 'rgba(0, 229, 255, 0.2)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { color: gridColor, drawTicks: false },
                ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            y: {
                grid: { color: gridColor, drawTicks: false },
                ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    // 1. Gráfica Mini-Temp en Dashboard
    const ctxMini = document.getElementById('miniTempChart').getContext('2d');
    charts.miniTemp = new Chart(ctxMini, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura DHT',
                data: [],
                borderColor: '#ff5e62',
                backgroundColor: 'rgba(255, 94, 98, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            ...baseChartOptions,
            plugins: {
                legend: { display: false },
                tooltip: baseChartOptions.plugins.tooltip
            },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: gridColor, drawTicks: false }, 
                    ticks: { color: labelColor, font: { size: 9 } } 
                }
            }
        }
    });

    // 2. Gráfica Principal: Temperatura (Comparativa DHT vs BMP)
    const ctxTemp = document.getElementById('chartTemperature').getContext('2d');
    charts.temperature = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sensor DHT22 (Aereo)',
                    data: [],
                    borderColor: '#ff9900',
                    backgroundColor: 'rgba(255, 153, 0, 0.03)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#ff9900',
                    pointHoverRadius: 5
                },
                {
                    label: 'Sensor BMP280 (Suelo/Presicion)',
                    data: [],
                    borderColor: '#ff5e62',
                    backgroundColor: 'rgba(255, 94, 98, 0.03)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#ff5e62',
                    pointHoverRadius: 5
                }
            ]
        },
        options: baseChartOptions
    });

    // 3. Gráfica Principal: Humedad Relativa
    const ctxHum = document.getElementById('chartHumidity').getContext('2d');
    charts.humidity = new Chart(ctxHum, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humedad Ambiental (%)',
                data: [],
                borderColor: '#00c6ff',
                backgroundColor: 'rgba(0, 198, 255, 0.06)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#00c6ff',
                pointHoverRadius: 5
            }]
        },
        options: baseChartOptions
    });

    // 4. Gráfica Principal: Presión Atmosférica
    const ctxPres = document.getElementById('chartPressure').getContext('2d');
    charts.pressure = new Chart(ctxPres, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Presion (hPa)',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#10b981',
                pointHoverRadius: 5
            }]
        },
        options: baseChartOptions
    });
}

/* -------------------------------------------------------------
   LAZO DE CONTROL SÍNCRONO: CONSULTA A SUPABASE DB
   ------------------------------------------------------------- */
function startDataSync() {
    if (updateIntervalId) clearInterval(updateIntervalId);

    // Primer intento inmediato de carga de base de datos
    fetchRealtimeData();
    fetchHistoryLog();
    
    // Consultar cada 5 segundos de forma constante
    updateIntervalId = setInterval(() => {
        fetchRealtimeData();
    }, 5000);
}

/* -------------------------------------------------------------
   CONEXIÓN REAL A SUPABASE DB
   ------------------------------------------------------------- */
async function fetchRealtimeData() {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('lecturas_climaticas')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const lastRow = data[0];
            const dateObj = new Date(lastRow.fecha);
            
            // Validar estado de la conexión a Supabase
            document.getElementById('db-status').className = 'status-indicator online';
            document.getElementById('db-status').querySelector('.status-label').textContent = 'SUPABASE: CONECTADO';

            // Validar si el ESP32 está reportando activamente (últimos 30 segundos)
            const diffSeconds = (new Date() - dateObj) / 1000;
            if (diffSeconds < 30) {
                document.getElementById('esp32-status').className = 'status-indicator online';
                document.getElementById('esp32-status').querySelector('.status-label').textContent = 'ESP32: CONECTADO';
            } else {
                document.getElementById('esp32-status').className = 'status-indicator offline';
                document.getElementById('esp32-status').querySelector('.status-label').textContent = 'ESP32: INACTIVO';
            }

            // Si es un dato nuevo frente al actual
            if (climateState.timestamp !== lastRow.fecha) {
                updateClimateValues(
                    parseFloat(lastRow.temperatura_dht),
                    parseFloat(lastRow.humedad),
                    parseFloat(lastRow.temperatura_bmp),
                    parseFloat(lastRow.presion),
                    parseFloat(lastRow.lluvia),
                    lastRow.estado_lluvia,
                    lastRow.fecha
                );

                // Refrescar el historial y gráficas
                fetchHistoryLog();
            }
        } else {
            document.getElementById('db-status').className = 'status-indicator waiting';
            document.getElementById('db-status').querySelector('.status-label').textContent = 'SUPABASE: SIN DATOS';
        }
    } catch (err) {
        console.error('Error consultando Supabase:', err);
        document.getElementById('db-status').className = 'status-indicator offline';
        document.getElementById('db-status').querySelector('.status-label').textContent = 'SUPABASE: ERROR';
    }
}

async function fetchHistoryLog() {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('lecturas_climaticas')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (data) {
            climateState.history = data;
            renderHistoryTable(data);
            repopulateCharts(data);
        }
    } catch (err) {
        console.error('Error cargando historial de base de datos:', err);
    }
}

/* -------------------------------------------------------------
   ACTUALIZAR VALORES OPERATIVOS EN INTERFAZ
   ------------------------------------------------------------- */
function updateClimateValues(tempDht, humidity, tempBmp, pressure, rainRaw, rainStatus, timestamp) {
    climateState.tempDht = tempDht;
    climateState.humidity = humidity;
    climateState.tempBmp = tempBmp;
    climateState.pressure = pressure;
    climateState.rainRaw = rainRaw;
    climateState.rainStatus = rainStatus;
    climateState.timestamp = timestamp;

    // 1. Renderizar en Tarjetas de Dashboard
    document.getElementById('val-temp-dht').textContent = tempDht.toFixed(1);
    document.getElementById('val-temp-bmp').textContent = `${tempBmp.toFixed(1)} C`;
    document.getElementById('val-humidity').textContent = Math.round(humidity);
    document.getElementById('val-pressure').textContent = Math.round(pressure);
    document.getElementById('val-rain-raw').textContent = Math.round(rainRaw);
    
    // Traducir e ilustrar estado de lluvia en tarjeta
    const rainStatusEl = document.getElementById('val-rain-status');
    const rainIconWrap = document.getElementById('rain-icon-container');
    rainStatusEl.textContent = rainStatus.toUpperCase();

    if (rainStatus.includes('Tormenta') || rainStatus.includes('Fuerte')) {
        rainIconWrap.innerHTML = '<i class="fa-solid fa-cloud-showers-heavy" style="color: #3b82f6;"></i>';
    } else if (rainStatus.includes('Llovizna')) {
        rainIconWrap.innerHTML = '<i class="fa-solid fa-cloud-rain" style="color: #60a5fa;"></i>';
    } else {
        rainIconWrap.innerHTML = '<i class="fa-solid fa-cloud-sun" style="color: #f59e0b;"></i>';
    }

    // 2. Renderizar Pestaña de Sensores Detallados (Medidores de Barra)
    document.getElementById('gauge-val-temp-dht').textContent = tempDht.toFixed(1);
    document.getElementById('gauge-val-temp-bmp').textContent = `${tempBmp.toFixed(1)} C`;
    document.getElementById('gauge-val-humidity').textContent = Math.round(humidity);
    document.getElementById('gauge-val-pressure').textContent = Math.round(pressure);
    document.getElementById('gauge-val-rain').textContent = Math.round(rainRaw);
    document.getElementById('gauge-val-rain-status').textContent = rainStatus.toUpperCase();

    // Convertir presión a atmósferas
    const pressAtm = (pressure / 1013.25).toFixed(3);
    document.getElementById('pressure-atmosphere').textContent = `${pressAtm} atm`;

    // Escalar barras de progreso
    const tempPct = Math.min(100, Math.max(0, ((tempDht + 10) / 60) * 100));
    document.getElementById('gauge-progress-temp-dht').style.width = `${tempPct}%`;

    document.getElementById('gauge-progress-humidity').style.width = `${humidity}%`;

    const presPct = Math.min(100, Math.max(0, ((pressure - 900) / 200) * 100));
    document.getElementById('gauge-progress-pressure').style.width = `${presPct}%`;

    const rainPct = Math.min(100, Math.max(0, (rainRaw / 4095) * 100));
    document.getElementById('gauge-progress-rain').style.width = `${rainPct}%`;

    // 3. Ejecutar Motores Inteligentes Mejorados
    evaluateCropRecommendations(tempDht, humidity, rainRaw, pressure);
    evaluateAlertThresholds(tempDht, humidity, rainRaw, pressure);

    // 4. Agregar Punto a las Gráficas
    appendDataToCharts(timestamp, tempDht, tempBmp, humidity, pressure);
}

/* -------------------------------------------------------------
   POBLAR GRÁFICAS DESDE EL HISTORIAL
   ------------------------------------------------------------- */
function repopulateCharts(data) {
    if (!data || data.length === 0) return;
    
    const chronologicalData = [...data].reverse();
    
    const labels = chronologicalData.map(row => {
        const d = new Date(row.fecha);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    });

    const tempsDht = chronologicalData.map(row => parseFloat(row.temperatura_dht));
    const tempsBmp = chronologicalData.map(row => parseFloat(row.temperatura_bmp));
    const hums = chronologicalData.map(row => parseFloat(row.humedad));
    const press = chronologicalData.map(row => parseFloat(row.presion));

    // Dashboard mini
    charts.miniTemp.data.labels = labels;
    charts.miniTemp.data.datasets[0].data = tempsDht;
    charts.miniTemp.update();

    // Comparativa Temperatura
    charts.temperature.data.labels = labels;
    charts.temperature.data.datasets[0].data = tempsDht;
    charts.temperature.data.datasets[1].data = tempsBmp;
    charts.temperature.update();

    // Humedad
    charts.humidity.data.labels = labels;
    charts.humidity.data.datasets[0].data = hums;
    charts.humidity.update();

    // Presión
    charts.pressure.data.labels = labels;
    charts.pressure.data.datasets[0].data = press;
    charts.pressure.update();
}

function appendDataToCharts(timestamp, tempDht, tempBmp, humidity, pressure) {
    const label = new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    Object.keys(charts).forEach(key => {
        const chart = charts[key];
        if (chart) {
            if (!chart.data.labels.includes(label)) {
                chart.data.labels.push(label);
                
                if (key === 'miniTemp') {
                    chart.data.datasets[0].data.push(tempDht);
                } else if (key === 'temperature') {
                    chart.data.datasets[0].data.push(tempDht);
                    chart.data.datasets[1].data.push(tempBmp);
                } else if (key === 'humidity') {
                    chart.data.datasets[0].data.push(humidity);
                } else if (key === 'pressure') {
                    chart.data.datasets[0].data.push(pressure);
                }

                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets.forEach(dataset => {
                        dataset.data.shift();
                    });
                }
                
                chart.update('none');
            }
        }
    });
}

/* -------------------------------------------------------------
   SISTEMA DE RECOMENDACIÓN AGRÍCOLA BASADO EN REGLAS (MEJORADA)
   ------------------------------------------------------------- */
function evaluateCropRecommendations(temp, humidity, rainRaw, pressure) {
    let chosenKey = 'standard';
    
    // Regla 1: Caluroso y Húmedo
    if (temp > 25 && humidity > 70) {
        chosenKey = 'tropical';
    } 
    // Regla 2: Caluroso y Seco
    else if (temp > 30 && humidity < 50) {
        chosenKey = 'arid';
    } 
    // Regla 3: Templado y Húmedo
    else if (temp >= 18 && temp <= 25 && humidity >= 60) {
        chosenKey = 'temperate';
    }

    const categoryData = cropDatabase[chosenKey];

    // 1. Actualizar Tarjeta en Dashboard Principal
    const mainCropName = categoryData.crops[0].name.toUpperCase();
    document.getElementById('val-crop-name').textContent = mainCropName;
    document.getElementById('val-crop-suitability').textContent = `Clima ideal: ${categoryData.categoryName}`;

    // 2. Panel de Recomendación Rápida (Dashboard)
    document.getElementById('quick-crop-title').textContent = `${categoryData.crops[0].name}, ${categoryData.crops[1].name}...`;
    document.getElementById('quick-crop-desc').textContent = `${categoryData.crops[0].description} En estas condiciones, este grupo ofrece la mayor resiliencia.`;
    document.getElementById('quick-crop-avatar').innerHTML = `<i class="fa-solid ${categoryData.crops[0].icon}"></i>`;

    // Barras de comparación visual (Dashboard)
    const tempCompBar = document.getElementById('comp-bar-temp');
    const tempCompVal = document.getElementById('comp-val-temp');
    const tempPct = Math.min(100, Math.max(0, (temp / 45) * 100));
    tempCompBar.style.width = `${tempPct}%`;
    tempCompVal.textContent = `${temp.toFixed(1)} C`;

    const humCompBar = document.getElementById('comp-bar-hum');
    const humCompVal = document.getElementById('comp-val-hum');
    humCompBar.style.width = `${humidity}%`;
    humCompVal.textContent = `${Math.round(humidity)}%`;

    // 3. Panel Detallado de Recomendaciones (Pestaña Recomendaciones)
    // Actualizar la tira resumen climática superior
    document.getElementById('strip-temp').textContent = `${temp.toFixed(1)} C`;
    document.getElementById('strip-hum').textContent = `${Math.round(humidity)}% UR`;
    document.getElementById('strip-rain').textContent = `${Math.round(rainRaw)} ADC`;
    
    const categoryBadge = document.getElementById('strip-category-badge');
    categoryBadge.textContent = categoryData.categoryName.toUpperCase();
    categoryBadge.className = 'strip-badge-status';

    // Generar Tarjetas Detalladas e Individuales de Cultivos
    const cropsContainer = document.getElementById('recommended-crops-container');
    cropsContainer.innerHTML = ''; // Limpiar loader

    categoryData.crops.forEach(crop => {
        // Calcular porcentaje matemático de compatibilidad basado en la desviación
        let tempDev = 0;
        if (temp < crop.tempRange[0]) tempDev = crop.tempRange[0] - temp;
        if (temp > crop.tempRange[1]) tempDev = temp - crop.tempRange[1];

        let humDev = 0;
        if (humidity < crop.humRange[0]) humDev = crop.humRange[0] - humidity;
        if (humidity > crop.humRange[1]) humDev = humidity - crop.humRange[1];

        // Reducir compatibilidad según la desviación (capping entre 55% y 99%)
        let compPct = 100 - Math.round((tempDev * 4) + (humDev * 2));
        compPct = Math.min(99, Math.max(55, compPct));

        // Formular la "Acción Inteligente" agronómica en base a desviaciones reales en vivo
        let actionAdvice = 'Condiciones ambientales optimas para un crecimiento vegetativo vigoroso.';
        if (temp < crop.tempRange[0]) {
            actionAdvice = `Temperatura fria detectada. Reducir flujo de riego y activar cubiertas termicas para proteger el cultivo.`;
        } else if (temp > crop.tempRange[1]) {
            actionAdvice = `Calor excesivo. Incrementar frecuencias de riego de enfriamiento y habilitar mallas de sombreado.`;
        } else if (humidity < crop.humRange[0]) {
            actionAdvice = `Humedad actual es baja para esta planta. Se recomienda activar microaspersores foliares para elevar el vapor.`;
        } else if (humidity > crop.humRange[1]) {
            actionAdvice = `Humedad superior al rango optimo. Incrementar la ventilacion del suelo para evitar la eclosion de hongos.`;
        }

        // Crear la tarjeta de cultivo
        const cropCard = document.createElement('div');
        cropCard.className = 'crop-enhanced-card';
        cropCard.innerHTML = `
            <div class="card-glow" style="background-color: ${compPct > 80 ? '#10b981' : '#f59e0b'};"></div>
            
            <div class="crop-card-top">
                <div class="crop-card-title-wrap">
                    <div class="crop-icon-circle">
                        <i class="fa-solid ${crop.icon}"></i>
                    </div>
                    <div>
                        <h4>${crop.name}</h4>
                        <span class="crop-suitability-badge">${compPct > 80 ? 'ALTA COMPATIBILIDAD' : 'COMPATIBILIDAD MEDIA'}</span>
                    </div>
                </div>
            </div>

            <div class="crop-compatibility-wrapper">
                <div class="crop-comp-header">
                    <span>Afinidad Climatica</span>
                    <span class="crop-comp-percentage" style="font-weight: 700; color: var(--accent);">${compPct}%</span>
                </div>
                <div class="crop-comp-bar">
                    <div class="crop-comp-bar-fill" style="width: ${compPct}%"></div>
                </div>
            </div>

            <div class="crop-requirements-list">
                <div class="req-item">
                    <span class="req-label">Rango Termico Ideal</span>
                    <span class="req-val">${crop.tempRange[0]} C a ${crop.tempRange[1]} C</span>
                </div>
                <div class="req-item">
                    <span class="req-label">Rango Humedad Ideal</span>
                    <span class="req-val">${crop.humRange[0]}% a ${crop.humRange[1]}% UR</span>
                </div>
                <div class="req-item">
                    <span class="req-label">Demanda Hidrica</span>
                    <span class="req-val">${crop.rainReq}</span>
                </div>
                <div class="req-item">
                    <span class="req-label">Metodo de Riego</span>
                    <span class="req-val">${crop.irrigation}</span>
                </div>
            </div>

            <p class="crop-desc-text" style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.4;">
                ${crop.description}
            </p>

            <div class="crop-smart-tip">
                <strong>Smart Tip:</strong> ${actionAdvice}
            </div>
        `;
        cropsContainer.appendChild(cropCard);
    });

    // 4. Resaltar la Tarjeta de la Regla en la cuadrícula de matriz
    const ruleCards = document.querySelectorAll('.rule-card');
    ruleCards.forEach(card => card.classList.remove('highlight-rule'));

    let targetCardId = 'rule-group-default';
    if (chosenKey === 'tropical') targetCardId = 'rule-group-1';
    else if (chosenKey === 'arid') targetCardId = 'rule-group-2';
    else if (chosenKey === 'temperate') targetCardId = 'rule-group-3';

    const targetCard = document.getElementById(targetCardId);
    if (targetCard) targetCard.classList.add('highlight-rule');
}

/* -------------------------------------------------------------
   SISTEMA DE ALERTAS DINÁMICAS (EVALUACIÓN DE UMBRALES CONFIGURADOS)
   ------------------------------------------------------------- */
function evaluateAlertThresholds(temp, humidity, rainRaw, pressure) {
    let alertLevel = 'green';
    let alertMsg = 'Condiciones normales de operacion.';
    let alertDetails = 'Todos los sensores registran niveles óptimos dentro del margen estándar para el crecimiento del cultivo.';

    // 1. Evaluación de Alertas Rojas (Críticas) basadas en los límites dinámicos
    if (
        temp > alertThresholds.tempRedHigh || 
        temp < alertThresholds.tempRedLow || 
        humidity < alertThresholds.humRedLow || 
        humidity > alertThresholds.humRedHigh || 
        rainRaw >= alertThresholds.rainRed || 
        pressure < 985 || 
        pressure > 1040
    ) {
        alertLevel = 'red';
        
        if (temp > alertThresholds.tempRedHigh) {
            alertMsg = `ALERTA ROJA: Temperatura superior a ${alertThresholds.tempRedHigh.toFixed(1)} °C`;
            alertDetails = 'Se ha superado el límite crítico de calor. Alto riesgo de estrés térmico, deshidratación rápida y aborto de floración. Activar riego de enfriamiento.';
        } else if (temp < alertThresholds.tempRedLow) {
            alertMsg = `ALERTA ROJA: Temperatura inferior a ${alertThresholds.tempRedLow.toFixed(1)} °C`;
            alertDetails = 'Riesgo inminente de congelación de tejidos vegetales y necrosis celular foliar. Activar quemadores o mantas térmicas.';
        } else if (humidity < alertThresholds.humRedLow) {
            alertMsg = `ALERTA ROJA: Humedad del aire inferior a ${alertThresholds.humRedLow}% UR`;
            alertDetails = 'Incremento exponencial de la evapotranspiración de los estomas. Cierre estomático severo y marchitez de hojas.';
        } else if (humidity > alertThresholds.humRedHigh) {
            alertMsg = `ALERTA ROJA: Humedad del aire superior a ${alertThresholds.humRedHigh}% UR`;
            alertDetails = 'Condiciones ideales para la eclosión de esporas fúngicas como roya y fitóftora. Incrementar de inmediato la ventilación.';
        } else if (rainRaw >= alertThresholds.rainRed) {
            alertMsg = `ALERTA ROJA: Lluvia Fuerte (${rainRaw} ADC)`;
            alertDetails = 'El sensor reporta lluvias de alta intensidad. Riesgo de erosión de suelos y saturación hídrica. Se sugiere supervisar el drenaje de cultivos.';
        } else {
            alertMsg = 'ALERTA ROJA: Anomalia Barometrica Extrema';
            alertDetails = 'Variación violenta de presión. Indicativo de frente de tormenta ciclónica severa inminente. Proteger invernaderos.';
        }
    }
    // 2. Evaluación de Alertas Amarillas (Advertencia) basadas en límites dinámicos
    else if (
        temp > alertThresholds.tempYellowHigh || 
        temp < alertThresholds.tempYellowLow || 
        humidity < alertThresholds.humYellowLow || 
        humidity > alertThresholds.humYellowHigh || 
        (rainRaw >= alertThresholds.rainYellow && rainRaw < alertThresholds.rainRed) || 
        pressure < 995 || 
        pressure > 1020
    ) {
        alertLevel = 'yellow';
        
        if (temp > alertThresholds.tempYellowHigh) {
            alertMsg = `ALERTA AMARILLA: Temperatura de Advertencia (> ${alertThresholds.tempYellowHigh.toFixed(1)} °C)`;
            alertDetails = 'Temperatura moderadamente elevada. Monitorear tasa de desecación del suelo y evaporación de agua.';
        } else if (temp < alertThresholds.tempYellowLow) {
            alertMsg = `ALERTA AMARILLA: Enfriamiento de Advertencia (< ${alertThresholds.tempYellowLow.toFixed(1)} °C)`;
            alertDetails = 'Temperatura por debajo del confort. Tasa de crecimiento ralentizada para especies tropicales.';
        } else if (humidity < alertThresholds.humYellowLow) {
            alertMsg = `ALERTA AMARILLA: Aire Seco (< ${alertThresholds.humYellowLow}% UR)`;
            alertDetails = 'Humedad ambiental baja. Aumentar ligeramente las frecuencias de riego foliar por la tarde.';
        } else if (humidity > alertThresholds.humYellowHigh) {
            alertMsg = `ALERTA AMARILLA: Aire Humedo de Riesgo (> ${alertThresholds.humYellowHigh}% UR)`;
            alertDetails = 'Humedad de riesgo. Monitorear la aparición de manchas foliares sospechosas en los tallos.';
        } else if (rainRaw >= alertThresholds.rainYellow && rainRaw < alertThresholds.rainRed) {
            alertMsg = 'ALERTA AMARILLA: Llovizna Detectada';
            alertDetails = 'Aporte de agua pluvial moderada en curso. Se recomienda pausar riegos automáticos temporales.';
        } else {
            alertMsg = 'ALERTA AMARILLA: Variacion Barometrica Inestable';
            alertDetails = 'Monitorear barómetro en las próximas horas ante cambios climáticos abruptos.';
        }
    }

    // 1. Actualizar Banner Superior del Dashboard
    const banner = document.getElementById('quick-alert-banner');
    const bannerText = document.getElementById('quick-alert-text');
    const bannerIcon = banner.querySelector('i');

    banner.className = 'quick-alert-banner';
    if (alertLevel === 'red') {
        banner.classList.add('danger-banner');
        bannerText.textContent = alertMsg.toUpperCase();
        bannerIcon.className = 'fa-solid fa-triangle-exclamation';
    } else if (alertLevel === 'yellow') {
        banner.classList.add('warning-banner');
        bannerText.textContent = alertMsg.toUpperCase();
        bannerIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        banner.classList.add('success-banner');
        bannerText.textContent = 'SISTEMA OPERANDO CON TOTAL NORMALIDAD';
        bannerIcon.className = 'fa-solid fa-circle-check';
    }

    // 2. Actualizar Panel de la Sección de Alertas
    const alertPanel = document.getElementById('alert-main-status-panel');
    const alertTitle = document.getElementById('alert-status-title');
    const alertSubtitle = document.getElementById('alert-status-subtitle');
    const alertDesc = document.getElementById('alert-status-description');
    const alertIconBox = document.getElementById('alert-status-icon-box');
    
    alertPanel.className = 'alert-status-card glass-card';
    if (alertLevel === 'red') {
        alertPanel.classList.add('alert-danger');
        alertTitle.textContent = alertMsg;
        alertSubtitle.textContent = 'LIMITES CRITICOS CONFIGURADOS SUPERADOS - ACCION REQUERIDA';
        alertDesc.textContent = alertDetails;
        alertIconBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else if (alertLevel === 'yellow') {
        alertPanel.classList.add('alert-warning');
        alertTitle.textContent = alertMsg;
        alertSubtitle.textContent = 'VALORES DE PREVENCION ALCANZADOS - MONITOREO ACTIVO';
        alertDesc.textContent = alertDetails;
        alertIconBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
    } else {
        alertPanel.classList.add('alert-normal');
        alertTitle.textContent = 'CONDICIONES AMBIENTALES IDEALES';
        alertSubtitle.textContent = 'AGRICULTURA DE PRECISION SIN INCIDENCIAS';
        alertDesc.textContent = alertDetails;
        alertIconBox.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
    }

    // 3. Registrar en Log de Alertas de Sesión
    if (alertLevel !== 'green') {
        const lastLog = alertLogs[0];
        if (!lastLog || lastLog.msg !== alertMsg) {
            const now = new Date();
            const logTimeStr = now.toLocaleTimeString('es-ES') + ' - ' + now.toLocaleDateString('es-ES');
            
            const nuevoLog = {
                level: alertLevel,
                msg: alertMsg,
                time: logTimeStr
            };
            
            alertLogs.unshift(nuevoLog);
            if (alertLogs.length > 30) {
                alertLogs.pop();
            }
            
            renderAlertLog();
        }
    }
}

function renderAlertLog() {
    const container = document.getElementById('alert-log-container');
    const clearBtn = document.getElementById('clear-alerts-btn');

    if (alertLogs.length === 0) {
        container.innerHTML = '<div class="log-empty-msg">No se han registrado eventos anomalos en la sesion actual.</div>';
        return;
    }

    container.innerHTML = '';
    alertLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = `log-item log-${log.level}`;
        
        let iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
        if (log.level === 'yellow') {
            iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
        }

        item.innerHTML = `
            <div class="log-item-left">
                ${iconHtml}
                <span>${log.msg}</span>
            </div>
            <span class="log-time">${log.time}</span>
        `;
        container.appendChild(item);
    });

    clearBtn.onclick = () => {
        alertLogs.length = 0;
        renderAlertLog();
        showAppNotification('Log Limpiado', 'Historial de alertas de la sesion borrado.', 'info');
    };
}

/* -------------------------------------------------------------
   INTERFAZ DEL HISTORIAL DE DATOS (TABLA Y FILTRADO)
   ------------------------------------------------------------- */
function renderHistoryTable(data) {
    const tbody = document.getElementById('history-table-body');
    const countEl = document.getElementById('history-count');
    
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading-msg">
                    <span>No hay datos almacenados disponibles en este momento.</span>
                </td>
            </tr>
        `;
        countEl.textContent = 'Mostrando 0 lecturas';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        const dateObj = new Date(row.fecha);
        const formattedDate = dateObj.toLocaleDateString('es-ES') + ' ' + dateObj.toLocaleTimeString('es-ES');
        
        let rainClass = 'cell-rain-none';
        if (row.lluvia >= alertThresholds.rainRed) {
            rainClass = 'cell-rain-high';
        } else if (row.lluvia >= alertThresholds.rainYellow) {
            rainClass = 'cell-rain-mid';
        }

        tr.innerHTML = `
            <td><strong>${formattedDate}</strong></td>
            <td>${parseFloat(row.temperatura_dht).toFixed(1)} C</td>
            <td>${Math.round(row.humedad)}% UR</td>
            <td>${parseFloat(row.temperatura_bmp).toFixed(1)} C</td>
            <td>${Math.round(row.presion)} hPa</td>
            <td class="${rainClass}">${Math.round(row.lluvia)} ADC</td>
            <td><span class="status-indicator waiting" style="padding: 2px 8px; font-size: 10px;">${row.estado_lluvia.toUpperCase()}</span></td>
        `;
        
        tbody.appendChild(tr);
    });

    countEl.textContent = `Mostrando ${data.length} lecturas de la base de datos`;

    setupHistorySearch();
}

function setupHistorySearch() {
    const searchInput = document.getElementById('history-search-input');
    const refreshBtn = document.getElementById('refresh-history-btn');

    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#history-table-body tr');

            rows.forEach(row => {
                if (row.querySelector('.table-loading-msg')) return;
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        };
    }

    if (refreshBtn) {
        refreshBtn.onclick = () => {
            fetchHistoryLog();
            showAppNotification('Consultando Supabase', 'Descargando ultimas lecturas de Supabase...', 'info');
        };
    }
}

/* -------------------------------------------------------------
   NOTIFICACIONES INTERNAS TOASTS
   ------------------------------------------------------------- */
function showAppNotification(title, message, type = 'info') {
    const activeToast = document.querySelector('.app-toast');
    if (activeToast) activeToast.remove();

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    else if (type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';
    else if (type === 'warning') iconClass = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-body">
            <h5>${title.toUpperCase()}</h5>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Inyección de estilos CSS de las notificaciones flotantes (Toasts)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
.app-toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-md);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 10000;
    max-width: 320px;
    transform: translateY(100px);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
}
.app-toast.toast-show {
    transform: translateY(0);
    opacity: 1;
}
.toast-icon {
    font-size: 22px;
    flex-shrink: 0;
}
.toast-success .toast-icon { color: var(--color-success); }
.toast-success { border-left: 4px solid var(--color-success); }
.toast-danger .toast-icon { color: var(--color-danger); }
.toast-danger { border-left: 4px solid var(--color-danger); }
.toast-warning .toast-icon { color: var(--color-warning); }
.toast-warning { border-left: 4px solid var(--color-warning); }
.toast-info .toast-icon { color: var(--accent); }
.toast-info { border-left: 4px solid var(--accent); }

.toast-body h5 {
    font-family: var(--font-heading);
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 2px;
    letter-spacing: 0.5px;
}
.toast-body p {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.3;
}
`;
document.head.appendChild(styleSheet);
