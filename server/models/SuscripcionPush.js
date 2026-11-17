const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Un registro por dispositivo/navegador suscrito a notificaciones push.
 * Un mismo usuario puede tener varios (celular, tablet, PC del servicio).
 */
const SuscripcionPush = sequelize.define('SuscripcionPush', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
    onDelete: 'CASCADE',
    field: 'usuario_id'
  },
  // URL que entrega el navegador (Apple, Google, Mozilla). Identifica al dispositivo.
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  p256dh: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  auth: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  plataforma: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(400),
    allowNull: true,
    field: 'user_agent'
  },
  ultimoEnvio: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ultimo_envio'
  },
  fallosConsecutivos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'fallos_consecutivos'
  }
}, {
  tableName: 'suscripciones_push',
  timestamps: true,
  indexes: [{ fields: ['usuario_id'] }]
});

module.exports = SuscripcionPush;
