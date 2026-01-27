const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pregunta = (pregunta) => {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta);
    });
  });
};

const abrirNavegador = (url) => {
  const plataforma = process.platform;
  let comando;
  
  if (plataforma === 'win32') {
    comando = `start "" "${url}"`;
  } else if (plataforma === 'darwin') {
    comando = `open "${url}"`;
  } else {
    comando = `xdg-open "${url}"`;
  }
  
  exec(comando, (error) => {
    if (error) {
      // Ignorar errores, solo mostrar URL
    }
  });
};

console.log('\n🔥🔥🔥 CONFIGURACIÓN AUTOMÁTICA DE FIREBASE 🔥🔥🔥\n');
console.log('Este script configurará Firebase completamente.\n');
console.log('═══════════════════════════════════════════════════════\n');

const configurarFirebase = async () => {
  try {
    console.log('📋 OPCIÓN 1: Configuración Rápida (Pegar todo de una vez)\n');
    console.log('📋 OPCIÓN 2: Configuración Paso a Paso\n');
    
    const opcion = await pregunta('¿Qué opción prefieres? (1/2): ');
    
    let apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, vapidKey;
    
    if (opcion === '1') {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('CONFIGURACIÓN RÁPIDA');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log('1. Abre Firebase Console: https://console.firebase.google.com/');
      console.log('2. Crea proyecto → Agrega app web → Copia la configuración\n');
      
      const abrir = await pregunta('¿Abrir Firebase Console ahora? (s/n): ');
      if (abrir.toLowerCase() === 's' || abrir.toLowerCase() === 'si') {
        abrirNavegador('https://console.firebase.google.com/');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('\n📋 Pega la configuración completa de Firebase (todo el objeto firebaseConfig):');
      console.log('Ejemplo: { apiKey: "...", authDomain: "...", ... }\n');
      
      const configCompleta = await pregunta('Pega aquí (puedes incluir comillas simples/dobles, espacios, etc.):\n');
      
      // Extraer valores usando regex
      apiKey = configCompleta.match(/apiKey["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
               configCompleta.match(/apiKey["\s]*:["\s]*([^\s,}]+)/)?.[1];
      authDomain = configCompleta.match(/authDomain["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
                   configCompleta.match(/authDomain["\s]*:["\s]*([^\s,}]+)/)?.[1];
      projectId = configCompleta.match(/projectId["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
                  configCompleta.match(/projectId["\s]*:["\s]*([^\s,}]+)/)?.[1];
      storageBucket = configCompleta.match(/storageBucket["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
                      configCompleta.match(/storageBucket["\s]*:["\s]*([^\s,}]+)/)?.[1];
      messagingSenderId = configCompleta.match(/messagingSenderId["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
                          configCompleta.match(/messagingSenderId["\s]*:["\s]*([^\s,}]+)/)?.[1];
      appId = configCompleta.match(/appId["\s]*:["\s]*["']([^"']+)["']/)?.[1] || 
              configCompleta.match(/appId["\s]*:["\s]*([^\s,}]+)/)?.[1];
      
      if (!apiKey || !authDomain || !projectId) {
        console.log('\n⚠️  No se pudieron extraer todos los valores. Usando modo paso a paso...\n');
        opcion = '2';
      } else {
        console.log('\n✅ Valores extraídos correctamente\n');
      }
    }
    
    if (opcion === '2' || !apiKey) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('CONFIGURACIÓN PASO A PASO');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log('En Firebase Console:');
      console.log('1. Crea proyecto → Agrega app web → Copia configuración\n');
      
      const abrir = await pregunta('¿Abrir Firebase Console? (s/n): ');
      if (abrir.toLowerCase() === 's' || abrir.toLowerCase() === 'si') {
        abrirNavegador('https://console.firebase.google.com/');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await pregunta('Presiona Enter cuando tengas la configuración...');
      console.log('');
      
      apiKey = await pregunta('📋 apiKey: ');
      authDomain = await pregunta('📋 authDomain: ');
      projectId = await pregunta('📋 projectId: ');
      storageBucket = await pregunta('📋 storageBucket: ');
      messagingSenderId = await pregunta('📋 messagingSenderId: ');
      appId = await pregunta('📋 appId: ');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('VAPID KEY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('En Firebase Console:');
    console.log('⚙️ Configuración → Cloud Messaging → Generar par de claves\n');
    
    vapidKey = await pregunta('📋 VAPID Key: ');
    
    // Actualizar firebase.js
    const firebaseJsPath = path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'firebase.js');
    let firebaseJsContent = fs.readFileSync(firebaseJsPath, 'utf8');
    
    firebaseJsContent = firebaseJsContent.replace(
      /const firebaseConfig = \{[\s\S]*?\};/,
      `const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
}`
    );
    
    firebaseJsContent = firebaseJsContent.replace(
      /const VAPID_KEY = ".*?"/,
      `const VAPID_KEY = "${vapidKey}"`
    );
    
    fs.writeFileSync(firebaseJsPath, firebaseJsContent, 'utf8');
    console.log('\n✅ client/src/utils/firebase.js actualizado\n');
    
    // Service Account
    console.log('═══════════════════════════════════════════════════════');
    console.log('SERVICE ACCOUNT');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('En Firebase Console:');
    console.log('⚙️ Configuración → Cuentas de servicio → Generar nueva clave privada\n');
    
    const rutaServiceAccount = await pregunta('📋 Ruta del archivo JSON descargado (o Enter para saltar): ');
    
    const destino = path.join(__dirname, '..', 'firebase-service-account.json');
    
    if (rutaServiceAccount.trim()) {
      try {
        const rutaLimpia = rutaServiceAccount.trim().replace(/["']/g, '');
        const serviceAccountPath = path.isAbsolute(rutaLimpia) 
          ? rutaLimpia 
          : path.resolve(process.cwd(), rutaLimpia);
        
        if (fs.existsSync(serviceAccountPath)) {
          fs.copyFileSync(serviceAccountPath, destino);
          console.log('\n✅ firebase-service-account.json copiado\n');
        } else {
          console.log('\n⚠️  Archivo no encontrado. Copia manualmente a:', destino);
        }
      } catch (error) {
        console.log('\n⚠️  Error:', error.message);
        console.log('   Copia manualmente a:', destino);
      }
    } else {
      console.log('\n⚠️  Saltando. Copia manualmente el JSON a:', destino);
    }
    
    // Resumen
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📝 Verificar: cd server && npm run verificar-firebase');
    console.log('🚀 Reiniciar: npm run dev\n');
    console.log('🎉 ¡Firebase configurado! Las notificaciones push funcionarán.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Revisa CONFIGURAR_FIREBASE.md para guía manual\n');
  } finally {
    rl.close();
  }
};

configurarFirebase();
