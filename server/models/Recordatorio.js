const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recordatorio = sequelize.define('Recordatorio', {
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
  solicitudId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'solicitudes', key: 'id' },
    onDelete: 'SET NULL',
    field: 'solicitud_id'
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_hora'
  },
  completado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Marca que ya se envió el aviso push, para no repetirlo
  notificado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'recordatorios',
  timestamps: true,
  indexes: [{ fields: ['usuario_id'] }, { fields: ['fecha_hora'] }]
});

module.exports = Recordatorio;
