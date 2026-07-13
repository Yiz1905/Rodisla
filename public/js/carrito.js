const API = '/api';

// --- Obtener usuario logueado ---
function getUsuario() {
  return JSON.parse(localStorage.getItem('usuario'));
}

// --- Mostrar cantidad en el botón del carrito ---
async function actualizarBadgeCarrito() {
  const usuario = getUsuario();
  if (!usuario) return;

  try {
    const res = await fetch(`${API}/carrito/${usuario.id}`);
    const items = await res.json();
    const badge = document.querySelector('.cart-badge');
    const total = items.reduce((sum, i) => sum + i.cantidad, 0);
    if (badge) badge.textContent = total;
  } catch (err) {
    console.error('Error al obtener carrito:', err);
  }
}

// --- Abrir modal del carrito ---
async function abrirCarrito() {
  const usuario = getUsuario();
  if (!usuario) return alert('Debes iniciar sesión primero');

  try {
    const res = await fetch(`${API}/carrito/${usuario.id}`);
    const items = await res.json();

    const modal = document.createElement('div');
    modal.className = 'carrito-modal';
    modal.innerHTML = `
      <div class="carrito-overlay"></div>
      <div class="carrito-panel">
        <div class="carrito-header">
          <h2>Carrito</h2>
          <button class="carrito-cerrar">&times;</button>
        </div>
        <div class="carrito-body">
          ${items.length === 0
            ? '<p style="text-align:center;color:#888;">Carrito vacío</p>'
            : items.map(item => `
              <div class="carrito-item" data-id="${item.id}">
                <img src="${item.imagen || 'https://via.placeholder.com/60'}" alt="${item.nombre}" />
                <div class="carrito-item-info">
                  <strong>${item.nombre}</strong>
                  <small>REF: ${item.codigo}</small>
                  <span>$${item.precio} x ${item.cantidad}</span>
                </div>
                <button class="carrito-eliminar" data-id="${item.id}">&times;</button>
              </div>
            `).join('')}
        </div>
        <div class="carrito-footer">
          <strong>Total: $${items.reduce((s, i) => s + i.precio * i.cantidad, 0).toFixed(2)} USD</strong>
          <button class="carrito-pagar" ${items.length === 0 ? 'disabled' : ''}>Realizar Pedido</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cerrar modal
    modal.querySelector('.carrito-cerrar').addEventListener('click', () => modal.remove());
    modal.querySelector('.carrito-overlay').addEventListener('click', () => modal.remove());

    // Eliminar item
    modal.querySelectorAll('.carrito-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch(`${API}/carrito/${btn.dataset.id}`, { method: 'DELETE' });
        modal.remove();
        abrirCarrito();
        actualizarBadgeCarrito();
      });
    });

    // Realizar pedido
    modal.querySelector('.carrito-pagar')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API}/ordenes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuario.id, metodo_pago: 'efectivo' })
        });
        const data = await res.json();
        alert(data.message);
        modal.remove();
        actualizarBadgeCarrito();
      } catch (err) {
        alert('Error al crear la orden');
      }
    });
  } catch (err) {
    console.error('Error al abrir carrito:', err);
  }
}

// --- Evento del botón carrito en el header ---
document.querySelector('.cart-button')?.addEventListener('click', abrirCarrito);

// --- Al cargar la página, actualizar badge ---
actualizarBadgeCarrito();