import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// MySQL Connection Configuration (Isolated Sorteos User)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sorteos_user',
  password: process.env.DB_PASSWORD || 'Sorteos2026',
  database: process.env.DB_NAME || 'sorteos_db',
  port: process.env.DB_PORT || 3306,
};

let pool;

export async function initDB() {
  try {
    // Connect pool to sorteos_db
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Create Tables for HeidiSQL / MySQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icono VARCHAR(100) DEFAULT 'award',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sorteos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        total INT NOT NULL,
        vendidos INT DEFAULT 0,
        estado VARCHAR(50) DEFAULT 'activo',
        fecha_sorteo VARCHAR(100) NOT NULL,
        galeria JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS paquetes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        sorteo_id INT NULL,
        cantidad INT NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        descuento INT DEFAULT 0,
        popular TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        cedula VARCHAR(100) UNIQUE NOT NULL,
        correo VARCHAR(255) NOT NULL,
        celular VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS compras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        sorteo_id INT NOT NULL,
        sorteo_nombre VARCHAR(255) NOT NULL,
        cliente_id INT NOT NULL,
        cliente_nombre VARCHAR(255) NOT NULL,
        cliente_cedula VARCHAR(100) NOT NULL,
        cliente_correo VARCHAR(255) NOT NULL,
        cliente_celular VARCHAR(100) NOT NULL,
        cantidad_boletos INT NOT NULL,
        total_pagado DECIMAL(10, 2) NOT NULL,
        metodo_pago VARCHAR(100) NOT NULL,
        comprobante_url VARCHAR(500) NULL,
        estado VARCHAR(50) DEFAULT 'pendiente',
        boletos_asignados JSON NULL,
        fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS boletos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sorteo_id INT NOT NULL,
        numero VARCHAR(50) NOT NULL,
        estado VARCHAR(50) DEFAULT 'disponible',
        compra_id INT NULL,
        cliente_id INT NULL,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id) ON DELETE CASCADE,
        FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
        UNIQUE KEY uq_sorteo_numero (sorteo_id, numero)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default data if empty
    const [cats] = await pool.query('SELECT COUNT(*) as count FROM categorias');
    if (cats[0].count === 0) {
      await pool.query(`
        INSERT INTO categorias (nombre, slug, icono) VALUES
        ('Autos y Motos', 'autos', 'car'),
        ('Tecnología', 'tecnologia', 'smartphone'),
        ('Efectivo y Premios', 'premios', 'award'),
        ('Casas e Inmuebles', 'casas', 'home');
      `);
    }

    const [sorteosCount] = await pool.query('SELECT COUNT(*) as count FROM sorteos');
    if (sorteosCount[0].count === 0) {
      const [resS1] = await pool.query(`
        INSERT INTO sorteos (nombre, categoria, precio, total, vendidos, estado, fecha_sorteo, galeria)
        VALUES ('Toyota Fortuner 4x4 2026', 'autos', 2.00, 1000, 480, 'activo', '2026-08-30', '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"]');
      `);

      const [resS2] = await pool.query(`
        INSERT INTO sorteos (nombre, categoria, precio, total, vendidos, estado, fecha_sorteo, galeria)
        VALUES ('iPhone 15 Pro Max 1TB (Titanio)', 'tecnologia', 1.00, 500, 320, 'activo', '2026-08-25', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]');
      `);

      await generarBoletosMySQL(resS1.insertId, 1000, 480);
      await generarBoletosMySQL(resS2.insertId, 500, 320);
    }

    console.log('✅ Base de datos MySQL inicializada correctamente con usuario sorteos_user en sorteos_db');
  } catch (err) {
    console.error('⚠️ Error al conectar a MySQL con sorteos_user:', err.message);
  }
}

export function getPool() {
  return pool;
}

export async function generarBoletosMySQL(sorteoId, total, vendidosIniciales = 0) {
  const [check] = await pool.query('SELECT COUNT(*) as count FROM boletos WHERE sorteo_id = ?', [sorteoId]);
  if (check[0].count > 0) return;

  const values = [];
  for (let i = 1; i <= total; i++) {
    const numStr = String(i).padStart(4, '0');
    const estado = i <= vendidosIniciales ? 'vendido' : 'disponible';
    values.push([sorteoId, numStr, estado]);
  }

  if (values.length > 0) {
    await pool.query('INSERT INTO boletos (sorteo_id, numero, estado) VALUES ?', [values]);
  }
}

export default {
  initDB,
  getPool,
  generarBoletosMySQL,
};
