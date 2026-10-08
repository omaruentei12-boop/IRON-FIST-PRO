/**
 * Control del Nivel 3 - Iron Fist
 * Incluye lógica de reinicio directo del Nivel 3 al perder sin recargar la página.
 */

class JuegoNivel3 {
    constructor() {
        // Constantes del Nivel
        this.TIEMPO_INICIAL = 50;
        this.PUNTAJE_OBJETIVO = 40;
        this.VOLUME_GENERAL = 0.4;

        // Estado del Juego
        this.tiempo = this.TIEMPO_INICIAL;
        this.puntaje = 0;
        this.activo = false;
        this.pausado = false;
        this.conteoInicio = 3;

        // Referencias del DOM
        this.dom = {
            tiempo: document.getElementById("Tiempolvl3"),
            puntaje: document.getElementById("Puntajelvl3"),
            btnPausa: document.getElementById("Pauselvl3"),
            textoPausa: document.getElementById("TextoPausalvl3"),
            btnPlay: document.getElementById("Playlvl3"),
            pantallaStart: document.getElementById("Startlvl3"),
            pantallaPausa: document.getElementById("Pausa_Pantallalvl3"),
            textoTitulo: document.getElementById("Textolvl3"),
            textoDificultad: document.getElementById("Dificultadlvl3"),
            contadorText: document.getElementById("RGBlvl3"),
            contenedorContador: document.getElementById("Contenedor_contadorlvl3"),
            meteoritos: [
                document.getElementById("Meteoritolvl3"),
                document.getElementById("Meteorito2lvl3"),
                document.getElementById("Meteorito3lvl3"),
                document.getElementById("Meteorito4lvl3")
            ],
            audios: {
                fondo: document.getElementById("Fondo_Ciberpunk"),
                perdiste: document.getElementById("Perdiste_sound"),
                puntos: [
                    document.getElementById("Puntos_sound"),
                    document.getElementById("Punto2"),
                    document.getElementById("Punto3"),
                    document.getElementById("Punto4")
                ],
                triunfo: document.getElementById("Triunfo"),
                musicaFinal: document.getElementById("Musica_Final")
            }
        };

        // Identificadores de Intervalos y Temporizadores
        this.timers = {
            restarTiempo: null,
            verificarPerder: null,
            movimientos: [],
            conteo: null
        };

        this.initEvents();
    }

