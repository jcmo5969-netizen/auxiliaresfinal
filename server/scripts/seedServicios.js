const { sequelize, Servicio } = require('../models');

const servicios = [
  { nombre: 'Medicina Quirurgica 1', piso: '1' },
  { nombre: 'Medicina Quirurgica 2', piso: '2' },
  { nombre: 'Medicina Quirurgica 3', piso: '3' },
  { nombre: 'UCI', piso: 'N/A' },
  { nombre: 'UTI', piso: 'N/A' },
  { nombre: 'Urgencias Adulto', piso: 'N/A' },
  { nombre: 'Urgencia Infantil', piso: 'N/A' },
  { nombre: 'CMA', piso: 'N/A' },
  { nombre: 'Maternidad/ginecologia', piso: 'N/A' },
  { nombre: 'Pabellon', piso: 'N/A' }
];

async function seedServicios() {
  try {
    await sequelize.authenticate();
    await Servicio.sync();

    for (const servicio of servicios) {
      const [registro, creado] = await Servicio.findOrCreate({
        where: { nombre: servicio.nombre },
        defaults: { ...servicio, activo: true }
      });

      if (!creado) {
        const updateData = {};
        if (registro.activo === false) updateData.activo = true;
        if (!registro.piso && servicio.piso) updateData.piso = servicio.piso;
        if (Object.keys(updateData).length > 0) {
          await registro.update(updateData);
        }
      }
    }

    console.log('✅ Servicios creados/actualizados');
  } catch (error) {
    console.error('❌ Error creando servicios:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedServicios();
