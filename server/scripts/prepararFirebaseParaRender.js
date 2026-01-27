const fs = require('fs');
const path = require('path');

/**
 * Script para preparar el JSON de Firebase para usar como variable de entorno en Render
 * 
 * Uso:
 *   node scripts/prepararFirebaseParaRender.js
 * 
 * Esto creará un archivo con el JSON en una sola línea que puedes copiar a Render
 */

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const outputPath = path.join(__dirname, '..', 'firebase-service-account-render.txt');

try {
  // Leer el archivo JSON
  const jsonContent = fs.readFileSync(serviceAccountPath, 'utf8');
  
  // Parsear para validar que sea JSON válido
  const jsonObject = JSON.parse(jsonContent);
  
  // Convertir a una sola línea (minificado)
  const minifiedJson = JSON.stringify(jsonObject);
  
  // Guardar en archivo de texto
  fs.writeFileSync(outputPath, minifiedJson, 'utf8');
  
  console.log('✅ Firebase JSON preparado para Render\n');
  console.log('📋 Pasos siguientes:');
  console.log('1. Abre el archivo: firebase-service-account-render.txt');
  console.log('2. Copia TODO el contenido (Ctrl+A, Ctrl+C)');
  console.log('3. Ve a Render → Tu servicio backend → Environment');
  console.log('4. Agrega variable: FIREBASE_SERVICE_ACCOUNT');
  console.log('5. Pega el contenido copiado');
  console.log('6. Guarda los cambios\n');
  console.log('📁 Archivo generado:', outputPath);
  console.log('📏 Longitud:', minifiedJson.length, 'caracteres\n');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ Error: No se encontró firebase-service-account.json');
    console.error('   Asegúrate de tener el archivo en:', serviceAccountPath);
    console.error('\n   Para obtenerlo:');
    console.error('   1. Ve a Firebase Console');
    console.error('   2. Configuración → Cuentas de servicio');
    console.error('   3. Generar nueva clave privada');
    console.error('   4. Descarga el JSON y colócalo en server/firebase-service-account.json');
  } else if (error instanceof SyntaxError) {
    console.error('❌ Error: El JSON no es válido');
    console.error('   Detalles:', error.message);
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
}

