const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mensaje = sequelize.define('Mensaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  remitenteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'remitente_id'
  },
  destinatarioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = mensaje global/grupo
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'destinatario_id'
  },
  solicitudId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = chat general
    references: {
      model: 'solicitudes',
      key: 'id'
    },
    field: 'solicitud_id'
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  leido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fechaLeido: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_leido'
  }
}, {
  tableName: 'mensajes',
  timestamps: true
});

module.exports = Mensaje;



