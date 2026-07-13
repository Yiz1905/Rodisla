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

module.exports = router;