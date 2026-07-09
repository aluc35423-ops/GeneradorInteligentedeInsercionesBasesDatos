//Este script valida el botón, muestra una animación de carga, y luego redirige hacia el index.html de Lalo
document
  .getElementById("conexion-form")
  .addEventListener("submit", function (e) {
    e.preventDefault(); // Evita recargar la página

    const btn = document.getElementById("btn-conectar");
    const text = document.getElementById("btn-text");
    const spinner = document.getElementById("spinner");

    // Cambiar estado visual a cargando
    btn.disabled = true;
    text.textContent = "Conectando al servidor...";
    spinner.classList.remove("hidden");

    // Simulamos el tiempo de conexión a la BD
    setTimeout(() => {
      // Redirige al archivo de Lalo que actualmente se llama index.html en la carpeta public
      window.location.href = "generador.html";
    }, 1500);
  });
