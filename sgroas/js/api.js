/**
 * api.js – Módulo de comunicación con APIs externas
 * SGROAS · Sistema de Gestión de Cooperativas de Transporte
 *
 * Usa JSONPlaceholder como API pública de demostración.
 * En producción se reemplazaría por datos.gob.ec o la API real.
 */

const API_BASE = 'https://jsonplaceholder.typicode.com';

/**
 *Obtiene una lista de "cooperativas" simuladas a partir
 *de los usuarios de JSONPlaceholder.
 *@returns {Promise<Array>} Lista de cooperativas procesadas
 */
export async function fetchCooperativas() {
  const response = await fetch(`${API_BASE}/users`);

  if (!response.ok) {
    throw new Error(`Error de red: ${response.status} ${response.statusText}`);
  }

  const users = await response.json();

  //Mapeamos los datos de la API al formato de cooperativas de transporte
  return users.map((u, i) => ({
    id: u.id,
    nombre: `Coop. de Transportes ${u.company.name}`,
    ciudad: u.address.city,
    provincia: u.address.zipcode,
    email: u.email,
    telefono: u.phone,
    website: u.website,
    unidades: 10 + (i * 7),
    rutas: 3 + (i * 2),
    tipo: ['Interprovincial', 'Intraprovincial', 'Urbano'][i % 3],
    estado: i % 5 !== 0 ? 'Activa' : 'En revisión',
    socios: 20 + (i * 15),
  }));
}

/**
 *Obtiene estadísticas globales calculadas a partir de la lista.
 *@param {Array} cooperativas
 *@returns {Object} Estadísticas agregadas
 */
export function calcularEstadisticas(cooperativas) {
  return {
    totalCoops:   cooperativas.length,
    totalUnidades: cooperativas.reduce((s, c) => s + c.unidades, 0),
    totalRutas:   cooperativas.reduce((s, c) => s + c.rutas, 0),
    totalSocios:  cooperativas.reduce((s, c) => s + c.socios, 0),
    activas:      cooperativas.filter(c => c.estado === 'Activa').length,
    interprovincial: cooperativas.filter(c => c.tipo === 'Interprovincial').length,
    intraprovincial: cooperativas.filter(c => c.tipo === 'Intraprovincial').length,
    urbano:       cooperativas.filter(c => c.tipo === 'Urbano').length,
  };
}
