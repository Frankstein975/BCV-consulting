/**
 * API.JS - Versión de alta disponibilidad para GitHub Pages
 */

// Referencias a la UI (Aseguramos que coincidan con tu HTML)
const USD_EL = document.getElementById('usd');
const EUR_EL = document.getElementById('eur');
const FECHA_EL = document.getElementById('fecha');
const DOT = document.getElementById('dot');

window.procesarTasas = function(usd, eur, fecha) {
    try {
        log("Actualizando indicadores...");

        // Función para limpiar y convertir a número (por si vienen como string)
        const num = (v) => parseFloat(v.toString().replace(',', '.'));
        
        const u = num(usd);
        const e = num(eur);

        if (isNaN(u)) throw new Error("Precio inválido");

        // Formato moneda local
        const f = (n) => n.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        USD_EL.innerText = f(u);
        EUR_EL.innerText = f(e);
        FECHA_EL.innerText = "Vigencia: " + (fecha || "Hoy");

        // Guardar en caché
        localStorage.setItem('v_u', f(u));
        localStorage.setItem('v_e', f(e));
        localStorage.setItem('v_d', FECHA_EL.innerText);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");

        if (typeof calculate === 'function') calculate();
    } catch (err) {
        log("Error al procesar datos.");
        DOT.className = "dot error";
    }
};

async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Sincronizando...";
    log("Conectando con servidores de divisas...");

    // Fuente 1: PyDolarVE (Muy estable para el BCV)
    try {
        const response = await fetch("https://pydolarve.org/api/v1/dollar?page=bcv");
        const data = await response.json();
        
        if (data && data.monedas) {
            window.procesarTasas(
                data.monedas.usd.valor, 
                data.monedas.eur.valor, 
                data.fecha
            );
            return; 
        }
    } catch (e) {
        log("Fuente 1 falló, probando respaldo...");
    }

    // Fuente 2: Alternativa directa (Por si PyDolar cae)
    try {
        const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        const data = await response.json();
        
        if (data && data.promedio) {
            // Nota: Esta API suele dar solo el dólar, usamos una estimación para el euro o buscamos su par
            const resEur = await fetch("https://ve.dolarapi.com/v1/euros/oficial");
            const dataEur = await resEur.json();
            
            window.procesarTasas(data.promedio, dataEur.promedio, data.fechaActualizacion);
            return;
        }
    } catch (e) {
        log("Todas las fuentes fallaron.");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Error de conexión";
    }
}
