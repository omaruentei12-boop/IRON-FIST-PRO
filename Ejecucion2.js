(function () {
    "use strict";

    // ---------- AJUSTES QUE PUEDES CAMBIAR FACILMENTE ----------
    var META_PUNTOS  = 34;   // puntos que hay que juntar para ganar
    var TIEMPO_TOTAL = 60;   // segundos que dura el nivel
        var VEL_INICIAL  = 520;  // velocidad de los meteoritos al empezar (px por segundo)
    var VEL_MAXIMA   = 800;  // velocidad maxima cuando ya vas casi ganando
        var CLAVE_RECORD = "ironfist_nivel2_record";

    function $(id) { return document.getElementById(id); }

    function limiteX() {
        return Math.max(100, tablero ? tablero.clientWidth * 0.70 : window.innerWidth * 0.70);
    }

    function altoUtil() {
        return Math.max(100, tablero ? tablero.clientHeight - 90 : window.innerHeight - 160);
    }


    // ---------- VARIABLES DEL JUEGO ----------
    var estado = "inicio";          // inicio | cuenta | jugando | pausa | fin
    var puntos = 0;
    var tiempo = TIEMPO_TOTAL;
    var record = 0;
    var ultimoFrame = 0;
    var tablero, meteoros, linea, cuentaId, siguienteAgregado = false;
    var cursor = { x: 0, y: 0, valido: false };
    var ultimoTiempoMostrado = -1;

    function crearMeteoro(id, sonido) {
        return { el: $(id), sonido: sonido, estado: "espera", x: -200, y: 0, dy: 0, espera: 0 };
    }

    // ---------- UTILIDADES ----------
    function reproducir(audio) {
        if (!audio) return;
        try {
            audio.currentTime = 0;
            var p = audio.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    }

    function musica(encendida) {
        var m = $("Fondo_Ciberpunk");
        if (!m) return;
        try {
            if (encendida) {
                var p = m.play();
                if (p && p.catch) p.catch(function () {});
            } else { m.pause(); }
        } catch (e) {}
    }

    function pintar(m) {
        m.el.style.left = m.x + "px";
        m.el.style.top = m.y + "px";
    }

    // ---------- RECORD (se guarda en el navegador) ----------
    function leerRecord() {
        try { record = parseInt(localStorage.getItem(CLAVE_RECORD), 10) || 0; } catch (e) { record = 0; }
        $("Recordlvl2").textContent = record;
    }
    function guardarRecord() {
        if (puntos > record) {
            record = puntos;
            $("Recordlvl2").textContent = record;
            try { localStorage.setItem(CLAVE_RECORD, String(record)); } catch (e) {}
        }
    }

    // ---------- MARCADORES ----------
    function mostrarPuntos() {
        $("Puntajelvl2").innerHTML = puntos + "&nbsp;/&nbsp;" + META_PUNTOS;
    }
    function mostrarTiempo() {
        var t = Math.ceil(tiempo);
        if (t === ultimoTiempoMostrado) return;
        ultimoTiempoMostrado = t;
        var span = $("Tiempolvl2");
        span.textContent = t;
        if (t <= 10) { span.classList.add("TiempoPocolvl2"); }
        else { span.classList.remove("TiempoPocolvl2"); }
    }
    function efectoPunto() {
        var s = $("Puntajelvl2");
        s.classList.add("Poplvl2");
        setTimeout(function () { s.classList.remove("Poplvl2"); }, 180);
    }
    function textoFlotante(x, y, texto) {
        var s = document.createElement("span");
        s.className = "Flotantelvl2";
        s.textContent = texto;
        s.style.left = Math.max(0, x) + "px";
        s.style.top = Math.max(0, y) + "px";
        tablero.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 800);
    }

    // ---------- DIFICULTAD PROGRESIVA ----------
    function progreso() { return Math.min(puntos / META_PUNTOS, 1); }
    function velocidadActual() { return VEL_INICIAL + (VEL_MAXIMA - VEL_INICIAL) * progreso(); }
    function retrasoNuevoMeteoro() {
        var p = progreso();
        var min = 900 - 400 * p;
        var max = 1900 - 700 * p;
        return min + Math.random() * (max - min);
    }

    // ---------- METEORITOS ----------
    function lanzar(m) {
        m.estado = "vuela";
        m.x = -80;
        m.y = Math.round(Math.random() * altoUtil());
        pintar(m);
    }
    function reponer(m, espera) {
        m.estado = "espera";
        m.x = -200;
        m.espera = (espera === undefined) ? retrasoNuevoMeteoro() : espera;
        pintar(m);
    }
    function reiniciarMeteoros() {
        var esperas = [1400, 2200, 3000];
        for (var i = 0; i < meteoros.length; i++) reponer(meteoros[i], esperas[i]);
    }
    function desviar(m) {
        if (estado !== "jugando" || m.estado !== "vuela") return; // un meteorito solo da 1 punto
        m.estado = "desviado";
        m.dy = (Math.random() * 2 - 1) * 160;
        if (window.destelloImpactoNivel2) window.destelloImpactoNivel2(m.el);
        reproducir($(m.sonido));
        puntos++;
        textoFlotante(m.x + 20, m.y, "+1");
        efectoPunto();
        mostrarPuntos();
        guardarRecord();
        if (puntos >= META_PUNTOS) ganar();
    }

    // ---------- FIN DEL JUEGO ----------
    function perder(motivo) {
        if (estado === "fin") return;
        estado = "fin";
        musica(false);
        reproducir($("Perdiste_sound"));
        guardarRecord();
        linea.classList.remove("Peligrolvl2");
        $("Tiempolvl2").classList.remove("TiempoPocolvl2");

        tablero.classList.add("Impactolvl2");
        setTimeout(function () { tablero.classList.remove("Impactolvl2"); }, 600);

        if (motivo === "tiempo") {
            $("Perdistelvl2Titulo").innerHTML = "SE ACABO<br>EL TIEMPO";
        } else {
            $("Perdistelvl2Titulo").innerHTML = "UN METEORITO<br>GOLPEO LA TIERRA";
        }
        $("Perdistelvl2Texto").innerHTML =
            "Lograste " + puntos + " de " + META_PUNTOS + " puntos.<br>" +
            "Te faltaron " + (META_PUNTOS - puntos) + " para salvar el planeta.<br>" +
            "Tu record: " + record;
        $("Perdistelvl2Pantalla").style.display = "flex";
    }

    function irANivel3() {
        $("NEXT").style.display = "none";
        $("GanastePantallaLvL2").style.display = "none";
        $("NIVEL_01").style.display = "none";
        $("NIVEL_02").style.display = "none";
        $("NIVEL3").style.display = "block";
    }

    function ganar() {
        if (estado === "fin") return;
        estado = "fin";
        musica(false);
        reproducir($("Triunfo"));
        guardarRecord();
        linea.classList.remove("Peligrolvl2");
        $("Tiempolvl2").classList.remove("TiempoPocolvl2");
        for (var i = 0; i < meteoros.length; i++) { meteoros[i].estado = "espera"; meteoros[i].x = -200; pintar(meteoros[i]); }

        $("NEXT").style.display = "flex";
        $("GanastePantallaLvL2").style.display = "flex";

        // el boton SIGUIENTE de abajo se activa (una sola vez)
        var boton = $("NEXT");
        if (boton && !siguienteAgregado) {
            siguienteAgregado = true;
            boton.addEventListener("click", irANivel3);
        }

        var sobrantes = Math.floor(tiempo);
        var estrellas = sobrantes >= 25 ? 3 : (sobrantes >= 10 ? 2 : 1);
        var textoEstrellas = "";
        for (var e = 0; e < 3; e++) textoEstrellas += (e < estrellas ? "\u2B50" : "\u2606");

        if (window.Swal) {
            window.Swal.fire({
                title: 'FELICIDADES POR SUPERAR <br> EL NIVEL <br><br> <img src="IMG/Check.png" width = "120px"><br>',
                html: '<div style="font-size:40px;margin-bottom:10px">' + textoEstrellas + '</div>' +
                      'Te sobraron <b>' + sobrantes + ' segundos</b>.<br><br>' +
                      '\u00BFVerdad que fue dif\u00EDcil? Prep\u00E1rate para el siguiente nivel que las cosas van a empeorar. ' +
                      'Esperemos que puedas seguir defendiendo la tierra de esa manera y mejores tu habilidad de reacci\u00F3n.',
                icon: 'success',
                confirmButtonText: 'QUIERO CONTINUAR',
                width: '50%',
                timer: 100000,
                timerProgressbar: true,
                allowOutsideClick: true,
                allowEscapeKey: false,
                allowEnterKey: true
            }).then(function (r) {
                // La transición al nivel 3 queda a cargo del botón visible SIGUIENTE NIVEL.
            });
        }
    }

    // ---------- PAUSA ----------
    function alternarPausa() {
        if (estado === "jugando") {
            estado = "pausa";
            $("Pausa_Pantallalvl2").style.display = "table";
            musica(false);
        } else if (estado === "pausa") {
            estado = "jugando";
            $("Pausa_Pantallalvl2").style.display = "none";
            musica(true);
        }
    }
    function nivelVisible() {
        return window.getComputedStyle($("NIVEL_02")).display !== "none";
    }

    // ---------- CUENTA REGRESIVA (3, 2, 1, YA!) ----------
    function cuentaRegresiva(alTerminar) {
        var inicio = $("Startlvl2");
        var contenedor = $("Contenedor_contadorlvl2");
        var numero = $("RGBlvl2");
        var n = 3;
        estado = "cuenta";
        $("NIVEL_02").classList.add("conteo-solo");
        inicio.style.display = "flex";
        contenedor.style.display = "table";
        numero.style.fontSize = "220px";
        numero.textContent = n;
        clearInterval(cuentaId);
        cuentaId = setInterval(function () {
            n--;
            if (n > 0) {
                numero.textContent = n;
            } else {
                clearInterval(cuentaId);
                numero.style.fontSize = "90px";
                numero.textContent = "\u00A1YA!";
                setTimeout(function () {
                    contenedor.style.display = "none";
                    inicio.style.display = "none";
                    $("NIVEL_02").classList.remove("conteo-solo");
                    alTerminar();
                }, 600);
            }
        }, 1000);
    }

    function empezarPartida() {
        puntos = 0;
        tiempo = TIEMPO_TOTAL;
        ultimoTiempoMostrado = -1;
        mostrarPuntos();
        mostrarTiempo();
        reiniciarMeteoros();
        ultimoFrame = performance.now();
        estado = "jugando";
    }

    function jugar() {
        if (estado !== "inicio") return;
        musica(true);
        // el titulo y los botones se deslizan hacia afuera (igual que antes)
        $("Texolvl2").style.left = "-900px";
        $("Playlvl2").style.left = "-900px";
        $("Dificultad").style.left = "-900px";
        $("Pistalvl2").style.left = "-900px";
        estado = "cuenta";
        setTimeout(function () { cuentaRegresiva(empezarPartida); }, 350);
    }

    function reintentar() {
        $("Perdistelvl2Pantalla").style.display = "none";
        $("Pausa_Pantallalvl2").style.display = "none";
        musica(true);
        puntos = 0;
        tiempo = TIEMPO_TOTAL;
        ultimoTiempoMostrado = -1;
        mostrarPuntos();
        mostrarTiempo();
        reiniciarMeteoros();
        cuentaRegresiva(empezarPartida);
    }

    // ---------- BUCLE PRINCIPAL (se repite ~60 veces por segundo) ----------
    function revisarCursor() {
        if (!cursor.valido) return;
        var tr = tablero.getBoundingClientRect();
        if (cursor.x < tr.left || cursor.x > tr.right || cursor.y < tr.top || cursor.y > tr.bottom) return;
        var ox = tr.left + tablero.clientLeft;
        var oy = tr.top + tablero.clientTop;
        for (var i = 0; i < meteoros.length; i++) {
            var m = meteoros[i];
            if (m.estado !== "vuela") continue;
            var w = m.el.offsetWidth || 70, h = m.el.offsetHeight || 70;
            if (cursor.x >= ox + m.x && cursor.x <= ox + m.x + w &&
                cursor.y >= oy + m.y && cursor.y <= oy + m.y + h) {
                desviar(m);
            }
        }
    }

    function bucle(t) {
        requestAnimationFrame(bucle);
        if (estado !== "jugando") { ultimoFrame = t; return; }

        var dt = Math.min((t - ultimoFrame) / 1000, 0.05);
        ultimoFrame = t;

        // reloj
        tiempo -= dt;
        if (tiempo <= 0) { tiempo = 0; mostrarTiempo(); perder("tiempo"); return; }
        mostrarTiempo();

        // meteoritos
        var vel = velocidadActual();
        var hayPeligro = false;
        for (var i = 0; i < meteoros.length; i++) {
            var m = meteoros[i];
            if (m.estado === "espera") {
                m.espera -= dt * 1000;
                if (m.espera <= 0) lanzar(m);
            } else if (m.estado === "vuela") {
                m.x += vel * dt;
                pintar(m);
                if (m.x > limiteX()) { perder("meteorito"); return; }
                if (m.x > limiteX() - 170) hayPeligro = true;
            } else if (m.estado === "desviado") {
                m.x -= 1300 * dt;
                m.y = Math.max(0, Math.min(altoUtil(), m.y + m.dy * dt));
                pintar(m);
                if (m.x < -120) reponer(m);
            }
        }

        // la linea parpadea en rojo cuando un meteorito esta cerca
        if (hayPeligro) linea.classList.add("Peligrolvl2");
        else linea.classList.remove("Peligrolvl2");

        revisarCursor();
    }

    // ---------- PREPARACION ----------
    function iniciar() {
        tablero = $("Startlvl2").parentElement;
        linea = tablero.querySelector(".Limitelvl2");
        meteoros = [
            crearMeteoro("Meteioritolvl2", "Puntos_sound"),
            crearMeteoro("Meteiorito2lvl2", "Punto2"),
            crearMeteoro("Meteiorito3lvl2", "Punto3")
        ];
        for (var i = 0; i < meteoros.length; i++) {
            (function (m) {
                m.el.style.transition = "none";
                m.el.draggable = false;
                m.el.addEventListener("mouseover", function () { desviar(m); });
                pintar(m);
            })(meteoros[i]);
        }

        $("Pistalvl2").innerHTML =
            "Pasa el cursor sobre los meteoritos para desviarlos.<br>" +
            "Meta: " + META_PUNTOS + " puntos en " + TIEMPO_TOTAL + " segundos.<br>" +
            "Botón o tecla P = pausar / reanudar";
        $("Tiempolvl2").textContent = TIEMPO_TOTAL;
        mostrarPuntos();
        leerRecord();

        document.addEventListener("pointermove", function (e) {
            cursor.x = e.clientX; cursor.y = e.clientY; cursor.valido = true;
        });
        $("Playlvl2").addEventListener("click", jugar);
        $("Pauselvl2").addEventListener("click", alternarPausa);
        $("Reintentarlvl2").addEventListener("click", reintentar);

        // La tecla P se gestiona desde el controlador global de index.html para evitar dobles activaciones.
        // si cambias de pestana, el juego se pausa solo
        document.addEventListener("visibilitychange", function () {
            if (document.hidden && estado === "jugando") alternarPausa();
        });

        requestAnimationFrame(bucle);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
