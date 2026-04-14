/**
 * Script de backup tabla por tabla.
 * Uso: BACKUP_DATABASE_URL="postgres://..." node backup.js
 * Genera archivos JSON en ./backup_data/
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SOURCE_URL =
  process.env.BACKUP_DATABASE_URL ||
  process.env.SOURCE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

const OUTPUT_DIR = path.join(__dirname, 'backup_data');

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
    connectionString: SOURCE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

async function exportarTabla(tabla) {
  const archivo = path.join(OUTPUT_DIR, `${tabla}.json`);
  if (fs.existsSync(archivo)) {
    console.log(`  ✅ ${tabla} — ya exportada, saltando`);
    return true;
  }

  let intentos = 0;
  while (intentos < 10) {
    intentos++;
    let client;
    try {
      console.log(`  🔄 ${tabla} — intento ${intentos}...`);
      client = await conectar();
      const result = await client.query(`SELECT * FROM "${tabla}"`);
      fs.writeFileSync(archivo, JSON.stringify(result.rows, null, 2));
      console.log(`  ✅ ${tabla} — ${result.rows.length} filas guardadas`);
      return true;
    } catch (err) {
      console.log(`  ⚠️  ${tabla} — falló: ${err.message}`);
      if (intentos < 10) {
        console.log(`     Reintentando en 15 segundos...`);
        await new Promise(r => setTimeout(r, 15000));
      }
    } finally {
      if (client) try { await client.end(); } catch (_) {}
    }
  }
  console.log(`  ❌ ${tabla} — no se pudo exportar después de 10 intentos`);
  return false;
}

async function main() {
  if (!SOURCE_URL) {
    console.error(
      '❌ Define BACKUP_DATABASE_URL, SOURCE_DATABASE_URL o DATABASE_URL (BD origen).'
    );
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  console.log('🚀 Iniciando backup tabla por tabla...\n');

  for (const tabla of TABLAS) {
    await exportarTabla(tabla);
  }

  console.log('\n✅ Backup finalizado. Archivos en ./backup_data/');
}

main().catch(console.error);
