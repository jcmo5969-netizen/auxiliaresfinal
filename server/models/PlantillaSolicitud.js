const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlantillaSolicitud = sequelize.define('PlantillaSolicitud', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es requerido' }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipoRequerimiento: {
    type: DataTypes.ENUM('alta', 'traslado', 'pabellon', 'otro'),
    allowNull: false,
    field: 'tipo_requerimiento'
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  },
  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'servicios',
      key: 'id'
    },
    field: 'servicio_id'
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'creado_por_id'
  },
  esPublica: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'es_publica'
  }
}, {
  tableName: 'plantillas_solicitudes',
  timestamps: true
});

module.exports = PlantillaSolicitud;



