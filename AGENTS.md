# Rodisla — bearing catalog e-commerce

## Stack
- Express 5 + mysql2 + dotenv (CommonJS)
- Frontend: static HTML/CSS/JS served from `public/`
- Database: MySQL (`rodisla_db`)

## Commands
- `npm run dev` — start with nodemon (auto-restart on changes)
- `npm start` — production start

## Project structure
- `server.js` — entrypoint, mounts routes under `/api`
- `database/connection.js` — MySQL pool via mysql2/promise
- `routes/` — Express routers: `auth.js`, `rodamientos.js`, `carrito.js`, `ordenes.js`
- `public/` — static assets served by Express
- `.env` — `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

## Route order quirk
In `routes/ordenes.js`, `GET /ordenes/detalle/:orden_id` must be defined BEFORE `GET /ordenes/:usuario_id` to avoid Express matching "detalle" as a user ID.

## Database
- Pool-based with `connectionLimit: 10`
- Tables: `rodamientos`, `usuarios`, `carrito`, `ordenes`, `detalle_ordenes`, `pagos`, `actividad_empleados`, `reportes_ventas`
- Password comparison is plaintext (no bcrypt yet)

## Frontend
- Font: Inter via Google Fonts (imported in HTML `<head>`)
- JS files in `public/js/`: `rodamientos.js`, `login.js`, `carrito.js`, `sesion.js`
- Cart modal is created dynamically via JS (no separate cart page)
- Session stored in `localStorage` under key `usuario`
