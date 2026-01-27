const { Usuario } = require('../models');

const initializeAdmin = async () => {
  try {
    const adminExiste = await Usuario.findOne({ where: { rol: 'administrador' } });
    
    if (!adminExiste) {
      const admin = await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@sistema.com',
        password: 'admin123',
        rol: 'administrador'
      });
      console.log('✅ Usuario administrador creado:');
      console.log('   Email: admin@sistema.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');
    }
  } catch (error) {
    console.error('Error inicializando administrador:', error);
  }
};

module.exports = initializeAdmin;
