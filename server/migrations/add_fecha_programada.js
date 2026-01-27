const sequelize = require('../config/database');

async function agregarFechaProgramada() {
  try {
    await sequelize.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMP NULL;
    `);
    console.log('✅ Columna fecha_programada agregada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error agregando columna:', error);
    process.exit(1);
  }
}

agregarFechaProgramada();

