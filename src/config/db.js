const mysql = require('mysql2/promise');
require('dotenv').config();

// 1. Creamos el pool de conexiones usando las variables del .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Función de prueba para verificar la conexión al iniciar
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ ¡Conexión exitosa a la base de datos MySQL (Puerto 3307)!');
        connection.release(); // Liberamos la conexión de vuelta al pool
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
    }
};

testConnection();

module.exports = pool;