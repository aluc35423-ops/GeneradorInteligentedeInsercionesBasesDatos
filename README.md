# 🚀 Generador Inteligente de Inserciones para Bases de Datos

**Universidad Tecnológica El Retoño (UTR)**
**Carrera:** Ingeniería en Desarrollo y Gestión de Software
**Materia:** Manejo de Bases de Datos (2.º Parcial 8 Cuatrimestre)

## 👥 Autores

* [Ulises Guadalupe Escareño Vega](https://github.com/aluc35423-ops)
* [José Braulio Martínez Mora](https://github.com/Braulio-Mtz-M)
* [Javier Humberto Cisneros Vela](https://github.com/JaviiVela)
* [Jesús Eduardo Vázquez Barba](https://github.com/jeduardovazbar-svg)

---

# 📌 Descripción del Proyecto

El **Generador Inteligente de Inserciones para Bases de Datos** es una herramienta **Full Stack** desarrollada bajo una arquitectura **Cliente/Servidor** para automatizar la generación de datos de prueba en bases de datos relacionales.

La aplicación se conecta dinámicamente a una base de datos, inspecciona su esquema (columnas, tipos de datos, llaves primarias, llaves foráneas y restricciones) y genera registros realistas mediante la librería **Faker.js**.

Además, cuenta con una interfaz gráfica basada en el estilo **Glassmorphism**, que permite previsualizar los registros antes de ejecutar una inserción masiva mediante transacciones. En el backend se implementó un patrón de adaptación denominado **Query Mapper**, diseñado para facilitar el soporte de múltiples motores de bases de datos, como MySQL y PostgreSQL.

---

# ⚙️ Requisitos Previos

* **Node.js:** v18 o superior (probado con v24.16.0)
* **npm** como gestor de paquetes
* **MySQL** ejecutándose localmente o en la nube

---

# 🛠️ Instalación

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
```

Si el proyecto fue entregado comprimido, simplemente descomprímelo y abre una terminal dentro de la carpeta.

---

## 2. Instalar las dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias, entre ellas:

* Express
* MySQL2
* Faker.js
* Dotenv

---

## 3. Configurar las variables de entorno

Crea un archivo llamado **`.env`** en la raíz del proyecto con la siguiente información:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=school
DB_ENGINE=mysql

PORT=3000
```

---

## 4. Preparar la base de datos

Ejecuta el script SQL proporcionado en:

```text
src/models/firstSchemas.js
```

Este archivo crea las tablas de ejemplo:

* alumnos
* profesor
* salon

---

# 🚀 Ejecución

Inicia el servidor con:

```bash
node index.js
```

Si la conexión fue exitosa, la terminal mostrará un mensaje similar a:

```text
✅ ¡Conexión exitosa a la base de datos MySQL!
```

Después abre tu navegador y accede a:

```text
http://localhost:3000
```

Desde la interfaz podrás:

* Seleccionar la tabla.
* Elegir la cantidad de registros a generar.
* Previsualizar la información.
* Confirmar la inserción masiva.

---

# 🤖 Uso de Inteligencia Artificial

Como parte de los lineamientos del proyecto, se utilizaron herramientas de Inteligencia Artificial (LLMs) como **asistentes técnicos de desarrollo**, con el objetivo de mejorar la calidad del software, optimizar la arquitectura y agilizar la resolución de problemas.

La IA se empleó específicamente en las siguientes áreas:

## Interpretación dinámica de restricciones SQL

Se utilizó asistencia mediante IA para diseñar expresiones regulares (Regex) capaces de interpretar automáticamente las restricciones `CHECK` almacenadas en `information_schema.CHECK_CONSTRAINTS`.

Esto permitió convertir expresiones como:

```sql
estatus IN (0,1)
```

en reglas utilizadas por Faker.js para generar datos válidos sin necesidad de programar manualmente cada restricción.

---

## Resolución de errores relacionados con llaves foráneas

La IA apoyó en el análisis y solución de errores asociados al mapeo de claves foráneas, como:

```text
Unknown column in field list
```

Se optimizó la extracción automática de nombres de columnas terminadas en `_id`, garantizando consultas válidas hacia las tablas relacionadas durante la generación de datos.

---

## Optimización de la arquitectura en Express

Se empleó asistencia mediante IA para resolver problemas de compatibilidad relacionados con `path-to-regexp` en versiones recientes de Express (v5.x), permitiendo una configuración estable del sistema de rutas y del servidor de archivos estáticos.

---

## Diseño de la interfaz y programación asíncrona

La IA también apoyó en la estructuración de la lógica asíncrona (`async/await`) del frontend, así como en el diseño de la interfaz con estilo **Glassmorphism**, incluyendo:

* Vista previa de registros.
* Sistema de notificaciones (Toast).
* Comunicación con la API mediante peticiones asíncronas.

---

# 🧩 Tecnologías Utilizadas

* Node.js
* Express.js
* MySQL
* MySQL2
* Faker.js
* Dotenv
* HTML5
* CSS3
* JavaScript (ES6+)

---

# 📂 Estructura del Proyecto

```text
.
├── public
│   ├── img
│   ├── static
│   ├── template
├── src
│   ├── config
│   ├── controllers
│   ├── models
│   └── routes
├── .env
├── index.js
├── package.json
└── README.md
```

---

# 📄 Licencia

Este proyecto fue desarrollado con fines académicos para la materia **Manejo de Bases de Datos** de la **Universidad Tecnológica El Retoño (UTR)**.
