/**
 * ui.js – Módulo de manipulación del DOM e interactividad
 * SGROAS · Sistema de Gestión de Cooperativas de Transporte
 *
 * Responsabilidades:
 *  - Renderizar cards de cooperativas
 *  - Controlar loader, estado vacío y alertas
 *  - Gestionar el modal con focus trap
 *  - Manejar el formulario de registro con validación
 *  - Persistir datos en localStorage
 */

// ── Selectores cacheados ──────────────────────────────
const coopGrid     = document.getElementById('coop-grid');
const flotaGrid    = document.getElementById('flota-grid');
const statsDash    = document.getElementById('stats-dashboard');
const loader       = document.getElementById('loader');
const emptyState   = document.getElementById('empty-state');
const alertRegion  = document.getElementById('alert-region');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const modalCloseBtn= document.getElementById('modal-close-btn');
const modalTitle   = document.getElementById('modal-title');
const modalDesc    = document.getElementById('modal-desc');
const searchInput  = document.getElementById('search-input');
const searchBtn    = document.getElementById('search-btn');
const navToggle    = document.getElementById('nav-toggle');
const mainNav      = document.getElementById('main-nav');
const cobertura    = document.getElementById('cobertura');
const coberturaVal = document.getElementById('cobertura-val');
const form         = document.getElementById('registro-form');
const formSuccess  = document.getElementById('form-success');
const statCoops    = document.getElementById('stat-coops');
const statUnits    = document.getElementById('stat-units');
const statRoutes   = document.getElementById('stat-routes');

let allCooperativas  = [];
let lastFocusedElement = null;

// ── Loader ────────────────────────────────────────────
export function showLoader() {
  loader.hidden = false;
  coopGrid.innerHTML = '';
}

export function hideLoader() {
  loader.hidden = true;
}

// ── Alerta accesible ─────────────────────────────────
export function showAlert(msg, type = 'info') {
  alertRegion.textContent = msg;
  alertRegion.className = `alert alert-${type}`;
  // Limpia tras 5s
  setTimeout(() => { alertRegion.textContent = ''; }, 5000);
}

// ── Renderizar cooperativas ───────────────────────────
export function renderCooperativas(list) {
  coopGrid.innerHTML = '';

  if (!list.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  list.forEach(coop => {
    const initials = coop.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const badgeClass = coop.tipo === 'Interprovincial' ? 'badge-blue'
                     : coop.tipo === 'Intraprovincial' ? 'badge-green' : 'badge-amber';

    const card = document.createElement('article');
    card.className = 'coop-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Cooperativa ${coop.nombre}, ${coop.ciudad}`);

    card.innerHTML = `
      <div class="coop-card-header">
        <div class="coop-avatar" aria-hidden="true">${initials}</div>
        <div>
          <p class="coop-name">${coop.nombre}</p>
          <p class="coop-location">📍 ${coop.ciudad}</p>
        </div>
      </div>
      <div class="coop-meta">
        <span class="badge ${badgeClass}">${coop.tipo}</span>
        <span class="badge badge-${coop.estado === 'Activa' ? 'green' : 'amber'}">${coop.estado}</span>
      </div>
      <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: 0.75rem;">
        🚌 ${coop.unidades} unidades &nbsp;·&nbsp; 🛣️ ${coop.rutas} rutas
      </p>
      <button
        class="btn btn-outline"
        style="margin-top: 1rem; width: 100%; color: var(--color-brand-primary); border-color: var(--color-brand-primary);"
        data-id="${coop.id}"
        aria-label="Ver detalle de ${coop.nombre}"
      >Ver detalle</button>
    `;

    // Abrir modal al hacer clic en la card o en el botón
    card.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      openModal(coop);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openModal(coop);
    });

    coopGrid.appendChild(card);
  });
}

// ── Renderizar flota ──────────────────────────────────
export function renderFlota(stats) {
  const items = [
    { icon: '🚌', num: stats.totalUnidades, label: 'Unidades en flota' },
    { icon: '🛣️', num: stats.totalRutas,    label: 'Rutas activas' },
    { icon: '👥', num: stats.totalSocios,   label: 'Socios registrados' },
    { icon: '✅', num: stats.activas,        label: 'Cooperativas activas' },
  ];

  flotaGrid.innerHTML = items.map(i => `
    <div class="flota-card" role="listitem">
      <div class="flota-icon" aria-hidden="true">${i.icon}</div>
      <span class="flota-num">${i.num.toLocaleString('es-EC')}</span>
      <span class="flota-label">${i.label}</span>
    </div>
  `).join('');
}

// ── Renderizar estadísticas ───────────────────────────
export function renderStats(stats) {
  const items = [
    { icon: '🏢', num: stats.totalCoops,       label: 'Total cooperativas' },
    { icon: '🚌', num: stats.totalUnidades,     label: 'Unidades registradas' },
    { icon: '🛣️', num: stats.totalRutas,        label: 'Rutas en operación' },
    { icon: '👥', num: stats.totalSocios,       label: 'Socios activos' },
    { icon: '🌐', num: stats.interprovincial,   label: 'Interprovinciales' },
    { icon: '🏙️', num: stats.intraprovincial,   label: 'Intraprovinciales' },
  ];

  statsDash.innerHTML = items.map(i => `
    <div class="stat-card" role="listitem">
      <div class="stat-card-icon" aria-hidden="true">${i.icon}</div>
      <span class="stat-card-num">${i.num.toLocaleString('es-EC')}</span>
      <p class="stat-card-label">${i.label}</p>
    </div>
  `).join('');

  // Hero stats
  if (statCoops)  statCoops.textContent  = stats.totalCoops;
  if (statUnits)  statUnits.textContent  = stats.totalUnidades.toLocaleString('es-EC');
  if (statRoutes) statRoutes.textContent = stats.totalRutas;
}

