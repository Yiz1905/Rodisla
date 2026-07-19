const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// POST /api/ordenes - Crear orden desde el carrito
router.post('/ordenes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { usuario_id, metodo_pago } = req.body;

    await connection.beginTransaction();

    // Obtener items del carrito
    const [carrito] = await connection.query(
      `SELECT c.producto_id, c.cantidad, r.precio
       FROM carrito c
       JOIN rodamientos r ON c.producto_id = r.id
       WHERE c.usuario_id = ?`,
      [usuario_id]
    );

    if (carrito.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Calcular total
    const total = carrito.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

    // Crear la orden
    const [orden] = await connection.query(
      'INSERT INTO ordenes (usuario_id, total, estado) VALUES (?, ?, ?)',
      [usuario_id, total, 'pendiente']
    );

    // Insertar detalle de orden
    for (const item of carrito) {
      await connection.query(
        'INSERT INTO detalle_ordenes (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [orden.insertId, item.producto_id, item.cantidad, item.precio]
      );

      // Descontar stock
      await connection.query(
        'UPDATE rodamientos SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // Crear pago pendiente
    await connection.query(
      'INSERT INTO pagos (pedido_id, metodo, estado, monto) VALUES (?, ?, ?, ?)',
      [orden.insertId, metodo_pago, 'pendiente', total]
    );

    // Vaciar carrito
    await connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);

    // Registrar actividad
    await connection.query(
      'INSERT INTO actividad_empleados (usuario_id, accion, detalle) VALUES (?, ?, ?)',
      [usuario_id, 'orden_creada', `Orden #${orden.insertId} creada por $${total}`]
    );

    await connection.commit();
    res.status(201).json({ message: 'Orden creada', orden_id: orden.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// GET /api/ordenes/detalle/:orden_id - Detalle de una orden específica
router.get('/ordenes/detalle/:orden_id', async (req, res) => {
  try {
    const [detalle] = await pool.query(
      `SELECT d.*, r.nombre, r.codigo, r.imagen
       FROM detalle_ordenes d
       JOIN rodamientos r ON d.producto_id = r.id
       WHERE d.pedido_id = ?`,
      [req.params.orden_id]
    );
    res.json(detalle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ordenes/:usuario_id - Historial de órdenes de un usuario
router.get('/ordenes/:usuario_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.metodo, p.estado AS pago_estado, p.referencia
       FROM ordenes o
       LEFT JOIN pagos p ON o.id = p.pedido_id
       WHERE o.usuario_id = ?
       ORDER BY o.id DESC`,
      [req.params.usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;