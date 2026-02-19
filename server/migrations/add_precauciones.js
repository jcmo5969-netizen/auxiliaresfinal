const sequelize = require('../config/database');

async function addPrecauciones() {
  try {
    await sequelize.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS precauciones_estandar BOOLEAN NOT NULL DEFAULT false;
    `);
    await sequelize.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS tipo_precaucion VARCHAR(255) NULL;
    `);
    console.log('✅ Precauciones estándar y tipo de precaución aplicados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración precauciones:', error);
    process.exit(1);
  }
}

addPrecauciones();
