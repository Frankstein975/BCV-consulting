// --- Lógica de Obtención de Datos BCV Real ---

/**
 * Procesa los datos crudos y actualiza los elementos del DOM.
 * Se comunica con las funciones de interfaz a través de los IDs.
 */
window.procesarTasas = function(usd, eur, fechaSource = null) {
    try {
        log("Procesando datos oficiales...");

        // Aseguramos que sean números
        const u = parseFloat(usd);
        const e = parseFloat(eur);

        if (isNaN(u) || u <= 0) throw new Error("Datos de moneda no válidos");

        // Formateo para Venezuela
        const uFormateado = u.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const eFormateado = e.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        // Actualización de Interfaz
        USD_EL.innerText = uFormateado;
        EUR_EL.innerText = eFormateado;
        
        // Priorizar fecha de la fuente o generar actual
        const fechaFinal = fechaSource ? fechaSource : new Date().toLocaleString('es-VE', { hour12: true });
        FECHA_EL.innerText = "Vigencia: " + fechaFinal;

        // Guardado en Caché
        localStorage.setItem('v_u', uFormateado);
        localStorage.setItem('v_e', eFormateado);
        localStorage.setItem('v_d', FECHA_EL.innerText);

        DOT.className = "dot online";
        log("¡Conexión exitosa!");
        
        // Disparar recálculo si la calculadora está abierta
        if(typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error en formato de datos.");
        DOT.className = "dot error";
    }
};

/**
 * Intenta obtener las tasas desde la fuente más estable (DolarApi)
 * que permite obtener USD y EUR por separado sin cálculos aproximados.
 */
async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Sincronizando...";
    log("Consultando BCV...");

    try {
        // Consultamos Dólar y Euro en paralelo para velocidad
        const [resUsd, resEur] = await Promise.all([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' }),
            fetch('https://ve.dolarapi.com/v1/euro/oficial', { cache: 'no-store' })
        ]);

        if (resUsd.ok && resEur.ok) {
            const dataUsd = await resUsd.json();
            const dataEur = await resEur.json();
            window.procesarTasas(dataUsd.promedio, dataEur.promedio);
        } else {
            throw new Error();
        }
    } catch (e) {
        log("Fuente principal fallida. Intentando respaldo...");
        fetchBackupPyDolar();
    }
}

/**
 * Fuente de respaldo mediante inyección de Script (Bypass de CORS)
 */
function fetchBackupPyDolar() {
    const oldScript = document.getElementById('api-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'api-script';
    // Endpoint directo a BCV
    script.src = `https://pydolarve.org/api/v1/dollar?key=bcv&callback=callbackPyDolar&t=${Date.now()}`;
    
    window.callbackPyDolar = (data) => {
        try {
            const u = data.monedas.usd.price;
            const e = data.monedas.eur.price;
            const f = data.datetime.fecha;
            window.procesarTasas(u, e, f);
        } catch (err) {
            log("Fallo total de red.");
            DOT.className = "dot error";
        }
    };

    document.body.appendChild(script);
}