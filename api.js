/**
 * API.JS - Versión Final Estable para GitHub Pages
 * Con corrección de formato de fecha ISO a Humano
 */

// Función para procesar y mostrar los datos en la interfaz
window.procesarTasas = function(usd, eur, fecha) {
    try {
        log("Actualizando indicadores...");

        // Formateador para moneda local (Ej: 36,45)
        const fNum = (n) => n.toLocaleString('es-VE', {
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        });
        
        const uVal = parseFloat(usd);
        const eVal = parseFloat(eur);

        if (isNaN(uVal)) throw new Error("Precio inválido");

        // Actualizar UI
        USD_EL.innerText = fNum(uVal);
        EUR_EL.innerText = fNum(eVal);

        // --- LIMPIEZA DE FECHA (De ISO a DD/MM/AAAA) ---
        let fechaLimpia = "";
        if (fecha && fecha.includes('T')) {
            // "2026-03-18T00:00:00-04:00" -> ["2026-03-18", "00:00:00-04:00"]
            const soloFecha = fecha.split('T')[0]; 
            const partes = soloFecha.split('-'); // ["2026", "03", "18"]
            fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`; // 18/03/2026
        } else {
            const ahora = new Date();
            fechaLimpia = ahora.toLocaleDateString('es-VE');
        }

        const textoVigencia = "Vigencia: " + fechaLimpia;
        FECHA_EL.innerText = textoVigencia;

        // Guardar en LocalStorage para persistencia
        localStorage.setItem('v_u', fNum(uVal));
        localStorage.setItem('v_e', fNum(eVal));
        localStorage.setItem('v_d', textoVigencia);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");

        // Ejecutar cálculo si la calculadora está abierta
        if (typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error en procesamiento de datos.");
        DOT.className = "dot error";
    }
};

// Función principal de consulta (Llamada desde ui.js)
async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Conectando...";
    log("Solicitando datos seguros...");

    // Endpoints de DolarApi (Espejo oficial BCV)
    const urlUsd = "https://ve.dolarapi.com/v1/dolares/oficial";
    const urlEur = "https://ve.dolarapi.com/v1/euros/oficial";

    try {
        const [resUsd, resEur] = await Promise.all([
            fetch(urlUsd),
            fetch(urlEur)
        ]);

        if (!resUsd.ok || !resEur.ok) throw new Error("Servidor no responde");

        const dataUsd = await resUsd.json();
        const dataEur = await resEur.json();

        // Enviamos los datos a procesar
        window.procesarTasas(dataUsd.promedio, dataEur.promedio, dataUsd.fechaActualizacion);

    } catch (err) {
        log("Error de red. Verifique conexión.");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Fallo de conexión";
    }
}