require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const rodamientosRoutes = require('./routes/rodamientos');
const authRoutes = require('./routes/auth');
const carritoRoutes = require('./routes/carrito');
const ordenesRoutes = require('./routes/ordenes');

app.use('/api', rodamientosRoutes);
app.use('/api', authRoutes);
app.use('/api', carritoRoutes);
app.use('/api', ordenesRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});