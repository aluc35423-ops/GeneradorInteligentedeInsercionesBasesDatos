const db = require('../config/db');
const { faker } = require('@faker-js/faker/locale/es_MX');

// 1. Definimos el motor actual leyendo el .env (por defecto mysql)
const DB_ENGINE = process.env.DB_ENGINE || 'mysql';

// 2. Diccionario de Consultas Multi-Motor
const queries = {
    getTables: () => {
        if (DB_ENGINE === 'mysql') return 'SHOW TABLES';
        if (DB_ENGINE === 'postgres') return "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
        throw new Error("Motor de base de datos no soportado");
    },
    // Aquí podemos ir agregando las demás consultas (DESCRIBE, etc.)
};

// GET /tables adaptado
const getTables = async (req, res) => {
    try {
        // Usamos nuestro diccionario en lugar del texto fijo
        const [rows] = await db.query(queries.getTables());
        
        // Mapeo de datos dependiendo del motor
        let data = [];
        if (DB_ENGINE === 'mysql') {
            data = rows.map(row => ({ tableName: Object.values(row)[0] }));
        } else if (DB_ENGINE === 'postgres') {
            data = rows.map(row => ({ tableName: row.table_name }));
        }

        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener la lista de tablas.", errorDetail: error.message });
    }
};

