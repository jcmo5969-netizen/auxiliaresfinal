const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Pares clave/valor del sistema que deben sobrevivir a reinicios
 * (por ejemplo las claves VAPID de notificaciones push).
 */
const Configuracion = sequelize.define('Configuracion', {
  clave: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'configuracion',
  timestamps: true
});

module.exports = Configuracion;
