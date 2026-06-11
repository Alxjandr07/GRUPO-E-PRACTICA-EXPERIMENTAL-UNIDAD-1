/**
 * app.js – Orquestador central del sistema SGROAS
 * Sistema de Gestión de Recursos Operativos,
 * Administrativos y de Seguridad
 *
 * Punto de entrada principal de la aplicación.
 * Coordina los módulos api.js y ui.js.
 */

import { fetchCooperativas, calcularEstadisticas } from './api.js';
import {
  showLoader,
  hideLoader,
  showAlert,
  renderCooperativas,
  renderFlota,
  renderStats,
  initSearch,
  initNav,
  initRange,
  initForm,
  initModal,
  initScrollSpy,
} from './ui.js';


async function loadCooperativas() {
  showLoader();

  try {
    const cooperativas = await fetchCooperativas();
    const stats = calcularEstadisticas(cooperativas);

    hideLoader();
    renderCooperativas(cooperativas);
    renderFlota(stats);
    renderStats(stats);
    initSearch(cooperativas);

  } catch (error) {
    hideLoader();

    //Distinguir error de red vs error de servidor
    const esRed = !navigator.onLine || error.message.includes('Failed to fetch');
    const msg = esRed
      ? 'Sin conexión a internet. Verifique su red e intente nuevamente.'
      : `Error al cargar cooperativas: ${error.message}`;

    showAlert(msg, 'error');

    //Mostrar estado vacío con mensaje de error
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.querySelector('p').textContent =
        '⚠️ No se pudieron cargar los datos. ' + msg;
    }

    console.error('[SGROAS] Error en loadCooperativas:', error);
  }
}


function init() {
  //Inicializar componentes UI
  initNav();
  initRange();
  initForm();
  initModal();
  initScrollSpy();

  //Cargar datos de la API
  loadCooperativas();

  console.info('[SGROAS] Sistema iniciado correctamente.');
}

//Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
