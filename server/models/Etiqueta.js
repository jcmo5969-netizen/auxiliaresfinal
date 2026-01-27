const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Etiqueta = sequelize.define('Etiqueta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El nombre es requerido' }
    }
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6', // Azul por defecto
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'etiquetas',
  timestamps: true
});

module.exports = Etiqueta;



