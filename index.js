const express = require('express');
const path = require('path');
require('dotenv').config();
const generateRoutes = require('./src/routes/generateRoutes');

const app = express();

app.use(express.json());

// 1. Servir los archivos estáticos del frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Rutas de la API
app.use('/api', generateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});