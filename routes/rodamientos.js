const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// GET /api/rodamientos - Listar todos (con filtros opcionales)
router.get('/rodamientos', async (req, res) => {
  try {
    let sql = 'SELECT * FROM rodamientos WHERE 1=1';
    const params = [];

    if (req.query.categoria) {
      sql += ' AND categoria = ?';
      params.push(req.query.categoria);
    }
    if (req.query.marca) {
      sql += ' AND marca = ?';
      params.push(req.query.marca);
    }
    if (req.query.search) {
      sql += ' AND (nombre LIKE ? OR codigo LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
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