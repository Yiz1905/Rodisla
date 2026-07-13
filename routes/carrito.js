const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// GET /api/carrito/:usuario_id - Ver carrito de un usuario
router.get('/carrito/:usuario_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.cantidad, r.id AS producto_id, r.nombre, r.codigo, r.precio, r.imagen
       FROM carrito c
       JOIN rodamientos r ON c.producto_id = r.id
       WHERE c.usuario_id = ?`,
      [req.params.usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/carrito - Agregar item al carrito
router.post('/carrito', async (req, res) => {
  try {
    const { usuario_id, producto_id, cantidad } = req.body;

    // Verificar si ya existe el producto en el carrito del usuario
    const [existing] = await pool.query(
      'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
      [usuario_id, producto_id]
    );

    if (existing.length > 0) {
      // Si existe, actualizar cantidad
      const newCantidad = existing[0].cantidad + (cantidad || 1);
      await pool.query('UPDATE carrito SET cantidad = ? WHERE id = ?', [newCantidad, existing[0].id]);
      res.json({ message: 'Cantidad actualizada' });
    } else {
      // Si no existe, insertar nuevo
      await pool.query(
        'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
        [usuario_id, producto_id, cantidad || 1]
      );
      res.status(201).json({ message: 'Producto agregado al carrito' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/carrito/:id - Eliminar item del carrito
router.delete('/carrito/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM carrito WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado del carrito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;