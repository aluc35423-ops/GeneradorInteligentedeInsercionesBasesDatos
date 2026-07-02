const { testConnection } = require('./config/db');

const iniciarApp = async () => {
    console.log('--- Generador Inteligente de Inserciones ---');
    await testConnection();
    
    // Aquí agregaremos la lógica de lectura de tablas en la siguiente fase
};

iniciarApp();