/**
 * API.JS - Extracción directa desde BCV.org.ve vía Proxy
 */

// Esta función procesa los números y actualiza la UI y el caché
window.procesarTasas = function(usd, eur, fechaSource = null) {
    try {
        log("Procesando datos oficiales...");

        // Convertir strings de tipo "36,45" a números flotantes
        const u = parseFloat(usd.replace(',', '.'));
        const e = parseFloat(eur.replace(',', '.'));

        if (isNaN(u) || u <= 0) throw new Error("Datos inválidos");

        // Formatear para mostrar en pantalla (Estilo Venezuela)
        const uFormateado = u.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const eFormateado = e.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        // Actualizar Elementos (IDs definidos en ui.js)
        USD_EL.innerText = uFormateado;
        EUR_EL.innerText = eFormateado;
        
        // Manejo de fecha
        const ahora = new Date();
        const fechaLocal = ahora.toLocaleDateString('es-VE') + " " + ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        FECHA_EL.innerText = "Vigencia: " + (fechaSource || fechaLocal);

        // Guardar en LocalStorage para persistencia
        localStorage.setItem('v_u', uFormateado);
        localStorage.setItem('v_e', eFormateado);
        localStorage.setItem('v_d', FECHA_EL.innerText);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");
        
        // Si la calculadora está abierta en ui.js, que se actualice
        if(typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error en formato de datos.");
        DOT.className = "dot error";
    }
};

/**
 * Función principal de consulta (Llamada desde ui.js)
 */
async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Consultando...";
    log("Iniciando conexión BCV...");

    const target = "https://www.bcv.org.ve/";
    
    // Lista de proxies para evitar bloqueos de CORS
    const proxies = [
        { name: "CorsProxy.io", url: `https://corsproxy.io/?${encodeURIComponent(target)}` },
        { name: "AllOrigins", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}&t=${Date.now()}` }
    ];

    let success = false;

    for (const proxy of proxies) {
        if (success) break;

        try {
            log(`Probando: ${proxy.name}...`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000); // 6 segundos de espera
            
            const response = await fetch(proxy.url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error();

            const html = await response.text();
            
            // --- Lógica de Extracción (Regex) ---
            // Buscamos los contenedores específicos del BCV para Dólar y Euro
            const extract = (id) => {
                const regex = new RegExp(`<div[^>]*id="${id}"[^>]*>.*?<strong>\\s*([0-9,.]+)\\s*</strong>`, 's');
                const match = html.match(regex);
                return match ? match[1].trim() : null;
            };

            const usd = extract('dolar');
            const eur = extract('euro');

            if (usd && eur) {
                window.procesarTasas(usd, eur);
                success = true;
            }

        } catch (err) {
            log(`${proxy.name} falló o fue muy lento.`);
        }
    }

    if (!success) {
        log("Todas las rutas fallaron. Intente más tarde.");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Error de conexión";
    }
}