    // Inicialización de Listeners Únicos
    initEvents() {
        if (this.dom.btnPlay) {
            this.dom.btnPlay.addEventListener('click', () => this.iniciarConteo());
        }

        if (this.dom.btnPausa) {
            this.dom.btnPausa.addEventListener('click', () => this.togglePausa());
        }

        // Eventos de interacción con meteoritos (Mouse y Touch)
        this.dom.meteoritos.forEach((meteorito, index) => {
            if (meteorito) {
                const expulsarHandler = () => this.expulsarMeteorito(index);
                meteorito.addEventListener('mouseover', expulsarHandler);
                meteorito.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    expulsarHandler();
                });
            }
        });

        // Configuración de volumen predeterminado
        Object.values(this.dom.audios).forEach(audio => {
            if (Array.isArray(audio)) {
                audio.forEach(a => { if (a) a.volume = this.VOLUME_GENERAL; });
            } else if (audio) {
                audio.volume = this.VOLUME_GENERAL;
            }
        });
    }

    reproducirAudio(audio) {
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
        }
    }

    iniciarConteo() {
        this.reproducirAudio(this.dom.audios.fondo);
        if (this.dom.textoTitulo) this.dom.textoTitulo.style.display = "none";
        if (this.dom.btnPlay) this.dom.btnPlay.style.display = "none";
        if (this.dom.textoDificultad) this.dom.textoDificultad.style.display = "none";

        this.conteoInicio = 3;
        this.dom.contadorText.innerHTML = this.conteoInicio;

        this.timers.conteo = setInterval(() => {
            this.conteoInicio--;
            if (this.conteoInicio > 0) {
                this.dom.contadorText.innerHTML = this.conteoInicio;
            } else if (this.conteoInicio === 0) {
                this.dom.contadorText.innerHTML = "¡YA!";
            } else {
                clearInterval(this.timers.conteo);
                this.dom.pantallaStart.style.display = "none";
                this.iniciarJuego();
            }
        }, 1000);
    }

    iniciarJuego() {
        this.activo = true;
        this.pausado = false;
        this.tiempo = this.TIEMPO_INICIAL;
        this.puntaje = 0;
        this.actualizarHUD();
        if (this.dom.btnPausa) this.dom.btnPausa.classList.remove("PausadoLvl3");
        if (this.dom.textoPausa) this.dom.textoPausa.textContent = "⏸ PAUSA";

        // Restablecer posición de meteoritos
        this.dom.meteoritos.forEach(m => {
            if (m) {
                m.style.display = "block";
                m.style.left = "-200px";
                m.style.top = "-100px";
                m.style.transition = "none";
            }
        });

        // Intervalo de decremento de tiempo
        this.timers.restarTiempo = setInterval(() => {
            if (!this.pausado) {
                this.tiempo--;
                this.actualizarHUD();
                if (this.tiempo <= 0) {
                    this.procesarDerrota("¡Tiempo agotado! Los meteoritos destruyeron la defensa.");
                }
            }
        }, 1000);

        // Bucle optimizado de detección de límites
        this.timers.verificarPerder = setInterval(() => {
            if (!this.pausado && this.activo) {
                this.verificarLimite();
            }
        }, 100);

        // Lanzar movimiento de meteoritos
        this.iniciarMovimientoMeteoritos();
    }

    iniciarMovimientoMeteoritos() {
        const velocidades = [2950, 2750, 2550, 2150];
        this.dom.meteoritos.forEach((meteorito, i) => {
            const mover = () => {
                if (this.activo && !this.pausado) {
                    const altura = Math.round(Math.random() * Math.max(100, document.querySelector("#NIVEL3 .Contenedorlvl3").clientHeight - 90));
                    meteorito.style.left = "80%";
                    meteorito.style.top = `${altura}px`;
                    const progreso = Math.min(this.puntaje / this.PUNTAJE_OBJETIVO, 1);
                    const duracion = Math.max(1, 1.9 - progreso * 0.75);
                    meteorito.style.transition = `${duracion.toFixed(2)}s linear`;
                }
            };
            setTimeout(mover, 500 * (i + 1));
            this.timers.movimientos[i] = setInterval(mover, velocidades[i]);
        });
    }

    expulsarMeteorito(index) {
        if (!this.activo || this.pausado) return;

        this.reproducirAudio(this.dom.audios.puntos[index]);
        const meteorito = this.dom.meteoritos[index];
        const alturaAleatoria = Math.round(Math.random() * Math.max(100, document.querySelector("#NIVEL3 .Contenedorlvl3").clientHeight - 90));

        meteorito.style.transition = "0.5s ease-out";
        meteorito.style.left = "-200px";
        meteorito.style.top = `${alturaAleatoria}px`;

        this.puntaje++;
        if (window.registrarPuntajeNivel) window.registrarPuntajeNivel(3, this.puntaje);
        this.actualizarHUD();
        this.animarPuntaje(meteorito);

        if (this.puntaje >= this.PUNTAJE_OBJETIVO) {
            this.procesarVictoria();
        }
    }

    verificarLimite() {
        const limitePx = this.dom.meteoritos[0]?.closest(".Contenedorlvl3")?.querySelector(".Limitelvl3")?.offsetLeft || window.innerWidth * 0.70;
        const perdi = this.dom.meteoritos.some(m => m && m.offsetLeft > limitePx);

        if (perdi) {
            this.procesarDerrota("¡DEMASIADO TARDE! Un meteorito cruzó el límite de seguridad.");
        }
    }

    actualizarHUD() {
        if (this.dom.tiempo) this.dom.tiempo.innerHTML = this.tiempo;
        if (this.dom.puntaje) this.dom.puntaje.innerHTML = `${this.puntaje} / ${this.PUNTAJE_OBJETIVO}`;
        if (this.dom.tiempo) this.dom.tiempo.classList.toggle("TiempoUrgentelvl3", this.tiempo <= 15);
    }

    animarPuntaje(meteorito) {
        const puntaje = this.dom.puntaje;
        if (!puntaje) return;
        puntaje.classList.remove("PuntajePoplvl3");
        void puntaje.offsetWidth;
        puntaje.classList.add("PuntajePoplvl3");
        const contenedor = puntaje.closest(".Puntajelvl3");
        if (contenedor) {
            contenedor.classList.remove("DestelloPuntajelvl3");
            void contenedor.offsetWidth;
            contenedor.classList.add("DestelloPuntajelvl3");
        }

        const destello = meteorito && document.getElementById(`Destellolvl3_${meteorito.id}`);
        if (destello) {
            const juego = meteorito.closest(".Contenedorlvl3");
            const cajaJuego = juego.getBoundingClientRect();
            const cajaMeteorito = meteorito.getBoundingClientRect();
            destello.style.left = `${cajaMeteorito.left - cajaJuego.left + cajaMeteorito.width / 2}px`;
            destello.style.top = `${cajaMeteorito.top - cajaJuego.top + cajaMeteorito.height / 2}px`;
            destello.classList.remove("DestelloActivolvl3");
            void destello.offsetWidth;
            destello.classList.add("DestelloActivolvl3");
        }
    }

    togglePausa() {
        if (!this.activo) return;

        this.pausado = !this.pausado;

        if (this.pausado) {
            this.dom.pantallaPausa.style.display = "flex";
            if (this.dom.textoPausa) this.dom.textoPausa.textContent = "▶ REANUDAR";
            if (this.dom.btnPausa) this.dom.btnPausa.classList.add("PausadoLvl3");
            if (this.dom.audios.fondo) this.dom.audios.fondo.pause();
            if (this.dom.planeta) this.dom.planeta.classList.add("pausado");

            // Congelar meteoritos
            this.dom.meteoritos.forEach(m => {
                m.classList.add("animacionPausadalvl3");
                const currentLeft = window.getComputedStyle(m).left;
                const currentTop = window.getComputedStyle(m).top;
                m.style.left = currentLeft;
                m.style.top = currentTop;
                m.style.transition = "none";
            });
        } else {
            this.dom.pantallaPausa.style.display = "none";
            if (this.dom.textoPausa) this.dom.textoPausa.textContent = "⏸ PAUSA";
            if (this.dom.btnPausa) this.dom.btnPausa.classList.remove("PausadoLvl3");
            this.dom.meteoritos.forEach(m => m.classList.remove("animacionPausadalvl3"));
            this.reproducirAudio(this.dom.audios.fondo);
            if (this.dom.planeta) this.dom.planeta.classList.remove("pausado");
        }
    }

    limpiarIntervalos() {
        clearInterval(this.timers.restarTiempo);
        clearInterval(this.timers.verificarPerder);
        clearInterval(this.timers.conteo);
        this.timers.movimientos.forEach(t => clearInterval(t));
        this.timers.movimientos = [];
    }

    // MÉTODO DE REINICIO INTERNO DEL NIVEL 3
    reiniciarNivel() {
        this.limpiarIntervalos();

        // Resetear variables de estado
        this.tiempo = this.TIEMPO_INICIAL;
        this.puntaje = 0;
        this.activo = false;
        this.pausado = false;
        this.actualizarHUD();
        if (this.dom.btnPausa) this.dom.btnPausa.classList.remove("PausadoLvl3");
        if (this.dom.textoPausa) this.dom.textoPausa.textContent = "⏸ PAUSA";

        // Ocultar pantalla de pausa si quedó abierta
        if (this.dom.pantallaPausa) this.dom.pantallaPausa.style.display = "none";

        // Resetear meteoritos fuera de pantalla
        this.dom.meteoritos.forEach(m => {
            if (m) {
                m.classList.remove("animacionPausadalvl3");
                m.style.display = "block";
                m.style.left = "-200px";
                m.style.top = "-100px";
                m.style.transition = "none";
            }
        });

        // Mostrar de nuevo la pantalla de Start del Nivel 3
        if (this.dom.pantallaStart) this.dom.pantallaStart.style.display = "flex";
        if (this.dom.textoTitulo) this.dom.textoTitulo.style.display = "block";
        if (this.dom.btnPlay) this.dom.btnPlay.style.display = "flex";
        if (this.dom.textoDificultad) this.dom.textoDificultad.style.display = "flex";
        if (this.dom.contadorText) this.dom.contadorText.innerHTML = "";
    }

    procesarDerrota(mensaje) {
        this.activo = false;
        this.limpiarIntervalos();
        if (window.efectoDerrotaNivel) window.efectoDerrotaNivel(3);

        if (this.dom.audios.fondo) this.dom.audios.fondo.pause();
        this.reproducirAudio(this.dom.audios.perdiste);

        Swal.fire({
            title: '¡Misión Fallida!',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Reintentar Nivel 3',
            confirmButtonColor: '#d33',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Reinicia el Nivel 3 directamente
                this.reiniciarNivel();
            }
        });
    }

    procesarVictoria() {
        this.activo = false;
        this.limpiarIntervalos();

        if (this.dom.audios.fondo) this.dom.audios.fondo.pause();
        this.reproducirAudio(this.dom.audios.triunfo);

        this.dom.meteoritos.forEach(m => { if (m) m.style.display = "none"; });

        this.mostrarSecuenciaFinal();
    }

    mostrarSecuenciaFinal() {
        this.reproducirAudio(this.dom.audios.musicaFinal);

        document.getElementById("Pantalla_Ovnislvl3").style.left = "7%";
        document.getElementById("Pantalla_Ovnislvl3").style.transition = "6s";
        document.getElementById("Pantalla_Nodrizalvl3").style.left = "10%";
        document.getElementById("Pantalla_Nodrizalvl3").style.transition = "5s";
        document.getElementById("Pantalla_Ovnis2lvl3").style.left = "7%";
        document.getElementById("Pantalla_Ovnis2lvl3").style.transition = "6s";

        setTimeout(() => {
            document.getElementById("Pantalla_creditoslvl3").style.background = "rgba(0,0,0,0.9)";
            document.getElementById("Creditoslvl3").style.top = "10%";
            document.getElementById("Creditoslvl3").style.transition = "8s";
            document.getElementById("Proximolvl3").style.bottom = "10%";
            document.getElementById("Proximolvl3").style.transition = "10s";

            setTimeout(() => this.mostrarModalContactos(), 8000);
        }, 3000);
    }

    mostrarModalContactos() {
        Swal.fire({
            title: '¡Felicitaciones por parte del Grupo Omega!',
            html: `
                <div style="text-align: center;">
                    <img src="IMG/Logo_Omega.png" alt="Logo Grupo Omega" width="100px" style="margin-bottom:15px;"><br>
                    <b>Sabíamos que lo lograrías. Nos salvaste de la destrucción, pero ahora nos espera otra lucha. Esperamos verte jugando IRON FIST 2 en el futuro.</b><br><br>
                    <hr>
                    <b>CONTACTOS DE DESARROLLO:</b><br>
                    73660489@certus.edu.pe<br>
                    78321864@certus.edu.pe<br>
                    70851660@certus.edu.pe<br>
                    61235647@certus.edu.pe<br>
                    70515673@Certus.edu.pe<br>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'De acuerdo',
            confirmButtonColor: '#3085d6',
            allowOutsideClick: false
        });
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    window.nivel3Instance = new JuegoNivel3();
});
