const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogActividad = sequelize.define('LogActividad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  entidad: {
    type: DataTypes.STRING,
    allowNull: false // 'solicitud', 'usuario', 'servicio', etc.
  },
  entidadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'entidad_id'
  },
  detalles: {
    type: DataTypes.JSONB,
    allowNull: true // Almacena información adicional
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  }
}, {
  tableName: 'logs_actividad',
  timestamps: true
});

module.exports = LogActividad;



