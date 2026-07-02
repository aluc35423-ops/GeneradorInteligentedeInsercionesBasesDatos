        // Simulación de las tablas que leerías de tu base de datos
        const dbTables = [
            { id: 'users', name: 'Usuarios', currentRecords: 1432 },
            { id: 'products', name: 'Productos', currentRecords: 850 },
            { id: 'orders', name: 'Pedidos', currentRecords: 5621 },
            { id: 'inventory', name: 'Inventario', currentRecords: 320 }
        ];

        const grid = document.getElementById('tables-grid');
        const toastContainer = document.getElementById('toast-container');

        // Función para renderizar las tarjetas
        function renderTables() {
            dbTables.forEach((table, index) => {
                const delay = index * 0.15; // Efecto cascada
                
                const card = document.createElement('div');
                card.className = 'card';
                card.style.animation = `fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`;
                
                card.innerHTML = `
                    <div class="card-header">
                        <div class="table-name">${table.name}</div>
                        <div class="record-count">${table.currentRecords.toLocaleString()} rows</div>
                    </div>
                    <div class="input-group">
                        <label for="input-${table.id}">Cantidad a insertar</label>
                        <input type="number" id="input-${table.id}" placeholder="Ej. 100" min="1" max="10000">
                    </div>
                    <button class="btn" onclick="handleInsert('${table.id}', '${table.name}', this)">
                        Insertar Datos
                    </button>
                `;
                grid.appendChild(card);
            });
        }

        // Función que maneja el click del botón
        async function handleInsert(tableId, tableName, button) {
            const input = document.getElementById(`input-${tableId}`);
            const amount = parseInt(input.value);

            if (!amount || amount <= 0) {
                showToast(`Por favor ingresa una cantidad válida para ${tableName}.`, true);
                input.focus();
                return;
            }

            // Iniciar animación de carga en el botón
            button.classList.add('loading');
            input.disabled = true;

            try {
                // ⚠️ ACUERDA ESTOS DATOS CON TUS COMPAÑEROS DE BACKEND:
                // 1. La URL exacta (ej. http://localhost:3000/api/insertar)
                // 2. El formato del JSON que esperan recibir
                
                const response = await fetch('http://localhost:3000/api/generar-datos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tabla: tableId,
                        cantidad: amount
                    })
                });

                // Convertir la respuesta del backend a JSON
                const data = await response.json();

                // Si el backend responde con un código de error (ej. 400 o 500)
                if (!response.ok) {
                    throw new Error(data.mensaje || 'Hubo un problema al insertar los datos.');
                }

                // Si todo sale bien, actualizamos la interfaz
                const recordElement = button.parentElement.querySelector('.record-count');
                const current = parseInt(recordElement.textContent.replace(/\D/g, ''));
                recordElement.textContent = (current + amount).toLocaleString() + ' rows';

                // Mostrar notificación de éxito
                showToast(`¡Éxito! Se insertaron ${amount} registros en la tabla ${tableName}.`);

            } catch (error) {
                // Si el servidor está caído o hay un error, mostramos la notificación roja
                showToast(`Error de conexión: ${error.message}`, true);
                
            } finally {
                // El bloque finally siempre se ejecuta al terminar, haya éxito o error.
                // Aquí regresamos el botón y el input a la normalidad.
                button.classList.remove('loading');
                input.disabled = false;
                input.value = '';
            }
        }

        // Sistema de notificaciones elegante
        function showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            if (isError) toast.style.borderLeftColor = 'var(--danger)';
            
            toast.innerHTML = `
                <div style="font-size: 1.2rem">${isError ? '⚠️' : '✨'}</div>
                <div>${message}</div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Trigger reflow
            void toast.offsetWidth;
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400); // Esperar a que termine la animación
            }, 4000);
        }

        // Inicializar
        document.addEventListener('DOMContentLoaded', renderTables);