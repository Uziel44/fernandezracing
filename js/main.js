/* ==========================================================================
   FERNANDEZ RACING · JavaScript del hero
   1. Menú (celular y submenú de Servicios)
   2. Slider: las diapositivas vecinas asoman, se avanza con puntos, flechas del
      teclado, toque en la diapositiva vecina, deslizando el dedo o solo cada
      unos segundos (con botón de pausa y sin movimiento si la persona lo pidió).
   ========================================================================== */

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ------------------------------------------------------------------------
     1. MENÚ
     ------------------------------------------------------------------------ */
  var burger = $('#burger');
  var nav = $('#nav');
  var itemServicios = $('.nav__item--sub');
  var btnServicios = $('#btn-servicios');

  var abrirMenu = function (abierto) {
    nav.classList.toggle('is-open', abierto);
    burger.setAttribute('aria-expanded', String(abierto));
    burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  };
  var abrirSub = function (abierto) {
    itemServicios.classList.toggle('is-open', abierto);
    btnServicios.setAttribute('aria-expanded', String(abierto));
  };

  burger.addEventListener('click', function () { abrirMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  btnServicios.addEventListener('click', function () { abrirSub(!itemServicios.classList.contains('is-open')); });

  $$('a', nav).forEach(function (a) {
    a.addEventListener('click', function () { abrirSub(false); abrirMenu(false); });
  });
  document.addEventListener('click', function (e) {
    if (!itemServicios.contains(e.target)) abrirSub(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (itemServicios.classList.contains('is-open')) { abrirSub(false); btnServicios.focus(); }
    else if (nav.classList.contains('is-open')) { abrirMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) {
    if (e.matches) { abrirMenu(false); abrirSub(false); }
  });


  /* ------------------------------------------------------------------------
     2. SLIDER
     Cada diapositiva tiene una posición relativa a la activa (d = -1, 0, 1, ...)
     y CSS la mueve con --d. Es circular: la que sale por un lado entra por el otro
     sin animarse (clase "sin-transicion") para no cruzar toda la pantalla.
     ------------------------------------------------------------------------ */
  var escenario = $('#escenario');
  var slides = $$('.slide', escenario);
  var items = $$('.servicios__item');
  var puntosBox = $('#puntos');
  var btnPausa = $('#pausa');
  var n = slides.length;
  var activa = 0;
  var INTERVALO = 6500;
  var temporizador = null;
  var pausadoPorPersona = false;
  var pausadoPorFoco = false;

  // Posición relativa y circular: de -floor(n/2) a +floor(n/2)
  var posicion = function (i) {
    var d = (i - activa + n) % n;
    return d > n / 2 ? d - n : d;
  };

  var puntos = slides.map(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'punto';
    b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1) + ' de ' + n);
    b.addEventListener('click', function () { ir(i); });
    puntosBox.appendChild(b);
    return b;
  });

  var dibujar = function (primera) {
    slides.forEach(function (s, i) {
      var d = posicion(i);
      var anterior = parseInt(s.style.getPropertyValue('--d') || '0', 10);
      var salto = !primera && Math.abs(d - anterior) > 1;

      if (salto) s.classList.add('sin-transicion');
      s.style.setProperty('--d', d);
      if (salto) { void s.offsetWidth; s.classList.remove('sin-transicion'); }

      var esActiva = d === 0;
      s.classList.toggle('is-activo', esActiva);
      s.setAttribute('aria-hidden', String(!esActiva));
      $$('a, button', s).forEach(function (el) { el.tabIndex = esActiva ? 0 : -1; });
    });

    puntos.forEach(function (p, i) { p.setAttribute('aria-current', String(i === activa)); });

    var servicio = slides[activa].dataset.servicio;
    items.forEach(function (it) { it.classList.toggle('is-activo', !!servicio && it.dataset.servicio === servicio); });

    escenario.setAttribute('aria-live', temporizador ? 'off' : 'polite');
  };

  var ir = function (i, desdeAutomatico) {
    activa = (i + n) % n;
    dibujar(false);
    if (!desdeAutomatico) reiniciar();
  };

  // ---- Cambio automático (con pausa) ----
  var detener = function () { clearInterval(temporizador); temporizador = null; };
  var arrancar = function () {
    detener();
    if (sinMovimiento || pausadoPorPersona || pausadoPorFoco || document.hidden) return;
    temporizador = setInterval(function () { ir(activa + 1, true); }, INTERVALO);
  };
  var reiniciar = arrancar;

  btnPausa.addEventListener('click', function () {
    pausadoPorPersona = !pausadoPorPersona;
    btnPausa.setAttribute('aria-pressed', String(pausadoPorPersona));
    btnPausa.setAttribute('aria-label', pausadoPorPersona ? 'Reanudar el cambio automático' : 'Pausar el cambio automático');
    arrancar();
    escenario.setAttribute('aria-live', temporizador ? 'off' : 'polite');
  });
  if (sinMovimiento) btnPausa.hidden = true;

  // Pausa mientras el mouse o el foco están sobre el slider
  var pausar = function (v) { pausadoPorFoco = v; arrancar(); };
  escenario.addEventListener('mouseenter', function () { pausar(true); });
  escenario.addEventListener('mouseleave', function () { pausar(false); });
  escenario.addEventListener('focusin', function () { pausar(true); });
  escenario.addEventListener('focusout', function () { pausar(false); });
  document.addEventListener('visibilitychange', arrancar);

  // ---- Teclado, toque en la vecina y deslizar ----
  escenario.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(activa + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(activa - 1); }
  });

  slides.forEach(function (s, i) {
    s.addEventListener('click', function (e) {
      if (i === activa || movido) return;
      e.preventDefault();
      ir(i);
    });
  });

  var x0 = null;
  var movido = false;
  escenario.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    x0 = e.clientX; movido = false;
  });
  escenario.addEventListener('pointermove', function (e) {
    if (x0 !== null && Math.abs(e.clientX - x0) > 12) movido = true;
  });
  var soltar = function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) { ir(dx < 0 ? activa + 1 : activa - 1); }
    setTimeout(function () { movido = false; }, 0);
  };
  escenario.addEventListener('pointerup', soltar);
  escenario.addEventListener('pointercancel', function () { x0 = null; movido = false; });

  dibujar(true);
  arrancar();
})();
