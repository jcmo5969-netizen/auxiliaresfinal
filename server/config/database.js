const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Detectar si estamos en Render (host contiene .render.com)
const isRender = process.env.DB_HOST && process.env.DB_HOST.includes('.render.com');
const isProduction = process.env.NODE_ENV === 'production';
const needsSSL = isRender || isProduction || process.env.DB_SSL === 'true';

/**
 * URL interna de Postgres en Render (host tipo dpg-xxxxx-a) suele NO ir bien con ssl: { require: true }
 * en node-pg; fuerza TLS y el servidor corta → "Connection terminated unexpectedly".
 * La URL pública (*.postgres.render.com) sí lleva ssl en la práctica.
 */
function sslDialectOptionsForDatabaseUrl(databaseUrl) {
  if (process.env.DATABASE_SSL === 'false' || process.env.DATABASE_SSL === '0') {
    return {};
  }
  if (process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1') {
    return { ssl: { require: true, rejectUnauthorized: false } };
  }
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname || '';
    const esHostInternoRender = host.startsWith('dpg-') && !host.includes('postgres.render.com');
    if (esHostInternoRender) {
      return {};
    }
  } catch {
    // continuar con SSL por defecto
  }
  return { ssl: { require: true, rejectUnauthorized: false } };
}

// Si DATABASE_URL está disponible (como en Render), úsala directamente
// De lo contrario, usa las variables individuales
let sequelize;

if (process.env.DATABASE_URL) {
  const sslOpts = sslDialectOptionsForDatabaseUrl(process.env.DATABASE_URL);
  console.log('📦 Usando DATABASE_URL para conexión');
  console.log('   SSL dialectOptions:', Object.keys(sslOpts).length ? 'activado' : 'desactivado (host interno Render o DATABASE_SSL=false)');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: sslOpts,
    pool: {
      max: 10,
      min: 0,       // 0 = no conexiones persistentes; reconecta solo cuando se necesita
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Usar variables individuales (para desarrollo local)
  console.log('📦 Usando variables individuales para conexión');
  console.log('   Host:', process.env.DB_HOST || 'localhost');
  console.log('   Database:', process.env.DB_NAME || 'sistema_auxiliares');
  console.log('   User:', process.env.DB_USER || 'postgres');
  
  sequelize = new Sequelize(
    process.env.DB_NAME || 'sistema_auxiliares',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'kokito123',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: needsSSL ? {
          require: true,
          rejectUnauthorized: false // Necesario para Render PostgreSQL
        } : false
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;



