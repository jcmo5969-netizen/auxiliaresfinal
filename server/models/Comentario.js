const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comentario = sequelize.define('Comentario', {
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
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'usuario_id'
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El contenido del comentario es requerido' }
    }
  },
  tipo: {
    type: DataTypes.ENUM('comentario', 'sistema'),
    defaultValue: 'comentario'
  }
}, {
  tableName: 'comentarios',
  timestamps: true
});

module.exports = Comentario;



