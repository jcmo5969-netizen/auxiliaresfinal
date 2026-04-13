/**
 * Agrega columnas que pueden faltar en tablas ya existentes.
 * Usa ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+) para que sea idempotente.
 * Se ejecuta al arrancar el servidor para cubrir el caso en que sync() sin
 * alter:true no agregó columnas nuevas que el modelo ya define.
 */
const ensureSchema = async (sequelize) => {
  const alteraciones = [
    // ── usuarios ──────────────────────────────────────────────────────────
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fcm_token        VARCHAR(255)    NULL`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS latitud          DECIMAL(10,8)   NULL`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS longitud         DECIMAL(11,8)   NULL`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_ubicacion TIMESTAMP       NULL`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS secret_2fa       VARCHAR(255)    NULL`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS habilitado_2fa   BOOLEAN         NOT NULL DEFAULT FALSE`,

    // ── solicitudes ───────────────────────────────────────────────────────
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS fecha_programada     TIMESTAMP    NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS precauciones_estandar BOOLEAN     NOT NULL DEFAULT FALSE`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS tipo_precaucion       VARCHAR(255) NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS motivo_cancelacion    TEXT         NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS destino_gescas        VARCHAR(255) NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS tipo_servicio         VARCHAR(255) NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS tipo_traslado         VARCHAR(255) NULL`,
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS prioridad_inmediato   BOOLEAN      NOT NULL DEFAULT FALSE`,
  ];

  let errores = 0;
  for (const sql of alteraciones) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      // Ignorar "already exists" u otros errores no críticos
      console.warn('ensureSchema (ignorado):', err.message?.split('\n')[0]);
      errores++;
    }
  }

  if (errores === 0) {
    console.log('✅ Esquema verificado (columnas al día)');
  } else {
    console.warn(`⚠️  ensureSchema: ${errores} alteraciones ignoradas (puede ser normal si ya existen)`);
  }
};

module.exports = ensureSchema;
