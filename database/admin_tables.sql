-- ============================================
-- Tablas nuevas para el Panel Admin de Rodisla
-- ============================================

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(150) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    direccion VARCHAR(255) DEFAULT '',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS orden_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT DEFAULT 1,
    total DECIMAL(10,2) DEFAULT 0,
    estado ENUM('pendiente','aprobada','recibida','cancelada') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES rodamientos(id) ON DELETE CASCADE
);

-- Tabla de facturas de proveedores
CREATE TABLE IF NOT EXISTS facturas_proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    orden_compra_id INT DEFAULT NULL,
    monto DECIMAL(10,2) DEFAULT 0,
    estado ENUM('pendiente','pagada','vencida') DEFAULT 'pendiente',
    fecha_vencimiento DATE DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra(id) ON DELETE SET NULL
);
