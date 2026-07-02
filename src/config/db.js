require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión al arrancar
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida con éxito.');
        connection.release(); // Liberamos la conexión de vuelta al pool
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        process.exit(1); // Detenemos la aplicación si la base de datos no responde
    }
};

module.exports = { pool, testConnection };