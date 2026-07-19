const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// ==================== USUARIOS ====================

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/admin/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, email, telefono, rol FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/usuarios - Crear usuario
router.post('/admin/usuarios', async (req, res) => {
  try {
    const { nombre, email, telefono, rol, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, password, telefono || '', rol || 'cliente']
    );
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/usuarios/:id - Editar usuario
router.put('/admin/usuarios/:id', async (req, res) => {
  try {
    const { nombre, email, telefono, rol, password } = req.body;
    const fields = [];
    const values = [];

    if (nombre) { fields.push('nombre = ?'); values.push(nombre); }
    if (email) { fields.push('email = ?'); values.push(email); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
    if (rol) { fields.push('rol = ?'); values.push(rol); }
    if (password) { fields.push('password = ?'); values.push(password); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/usuarios/:id - Eliminar usuario
router.delete('/admin/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PEDIDOS (Admin) ====================

// GET /api/admin/pedidos - Listar todos los pedidos
router.get('/admin/pedidos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.metodo, p.estado AS pago_estado, p.monto AS pago_monto
       FROM ordenes o
       LEFT JOIN pagos p ON o.id = p.pedido_id
       ORDER BY o.id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/pedidos/:id - Actualizar estado de pedido
router.put('/admin/pedidos/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado es obligatorio' });
    await pool.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ message: 'Pedido actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FACTURAS (Pagos) ====================

// GET /api/admin/facturas - Listar todas las facturas/pagos
router.get('/admin/facturas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pagos ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/facturas/:id - Actualizar estado de factura
router.put('/admin/facturas/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado es obligatorio' });
    await pool.query('UPDATE pagos SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ message: 'Factura actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVEEDORES ====================

// GET /api/admin/proveedores
router.get('/admin/proveedores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proveedores ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/proveedores
router.post('/admin/proveedores', async (req, res) => {
  try {
    const { nombre, contacto, email, telefono, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, contacto, email, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
      [nombre, contacto || '', email || '', telefono || '', direccion || '']
    );
    res.status(201).json({ message: 'Proveedor creado', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/proveedores/:id
router.put('/admin/proveedores/:id', async (req, res) => {
  try {
    const { nombre, contacto, email, telefono, direccion } = req.body;
    const fields = [];
    const values = [];
    if (nombre) { fields.push('nombre = ?'); values.push(nombre); }
    if (contacto !== undefined) { fields.push('contacto = ?'); values.push(contacto); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
    if (direccion !== undefined) { fields.push('direccion = ?'); values.push(direccion); }
    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    values.push(req.params.id);
    await pool.query(`UPDATE proveedores SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/proveedores/:id
router.delete('/admin/proveedores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM proveedores WHERE id = ?', [req.params.id]);
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDEN DE COMPRA ====================

// GET /api/admin/orden-compra
router.get('/admin/orden-compra', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT oc.*, pr.nombre AS proveedor_nombre, r.nombre AS producto_nombre
       FROM orden_compra oc
       LEFT JOIN proveedores pr ON oc.proveedor_id = pr.id
       LEFT JOIN rodamientos r ON oc.producto_id = r.id
       ORDER BY oc.id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/orden-compra
router.post('/admin/orden-compra', async (req, res) => {
  try {
    const { proveedor_id, producto_id, cantidad, total } = req.body;
    if (!proveedor_id || !producto_id) {
      return res.status(400).json({ error: 'Proveedor y producto son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO orden_compra (proveedor_id, producto_id, cantidad, total, estado) VALUES (?, ?, ?, ?, ?)',
      [proveedor_id, producto_id, cantidad || 1, total || 0, 'pendiente']
    );
    res.status(201).json({ message: 'Orden de compra creada', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/orden-compra/:id
router.put('/admin/orden-compra/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado es obligatorio' });
    await pool.query('UPDATE orden_compra SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ message: 'Orden de compra actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/orden-compra/:id
router.delete('/admin/orden-compra/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orden_compra WHERE id = ?', [req.params.id]);
    res.json({ message: 'Orden de compra eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FACTURAS PROVEEDOR ====================

// GET /api/admin/facturas-proveedor
router.get('/admin/facturas-proveedor', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fp.*, pr.nombre AS proveedor_nombre
       FROM facturas_proveedor fp
       LEFT JOIN proveedores pr ON fp.proveedor_id = pr.id
       ORDER BY fp.id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/facturas-proveedor
router.post('/admin/facturas-proveedor', async (req, res) => {
  try {
    const { proveedor_id, orden_compra_id, monto, fecha_vencimiento } = req.body;
    if (!proveedor_id) return res.status(400).json({ error: 'Proveedor es obligatorio' });
    const [result] = await pool.query(
      'INSERT INTO facturas_proveedor (proveedor_id, orden_compra_id, monto, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, ?)',
      [proveedor_id, orden_compra_id || null, monto || 0, fecha_vencimiento || null, 'pendiente']
    );
    res.status(201).json({ message: 'Factura de proveedor creada', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/facturas-proveedor/:id
router.put('/admin/facturas-proveedor/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado es obligatorio' });
    await pool.query('UPDATE facturas_proveedor SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ message: 'Factura de proveedor actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/facturas-proveedor/:id
router.delete('/admin/facturas-proveedor/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM facturas_proveedor WHERE id = ?', [req.params.id]);
    res.json({ message: 'Factura de proveedor eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RODAMIENTOS (Admin CRUD) ====================

// POST /api/admin/rodamientos - Crear rodamiento
router.post('/admin/rodamientos', async (req, res) => {
  try {
    const { nombre, codigo, marca, categoria, imagen, precio, stock } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const [result] = await pool.query(
      'INSERT INTO rodamientos (nombre, codigo, marca, categoria, imagen, precio, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, codigo || '', marca || '', categoria || '', imagen || '', precio || 0, stock || 0]
    );
    res.status(201).json({ message: 'Rodamiento creado', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/rodamientos/:id - Editar rodamiento
router.put('/admin/rodamientos/:id', async (req, res) => {
  try {
    const { nombre, codigo, marca, categoria, imagen, precio, stock } = req.body;
    const fields = [];
    const values = [];
    if (nombre) { fields.push('nombre = ?'); values.push(nombre); }
    if (codigo !== undefined) { fields.push('codigo = ?'); values.push(codigo); }
    if (marca !== undefined) { fields.push('marca = ?'); values.push(marca); }
    if (categoria !== undefined) { fields.push('categoria = ?'); values.push(categoria); }
    if (imagen !== undefined) { fields.push('imagen = ?'); values.push(imagen); }
    if (precio !== undefined) { fields.push('precio = ?'); values.push(precio); }
    if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    values.push(req.params.id);
    await pool.query(`UPDATE rodamientos SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Rodamiento actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/rodamientos/:id
router.delete('/admin/rodamientos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rodamientos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Rodamiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVIDAD ====================

// GET /api/admin/actividad
router.get('/admin/actividad', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, u.nombre AS usuario_nombre FROM actividad_empleados a LEFT JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.id DESC LIMIT 20'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