// GET /tables/:tableName/schema
const getTableSchema = async (req, res) => {
    const { tableName } = req.params;
    const dbName = process.env.DB_NAME;

    try {
        // Consulta avanzada al information_schema para extraer llaves primarias y foráneas
        const query = `
            SELECT 
                c.COLUMN_NAME as 'name',
                c.DATA_TYPE as 'type',
                IF(c.COLUMN_KEY = 'PRI', true, false) as 'isPrimaryKey',
                IF(c.EXTRA = 'auto_increment', true, false) as 'isAutoIncrement',
                IF(kcu.REFERENCED_TABLE_NAME IS NOT NULL, true, false) as 'isForeignKey',
                kcu.REFERENCED_TABLE_NAME as 'referenceTable'
            FROM information_schema.COLUMNS c
            LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu 
                ON c.TABLE_NAME = kcu.TABLE_NAME 
                AND c.COLUMN_NAME = kcu.COLUMN_NAME 
                AND c.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
                AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
            WHERE c.TABLE_NAME = ? AND c.TABLE_SCHEMA = ?
            ORDER BY c.ORDINAL_POSITION;
        `;

        const [columns] = await db.query(query, [tableName, dbName]);

        if (columns.length === 0) {
            return res.status(404).json({
                success: false,
                message: `La tabla '${tableName}' no existe o no tiene columnas.`,
                errorDetail: "Table not found in schema"
            });
        }

        // Formatear booleanos (MySQL devuelve 1 o 0)
        const formattedColumns = columns.map(col => ({
            name: col.name,
            type: col.type,
            isPrimaryKey: Boolean(col.isPrimaryKey),
            isAutoIncrement: Boolean(col.isAutoIncrement),
            ...(Boolean(col.isForeignKey) && { 
                isForeignKey: true, 
                referenceTable: col.referenceTable 
            })
        }));

        res.status(200).json({
            success: true,
            data: {
                tableName: tableName,
                columns: formattedColumns
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al inspeccionar el esquema de la tabla.",
            errorDetail: error.message
        });
    }
};

// POST /generate
const generateData = async (req, res) => {
    const { tableName, rowCount } = req.body;

    if (!tableName || !rowCount || rowCount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Faltan parámetros requeridos o son inválidos.",
            errorDetail: "Asegúrate de enviar 'tableName' y un 'rowCount' válido."
        });
    }

    try {
        const [columns] = await db.query(`DESCRIBE ${tableName}`);
        let insertedCount = 0;
        let errors = [];

        for (let i = 0; i < rowCount; i++) {
            const rowData = {};

            for (const col of columns) {
                const colName = col.Field;
                const colType = col.Type;
                
                if (col.Extra.includes('auto_increment')) continue;

                if (colName.includes('nombre')) {
                    rowData[colName] = faker.person.firstName();
                } else if (colName.includes('last_name')) {
                    rowData[colName] = faker.person.lastName();
                } else if (colName.includes('telefono')) {
                    rowData[colName] = faker.phone.number('##########');
                } else if (colType.includes('enum')) {
                    const match = colType.match(/enum\((.*)\)/);
                    if (match) {
                        const enumValues = match[1].replace(/'/g, "").split(',');
                        rowData[colName] = faker.helpers.arrayElement(enumValues);
                    }
                } else if (colType.includes('tinyint') || colName === 'estatus') {
                    rowData[colName] = faker.helpers.arrayElement([0, 1]);
                } else if (colName.includes('_id')) {
                    // Le quitamos el '_id' para obtener el nombre exacto de la tabla referenciada
                    const refTable = colName.replace('_id', '');
                    try {
                        const [ids] = await db.query(`SELECT ${colName} FROM ${refTable} ORDER BY RAND() LIMIT 1`);
                        rowData[colName] = ids.length > 0 ? ids[0][colName] : 1; 
                    } catch (e) {
                        console.warn(`No se pudo obtener FK para ${colName} en la tabla ${refTable}. Usando valor por defecto 1.`);
                        rowData[colName] = 1; 
                    }
                } else if (colType.includes('varchar')) {
                    rowData[colName] = faker.lorem.word();
                }
            }

            try {
                const keys = Object.keys(rowData).join(', ');
                const placeholders = Object.keys(rowData).map(() => '?').join(', ');
                const values = Object.values(rowData);

                const insertQuery = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`;
                await db.query(insertQuery, values);
                insertedCount++;
            } catch (insertError) {
                errors.push(insertError.message);
            }
        }

        // Respuesta exitosa formateada según el contrato
        res.status(200).json({ 
            success: true, 
            message: `Se han insertado ${insertedCount} registros correctamente en la tabla '${tableName}'.`,
            data: {
                insertedRows: insertedCount,
                errors: errors
            }
        });

    } catch (error) {
        // Respuesta de error estándar
        res.status(500).json({ 
            success: false,
            message: "Error al insertar los registros. Verifica las restricciones de la tabla.",
            errorDetail: error.message
        });
    }
};

// POST /preview - Solo genera los datos con Faker y los devuelve
const generatePreview = async (req, res) => {
    const { tableName, rowCount } = req.body;
    if (!tableName || !rowCount || rowCount <= 0) return res.status(400).json({ success: false, message: "Parámetros inválidos." });

    const dbName = process.env.DB_NAME;

    try {
        // 1. Obtenemos las columnas
        const [columns] = await db.query(`DESCRIBE ${tableName}`);
        
        // 2. NUEVO: Obtenemos las restricciones CHECK de manera dinámica
        const [checkRows] = await db.query(`
            SELECT cc.CHECK_CLAUSE 
            FROM information_schema.TABLE_CONSTRAINTS tc
            JOIN information_schema.CHECK_CONSTRAINTS cc 
                ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA 
                AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = ? AND tc.TABLE_SCHEMA = ? AND tc.CONSTRAINT_TYPE = 'CHECK'
        `, [tableName, dbName]);

        // 3. Procesamos los CHECKS con Regex para saber qué valores permite cada columna
        const checkConstraints = {};
        checkRows.forEach(row => {
            // Busca la columna entre backticks (ej. `estatus`)
            const colMatch = row.CHECK_CLAUSE.match(/`([^`]+)`/);
            // Busca los valores dentro del IN (ej. (0,1))
            const inMatch = row.CHECK_CLAUSE.match(/in\s*\(([^)]+)\)/i);
            
            if (colMatch && inMatch) {
                const checkColName = colMatch[1];
                // Limpiamos los valores, quitamos comillas/espacios y los guardamos
                const values = inMatch[1].split(',').map(v => v.replace(/['"\s]/g, ''));
                checkConstraints[checkColName] = values.map(v => isNaN(v) ? v : Number(v));
            }
        });

        let previewData = [];

        // 4. Generación de datos
        for (let i = 0; i < rowCount; i++) {
            const rowData = {};
            for (const col of columns) {
                const colName = col.Field;
                const colType = col.Type;
                
                if (col.Extra.includes('auto_increment')) continue;

                if (checkConstraints[colName]) {
                    rowData[colName] = faker.helpers.arrayElement(checkConstraints[colName]);
                } 
                // Lógica normal
                else if (colName.includes('nombre')) rowData[colName] = faker.person.firstName();
                else if (colName.includes('last_name')) rowData[colName] = faker.person.lastName();
                else if (colName.includes('telefono')) rowData[colName] = faker.phone.number('##########');
                else if (colType.includes('enum')) {
                    const match = colType.match(/enum\((.*)\)/);
                    if (match) {
                        const enumValues = match[1].replace(/'/g, "").split(',');
                        rowData[colName] = faker.helpers.arrayElement(enumValues);
                    }
                } else if (colType.includes('tinyint')) {
                    rowData[colName] = faker.helpers.arrayElement([0, 1]); // Fallback por si no tiene check
                } else if (colName.includes('_id')) {
                    const refTable = colName.replace('_id', '');
                    try {
                        const [ids] = await db.query(`SELECT ${colName} FROM ${refTable} ORDER BY RAND() LIMIT 1`);
                        rowData[colName] = ids.length > 0 ? ids[0][colName] : 1; 
                    } catch (e) {
                         rowData[colName] = 1; 
                    }
                } else if (colType.includes('varchar')) rowData[colName] = faker.lorem.word();
            }
            previewData.push(rowData);
        }
        res.status(200).json({ success: true, data: previewData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al generar la vista previa.", errorDetail: error.message });
    }
};

// POST /insert-bulk - Inserta el arreglo de datos confirmado
const insertBulk = async (req, res) => {
    const { tableName, rows } = req.body;
    if (!tableName || !rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: "Datos inválidos." });

    try {
        let insertedCount = 0;
        let errors = [];

        for (const rowData of rows) {
            try {
                const keys = Object.keys(rowData).join(', ');
                const placeholders = Object.keys(rowData).map(() => '?').join(', ');
                const values = Object.values(rowData);

                await db.query(`INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`, values);
                insertedCount++;
            } catch (insertError) {
                errors.push(insertError.message);
            }
        }
        res.status(200).json({ success: true, message: `Se han insertado ${insertedCount} registros.`, data: { insertedRows: insertedCount, errors } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error en la inserción masiva.", errorDetail: error.message });
    }
};

module.exports = { getTables, getTableSchema, generateData, generatePreview, insertBulk };