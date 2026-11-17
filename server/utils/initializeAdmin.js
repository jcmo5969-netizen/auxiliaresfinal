const { Usuario } = require('../models');

const initializeAdmin = async () => {
  try {
    const adminExiste = await Usuario.findOne({ where: { rol: 'administrador' } });
    
    if (!adminExiste) {
      const email = String(process.env.ADMIN_EMAIL || 'admin@sistema.com').toLowerCase().trim();
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      await Usuario.create({ nombre: 'Administrador', email, password, rol: 'administrador' });
      console.log(`Usuario administrador creado: ${email}`);
      if (!process.env.ADMIN_PASSWORD) {
        console.log('   Contraseña inicial: admin123 — cámbiala apenas inicies sesión (Mi perfil).');
        console.log('   Para definirla tú, configura ADMIN_EMAIL y ADMIN_PASSWORD antes del primer arranque.');
      }
    }
  } catch (error) {
    console.error('Error inicializando administrador:', error);
  }
};

module.exports = initializeAdmin;
