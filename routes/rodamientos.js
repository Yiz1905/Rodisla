const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// GET /api/rodamientos - Listar todos (con filtros y paginación)
router.get('/rodamientos', async (req, res) => {
  try {
    let sql = 'SELECT * FROM rodamientos WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM rodamientos WHERE 1=1';
    const params = [];
    const countParams = [];

    if (req.query.categoria) {
      sql += ' AND categoria = ?';
      countSql += ' AND categoria = ?';
      params.push(req.query.categoria);
      countParams.push(req.query.categoria);
    }
    if (req.query.marca) {
      sql += ' AND marca = ?';
      countSql += ' AND marca = ?';
      params.push(req.query.marca);
      countParams.push(req.query.marca);
    }
    if (req.query.search) {
      const cond = ' AND (nombre LIKE ? OR codigo LIKE ?)';
      sql += cond;
      countSql += cond;
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }
    if (req.query.precio_min) {
      sql += ' AND precio >= ?';
      countSql += ' AND precio >= ?';
      params.push(Number(req.query.precio_min));
      countParams.push(Number(req.query.precio_min));
    }
    if (req.query.precio_max) {
      sql += ' AND precio <= ?';
      countSql += ' AND precio <= ?';
      params.push(Number(req.query.precio_max));
      countParams.push(Number(req.query.precio_max));
    }

    // Paginación
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;

    // Obtener total
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Obtener productos de la página actual
    sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);

    res.json({
      productos: rows,
      paginacion: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rodamientos/:id - Detalle de un rodamiento
router.get('/rodamientos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rodamientos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rodamiento no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
