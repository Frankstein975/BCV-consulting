/**
 * API.JS - Versión de Alta Compatibilidad para GitHub Pages
 * Usa un puente (Bridge) para evitar bloqueos de CORS del BCV
 */

window.procesarTasas = function(usd, eur, fecha = null) {
    try {
        log("Actualizando indicadores...");

        // Formatear para la interfaz (Aseguramos el estilo "36,45")
        const f = (n) => n.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        // Convertimos a número para procesar, luego a string para mostrar
        const uVal = parseFloat(usd);
        const eVal = parseFloat(eur);

        USD_EL.innerText = f(uVal);
        EUR_EL.innerText = f(eVal);

        const ahora = new Date();
        const textoFecha = "Vigencia: " + (fecha || ahora.toLocaleString('es-VE', { hour12: true }));
        FECHA_EL.innerText = textoFecha;

        // Guardar en caché
        localStorage.setItem('v_u', f(uVal));
        localStorage.setItem('v_e', f(eVal));
        localStorage.setItem('v_d', textoFecha);

        DOT.className = "dot online";
        log("¡Sincronización exitosa!");

        if (typeof calculate === 'function') calculate();
        
    } catch (err) {
        log("Error en procesamiento de datos.");
        DOT.className = "dot error";
    }
};

async function fetchRates() {
    DOT.className = "dot loading";
    FECHA_EL.innerText = "Conectando...";
    log("Solicitando datos seguros...");

    // Usamos DolarApi, que es un espejo del BCV diseñado para programadores
    // Es 100% gratuito y no lo bloquea GitHub Pages
    const urlUsd = "https://ve.dolarapi.com/v1/dolares/oficial";
    const urlEur = "https://ve.dolarapi.com/v1/euros/oficial";

    try {
        // Pedimos ambos valores en paralelo para ganar velocidad
        const [resUsd, resEur] = await Promise.all([
            fetch(urlUsd),
            fetch(urlEur)
        ]);

        if (!resUsd.ok || !resEur.ok) throw new Error("Error en servidor de datos");

        const dataUsd = await resUsd.json();
        const dataEur = await resEur.json();

        // Enviamos los promedios (que es el valor oficial del BCV)
        window.procesarTasas(dataUsd.promedio, dataEur.promedio, dataUsd.fechaActualizacion);

    } catch (err) {
        log("Error de red. Reintentando...");
        DOT.className = "dot error";
        FECHA_EL.innerText = "Fallo de conexión";
        
        // Si falla la API, intentamos el método tradicional como último recurso
        log("Usando ruta de emergencia...");
        // (Aquí podrías poner tu código anterior de AllOrigins si quisieras)
    }
}
