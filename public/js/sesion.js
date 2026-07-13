// --- Obtener usuario logueado ---
function getUsuario() {
  return JSON.parse(localStorage.getItem('usuario'));
}

// --- Actualizar estado de sesión en el header ---
function actualizarSesion() {
  const usuario = getUsuario();
  const headerRight = document.querySelector('.header-right');

  const loginItem = headerRight?.querySelector('a');
  if (loginItem) loginItem.remove();

  const sesionItem = document.createElement(usuario ? 'button' : 'a');
  sesionItem.className = usuario ? '' : 'header-link';
  sesionItem.href = usuario ? '#' : './login.html';

  if (usuario) {
    sesionItem.textContent = `Cerrar sesión (${usuario.nombre})`;
    sesionItem.addEventListener('click', () => {
      localStorage.removeItem('usuario');
      window.location.reload();
    });
  }

  headerRight?.appendChild(sesionItem);
}

actualizarSesion();