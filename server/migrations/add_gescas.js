const sequelize = require('../config/database');

async function addGescas() {
  try {
    // Añadir valor 'gescas' al enum tipo_requerimiento (PostgreSQL)
    // El tipo puede llamarse enum_solicitudes_tipo_requerimiento o similar
    const [rows] = await sequelize.query(`
      SELECT t.typname
      FROM pg_attribute a
      JOIN pg_type t ON a.atttypid = t.oid
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'solicitudes' AND a.attname = 'tipo_requerimiento' AND a.attnum > 0 AND NOT a.attisdropped
    `);
    const typname = rows && rows[0] && rows[0].typname;
    if (typname) {
      await sequelize.query(`ALTER TYPE "${typname}" ADD VALUE IF NOT EXISTS 'gescas';`).catch(() => {});
    } else {
      await sequelize.query(`ALTER TYPE enum_solicitudes_tipo_requerimiento ADD VALUE IF NOT EXISTS 'gescas';`).catch(() => {});
    }
    // Columna destino GESCAS
    await sequelize.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS destino_gescas VARCHAR(255) NULL;
    `);
    console.log('✅ GESCAS: enum y columna destino_gescas aplicados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración GESCAS:', error);
    process.exit(1);
  }
}

addGescas();
