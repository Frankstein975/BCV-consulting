/**
 * API.JS - Versión Final Reparada (Marzo 2024)
 * Basada en la estructura real del bcv.org.ve
 */

// Función para actualizar la interfaz y el almacenamiento
window.procesarTasas = function(usd, eur) {
    try {
        log("Procesando datos del BCV...");

        // Formatear para la UI (Asegurar que se vea como "36,45")
        USD_EL.innerText = usd;
        EUR_EL.innerText = eur;

        const f = "Vigencia: " + new Date().toLocaleString('es-VE', { hour12: true });
        FECHA_EL.innerText = f;

        // Guardar en caché
        localStorage.setItem('v_u', usd);
        localStorage.setItem('v_e', eur);
        localStorage.setItem('v_d', f);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");

        if (typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error al mostrar los datos.");
        DOT.className = "dot error";
    }
};

async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Conectando...";
    log("Consultando BCV oficial...");

    const target = "https://www.bcv.org.ve/";
    const proxies = [
        { name: "AllOrigins", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}&t=${Date.now()}` },
        { name: "CorsProxy", url: `https://corsproxy.io/?${encodeURIComponent(target)}` }
    ];

    let success = false;

    for (let proxy of proxies) {
        if (success) break;

        try {
            log(`Usando ${proxy.name}...`);
            const response = await fetch(proxy.url);
            if (!response.ok) throw new Error();

            const html = await response.text();

            /**
             * EXTRACCIÓN BASADA EN EL HTML QUE ENVIASTE:
             * Buscamos el div con id="dolar" o id="euro" y capturamos 
             * el valor numérico (incluyendo puntos y comas).
             */
            const extract = (id) => {
                const regex = new RegExp(`id="${id}"[^>]*>.*?([0-9]+,[0-9]+)`, 's');
                const match = html.match(regex);
                return match ? match[1].trim() : null;
            };

            const valUsd = extract('dolar');
            const valEur = extract('euro');

            if (valUsd && valEur) {
                window.procesarTasas(valUsd, valEur);
                success = true;
            } else {
                log("HTML cargado pero valores no encontrados.");
            }

        } catch (err) {
            log(`Fallo en ruta ${proxy.name}.`);
        }
    }

    if (!success) {
        DOT.className = "dot error";
        FECHA_EL.innerText = "Error de conexión";
        log("El BCV bloqueó la petición.");
    }
}
