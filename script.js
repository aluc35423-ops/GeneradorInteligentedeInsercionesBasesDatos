const API_BASE_URL = 'http://localhost:3000/api';
const grid = document.getElementById('tables-grid');
const initialLoader = document.getElementById('initial-loader');
const toastContainer = document.getElementById('toast-container');

// 1. Obtener las tablas dinámicamente al cargar la página
async function fetchTables() {
    try {
        const response = await fetch(`${API_BASE_URL}/tables`);
        const result = await response.json();

        if (response.ok && result.success) {
            initialLoader.style.display = 'none';
            // Renderizamos las tablas y cargamos sus esquemas
            renderTables(result.data);
        } else {
            throw new Error("Formato de respuesta inválido del servidor.");
        }
    } catch (error) {
        initialLoader.textContent = "Error de conexión. Verifica que el backend esté corriendo en el puerto 3000.";
        showToast(`Error al obtener tablas: ${error.message}`, true);
    }
}

// 2. Renderizar las tarjetas y consultar el esquema de cada una (Cumple con GET /tables/:tableName/schema)
function renderTables(tablesArray) {
    tablesArray.forEach((tableData, index) => {
        const delay = index * 0.15;
        const tableName = tableData.tableName;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animation = `fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`;
        
        // Estructura base con un contenedor vacío para las columnas (.table-schema)
        card.innerHTML = `
            <div class="card-header">
                <div class="table-name">${tableName}</div>
            </div>
            
            <div class="table-schema" id="schema-${tableName}" style="margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 0.5rem;">
                <span style="opacity: 0.6;">Cargando estructura...</span>
            </div>

            <div class="input-group">
                <label for="input-${tableName}">Cantidad de registros (Máx 10,000)</label>
                <input type="number" id="input-${tableName}" placeholder="Ej. 50" min="1" max="10000">
            </div>
            <button class="btn" onclick="handleInsert('${tableName}', this)">
                Generar Inserciones
            </button>
        `;
        grid.appendChild(card);

        // Llamada inmediata para complementar la tarjeta con su esquema del contrato
        fetchAndRenderSchema(tableName);
    });
}

// Nueva función para consumir el endpoint obligatorio de esquema
async function fetchAndRenderSchema(tableName) {
    const schemaContainer = document.getElementById(`schema-${tableName}`);
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${tableName}/schema`);
        const result = await response.json();

        if (response.ok && result.success) {
            schemaContainer.innerHTML = ''; // Limpiar el "Cargando..."
            
            // Iterar sobre las columnas devueltas por el contrato
            result.data.columns.forEach(col => {
                const badge = document.createElement('span');
                badge.style.cssText = `
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                `;
                
                // Si es llave primaria o foránea le añadimos un indicador visual
                let extra = '';
                if (col.isPrimaryKey) extra = ' 🔑';
                if (col.isForeignKey) extra = ` 🔗 (${col.referenceTable})`;

                badge.textContent = `${col.name} (${col.type})${extra}`;
                schemaContainer.appendChild(badge);
            });
        }
    } catch (error) {
        schemaContainer.innerHTML = '<span style="color: var(--danger);">Error al cargar esquema</span>';
    }
}

// 3. Manejar la inserción (POST /generate)
async function handleInsert(tableName, button) {
    const input = document.getElementById(`input-${tableName}`);
    const amount = parseInt(input.value);

    // Validación preventiva de frontend (Página 3, Lineamiento 4)
    if (!amount || amount <= 0 || amount > 10000) {
        showToast(`Por favor ingresa una cantidad válida entre 1 y 10,000 para ${tableName}.`, true);
        input.focus();
        return;
    }

    // Manejo de estado: Bloquear UI (Página 4, Lineamiento 4)
    button.classList.add('loading');
    button.disabled = true;
    input.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tableName: tableName,
                rowCount: amount
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(result.message || `Se han insertado ${result.data.insertedRows} registros correctamente.`);
            input.value = ''; 
        } else {
            // Mapeo dinámico de errores relacionales o de validación (Estructura de Control Global)
            const errorMessage = result.message || 'Error al insertar los registros.';
            const errorDetail = result.errorDetail ? `<br><small style="font-size:0.8rem; display:block; margin-top:5px; color:#ff8b8b;">${result.errorDetail}</small>` : '';
            showToast(`${errorMessage} ${errorDetail}`, true);
        }

    } catch (error) {
        showToast(`Error crítico de red: ${error.message}`, true);
    } finally {
        // Liberar estado de carga
        button.classList.remove('loading');
        button.disabled = false;
        input.disabled = false;
    }
}

// Sistema de notificaciones (Toast)
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.style.borderLeftColor = 'var(--danger)';
    
    toast.innerHTML = `
        <div style="font-size: 1.2rem; flex-shrink: 0;">${isError ? '⚠️' : '✨'}</div>
        <div style="font-size: 0.95rem; line-height: 1.4; width: 100%; text-align: left;">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    void toast.offsetWidth; // Trigger reflow
    toast.classList.add('show');

    const displayTime = isError ? 7000 : 4000;

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, displayTime);
}

// Iniciar
document.addEventListener('DOMContentLoaded', fetchTables);