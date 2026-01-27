const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createDatabase = async () => {
  // Conectar sin especificar base de datos para poder crearla
  const sequelize = new Sequelize(
    'postgres', // Base de datos por defecto
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'kokito123',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    const dbName = process.env.DB_NAME || 'sistema_auxiliares';
    
    // Verificar si la base de datos existe
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      // Crear la base de datos
      await sequelize.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos '${dbName}' creada exitosamente`);
    } else {
      console.log(`✅ La base de datos '${dbName}' ya existe`);
    }

    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('   Verifica que la contraseña en .env sea correcta');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   Verifica que PostgreSQL esté corriendo');
    }
    await sequelize.close();
    return false;
  }
};

createDatabase().then(success => {
  if (success) {
    console.log('\n✅ Base de datos lista. Ahora puedes iniciar el servidor.');
    process.exit(0);
  } else {
    console.log('\n❌ No se pudo crear la base de datos. Verifica la configuración.');
    process.exit(1);
  }
});



