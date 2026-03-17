// --- Selectores ---
const USD_EL = document.getElementById('usd');
const EUR_EL = document.getElementById('eur');
const FECHA_EL = document.getElementById('fecha');
const DOT = document.getElementById('dot');
const LOG_BOX = document.getElementById('console');
const MODAL = document.getElementById('calc-modal');

// --- Sistema de Logs ---
function log(msg) {
    const t = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    LOG_BOX.innerHTML = `[${t}] ${msg}<br>` + LOG_BOX.innerHTML;
}

// --- Funciones del Modal ---
function toggleCalc(show) {
    if (show) {
        MODAL.classList.add('active');
        document.getElementById('calc-input').focus();
    } else {
        MODAL.classList.remove('active');
    }
}

// --- Inicialización y Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar caché (Persistencia)
    if (localStorage.getItem('v_u')) {
        USD_EL.innerText = localStorage.getItem('v_u');
        EUR_EL.innerText = localStorage.getItem('v_e');
        FECHA_EL.innerText = localStorage.getItem('v_d');
        log("Caché cargada.");
    }

    // 2. Eventos de botones
    document.getElementById('btn-update').onclick = fetchRates;
    document.getElementById('btn-calc-open').onclick = () => toggleCalc(true);
    document.getElementById('btn-calc-close').onclick = () => toggleCalc(false);
    
    // 3. Cierre por clic fuera (Área oscura)
    MODAL.addEventListener('click', (e) => {
        if (!e.target.closest('.calc-content')) toggleCalc(false);
    });

    // 4. Cierre con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && MODAL.classList.contains('active')) {
            toggleCalc(false);
        }
    });

    // 5. WhatsApp Compartir
    document.getElementById('btn-share').onclick = () => {
        const urlApp = "https://frankstein975.github.io/BCV-consulting/";
        const m = encodeURIComponent(
            `📊 *BCV OFICIAL*\n\n` +
            `💵 USD: *${USD_EL.innerText}* Bs\n` +
            `€ EUR: *${EUR_EL.innerText}* Bs\n\n` +
            `🔗 Consulta en línea:\n${urlApp}`
        );
        window.open(`https://wa.me/?text=${m}`, '_blank');
    };

    // 6. Lógica de la Calculadora
    const cInput = document.getElementById('calc-input');
    const cType = document.getElementById('calc-type');
    const cRes = document.getElementById('calc-result');

    window.calculate = () => {
        const v = parseFloat(cInput.value) || 0;
        // Limpiamos los puntos de miles y comas decimales para operar
        const cleanNum = (el) => parseFloat(el.innerText.replace(/\./g, '').replace(',', '.'));
        
        const usd = cleanNum(USD_EL);
        const eur = cleanNum(EUR_EL);
        let r = 0;

        if(cType.value.includes('usd')) r = cType.value.startsWith('usd') ? v * usd : v / usd;
        else r = cType.value.startsWith('eur') ? v * eur : v / eur;

        cRes.innerText = r.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };

    cInput.oninput = calculate;
    cType.onchange = calculate;

    // Ejecutar consulta inicial al cargar
    fetchRates();
});