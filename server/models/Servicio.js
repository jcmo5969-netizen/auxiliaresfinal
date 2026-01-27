const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del servicio es requerido' }
    }
  },
  piso: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El piso es requerido' }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'servicios',
  timestamps: true
});

module.exports = Servicio;
