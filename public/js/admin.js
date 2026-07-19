/* ===== RODISLA ADMIN PANEL ===== */
const API = '/api';

const AdminApp = {
    currentSection: 'dashboard',
    data: {
        rodamientos: [],
        usuarios: [],
        carritos: [],
        pedidos: [],
        facturas: [],
        proveedores: [],
        ordenCompra: [],
        facturasProveedor: [],
    },
    editingId: null,
    editingType: null,

    /* ==================== INIT ==================== */
    init() {
        this.checkAuth();
        this.bindNav();
        this.bindMenuToggle();
        this.bindLogout();
        this.bindSearchFilters();
        this.loadSection('dashboard');
    },

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('usuario'));
        if (!user || (user.rol !== 'admin' && user.rol !== 'empleado')) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('admin-user-name').textContent = user.nombre;
        document.getElementById('admin-role-badge').textContent = user.rol === 'admin' ? 'Admin' : 'Empleado';
    },

    /* ==================== NAVIGATION ==================== */
    bindNav() {
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.querySelector('.admin-nav-link').addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
                // close mobile sidebar
                document.querySelector('.admin-sidebar').classList.remove('open');
            });
        });
    },

    loadSection(section) {
        this.currentSection = section;

        // Update nav active
        document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.admin-nav-item[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'rodamientos': 'Rodamientos',
            'clientes': 'Clientes',
            'carritos': 'Carritos de Clientes',
            'pedidos': 'Pedidos',
            'facturas': 'Facturas',
            'proveedores': 'Proveedores',
            'orden-compra': 'Órdenes de Compra',
            'facturas-proveedor': 'Facturas de Proveedores',
            'usuarios': 'Usuarios'
        };
        document.getElementById('page-title').textContent = titles[section] || section;

        // Load data
        this.loadSectionData(section);
    },

    bindMenuToggle() {
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.querySelector('.admin-sidebar').classList.toggle('open');
        });
    },

    bindLogout() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    },

    /* ==================== LOAD DATA ==================== */
    async loadSectionData(section) {
        try {
            switch (section) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'rodamientos': await this.loadRodamientos(); break;
                case 'clientes': await this.loadClientes(); break;
                case 'carritos': await this.loadCarritoUsuarios(); break;
                case 'pedidos': await this.loadPedidos(); break;
                case 'facturas': await this.loadFacturas(); break;
                case 'proveedores': await this.loadProveedores(); break;
                case 'orden-compra': await this.loadOrdenCompra(); break;
                case 'facturas-proveedor': await this.loadFacturasProveedor(); break;
                case 'usuarios': await this.loadUsuarios(); break;
            }
        } catch (err) {
            this.toast('Error al cargar datos: ' + err.message, 'error');
        }
    },

    /* ==================== DASHBOARD ==================== */
    async loadDashboard() {
        const [rodamientos, pedidos, usuarios, pagos] = await Promise.all([
            this.fetch('/rodamientos?limit=1'),
            this.fetch('/admin/pedidos'),
            this.fetch('/admin/usuarios'),
            this.fetch('/admin/facturas'),
        ]);

        document.getElementById('stat-productos').textContent = rodamientos.paginacion?.total || 0;
        document.getElementById('stat-pedidos').textContent = pedidos.length || 0;
        document.getElementById('stat-clientes').textContent = usuarios.filter(u => u.rol === 'cliente').length || 0;

        const totalVentas = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto), 0);
        document.getElementById('stat-ventas').textContent = '$' + totalVentas.toLocaleString();

        // Pedidos recientes
        const recentOrders = pedidos.slice(0, 5);
        const tbody = document.getElementById('dashboard-pedidos');
        if (recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay pedidos aún</p></td></tr>';
        } else {
            tbody.innerHTML = recentOrders.map(p => `
                <tr>
                    <td>#${p.id}</td>
                    <td>${p.usuario_id}</td>
                    <td>$${Number(p.total).toLocaleString()}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>${p.fecha ? new Date(p.fecha).toLocaleDateString() : '-'}</td>
                </tr>
            `).join('');
        }

        // Actividad
        const actList = document.getElementById('dashboard-actividad');
        const actividades = await this.fetch('/admin/actividad').catch(() => []);
        if (actividades.length === 0) {
            actList.innerHTML = '<div class="empty-state"><p>No hay actividad reciente</p></div>';
        } else {
            actList.innerHTML = actividades.slice(0, 8).map(a => `
                <div class="activity-item">
                    <div class="activity-dot"></div>
                    <div class="activity-text">
                        <strong>${a.accion}</strong> — ${a.detalle || 'Sin detalle'}
                    </div>
                </div>
            `).join('');
        }
    },

    /* ==================== RODAMIENTOS ==================== */
    async loadRodamientos() {
        const res = await this.fetch('/rodamientos?limit=100');
        this.data.rodamientos = res.productos || [];
        this.renderRodamientos();
    },

    renderRodamientos() {
        const search = (document.getElementById('search-rodamientos')?.value || '').toLowerCase();
        const cat = document.getElementById('filter-cat-rodamientos')?.value || '';

        let filtered = this.data.rodamientos.filter(r => {
            const matchSearch = !search || r.nombre.toLowerCase().includes(search) || r.codigo?.toLowerCase().includes(search);
            const matchCat = !cat || r.categoria === cat;
            return matchSearch && matchCat;
        });

        const tbody = document.getElementById('table-rodamientos');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><p>No se encontraron rodamientos</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(r => `
            <tr>
                <td>${r.id}</td>
                <td><img class="table-thumb" src="Imagenes/${r.imagen || 'placeholder.png'}" alt="${r.nombre}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f1f3f5%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2224%22 text-anchor=%22middle%22 font-size=%2212%22>📦</text></svg>'"></td>
                <td><strong>${r.nombre}</strong></td>
                <td>${r.codigo || '-'}</td>
                <td>${r.marca || '-'}</td>
                <td>${r.categoria || '-'}</td>
                <td>$${Number(r.precio).toLocaleString()}</td>
                <td>${r.stock ?? '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-sm btn-edit" onclick="AdminApp.editRodamiento(${r.id})">Editar</button>
                        <button class="btn btn-sm btn-delete" onclick="AdminApp.deleteItem('rodamientos', ${r.id})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    editRodamiento(id) {
        const r = this.data.rodamientos.find(x => x.id === id);
        if (!r) return;
        this.editingId = id;
        this.editingType = 'rodamiento';
        this.openModal('rodamiento', r);
    },

    /* ==================== CLIENTES ==================== */
    async loadClientes() {
        const all = await this.fetch('/admin/usuarios');
        this.data.usuarios = all;
        this.data.clientes = all.filter(u => u.rol === 'cliente');
        this.renderClientes();
    },

    renderClientes() {
        const search = (document.getElementById('search-clientes')?.value || '').toLowerCase();
        let filtered = (this.data.clientes || []).filter(c => {
            return !search || c.nombre.toLowerCase().includes(search) || c.email?.toLowerCase().includes(search);
        });

        const tbody = document.getElementById('table-clientes');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay clientes</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><strong>${c.nombre}</strong></td>
                <td>${c.email || '-'}</td>
                <td>${c.telefono || '-'}</td>
                <td><span class="badge badge-${c.rol}">${c.rol}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-sm btn-view" onclick="AdminApp.verCarritoCliente(${c.id})">Ver Carrito</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    verCarritoCliente(usuarioId) {
        document.getElementById('filter-usuario-carrito').value = usuarioId;
        this.loadSection('carritos');
        setTimeout(() => this.verCarrito(), 300);
    },

    /* ==================== CARRITOS ==================== */
    async loadCarritoUsuarios() {
        const users = await this.fetch('/admin/usuarios');
        const clientes = users.filter(u => u.rol === 'cliente');
        const select = document.getElementById('filter-usuario-carrito');
        const current = select.value;
        select.innerHTML = '<option value="">Seleccionar cliente...</option>' +
            clientes.map(u => `<option value="${u.id}" ${String(u.id) === current ? 'selected' : ''}>${u.nombre} (${u.email})</option>`).join('');
    },

    async verCarrito() {
        const usuarioId = document.getElementById('filter-usuario-carrito').value;
        if (!usuarioId) {
            this.toast('Selecciona un cliente primero', 'warning');
            return;
        }
        const items = await this.fetch(`/carrito/${usuarioId}`);
        const tbody = document.getElementById('table-carritos');
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Este cliente no tiene productos en el carrito</p></td></tr>';
            return;
        }
        tbody.innerHTML = items.map(i => `
            <tr>
                <td><strong>${i.nombre}</strong></td>
                <td>${i.codigo || '-'}</td>
                <td>$${Number(i.precio).toLocaleString()}</td>
                <td>${i.cantidad}</td>
                <td>$${(Number(i.precio) * i.cantidad).toLocaleString()}</td>
            </tr>
        `).join('');
    },

    /* ==================== PEDIDOS ==================== */
    async loadPedidos() {
        this.data.pedidos = await this.fetch('/admin/pedidos');
        this.renderPedidos();
    },

    renderPedidos() {
        const search = (document.getElementById('search-pedidos')?.value || '').toLowerCase();
        const estado = document.getElementById('filter-estado-pedidos')?.value || '';

        let filtered = this.data.pedidos.filter(p => {
            const matchSearch = !search || String(p.id).includes(search);
            const matchEstado = !estado || p.estado === estado;
            return matchSearch && matchEstado;
        });

        const tbody = document.getElementById('table-pedidos');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay pedidos</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td>${p.usuario_id}</td>
                <td>$${Number(p.total).toLocaleString()}</td>
                <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                <td>${p.pago_estado ? `<span class="badge badge-${p.pago_estado}">${p.pago_estado}</span>` : '-'}</td>
                <td>${p.fecha ? new Date(p.fecha).toLocaleDateString() : '-'}</td>
                <td>
                    <div class="actions-cell">
                        <select class="table-select" style="min-width:120px; padding:4px 8px; font-size:0.78rem;" onchange="AdminApp.updatePedidoEstado(${p.id}, this.value)">
                            <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en_proceso" ${p.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="entregado" ${p.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${p.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async updatePedidoEstado(id, estado) {
        try {
            await this.fetch(`/admin/pedidos/${id}`, 'PUT', { estado });
            this.toast('Estado actualizado', 'success');
            this.loadPedidos();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== FACTURAS ==================== */
    async loadFacturas() {
        this.data.facturas = await this.fetch('/admin/facturas');
        this.renderFacturas();
    },

    renderFacturas() {
        const estado = document.getElementById('filter-estado-facturas')?.value || '';
        let filtered = this.data.facturas.filter(f => !estado || f.estado === estado);

        const tbody = document.getElementById('table-facturas');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay facturas</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(f => `
            <tr>
                <td>#${f.id}</td>
                <td>${f.pedido_id || '-'}</td>
                <td>${f.metodo || '-'}</td>
                <td>$${Number(f.monto).toLocaleString()}</td>
                <td><span class="badge badge-${f.estado}">${f.estado}</span></td>
                <td>
                    <div class="actions-cell">
                        <select class="table-select" style="min-width:110px; padding:4px 8px; font-size:0.78rem;" onchange="AdminApp.updateFacturaEstado(${f.id}, this.value)">
                            <option value="pendiente" ${f.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="pagado" ${f.estado === 'pagado' ? 'selected' : ''}>Pagado</option>
                            <option value="cancelado" ${f.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async updateFacturaEstado(id, estado) {
        try {
            await this.fetch(`/admin/facturas/${id}`, 'PUT', { estado });
            this.toast('Factura actualizada', 'success');
            this.loadFacturas();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== PROVEEDORES ==================== */
    async loadProveedores() {
        this.data.proveedores = await this.fetch('/admin/proveedores');
        this.renderProveedores();
    },

    renderProveedores() {
        const search = (document.getElementById('search-proveedores')?.value || '').toLowerCase();
        let filtered = this.data.proveedores.filter(p => !search || p.nombre.toLowerCase().includes(search));

        const tbody = document.getElementById('table-proveedores');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay proveedores registrados</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.contacto || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.telefono || '-'}</td>
                <td>${p.direccion || '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-sm btn-edit" onclick="AdminApp.editProveedor(${p.id})">Editar</button>
                        <button class="btn btn-sm btn-delete" onclick="AdminApp.deleteItem('proveedores', ${p.id})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    editProveedor(id) {
        const p = this.data.proveedores.find(x => x.id === id);
        if (!p) return;
        this.editingId = id;
        this.editingType = 'proveedor';
        this.openModal('proveedor', p);
    },

    /* ==================== ORDEN DE COMPRA ==================== */
    async loadOrdenCompra() {
        this.data.ordenCompra = await this.fetch('/admin/orden-compra');
        // also load suppliers for dropdowns
        if (this.data.proveedores.length === 0) {
            this.data.proveedores = await this.fetch('/admin/proveedores');
        }
        if (this.data.rodamientos.length === 0) {
            const res = await this.fetch('/rodamientos?limit=200');
            this.data.rodamientos = res.productos || [];
        }
        this.renderOrdenCompra();
    },

    renderOrdenCompra() {
        const estado = document.getElementById('filter-estado-oc')?.value || '';
        let filtered = this.data.ordenCompra.filter(o => !estado || o.estado === estado);

        const tbody = document.getElementById('table-orden-compra');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay órdenes de compra</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.proveedor_nombre || o.proveedor_id}</td>
                <td>${o.producto_nombre || o.producto_id}</td>
                <td>${o.cantidad}</td>
                <td>$${Number(o.total).toLocaleString()}</td>
                <td><span class="badge badge-${o.estado}">${o.estado}</span></td>
                <td>
                    <div class="actions-cell">
                        <select class="table-select" style="min-width:110px; padding:4px 8px; font-size:0.78rem;" onchange="AdminApp.updateOCEstado(${o.id}, this.value)">
                            <option value="pendiente" ${o.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="aprobada" ${o.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option>
                            <option value="recibida" ${o.estado === 'recibida' ? 'selected' : ''}>Recibida</option>
                            <option value="cancelada" ${o.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async updateOCEstado(id, estado) {
        try {
            await this.fetch(`/admin/orden-compra/${id}`, 'PUT', { estado });
            this.toast('Orden de compra actualizada', 'success');
            this.loadOrdenCompra();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== FACTURAS PROVEEDOR ==================== */
    async loadFacturasProveedor() {
        this.data.facturasProveedor = await this.fetch('/admin/facturas-proveedor');
        if (this.data.proveedores.length === 0) {
            this.data.proveedores = await this.fetch('/admin/proveedores');
        }
        if (this.data.ordenCompra.length === 0) {
            this.data.ordenCompra = await this.fetch('/admin/orden-compra');
        }
        this.renderFacturasProveedor();
    },

    renderFacturasProveedor() {
        const estado = document.getElementById('filter-estado-fp')?.value || '';
        let filtered = this.data.facturasProveedor.filter(f => !estado || f.estado === estado);

        const tbody = document.getElementById('table-facturas-proveedor');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay facturas de proveedores</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(f => `
            <tr>
                <td>#${f.id}</td>
                <td>${f.proveedor_nombre || f.proveedor_id}</td>
                <td>${f.orden_compra_id ? '#' + f.orden_compra_id : '-'}</td>
                <td>$${Number(f.monto).toLocaleString()}</td>
                <td><span class="badge badge-${f.estado}">${f.estado}</span></td>
                <td>${f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString() : '-'}</td>
                <td>
                    <div class="actions-cell">
                        <select class="table-select" style="min-width:100px; padding:4px 8px; font-size:0.78rem;" onchange="AdminApp.updateFPEstado(${f.id}, this.value)">
                            <option value="pendiente" ${f.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="pagada" ${f.estado === 'pagada' ? 'selected' : ''}>Pagada</option>
                            <option value="vencida" ${f.estado === 'vencida' ? 'selected' : ''}>Vencida</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async updateFPEstado(id, estado) {
        try {
            await this.fetch(`/admin/facturas-proveedor/${id}`, 'PUT', { estado });
            this.toast('Factura de proveedor actualizada', 'success');
            this.loadFacturasProveedor();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== USUARIOS ==================== */
    async loadUsuarios() {
        this.data.usuarios = await this.fetch('/admin/usuarios');
        this.renderUsuarios();
    },

    renderUsuarios() {
        const search = (document.getElementById('search-usuarios')?.value || '').toLowerCase();
        const rol = document.getElementById('filter-rol-usuarios')?.value || '';

        let filtered = this.data.usuarios.filter(u => {
            const matchSearch = !search || u.nombre.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search);
            const matchRol = !rol || u.rol === rol;
            return matchSearch && matchRol;
        });

        const tbody = document.getElementById('table-usuarios');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay usuarios</p></td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.nombre}</strong></td>
                <td>${u.email || '-'}</td>
                <td>${u.telefono || '-'}</td>
                <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-sm btn-edit" onclick="AdminApp.editUsuario(${u.id})">Editar</button>
                        <button class="btn btn-sm btn-delete" onclick="AdminApp.deleteItem('usuarios', ${u.id})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    editUsuario(id) {
        const u = this.data.usuarios.find(x => x.id === id);
        if (!u) return;
        this.editingId = id;
        this.editingType = 'usuario';
        this.openModal('usuario', u);
    },

    /* ==================== SEARCH/FILTER BINDINGS ==================== */
    bindSearchFilters() {
        // Rodamientos
        this._bindDebounce('search-rodamientos', () => this.renderRodamientos());
        this._bindChange('filter-cat-rodamientos', () => this.renderRodamientos());
        // Clientes
        this._bindDebounce('search-clientes', () => this.renderClientes());
        // Pedidos
        this._bindDebounce('search-pedidos', () => this.renderPedidos());
        this._bindChange('filter-estado-pedidos', () => this.renderPedidos());
        // Facturas
        this._bindChange('filter-estado-facturas', () => this.renderFacturas());
        // Proveedores
        this._bindDebounce('search-proveedores', () => this.renderProveedores());
        // OC
        this._bindChange('filter-estado-oc', () => this.renderOrdenCompra());
        // FP
        this._bindChange('filter-estado-fp', () => this.renderFacturasProveedor());
        // Usuarios
        this._bindDebounce('search-usuarios', () => this.renderUsuarios());
        this._bindChange('filter-rol-usuarios', () => this.renderUsuarios());
    },

    _bindDebounce(id, fn) {
        const el = document.getElementById(id);
        if (!el) return;
        let timer;
        el.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(fn, 300);
        });
    },

    _bindChange(id, fn) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', fn);
    },

    /* ==================== MODAL ==================== */
    openModal(type, data = null) {
        this.editingId = data ? data.id : null;
        this.editingType = type;

        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        const forms = {
            'rodamiento': {
                title: data ? 'Editar Rodamiento' : 'Nuevo Rodamiento',
                html: `
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="m-nombre" value="${data?.nombre || ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Código</label>
                                <input type="text" id="m-codigo" value="${data?.codigo || ''}">
                            </div>
                            <div class="form-group">
                                <label>Marca</label>
                                <select id="m-marca">
                                    <option value="SKF" ${data?.marca === 'SKF' ? 'selected' : ''}>SKF</option>
                                    <option value="NSK" ${data?.marca === 'NSK' ? 'selected' : ''}>NSK</option>
                                    <option value="NTN" ${data?.marca === 'NTN' ? 'selected' : ''}>NTN</option>
                                    <option value="FAG" ${data?.marca === 'FAG' ? 'selected' : ''}>FAG</option>
                                    <option value="KOYO" ${data?.marca === 'KOYO' ? 'selected' : ''}>KOYO</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Categoría</label>
                                <select id="m-categoria">
                                    <option value="Rodamientos" ${data?.categoria === 'Rodamientos' ? 'selected' : ''}>Rodamientos</option>
                                    <option value="Automotriz" ${data?.categoria === 'Automotriz' ? 'selected' : ''}>Automotriz</option>
                                    <option value="Industrial" ${data?.categoria === 'Industrial' ? 'selected' : ''}>Industrial</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Imagen (nombre archivo)</label>
                                <input type="text" id="m-imagen" value="${data?.imagen || ''}" placeholder="ej: rodamiento.jpg">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Precio ($)</label>
                                <input type="number" id="m-precio" min="0" step="0.01" value="${data?.precio || ''}">
                            </div>
                            <div class="form-group">
                                <label>Stock</label>
                                <input type="number" id="m-stock" min="0" value="${data?.stock ?? ''}">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-cancel" onclick="AdminApp.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminApp.saveRodamiento()">${data ? 'Guardar Cambios' : 'Crear'}</button>
                        </div>
                    </div>
                `
            },
            'proveedor': {
                title: data ? 'Editar Proveedor' : 'Nuevo Proveedor',
                html: `
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="m-nombre" value="${data?.nombre || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Contacto</label>
                            <input type="text" id="m-contacto" value="${data?.contacto || ''}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="m-email" value="${data?.email || ''}">
                            </div>
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="text" id="m-telefono" value="${data?.telefono || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" id="m-direccion" value="${data?.direccion || ''}">
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-cancel" onclick="AdminApp.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminApp.saveProveedor()">${data ? 'Guardar Cambios' : 'Crear'}</button>
                        </div>
                    </div>
                `
            },
            'usuario': {
                title: data ? 'Editar Usuario' : 'Nuevo Usuario',
                html: `
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="m-nombre" value="${data?.nombre || ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="m-email" value="${data?.email || ''}">
                            </div>
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="text" id="m-telefono" value="${data?.telefono || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Rol</label>
                            <select id="m-rol">
                                <option value="cliente" ${data?.rol === 'cliente' ? 'selected' : ''}>Cliente</option>
                                <option value="empleado" ${data?.rol === 'empleado' ? 'selected' : ''}>Empleado</option>
                                <option value="admin" ${data?.rol === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        ${!data ? `
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" id="m-password" placeholder="Mínimo 6 caracteres">
                        </div>
                        ` : ''}
                        <div class="modal-actions">
                            <button class="btn btn-cancel" onclick="AdminApp.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminApp.saveUsuario()">${data ? 'Guardar Cambios' : 'Crear'}</button>
                        </div>
                    </div>
                `
            },
            'orden-compra': {
                title: 'Nueva Orden de Compra',
                html: `
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Proveedor</label>
                            <select id="m-proveedor_id">
                                <option value="">Seleccionar...</option>
                                ${this.data.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Producto (Rodamiento)</label>
                            <select id="m-producto_id">
                                <option value="">Seleccionar...</option>
                                ${this.data.rodamientos.map(r => `<option value="${r.id}">${r.nombre} (${r.codigo || 'S/C'})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Cantidad</label>
                                <input type="number" id="m-cantidad" min="1" value="1">
                            </div>
                            <div class="form-group">
                                <label>Total ($)</label>
                                <input type="number" id="m-total" min="0" step="0.01" value="0">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-cancel" onclick="AdminApp.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminApp.saveOrdenCompra()">Crear</button>
                        </div>
                    </div>
                `
            },
            'factura-proveedor': {
                title: 'Nueva Factura de Proveedor',
                html: `
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Proveedor</label>
                            <select id="m-proveedor_id">
                                <option value="">Seleccionar...</option>
                                ${this.data.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Orden de Compra (opcional)</label>
                            <select id="m-orden_compra_id">
                                <option value="">Ninguna</option>
                                ${this.data.ordenCompra.map(o => `<option value="${o.id}">#${o.id} - ${o.proveedor_nombre || 'Proveedor ' + o.proveedor_id}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Monto ($)</label>
                                <input type="number" id="m-monto" min="0" step="0.01" value="0">
                            </div>
                            <div class="form-group">
                                <label>Fecha Vencimiento</label>
                                <input type="date" id="m-fecha_vencimiento">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-cancel" onclick="AdminApp.closeModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminApp.saveFacturaProveedor()">Crear</button>
                        </div>
                    </div>
                `
            },
        };

        const form = forms[type];
        if (!form) return;

        title.textContent = form.title;
        body.innerHTML = form.html;
        overlay.classList.add('open');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('open');
        this.editingId = null;
        this.editingType = null;
    },

    /* ==================== SAVE OPERATIONS ==================== */
    async saveRodamiento() {
        const body = {
            nombre: document.getElementById('m-nombre').value,
            codigo: document.getElementById('m-codigo').value,
            marca: document.getElementById('m-marca').value,
            categoria: document.getElementById('m-categoria').value,
            imagen: document.getElementById('m-imagen').value,
            precio: document.getElementById('m-precio').value,
            stock: document.getElementById('m-stock').value,
        };
        if (!body.nombre) { this.toast('El nombre es obligatorio', 'error'); return; }

        try {
            if (this.editingId) {
                await this.fetch(`/admin/rodamientos/${this.editingId}`, 'PUT', body);
                this.toast('Rodamiento actualizado', 'success');
            } else {
                await this.fetch('/admin/rodamientos', 'POST', body);
                this.toast('Rodamiento creado', 'success');
            }
            this.closeModal();
            this.loadRodamientos();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    async saveProveedor() {
        const body = {
            nombre: document.getElementById('m-nombre').value,
            contacto: document.getElementById('m-contacto').value,
            email: document.getElementById('m-email').value,
            telefono: document.getElementById('m-telefono').value,
            direccion: document.getElementById('m-direccion').value,
        };
        if (!body.nombre) { this.toast('El nombre es obligatorio', 'error'); return; }

        try {
            if (this.editingId) {
                await this.fetch(`/admin/proveedores/${this.editingId}`, 'PUT', body);
                this.toast('Proveedor actualizado', 'success');
            } else {
                await this.fetch('/admin/proveedores', 'POST', body);
                this.toast('Proveedor creado', 'success');
            }
            this.closeModal();
            this.loadProveedores();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    async saveUsuario() {
        const body = {
            nombre: document.getElementById('m-nombre').value,
            email: document.getElementById('m-email').value,
            telefono: document.getElementById('m-telefono').value,
            rol: document.getElementById('m-rol').value,
        };
        if (!body.nombre) { this.toast('El nombre es obligatorio', 'error'); return; }

        const pwField = document.getElementById('m-password');
        if (pwField) body.password = pwField.value;

        try {
            if (this.editingId) {
                await this.fetch(`/admin/usuarios/${this.editingId}`, 'PUT', body);
                this.toast('Usuario actualizado', 'success');
            } else {
                await this.fetch('/admin/usuarios', 'POST', body);
                this.toast('Usuario creado', 'success');
            }
            this.closeModal();
            this.loadUsuarios();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    async saveOrdenCompra() {
        const body = {
            proveedor_id: document.getElementById('m-proveedor_id').value,
            producto_id: document.getElementById('m-producto_id').value,
            cantidad: document.getElementById('m-cantidad').value,
            total: document.getElementById('m-total').value,
        };
        if (!body.proveedor_id || !body.producto_id) { this.toast('Selecciona proveedor y producto', 'error'); return; }

        try {
            await this.fetch('/admin/orden-compra', 'POST', body);
            this.toast('Orden de compra creada', 'success');
            this.closeModal();
            this.loadOrdenCompra();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    async saveFacturaProveedor() {
        const body = {
            proveedor_id: document.getElementById('m-proveedor_id').value,
            orden_compra_id: document.getElementById('m-orden_compra_id').value || null,
            monto: document.getElementById('m-monto').value,
            fecha_vencimiento: document.getElementById('m-fecha_vencimiento').value || null,
        };
        if (!body.proveedor_id) { this.toast('Selecciona un proveedor', 'error'); return; }

        try {
            await this.fetch('/admin/facturas-proveedor', 'POST', body);
            this.toast('Factura de proveedor creada', 'success');
            this.closeModal();
            this.loadFacturasProveedor();
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== DELETE ==================== */
    async deleteItem(type, id) {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            await this.fetch(`/admin/${type}/${id}`, 'DELETE');
            this.toast('Eliminado correctamente', 'success');
            this.loadSectionData(this.currentSection);
        } catch (err) {
            this.toast('Error: ' + err.message, 'error');
        }
    },

    /* ==================== UTILITIES ==================== */
    async fetch(endpoint, method = 'GET', body = null) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API}${endpoint}`, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error del servidor');
        return data;
    },

    toast(msg, type = 'success') {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = `admin-toast ${type} show`;
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};

/* Boot */
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
