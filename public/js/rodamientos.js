const API = '/api';

// --- Renderizar productos ---
async function cargarProductos(params = '') {
  try {
    const res = await fetch(`${API}/rodamientos${params}`);
    const productos = await res.json();
    const grid = document.querySelector('.catalog-grid');
    grid.innerHTML = productos.map(p => `
      <article class="catalog-card">
        <div class="card-image">
          <img src="${p.imagen || 'https://via.placeholder.com/360x260?text=Sin+Imagen'}" alt="${p.nombre}" />
          <span class="card-badge">${p.stock > 0 ? 'Disponible' : 'Agotado'}</span>
        </div>
        <div class="card-body">
          <small class="card-brand">${p.marca || ''}</small>
          <h2 class="card-title">${p.nombre}</h2>
          <p class="card-ref">REF: ${p.codigo}</p>
        </div>
        <div class="card-footer">
          <span class="card-price">$${p.precio} USD</span>
          <button class="cart-icon" type="button" data-id="${p.id}" aria-label="Agregar al carrito">🛒</button>
        </div>
      </article>
    `).join('');

    document.querySelectorAll('.cart-icon').forEach(btn => {
      btn.addEventListener('click', () => agregarAlCarrito(btn.dataset.id));
    });
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

// --- Agregar al carrito ---
async function agregarAlCarrito(productoId) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) return alert('Debes iniciar sesión primero');

  try {
    const res = await fetch(`${API}/carrito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuario.id, producto_id: productoId, cantidad: 1 })
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error('Error al agregar al carrito:', err);
  }
}

// --- Búsqueda ---
document.querySelector('.search-form').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.querySelector('.search-input').value;
  cargarProductos(`?search=${encodeURIComponent(q)}`);
});

// --- Filtro por categoría (sidebar) ---
document.querySelectorAll('.category-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const categoria = item.querySelector('span').textContent;
    cargarProductos(`?categoria=${encodeURIComponent(categoria)}`);
  });
});

// --- Filtro por marca ---
document.getElementById('brand-select')?.addEventListener('change', e => {
  const marca = e.target.value;
  cargarProductos(marca && marca !== 'Todas las marcas' ? `?marca=${encodeURIComponent(marca)}` : '');
});

// --- Cargar productos al inicio ---
cargarProductos();

// --- Estado de sesión en el header ---
function actualizarSesion() {
  const usuario = getUsuario();
  const loginLink = document.querySelector('.header-right a');
  if (usuario && loginLink) {
    loginLink.textContent = `Cerrar sesión (${usuario.nombre})`;
    loginLink.href = '#';
    loginLink.addEventListener('click', () => {
      localStorage.removeItem('usuario');
      window.location.reload();
    });
  }
}
actualizarSesion();