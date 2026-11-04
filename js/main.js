/* ==========================================================================
   FERNANDEZ RACING · JavaScript del hero
   1. Menú (celular y submenú de Servicios)
   2. Slider: las diapositivas vecinas asoman, se avanza con puntos, flechas del
      teclado, toque en la diapositiva vecina, deslizando el dedo o solo cada
      unos segundos (con botón de pausa y sin movimiento si la persona lo pidió).
   3. Contacto: WhatsApp (si está cargado) o el chat de Instagram, formulario y año
   ========================================================================== */

(function () {
  'use strict';

  // ---- Configuración: cambiá estos datos y se actualiza toda la web ----
  var WHATSAPP = '';                   // COMPLETAR: código de país + número, sin "+" ni espacios (ej. 5493511234567)
  var INSTAGRAM = 'fernandezracing1';  // usuario de Instagram, sin "@"
  // ----------------------------------------------------------------------

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

  /* ------------------------------------------------------------------------
     3. CONTACTO
     Con WHATSAPP cargado: aparecen los botones de WhatsApp y el formulario abre el chat.
     Sin WHATSAPP: el formulario copia el mensaje y abre el chat de Instagram.
     ------------------------------------------------------------------------ */
  var enlaceWhatsApp = function (texto) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto); };

  if (WHATSAPP) {
    $$('[data-wa]').forEach(function (a) { a.href = enlaceWhatsApp(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-wa-dato], #wa').forEach(function (el) { el.hidden = false; });
    var nota = $('#form-nota');
    if (nota) nota.textContent = 'Se abre WhatsApp con tu mensaje listo. No guardamos tus datos.';
  }

  // Los botones "Consultar disponibilidad" llegan al formulario con la opción ya elegida
  $$('[data-interes]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = $('#f-interes');
      if (sel) sel.value = a.dataset.interes;
    });
  });

  var form = $('#form');
  if (form) {
    var error = $('#form-error');
    var aviso = $('#form-aviso');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      aviso.textContent = '';
      var nombre = form.nombre.value.trim();
      var telefono = form.telefono.value.trim();
      var faltan = [];
      if (!nombre) faltan.push('tu nombre');
      if (telefono.replace(/\D/g, '').length < 7 || !/^[0-9+()\-\s]+$/.test(telefono)) faltan.push('tu teléfono (solo números)');
      if (faltan.length) { error.textContent = 'Antes de enviar, completá ' + faltan.join(' y ') + '.'; return; }
      error.textContent = '';

      var lineas = ['Hola Fernandez Racing, quiero hacer una consulta.', ''];
      lineas.push('Nombre: ' + nombre);
      lineas.push('Teléfono: ' + telefono);
      if (form.interes.value) lineas.push('Me interesa: ' + form.interes.value);
      if (form.mensaje.value.trim()) lineas.push('Mensaje: ' + form.mensaje.value.trim());
      var texto = lineas.join('\n');

      if (WHATSAPP) {
        var url = enlaceWhatsApp(texto);
        if (url.length > 2000) { error.textContent = 'El mensaje es muy largo para WhatsApp. Acortalo.'; return; }
        var v = window.open(url, '_blank');
        if (v) v.opener = null; else window.location.href = url;
        return;
      }

      // Sin WhatsApp: se copia el mensaje y se abre el chat de Instagram
      var abrirIG = function (copiado) {
        aviso.textContent = copiado
          ? 'Copiamos tu mensaje. Pegalo en el chat de Instagram y enviálo.'
          : 'Escribinos por Instagram y contanos qué necesitás.';
        var v = window.open('https://ig.me/m/' + INSTAGRAM, '_blank');
        if (v) v.opener = null;
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { abrirIG(true); }, function () { abrirIG(false); });
      } else {
        abrirIG(false);
      }
    });

    form.addEventListener('input', function () { error.textContent = ''; });
    form.telefono.addEventListener('input', function () {
      form.telefono.value = form.telefono.value.replace(/[^0-9+()\-\s]/g, '');
    });
  }

  // El botón flotante de WhatsApp se esconde cuando ya se ve el formulario o el footer
  var wa = $('#wa');
  if (wa && 'IntersectionObserver' in window) {
    var visibles = new Set();
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) visibles.add(en.target); else visibles.delete(en.target); });
      wa.classList.toggle('is-hidden', visibles.size > 0);
    });
    [$('#contacto'), $('.site-footer')].forEach(function (el) { if (el) io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     4. GALERÍA: visor ampliado (flechas del teclado, Esc, clic fuera, deslizar)
     ------------------------------------------------------------------------ */
  var visor = $('#visor');
  var fotos = $$('.galeria__btn img');
  if (visor && fotos.length && typeof visor.showModal === 'function') {
    var visorImg = $('#visor-img');
    var visorCuenta = $('#visor-cuenta');
    var actual = 0;
    var origen = null;

    var mostrar = function (i) {
      actual = (i + fotos.length) % fotos.length;
      visorImg.src = fotos[actual].currentSrc || fotos[actual].src;
      visorImg.alt = fotos[actual].alt;
      visorCuenta.textContent = (actual + 1) + ' / ' + fotos.length;
    };
    var abrirVisor = function (i) {
      origen = document.activeElement;
      mostrar(i);
      visor.showModal();
      document.body.classList.add('visor-abierto');
    };
    var cerrarVisor = function () { visor.close(); };

    fotos.forEach(function (img, i) {
      img.closest('button').addEventListener('click', function () { abrirVisor(i); });
    });
    $('#visor-cerrar').addEventListener('click', cerrarVisor);
    $('#visor-ant').addEventListener('click', function () { mostrar(actual - 1); });
    $('#visor-sig').addEventListener('click', function () { mostrar(actual + 1); });

    visor.addEventListener('click', function (e) { if (e.target === visor) cerrarVisor(); });
    visor.addEventListener('close', function () {
      document.body.classList.remove('visor-abierto');
      if (origen) origen.focus();
    });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1); }
    });

    var vx0 = null;
    visor.addEventListener('pointerdown', function (e) { vx0 = e.clientX; });
    visor.addEventListener('pointerup', function (e) {
      if (vx0 === null) return;
      var dx = e.clientX - vx0;
      vx0 = null;
      if (Math.abs(dx) > 60) mostrar(dx < 0 ? actual + 1 : actual - 1);
    });
  }

  var anio = $('#year');
  if (anio) anio.textContent = new Date().getFullYear();
})();
