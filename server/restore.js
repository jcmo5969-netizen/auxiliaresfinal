/**
 * Script de restore tabla por tabla desde archivos JSON.
 * Uso: RESTORE_DATABASE_URL="postgres://..." node restore.js
 * (o DATABASE_URL). Lee ./backup_data/ e inserta en la BD destino.
 * Solo secuencias (p. ej. tras un restore ya hecho): node restore.js --solo-secuencias
 *
 * Tras insertar filas con id explícito, ajusta las secuencias SERIAL;
 * si no, los nuevos INSERT fallan por id duplicado (error 500 al crear solicitudes).
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DEST_URL =
  process.env.RESTORE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

const INPUT_DIR = path.join(__dirname, 'backup_data');

// Orden importante: respetar foreign keys
const TABLAS = [
  'usuarios',
  'servicios',
  'solicitudes',
  'comentarios',
  'historial_cambios',
  'plantillas_solicitudes',
  'etiquetas',
  'logs_actividad',
  'mensajes',
  'solicitud_etiquetas',
];

async function conectar() {
  const client = new Client({
    connectionString: DEST_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

async function restaurarTabla(client, tabla) {
  const archivo = path.join(INPUT_DIR, `${tabla}.json`);
  if (!fs.existsSync(archivo)) {
    console.log(`  ⏭️  ${tabla} — archivo no encontrado, saltando`);
    return;
  }

  const filas = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  if (!filas || filas.length === 0) {
    console.log(`  ⏭️  ${tabla} — sin datos`);
    return;
  }

  const columnas = Object.keys(filas[0]);
  let insertadas = 0;
  let errores = 0;

  for (const fila of filas) {
    const valores = columnas.map((_, i) => `$${i + 1}`);
    const datos = columnas.map(c => fila[c]);
    const sql = `INSERT INTO "${tabla}" (${columnas.map(c => `"${c}"`).join(', ')}) VALUES (${valores.join(', ')}) ON CONFLICT DO NOTHING`;
    try {
      await client.query(sql, datos);
      insertadas++;
    } catch (err) {
      errores++;
      if (errores <= 3) console.log(`    ⚠️  fila con error: ${err.message}`);
    }
  }

  console.log(`  ✅ ${tabla} — ${insertadas} insertadas, ${errores} errores`);
}

/**
 * Sin esto, tras INSERT con id fijo la secuencia queda atrás y el siguiente
 * registro reutiliza un id existente → duplicate key / 500 en la API.
 */
async function ajustarSecuenciasId(client) {
  console.log('\n🔧 Ajustando secuencias de columnas id...');
  for (const tabla of TABLAS) {
    try {
      const seqRow = await client.query(
        `SELECT pg_get_serial_sequence($1::text, 'id') AS seq`,
        [tabla]
      );
      const seq = seqRow.rows[0]?.seq;
      if (!seq) continue;

      const maxRow = await client.query(`SELECT MAX(id) AS m FROM "${tabla}"`);
      const maxId = maxRow.rows[0].m;

      if (maxId == null) {
        await client.query(`SELECT setval($1::regclass, 1, false)`, [seq]);
      } else {
        await client.query(`SELECT setval($1::regclass, $2::bigint, true)`, [seq, maxId]);
      }
      console.log(`  ✓ ${tabla} → siguiente id libre tras ${maxId == null ? 0 : maxId}`);
    } catch (e) {
      console.log(`  ⏭️  ${tabla} — omitido (${e.message})`);
    }
  }
}

async function main() {
  if (!DEST_URL) {
    console.error(
      '❌ Define RESTORE_DATABASE_URL o DATABASE_URL (URL de Postgres de destino).'
    );
    process.exit(1);
  }

  const soloSecuencias = process.argv.includes('--solo-secuencias');

  if (!soloSecuencias && !fs.existsSync(INPUT_DIR)) {
    console.error('❌ No existe la carpeta backup_data. Corre primero node backup.js');
    process.exit(1);
  }

  let client;
  try {
    client = await conectar();
    console.log('✅ Conectado a la BD\n');

    if (soloSecuencias) {
      console.log('Modo: solo ajuste de secuencias (sin reimportar JSON).\n');
      await ajustarSecuenciasId(client);
      console.log('\n✅ Secuencias actualizadas.');
      return;
    }

    console.log('🚀 Iniciando restore desde backup_data...\n');

    for (const tabla of TABLAS) {
      await restaurarTabla(client, tabla);
    }

    await ajustarSecuenciasId(client);

    console.log('\n✅ Restore finalizado exitosamente.');
  } catch (err) {
    console.error('❌ Error en restore:', err.message);
  } finally {
    if (client) await client.end();
  }
}

main().catch(console.error);
