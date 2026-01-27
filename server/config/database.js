const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Detectar si estamos en Render (host contiene .render.com)
const isRender = process.env.DB_HOST && process.env.DB_HOST.includes('.render.com');
const isProduction = process.env.NODE_ENV === 'production';
const needsSSL = isRender || isProduction || process.env.DB_SSL === 'true';

const sequelize = new Sequelize(
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

module.exports = sequelize;



