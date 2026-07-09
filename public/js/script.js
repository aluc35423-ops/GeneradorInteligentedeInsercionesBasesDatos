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
let currentPreviewData = []; // Guardará los datos temporalmente
let currentTableName = '';   // Guardará la tabla destino

async function handleInsert(tableName, button) {
    const input = document.getElementById(`input-${tableName}`);
    const amount = parseInt(input.value);

    if (!amount || amount <= 0 || amount > 10000) {
        showToast(`Cantidad inválida para ${tableName}.`, true);
        input.focus(); return;
    }

    button.classList.add('loading');
    button.disabled = true;

    try {
        // 1. Pedimos la VISTA PREVIA
        const response = await fetch(`${API_BASE_URL}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, rowCount: amount })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            currentPreviewData = result.data;
            currentTableName = tableName;
            renderPreviewModal(tableName, currentPreviewData);
        } else {
            showToast(result.message, true);
        }
    } catch (error) {
        showToast(`Error de red: ${error.message}`, true);
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// 2. Dibuja los datos en el Modal
function renderPreviewModal(tableName, data) {
    document.getElementById('preview-table-name').textContent = tableName;
    const thead = document.getElementById('preview-thead');
    const tbody = document.getElementById('preview-tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length > 0) {
        // Cabeceras (nombres de columnas)
        const columns = Object.keys(data[0]);
        const trHead = document.createElement('tr');
        columns.forEach(col => {
            trHead.innerHTML += `<th>${col}</th>`;
        });
        thead.appendChild(trHead);

        // Filas (mostramos máximo 10 en la vista previa para no saturar)
        const previewLimit = data.slice(0, 10);
        previewLimit.forEach(row => {
            const trBody = document.createElement('tr');
            columns.forEach(col => {
                trBody.innerHTML += `<td>${row[col]}</td>`;
            });
            tbody.appendChild(trBody);
        });

        if(data.length > 10) {
            tbody.innerHTML += `<tr><td colspan="${columns.length}" style="text-align:center; opacity:0.5;">... y ${data.length - 10} registros más listos para insertar</td></tr>`;
        }
    }

    // Mostrar modal
    const modal = document.getElementById('preview-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

// 3. Confirmar la Inserción a la Base de Datos
document.getElementById('btn-confirm-insert').addEventListener('click', async function() {
    const btn = this;
    btn.classList.add('loading');
    btn.textContent = 'Insertando...';

    try {
        const response = await fetch(`${API_BASE_URL}/insert-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName: currentTableName, rows: currentPreviewData })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(result.message);
            document.getElementById(`input-${currentTableName}`).value = ''; 
            closeModal();
        } else {
            showToast(result.message || 'Error en inserción.', true);
        }
    } catch (error) {
        showToast(`Error de red: ${error.message}`, true);
    } finally {
        btn.classList.remove('loading');
        btn.textContent = 'Confirmar e Insertar';
    }
});

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