const sequelize = require('../config/database');

async function addMotivoCancelacion() {
  try {
    await sequelize.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT NULL;
    `);
    console.log('✅ Columna motivo_cancelacion aplicada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración motivo_cancelacion:', error);
    process.exit(1);
  }
}

addMotivoCancelacion();
