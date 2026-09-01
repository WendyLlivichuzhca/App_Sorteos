import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

// MySQL Connection Configuration (Isolated Sorteos User)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sorteos_user',
  password: process.env.DB_PASSWORD || 'Sorteos2026',
  database: process.env.DB_NAME || 'sorteos_db',
  port: process.env.DB_PORT || 3306,
  decimalNumbers: true, // return DECIMAL columns (precio, total_pagado) as JS numbers, not strings
};

let pool;

// Adds a column to an existing table only if it doesn't already exist yet.
// CREATE TABLE IF NOT EXISTS does not alter tables that already exist, so
// schema changes on tables with production data need this instead.
async function ensureColumn(pool, tabla, columna, definicionSQL) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna]
  );
  if (rows[0].count === 0) {
    await pool.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicionSQL}`);
  }
}

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
    await ensureColumn(pool, 'clientes', 'bloqueado', 'TINYINT(1) DEFAULT 0');

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
    await ensureColumn(pool, 'compras', 'payphone_transaction_id', 'VARCHAR(100) NULL');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ganadores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sorteo_id INT NOT NULL,
        sorteo_nombre VARCHAR(255) NOT NULL,
        boleto_numero VARCHAR(50) NOT NULL,
        cliente_id INT NULL,
        cliente_nombre VARCHAR(255) NOT NULL,
        ciudad VARCHAR(255) NULL,
        premio_entregado TINYINT(1) DEFAULT 0,
        fecha_sorteo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sorteo_lugares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sorteo_id INT NOT NULL,
        orden INT NOT NULL,
        premio VARCHAR(255) NOT NULL,
        boleto_numero VARCHAR(50) NULL,
        cliente_id INT NULL,
        cliente_nombre VARCHAR(255) NULL,
        entregado TINYINT(1) DEFAULT 0,
        fecha_sorteo TIMESTAMP NULL,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
        UNIQUE KEY uq_sorteo_orden (sorteo_id, orden)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migra los ganadores ya sorteados con el sistema viejo (un solo ganador por
    // sorteo) a la nueva tabla de lugares, como "1er lugar", para no perder ese
    // historial. Solo corre si sorteo_lugares está vacía.
    const [lugaresCount] = await pool.query('SELECT COUNT(*) as count FROM sorteo_lugares');
    if (lugaresCount[0].count === 0) {
      const [ganadoresViejos] = await pool.query('SELECT * FROM ganadores');
      for (const g of ganadoresViejos) {
        await pool.query(
          `INSERT IGNORE INTO sorteo_lugares
           (sorteo_id, orden, premio, boleto_numero, cliente_id, cliente_nombre, entregado, fecha_sorteo)
           VALUES (?, 1, ?, ?, ?, ?, ?, ?)`,
          [g.sorteo_id, g.sorteo_nombre, g.boleto_numero, g.cliente_id, g.cliente_nombre, g.premio_entregado, g.fecha_sorteo]
        );
      }
    }

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS numeros_premiados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sorteo_id INT NOT NULL,
        numero VARCHAR(50) NOT NULL,
        premio VARCHAR(255) NOT NULL,
        ganado TINYINT(1) DEFAULT 0,
        cliente_id INT NULL,
        cliente_nombre VARCHAR(255) NULL,
        entregado TINYINT(1) DEFAULT 0,
        fecha_ganado TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sorteo_id) REFERENCES sorteos(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
        UNIQUE KEY uq_sorteo_numero_premiado (sorteo_id, numero)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS descuentos_volumen (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cantidad_minima INT NOT NULL,
        porcentaje INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INT PRIMARY KEY DEFAULT 1,
        nombre_empresa VARCHAR(255) DEFAULT 'SORTEOS EN LÍNEA',
        whatsapp VARCHAR(50) DEFAULT '',
        correo VARCHAR(255) DEFAULT '',
        facebook VARCHAR(255) DEFAULT '',
        instagram VARCHAR(255) DEFAULT '',
        tiktok VARCHAR(255) DEFAULT '',
        color_tema VARCHAR(20) DEFAULT '#1F8A5A',
        politicas TEXT NULL,
        faq_texto TEXT NULL,
        metodos_pago JSON NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureColumn(pool, 'configuracion', 'instrucciones_pago', 'TEXT NULL');
    await ensureColumn(pool, 'configuracion', 'qr_pago', 'LONGTEXT NULL');
    await ensureColumn(pool, 'configuracion', 'logo_url', 'LONGTEXT NULL');

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

    const [descuentosCount] = await pool.query('SELECT COUNT(*) as count FROM descuentos_volumen');
    if (descuentosCount[0].count === 0) {
      await pool.query(`
        INSERT INTO descuentos_volumen (cantidad_minima, porcentaje) VALUES
        (5, 10),
        (10, 20),
        (20, 30);
      `);
    }

    const [configCount] = await pool.query('SELECT COUNT(*) as count FROM configuracion');
    if (configCount[0].count === 0) {
      await pool.query(
        `INSERT INTO configuracion
         (id, nombre_empresa, whatsapp, correo, facebook, instagram, tiktok, color_tema, politicas, faq_texto, metodos_pago)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'SORTEOS EN LÍNEA',
          '+593 99 999 9999',
          'soporte@sorteosenlinea.com',
          'https://facebook.com/sorteosenlinea',
          'https://instagram.com/sorteosenlinea',
          'https://tiktok.com/@sorteosenlinea',
          '#1F8A5A',
          'Todos los sorteos son supervisados y auditados. Los boletos son únicos y no reembolsables una vez realizado el sorteo.',
          '¿Cómo sé si gané? Te contactaremos por teléfono y WhatsApp oficial inmediatamente después del sorteo.',
          JSON.stringify({ tarjeta: true, payphone: true, deuna: true, transferencia: true, paypal: true }),
        ]
      );
    }

    const [adminsCount] = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (adminsCount[0].count === 0) {
      const usuario = process.env.ADMIN_USER || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const hash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO admins (usuario, password_hash) VALUES (?, ?)', [usuario, hash]);
      if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
        console.warn('⚠️ ADMIN_USER/ADMIN_PASSWORD no definidos en .env — se creó el admin con credenciales por defecto (admin/admin123). Cámbialas.');
      } else {
        console.log(`✅ Administrador "${usuario}" creado a partir de .env`);
      }
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
