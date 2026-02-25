const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Detectar si estamos en Render (host contiene .render.com)
const isRender = process.env.DB_HOST && process.env.DB_HOST.includes('.render.com');
const isProduction = process.env.NODE_ENV === 'production';
const needsSSL = isRender || isProduction || process.env.DB_SSL === 'true';

// Si DATABASE_URL está disponible (como en Render), úsala directamente
// De lo contrario, usa las variables individuales
let sequelize;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL completa (más confiable en Render)
  // Render sine requiere SSL para PostgreSQL
  console.log('📦 Usando DATABASE_URL para conexión');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necesario para Render PostgreSQL
      }
    },
    pool: {
      max: 5,
      min: 0,
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
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;



