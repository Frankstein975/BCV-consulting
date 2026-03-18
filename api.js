/**
 * API.JS - Edición Especial para GitHub Pages
 */

// 1. Referencias globales (aseguramos que existan)
const USD_EL = document.getElementById('usd');
const EUR_EL = document.getElementById('eur');
const FECHA_EL = document.getElementById('fecha');
const DOT = document.getElementById('dot');

window.procesarTasas = function(usd, eur, fechaSource = null) {
    try {
        log("Actualizando interfaz...");

        // Función para limpiar el texto y convertirlo a número usable
        const limpiar = (txt) => {
            if (!txt) return 0;
            // Quitamos todo lo que no sea número o coma
            let limpio = txt.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(limpio);
        };

        const u = limpiar(usd);
        const e = limpiar(eur);

        if (!u || isNaN(u)) throw new Error("Datos corruptos");

        // Formatear para mostrar
        const formato = (n) => n.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        USD_EL.innerText = formato(u);
        EUR_EL.innerText = formato(e);

        const ahora = new Date();
        const textoFecha = fechaSource || ahora.toLocaleDateString('es-VE') + " " + ahora.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        FECHA_EL.innerText = "Vigencia: " + textoFecha;

        // Guardar en caché
        localStorage.setItem('v_u', formato(u));
        localStorage.setItem('v_e', formato(e));
        localStorage.setItem('v_d', FECHA_EL.innerText);

        DOT.className = "dot online";
        log("¡Sincronizado con éxito!");

        if (typeof calculate === 'function') calculate();

    } catch (err) {
        log("Error al procesar números.");
        DOT.className = "dot error";
    }
};

async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Conectando...";
    log("Solicitando datos al BCV...");

    // Usaremos AllOrigins pero con el formato JSON para saltar restricciones de tipo de contenido
    const target = "https://www.bcv.org.ve/";
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(target)}&timestamp=${Date.now()}`;

    try {
        const response = await fetch(proxy);
        if (!response.ok) throw new Error("Proxy falló");
        
        const data = await response.json();
        const html = data.contents; // El HTML viene dentro del JSON

        // Buscamos el valor justo después de los IDs 'dolar' y 'euro'
        const extraer = (id) => {
            const regex = new RegExp(`id="${id}"[^>]*>.*?([0-9]+,[0-9]+)`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const valUsd = extraer('dolar');
        const valEur = extraer('euro');

        if (valUsd && valEur) {
            window.procesarTasas(valUsd, valEur);
        } else {
            log("BCV cambió su diseño. Revisa los IDs.");
            DOT.className = "dot error";
        }

    } catch (err) {
        log("Error de red. BCV inaccesible.");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Error de conexión";
    }
}
