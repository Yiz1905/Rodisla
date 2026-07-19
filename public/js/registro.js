const API = '/api';

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const terms = document.querySelector('input[name="terms"]').checked;

  // Validaciones
  if (!nombre || !email || !telefono || !password) {
    return mostrarError('Todos los campos son obligatorios');
  }

  if (password !== confirmPassword) {
    return mostrarError('Las contraseñas no coinciden');
  }

  if (password.length < 6) {
    return mostrarError('La contraseña debe tener al menos 6 caracteres');
  }

  if (!terms) {
    return mostrarError('Debes aceptar los términos y condiciones');
  }

  try {
    const res = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return mostrarError(data.error || 'Error al registrar');
    }

    mostrarExito('Cuenta creada correctamente. Redirigiendo al login...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  } catch (err) {
    mostrarError('Error de conexión con el servidor');
  }
});

function mostrarError(msg) {
  limpiarMensajes();
  const error = document.createElement('p');
  error.className = 'login-error';
  error.style.cssText = 'color: #d32f2f; text-align: center; margin-top: 12px; font-size: 0.9rem; font-weight: 600;';
  error.textContent = msg;
  document.getElementById('register-form').appendChild(error);
}

function mostrarExito(msg) {
  limpiarMensajes();
  const exito = document.createElement('p');
  exito.className = 'login-success';
  exito.style.cssText = 'color: #2e7d32; text-align: center; margin-top: 12px; font-size: 0.9rem; font-weight: 600;';
  exito.textContent = msg;
  document.getElementById('register-form').appendChild(exito);
}

function limpiarMensajes() {
  const existente = document.querySelector('.login-error, .login-success');
  if (existente) existente.remove();
}
