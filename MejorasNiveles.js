(function () {
    "use strict";

    const niveles = [
        {
            id: 1,
            seccion: "NIVEL_01",
            tablero: "NIVEL_01 .Contenedor",
            cabecera: "NIVEL_01 .Cabezera",
            inicio: "Start",
            pausa: "Pause",
            pantallaPausa: "Pausa_Pantalla",
            puntaje: "Puntaje",
            tiempo: "Tiempo",
            meta: 15,
            meteoro: ["Meteiorito", "Meteiorito2"],
            fin: ["GANASTE_PANTALLA", "PERDISTE_PANTALLA"]
        },
        {
            id: 2,
            seccion: "NIVEL_02",
            tablero: "NIVEL_02 .Contenedorlvl2",
            cabecera: "NIVEL_02 .Cabezeralvl2",
            inicio: "Startlvl2",
            pausa: "Pauselvl2",
            pantallaPausa: "Pausa_Pantallalvl2",
            puntaje: "Puntajelvl2",
            tiempo: "Tiempolvl2",
            meta: 34,
            meteoro: ["Meteioritolvl2", "Meteiorito2lvl2", "Meteiorito3lvl2"],
            recordExistente: true,
            fin: ["GanastePantallaLvL2", "Perdistelvl2Pantalla"]
        },
        {
            id: 3,
            seccion: "NIVEL3",
            tablero: "NIVEL3 .Contenedorlvl3",
            cabecera: "NIVEL3 .Cabezeralvl3",
            inicio: "Startlvl3",
            pausa: "Pauselvl3",
            pantallaPausa: "Pausa_Pantallalvl3",
            puntaje: "Puntajelvl3",
            tiempo: "Tiempolvl3",
            meta: 40,
            meteoro: ["Meteoritolvl3", "Meteorito2lvl3", "Meteorito3lvl3", "Meteorito4lvl3"],
            fin: []
        }
    ];

    const porId = id => document.getElementById(id);
    const numero = el => parseInt((el && el.textContent.match(/\d+/) || [0])[0], 10) || 0;
    const visible = el => !!el && getComputedStyle(el).display !== "none";

    function leerRecord(id) {
        try { return parseInt(localStorage.getItem(`ironfist_nivel${id}_record`), 10) || 0; }
        catch (_) { return 0; }
    }

    function guardarRecord(id, puntos) {
        const valor = Math.max(leerRecord(id), puntos);
        try { localStorage.setItem(`ironfist_nivel${id}_record`, String(valor)); }
        catch (_) { /* El juego sigue funcionando si el navegador bloquea el almacenamiento. */ }
        const marcador = porId(`RecordCompartido${id}`);
        if (marcador) marcador.textContent = valor;
        return valor;
    }

    // La puntuación del nivel 1 se reinicia inmediatamente al ganar; se guarda
    // desde el propio manejador del punto para conservar también el último.
    window.registrarPuntajeNivel = guardarRecord;
    window.duracionMeteoritoNivel1 = () => {
        const progreso = Math.min(numero(porId("Puntaje")) / 15, 1);
        return `${Math.max(1.3, 2.4 - progreso * 1.1).toFixed(2)}s`;
    };

    function agregarRecord(nivel) {
        if (nivel.recordExistente) return;
        const cabecera = document.querySelector(`.${nivel.cabecera.split(".").pop()}`);
        if (!cabecera || porId(`RecordCompartido${nivel.id}`)) return;
        const caja = document.createElement("div");
        caja.className = `RecordCompartido RecordCompartidoNivel${nivel.id}`;
        caja.innerHTML = `<h3>RÉCORD</h3><span id="RecordCompartido${nivel.id}">0</span>`;
        const boton = porId(nivel.pausa);
        cabecera.insertBefore(caja, boton || null);
        guardarRecord(nivel.id, 0);
    }

    function agregarInstrucciones(nivel) {
        const start = porId(nivel.inicio);
        if (!start || start.querySelector(".AyudaNivelCompartida")) return;
        const ayuda = document.createElement("div");
        ayuda.className = "AyudaNivelCompartida";
        ayuda.innerHTML = "Pasa el cursor sobre los meteoritos para desviarlos.<br>" +
            `Meta: ${nivel.meta} puntos. Pulsa <b>P</b> o el botón para pausar y reanudar.`;
        start.appendChild(ayuda);
    }

    function sinFinal(nivel) {
        return nivel.fin.every(id => !visible(porId(id)));
    }

    function jugando(nivel) {
        const seccion = porId(nivel.seccion);
        if (!visible(seccion) || !sinFinal(nivel) || visible(porId(nivel.pantallaPausa))) return false;
        if (nivel.id === 3 && window.nivel3Instance) return window.nivel3Instance.activo;
        return !visible(porId(nivel.inicio));
    }

    function sincronizarBoton(nivel) {
        const boton = porId(nivel.pausa);
        if (!boton) return;
        const enPausa = visible(porId(nivel.pantallaPausa));
        const texto = boton.querySelector("h3") || boton;
        texto.textContent = enPausa ? "▶ REANUDAR" : "⏸ PAUSA";
        boton.classList.toggle("ControlEnPausaCompartido", enPausa);
    }

    function efectoPuntaje(nivel, marcador) {
        marcador.classList.remove("PuntajeUnificadoPop");
        void marcador.offsetWidth;
        marcador.classList.add("PuntajeUnificadoPop");
        const contenedor = marcador.closest(".Puntaje, .Puntajelvl2, .Puntajelvl3");
        if (contenedor) {
            contenedor.classList.remove("PuntajeUnificadoBrillo");
            void contenedor.offsetWidth;
            contenedor.classList.add("PuntajeUnificadoBrillo");
        }
    }

    function ajustarDificultad(nivel) {
        if (nivel.id === 2) return; // El nivel 2 ya ajusta la velocidad en su bucle.
        const progreso = Math.min(numero(porId(nivel.puntaje)) / nivel.meta, 1);
        const base = nivel.id === 1 ? 2.4 : 1.9;
        const duracion = `${Math.max(0.8, base * (1 - progreso * 0.45)).toFixed(2)}s`;
        nivel.meteoro.forEach(id => {
            const meteorito = porId(id);
            if (meteorito && meteorito.style.transitionDuration !== duracion) {
                meteorito.style.transitionDuration = duracion;
            }
        });
    }

    function prepararNivel(nivel) {
        agregarRecord(nivel);
        agregarInstrucciones(nivel);

        const recordInicial = leerRecord(nivel.id);
        guardarRecord(nivel.id, recordInicial);

        const marcador = porId(nivel.puntaje);
        const reloj = porId(nivel.tiempo);
        if (marcador) {
            let anterior = numero(marcador);
            new MutationObserver(() => {
                const actual = numero(marcador);
                if (actual > anterior) {
                    guardarRecord(nivel.id, actual);
                    efectoPuntaje(nivel, marcador);
                    ajustarDificultad(nivel);
                }
                anterior = actual;
            }).observe(marcador, { childList: true, characterData: true, subtree: true });
        }

        if (reloj) {
            const resaltarTiempo = () => reloj.classList.toggle("TiempoUrgenteCompartido", numero(reloj) <= 15);
            new MutationObserver(resaltarTiempo).observe(reloj, { childList: true, characterData: true, subtree: true });
            resaltarTiempo();
        }

        const boton = porId(nivel.pausa);
        const pantalla = porId(nivel.pantallaPausa);
        if (boton && pantalla) {
            new MutationObserver(() => sincronizarBoton(nivel)).observe(pantalla, { attributes: true, attributeFilter: ["style", "class"] });
            sincronizarBoton(nivel);
        }

    }

    function pausarNivelVisible() {
        const nivel = niveles.find(jugando);
        if (nivel) porId(nivel.pausa).click();
    }

    function iniciar() {
        niveles.forEach(prepararNivel);

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) pausarNivelVisible();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();