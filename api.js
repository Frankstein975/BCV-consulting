/**
 * API.JS - Extracción directa desde BCV.org.ve (Versión Reparada)
 */

window.procesarTasas = function(usd, eur, fechaSource = null) {
    try {
        log("Procesando datos oficiales...");

        // Limpieza de strings y conversión
        const u = parseFloat(usd.replace(/\./g, '').replace(',', '.'));
        const e = parseFloat(eur.replace(/\./g, '').replace(',', '.'));

        if (isNaN(u) || u <= 0) throw new Error("Datos inválidos");

        const uFormateado = u.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const eFormateado = e.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        USD_EL.innerText = uFormateado;
        EUR_EL.innerText = eFormateado;
        
        const ahora = new Date();
        const fechaLocal = ahora.toLocaleDateString('es-VE') + " " + ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        FECHA_EL.innerText = "Vigencia: " + (fechaSource || fechaLocal);

        localStorage.setItem('v_u', uFormateado);
        localStorage.setItem('v_e', eFormateado);
        localStorage.setItem('v_d', FECHA_EL.innerText);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");
        
        if(typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error en formato de datos.");
        DOT.className = "dot error";
    }
};

async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Consultando...";
    log("Iniciando conexión BCV...");

    const target = "https://www.bcv.org.ve/";
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
            const timeout = setTimeout(() => controller.abort(), 8000); 
            
            const response = await fetch(proxy.url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error();

            const html = await response.text();
            
            /**
             * NUEVA LÓGICA DE EXTRACCIÓN (REPARADA)
             * Buscamos el ID y agarramos el primer número que aparezca después,
             * sin importar si está dentro de un <strong>, <span> o texto plano.
             */
            const extract = (id) => {
                // Busca el id y captura el primer número con coma que encuentre cerca
                const regex = new RegExp(`id="${id}"[^>]*>.*?([0-9]+,[0-9]+)`, 's');
                const match = html.match(regex);
                return match ? match[1].trim() : null;
            };

            const usd = extract('dolar');
            const eur = extract('euro');

            if (usd && eur) {
                window.procesarTasas(usd, eur);
                success = true;
            } else {
                log(`Fallo: No se encontró el valor en el HTML.`);
            }

        } catch (err) {
            log(`${proxy.name} falló o bloqueado.`);
        }
    }

    if (!success) {
        log("Error: BCV no responde a los proxies.");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Error de conexión";
    }
}
