const { Servicio } = require('../models');

const SERVICIOS_DEFAULT = [
  { nombre: 'Medicina Quirurgica 1', piso: '1' },
  { nombre: 'Medicina Quirurgica 2', piso: '2' },
  { nombre: 'Medicina Quirurgica 3', piso: '3' },
  { nombre: 'UCI', piso: 'N/A' },
  { nombre: 'UTI', piso: 'N/A' },
  { nombre: 'Urgencias Adulto', piso: 'N/A' },
  { nombre: 'Urgencia Infantil', piso: 'N/A' },
  { nombre: 'CMA', piso: 'N/A' },
  { nombre: 'Maternidad/ginecologia', piso: 'N/A' },
  { nombre: 'Pabellon', piso: 'N/A' },
  { nombre: 'GESCAS', piso: 'N/A' }
];

/**
 * Asegura que los servicios por defecto (incluido GESCAS) existan en la BD.
 * Se ejecuta al iniciar el servidor (p. ej. en Render) para que el desplegable de servicios esté completo.
 */
async function seedServiciosOnStartup() {
  try {
    for (const servicio of SERVICIOS_DEFAULT) {
      await Servicio.findOrCreate({
        where: { nombre: servicio.nombre },
        defaults: { ...servicio, activo: true }
      });
    }
    console.log('✅ Servicios por defecto verificados (incl. GESCAS)');
  } catch (error) {
    console.error('⚠️ Error verificando servicios por defecto:', error.message);
    // No lanzar: el servidor puede seguir funcionando
  }
}

module.exports = seedServiciosOnStartup;
