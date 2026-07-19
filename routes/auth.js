const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/registro', async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el email ya existe
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, password, telefono, 'cliente']
    );

    res.status(201).json({ message: 'Cuenta creada correctamente', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;