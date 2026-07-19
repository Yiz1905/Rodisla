const API = '/api';

// Estado actual de paginación y filtros
let currentPage = 1;
let currentParams = {};

// --- Renderizar productos ---
async function cargarProductos(params = {}, page = 1) {
  try {
    currentParams = params;
    currentPage = page;

    const query = new URLSearchParams(params);
    query.set('page', page);
    query.set('limit', 12);

    const res = await fetch(`${API}/rodamientos?${query.toString()}`);
    const data = await res.json();
    const { productos, paginacion } = data;

    const grid = document.querySelector('.catalog-grid');
    const counter = document.getElementById('result-count');

    if (productos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 1.1rem;">No se encontraron productos con los filtros seleccionados.</p>';
    } else {
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
    }

    if (counter) counter.textContent = paginacion.total;

    // Eventos de carrito
    document.querySelectorAll('.cart-icon').forEach(btn => {
      btn.addEventListener('click', () => agregarAlCarrito(btn.dataset.id));
    });

    // Renderizar paginación
    renderPagination(paginacion);
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

// --- Renderizar paginación dinámica ---
function renderPagination({ page, totalPages, total }) {
  const container = document.querySelector('.catalog-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Botón anterior
  html += `<button class="pagination-button ${page === 1 ? 'disabled' : ''}" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>←</button>`;

  // Lógica de numeración inteligente
  const pages = getVisiblePages(page, totalPages);

  pages.forEach(p => {
    if (p === '...') {
      html += `<span class="pagination-ellipsis">…</span>`;
    } else {
      html += `<button class="pagination-button ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  // Botón siguiente
  html += `<button class="pagination-button ${page === totalPages ? 'disabled' : ''}" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>→</button>`;

  container.innerHTML = html;

  // Eventos de paginación
  container.querySelectorAll('.pagination-button:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const newPage = parseInt(btn.dataset.page);
      if (newPage >= 1 && newPage <= totalPages) {
        cargarProductos(currentParams, newPage);
        // Scroll suave arriba
        document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// --- Determinar qué páginas mostrar ---
function getVisiblePages(current, total) {
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  // Siempre mostrar primera página
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  // Páginas alrededor de la actual
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  // Siempre mostrar última página
  pages.push(total);

  return pages;
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
  cargarProductos(q ? { search: q } : {}, 1);
});

// --- Filtros superiores ---
document.getElementById('apply-filters')?.addEventListener('click', () => {
  const categoria = document.getElementById('category-select')?.value || '';
  const marca = document.getElementById('brand-select')?.value || '';
  const precioMin = document.getElementById('price-min')?.value || '';
  const precioMax = document.getElementById('price-max')?.value || '';

  const params = {};
  if (categoria) params.categoria = categoria;
  if (marca) params.marca = marca;
  if (precioMin) params.precio_min = precioMin;
  if (precioMax) params.precio_max = precioMax;

  cargarProductos(params, 1);
});

// --- Navegación del sidebar ---
document.querySelectorAll('.nav-menu-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-menu-item').forEach(item => item.classList.remove('active'));
    link.closest('.nav-menu-item').classList.add('active');
  });
});

// --- Cargar productos al inicio ---
cargarProductos();
