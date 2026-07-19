const API = '/api';

document.querySelector('form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return mostrarError(data.error || 'Credenciales incorrectas');
    }

    localStorage.setItem('usuario', JSON.stringify(data));

    // Admin y empleado van al panel admin
    if (data.rol === 'admin' || data.rol === 'empleado') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
  } catch (err) {
    mostrarError('Error de conexión con el servidor');
  }
});

function mostrarError(msg) {
  const existente = document.querySelector('.login-error');
  if (existente) existente.remove();

  const error = document.createElement('p');
  error.className = 'login-error';
  error.style.cssText = 'color: #d32f2f; text-align: center; margin-top: 10px;';
  error.textContent = msg;
  document.querySelector('form').appendChild(error);
}