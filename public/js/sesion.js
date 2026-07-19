// --- Obtener usuario logueado ---
function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch (error) {
    return null;
  }
}

// --- Actualizar estado de sesión en el header ---
function actualizarSesion() {
  const usuario = getUsuario();
  const headerRight = document.querySelector('.header-right');

  if (!headerRight) return;

  let sesionItem = headerRight.querySelector('.login-link');

  if (!sesionItem) {
    sesionItem = document.createElement('a');
    sesionItem.className = 'login-link';
    headerRight.appendChild(sesionItem);
  }

  if (usuario) {
    sesionItem.href = '#';
    sesionItem.textContent = `Cerrar sesión (${usuario.nombre || usuario.email || 'usuario'})`;
    sesionItem.onclick = (event) => {
      event.preventDefault();
      localStorage.removeItem('usuario');
      window.location.reload();
    };
  } else {
    sesionItem.href = './login.html';
    sesionItem.textContent = 'Iniciar Sesión';
    sesionItem.onclick = null;
  }
}

actualizarSesion();