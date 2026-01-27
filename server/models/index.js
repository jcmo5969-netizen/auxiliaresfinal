const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Servicio = require('./Servicio');
const Solicitud = require('./Solicitud');
const Comentario = require('./Comentario');
const HistorialCambio = require('./HistorialCambio');
const PlantillaSolicitud = require('./PlantillaSolicitud');
const Etiqueta = require('./Etiqueta');
const LogActividad = require('./LogActividad');
const Mensaje = require('./Mensaje');

// Definir relaciones
Solicitud.belongsTo(Servicio, { foreignKey: 'servicioId', as: 'servicio' });
Solicitud.belongsTo(Usuario, { foreignKey: 'solicitadoPorId', as: 'solicitadoPor' });
Solicitud.belongsTo(Usuario, { foreignKey: 'asignadoAId', as: 'asignadoA' });

Servicio.hasMany(Solicitud, { foreignKey: 'servicioId', as: 'solicitudes' });
Usuario.hasMany(Solicitud, { foreignKey: 'solicitadoPorId', as: 'solicitudesCreadas' });
Usuario.hasMany(Solicitud, { foreignKey: 'asignadoAId', as: 'solicitudesAsignadas' });

// Relación Usuario-Servicio (para personal de enfermería)
Usuario.belongsTo(Servicio, { foreignKey: 'servicioId', as: 'servicio' });
Usuario.belongsTo(Servicio, { foreignKey: 'servicioId', as: 'servicioAsignado' }); // Alias adicional para compatibilidad
Servicio.hasMany(Usuario, { foreignKey: 'servicioId', as: 'personal' });

// Relaciones de Comentarios
Comentario.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });
Comentario.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Solicitud.hasMany(Comentario, { foreignKey: 'solicitudId', as: 'comentarios' });
Usuario.hasMany(Comentario, { foreignKey: 'usuarioId', as: 'comentarios' });

// Relaciones de Historial
HistorialCambio.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });
HistorialCambio.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Solicitud.hasMany(HistorialCambio, { foreignKey: 'solicitudId', as: 'historial' });
Usuario.hasMany(HistorialCambio, { foreignKey: 'usuarioId', as: 'cambiosRealizados' });

// Relaciones de Plantillas
PlantillaSolicitud.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });
PlantillaSolicitud.belongsTo(Servicio, { foreignKey: 'servicioId', as: 'servicio', required: false });
Usuario.hasMany(PlantillaSolicitud, { foreignKey: 'creadoPorId', as: 'plantillas' });

// Relaciones de Etiquetas (Many-to-Many con Solicitudes)
const SolicitudEtiqueta = sequelize.define('SolicitudEtiqueta', {
  solicitudId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'solicitudes', key: 'id' },
    field: 'solicitud_id'
  },
  etiquetaId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'etiquetas', key: 'id' },
    field: 'etiqueta_id'
  }
}, {
  tableName: 'solicitud_etiquetas',
  timestamps: false
});

Solicitud.belongsToMany(Etiqueta, { through: SolicitudEtiqueta, as: 'etiquetas', foreignKey: 'solicitudId' });
Etiqueta.belongsToMany(Solicitud, { through: SolicitudEtiqueta, as: 'solicitudes', foreignKey: 'etiquetaId' });

// Relaciones de Logs
LogActividad.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario', required: false });
Usuario.hasMany(LogActividad, { foreignKey: 'usuarioId', as: 'actividades' });

// Relaciones de Mensajes
Mensaje.belongsTo(Usuario, { foreignKey: 'remitenteId', as: 'remitente' });
Mensaje.belongsTo(Usuario, { foreignKey: 'destinatarioId', as: 'destinatario', required: false });
Mensaje.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud', required: false });
Usuario.hasMany(Mensaje, { foreignKey: 'remitenteId', as: 'mensajesEnviados' });
Usuario.hasMany(Mensaje, { foreignKey: 'destinatarioId', as: 'mensajesRecibidos' });
Solicitud.hasMany(Mensaje, { foreignKey: 'solicitudId', as: 'mensajes' });

module.exports = {
  sequelize,
  Usuario,
  Servicio,
  Solicitud,
  Comentario,
  HistorialCambio,
  PlantillaSolicitud,
  Etiqueta,
  LogActividad,
  Mensaje,
  SolicitudEtiqueta
};

