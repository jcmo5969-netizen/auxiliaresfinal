const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solicitud = sequelize.define('Solicitud', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'id'
    },
    field: 'servicio_id'
  },
  tipoRequerimiento: {
    type: DataTypes.ENUM('alta', 'traslado', 'pabellon', 'otro'),
    allowNull: false,
    field: 'tipo_requerimiento'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipoServicio: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tipo_servicio'
  },
  tipoTraslado: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tipo_traslado'
  },
  prioridadInmediato: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'prioridad_inmediato'
  },
  cama: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada'),
    defaultValue: 'pendiente'
  },
  solicitadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'solicitado_por_id'
  },
  asignadoAId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'asignado_a_id'
  },
  fechaAsignacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_asignacion'
  },
  fechaCompletada: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_completada'
  },
  tiempoRespuesta: {
    type: DataTypes.INTEGER, // minutos
    allowNull: true,
    field: 'tiempo_respuesta'
  },
  tiempoCompletado: {
    type: DataTypes.INTEGER, // minutos
    allowNull: true,
    field: 'tiempo_completado'
  },
  fechaProgramada: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_programada'
  }
}, {
  tableName: 'solicitudes',
  timestamps: true
});

module.exports = Solicitud;
