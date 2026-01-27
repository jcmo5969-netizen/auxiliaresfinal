const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialCambio = sequelize.define('HistorialCambio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  solicitudId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitudes',
      key: 'id'
    },
    field: 'solicitud_id'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'usuario_id'
  },
  accion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  campo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  valorAnterior: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'valor_anterior'
  },
  valorNuevo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'valor_nuevo'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'historial_cambios',
  timestamps: true
});

module.exports = HistorialCambio;