// ── Modal + Focus Trap ────────────────────────────────
export function openModal(coop) {
  lastFocusedElement = document.activeElement;

  modalTitle.textContent = coop.nombre;
  modalDesc.innerHTML = `
    <p><strong>Ciudad:</strong> ${coop.ciudad}</p>
    <p><strong>Tipo de servicio:</strong> ${coop.tipo}</p>
    <p><strong>Estado:</strong> ${coop.estado}</p>
    <p><strong>Unidades:</strong> ${coop.unidades}</p>
    <p><strong>Rutas activas:</strong> ${coop.rutas}</p>
    <p><strong>Socios:</strong> ${coop.socios}</p>
    <p><strong>Email:</strong> <a href="mailto:${coop.email}">${coop.email}</a></p>
    <p><strong>Teléfono:</strong> ${coop.telefono}</p>
  `;

  modalOverlay.hidden = false;
  modalClose.focus();
  document.body.style.overflow = 'hidden';
  trapFocus(modalOverlay);
}

export function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  container.addEventListener('keydown', function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }

    if (modalOverlay.hidden) container.removeEventListener('keydown', handler);
  });

  //Cerrar con Escape
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape' && !modalOverlay.hidden) {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

//Búsqueda
export function initSearch(cooperativas) {
  allCooperativas = cooperativas;

  const doSearch = () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q
      ? allCooperativas.filter(c =>
          c.nombre.toLowerCase().includes(q) ||
          c.ciudad.toLowerCase().includes(q) ||
          c.tipo.toLowerCase().includes(q)
        )
      : allCooperativas;

    renderCooperativas(filtered);

    const msg = filtered.length
      ? `${filtered.length} cooperativa(s) encontrada(s).`
      : 'No se encontraron cooperativas.';
    showAlert(msg, 'info');
  };

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

//Hamburger nav 
export function initNav() {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    mainNav.classList.toggle('open', !open);
  });

  // Cerrar nav al hacer clic en un link
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('open');
    });
  });
}

//Range cobertura 
export function initRange() {
  if (!cobertura) return;
  cobertura.addEventListener('input', () => {
    coberturaVal.textContent = `${cobertura.value}%`;
  });
}

//Formulario con validación y localStorage
export function initForm() {
  if (!form) return;

  //Validación en tiempo real
  const campos = {
    nombre:  { el: document.getElementById('nombre'),  err: document.getElementById('nombre-error'),  msg: 'El nombre debe tener al menos 3 caracteres.' },
    ruc:     { el: document.getElementById('ruc'),     err: document.getElementById('ruc-error'),     msg: 'El RUC debe tener exactamente 13 dígitos.' },
    email:   { el: document.getElementById('email'),   err: document.getElementById('email-error'),   msg: 'Ingrese un correo electrónico válido.' },
    telefono:{ el: document.getElementById('telefono'),err: document.getElementById('telefono-error'),msg: 'Ingrese un número de teléfono válido.' },
    unidades:{ el: document.getElementById('num-unidades'), err: document.getElementById('unidades-error'), msg: 'Ingrese un número entre 1 y 500.' },
    repNombre:{ el: document.getElementById('rep-nombre'), err: document.getElementById('rep-error'), msg: 'Ingrese el nombre del representante.' },
    password:{ el: document.getElementById('password'), err: document.getElementById('password-error'), msg: 'Mínimo 8 caracteres, una mayúscula y un número.' },
    terminos:{ el: document.getElementById('acepta-terminos'), err: document.getElementById('terms-error'), msg: 'Debe aceptar los términos y condiciones.' },
  };

  Object.values(campos).forEach(({ el, err, msg }) => {
    if (!el) return;
    el.addEventListener('blur', () => {
      if (!el.validity.valid) {
        err.textContent = msg;
        el.classList.add('error');
      } else {
        err.textContent = '';
        el.classList.remove('error');
      }
    });
  });

  //Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    Object.values(campos).forEach(({ el, err, msg }) => {
      if (!el) return;
      if (!el.validity.valid) {
        err.textContent = msg;
        el.classList.add('error');
        if (valid) { el.focus(); valid = false; }
      }
    });

    if (!valid) {
      showAlert('Por favor corrija los errores del formulario.', 'error');
      return;
    }

    //Guardar en localStorage
    const data = {
      nombre:   document.getElementById('nombre').value,
      ruc:      document.getElementById('ruc').value,
      email:    document.getElementById('email').value,
      tipo:     document.getElementById('tipo-servicio').value,
      unidades: document.getElementById('num-unidades').value,
      cobertura:cobertura.value,
      fecha:    new Date().toISOString(),
    };

    const registros = JSON.parse(localStorage.getItem('sgroas_registros') || '[]');
    registros.push(data);
    localStorage.setItem('sgroas_registros', JSON.stringify(registros));

    form.reset();
    formSuccess.hidden = false;
    formSuccess.focus();
    showAlert('Cooperativa registrada exitosamente.', 'success');

    setTimeout(() => { formSuccess.hidden = true; }, 6000);
  });

  //Fecha máxima = hoy
  const fechaInput = document.getElementById('fecha-constitucion');
  if (fechaInput) {
    fechaInput.max = new Date().toISOString().split('T')[0];
  }
}

//Modal events
export function initModal() {
  modalClose.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
}

//Active nav on scroll
export function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`);
          l.removeAttribute('aria-current');
          if (l.getAttribute('href') === `#${entry.target.id}`) {
            l.setAttribute('aria-current', 'page');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}
