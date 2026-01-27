const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Firebase...\n');

// Verificar archivo service account
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccountExiste = fs.existsSync(serviceAccountPath);

if (serviceAccountExiste) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ firebase-service-account.json encontrado');
    console.log(`   Proyecto: ${serviceAccount.project_id}`);
    console.log(`   Email: ${serviceAccount.client_email}`);
  } catch (error) {
    console.log('❌ firebase-service-account.json existe pero tiene formato inválido');
    console.log(`   Error: ${error.message}`);
  }
} else {
  console.log('❌ firebase-service-account.json NO encontrado');
  console.log('   Ubicación esperada:', serviceAccountPath);
  console.log('   Pasos:');
  console.log('   1. Ve a Firebase Console > Configuración del proyecto');
  console.log('   2. Ve a "Cuentas de servicio"');
  console.log('   3. Genera nueva clave privada');
  console.log('   4. Renombra el archivo a firebase-service-account.json');
  console.log('   5. Muévelo a la carpeta server/');
}

// Verificar configuración del cliente
const firebaseConfigPath = path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'firebase.js');
const firebaseConfigExiste = fs.existsSync(firebaseConfigPath);

if (firebaseConfigExiste) {
  const contenido = fs.readFileSync(firebaseConfigPath, 'utf8');
  // Verificar que tiene valores reales (no placeholders)
  const tieneApiKey = contenido.includes('apiKey:') && 
                      !contenido.match(/apiKey:\s*["']TU_API_KEY["']/) &&
                      contenido.match(/apiKey:\s*["']AIza/);
  const tieneVapidKey = contenido.includes('VAPID_KEY') && 
                        !contenido.match(/VAPID_KEY\s*=\s*["']TU_VAPID_KEY["']/) &&
                        contenido.match(/VAPID_KEY\s*=\s*["'][^"']{20,}/);
  
  if (tieneApiKey && tieneVapidKey) {
    console.log('\n✅ firebase.js configurado correctamente');
    // Extraer valores para mostrar
    const apiKeyMatch = contenido.match(/apiKey:\s*["']([^"']+)["']/);
    const projectIdMatch = contenido.match(/projectId:\s*["']([^"']+)["']/);
    if (apiKeyMatch) {
      console.log(`   API Key: ${apiKeyMatch[1].substring(0, 20)}...`);
    }
    if (projectIdMatch) {
      console.log(`   Project ID: ${projectIdMatch[1]}`);
    }
  } else {
    console.log('\n❌ firebase.js NO está configurado');
    console.log('   Debes reemplazar los valores placeholder en:');
    console.log('   client/src/utils/firebase.js');
    console.log('   - firebaseConfig (apiKey, authDomain, etc.)');
    console.log('   - VAPID_KEY');
  }
} else {
  console.log('\n❌ firebase.js no encontrado');
}

console.log('\n📚 Para más información, consulta: CONFIGURAR_FIREBASE.md\n');

