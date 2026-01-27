const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Email inválido' },
      notEmpty: { msg: 'El email es requerido' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, Infinity],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'auxiliar', 'enfermeria'),
    defaultValue: 'auxiliar'
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
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  ultimaUbicacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ultima_ubicacion'
  },
  secret2FA: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'secret_2fa'
  },
  habilitado2FA: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'habilitado_2fa'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    }
  }
});

// Método para comparar contraseñas
Usuario.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Usuario;
