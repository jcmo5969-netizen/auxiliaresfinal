/**
 * Script de backup tabla por tabla.
 * Uso: BACKUP_DATABASE_URL="postgres://..." node backup.js
 * Genera archivos JSON en ./backup_data/
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

for (const envPath of [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

function construirUrlDesdeDbVars() {
  const host = process.env.DB_HOST;
  if (!host) return '';
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD) : '';
  const db = process.env.DB_NAME || 'sistema_auxiliares';
  const port = process.env.DB_PORT || 5432;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}`;
}

function urlOrigen() {
  return (
    process.env.BACKUP_DATABASE_URL ||
    process.env.SOURCE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    construirUrlDesdeDbVars() ||
    ''
  );
}

function sslParaPg(urlStr) {
  try {
    const h = new URL(urlStr).hostname || '';
    if (h === 'localhost' || h === '127.0.0.1') return undefined;
    return { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

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
  const url = urlOrigen();
  const client = new Client({
    connectionString: url,
    ssl: sslParaPg(url),
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
  if (!urlOrigen()) {
    console.error(
      '❌ No hay URL de Postgres origen. Usa BACKUP_DATABASE_URL / DATABASE_URL en .env,\n' +
        '   o DB_HOST + DB_USER + DB_PASSWORD + DB_NAME, o pásala en la sesión de PowerShell.'
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
