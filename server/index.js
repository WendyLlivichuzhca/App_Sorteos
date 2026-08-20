import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { initDB, getPool, generarBoletosMySQL } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { calcularTotal } from './pricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MySQL / MariaDB Database
await initDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Uploads static directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `comp_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes o PDF.'));
  },
});

// ==========================================
// 0. AUTH
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const pool = getPool();
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const [admins] = await pool.query('SELECT * FROM admins WHERE usuario = ?', [usuario]);
    if (admins.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const admin = admins[0];
    const valido = await bcrypt.compare(password, admin.password_hash);
    if (!valido) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, usuario: admin.usuario } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. SORTEOS ENDPOINTS (MySQL)
// ==========================================
app.get('/api/sorteos', async (req, res) => {
  try {
    const pool = getPool();
    const { categoria, estado } = req.query;
    let query = 'SELECT * FROM sorteos WHERE 1=1';
    const params = [];

    if (categoria && categoria !== 'todos') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    if (estado && estado !== 'todos') {
      query += ' AND estado = ?';
      params.push(estado);
    }
    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    const parsed = rows.map((r) => ({
      ...r,
      fechaSorteo: r.fecha_sorteo,
      galeria: typeof r.galeria === 'string' ? JSON.parse(r.galeria || '[]') : r.galeria || [],
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sorteos/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM sorteos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Sorteo no encontrado' });

    const row = rows[0];
    const [disp] = await pool.query("SELECT COUNT(*) as count FROM boletos WHERE sorteo_id = ? AND estado = 'disponible'", [req.params.id]);

    res.json({
      ...row,
      fechaSorteo: row.fecha_sorteo,
      galeria: typeof row.galeria === 'string' ? JSON.parse(row.galeria || '[]') : row.galeria || [],
      disponibles: disp[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sorteos', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, categoria, precio, total, estado, fechaSorteo, galeria } = req.body;

    const [result] = await pool.query(
      `INSERT INTO sorteos (nombre, categoria, precio, total, vendidos, estado, fecha_sorteo, galeria)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        nombre,
        categoria || 'autos',
        parseFloat(precio),
        parseInt(total),
        estado || 'activo',
        fechaSorteo || '2026-08-30',
        JSON.stringify(galeria || []),
      ]
    );

    const newId = result.insertId;
    await generarBoletosMySQL(newId, parseInt(total), 0);

    res.status(201).json({ id: newId, message: 'Sorteo creado exitosamente en MySQL' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sorteos/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, categoria, precio, total, estado, fechaSorteo, galeria } = req.body;

    await pool.query(
      `UPDATE sorteos
       SET nombre = ?, categoria = ?, precio = ?, total = ?, estado = ?, fecha_sorteo = ?, galeria = ?
       WHERE id = ?`,
      [
        nombre,
        categoria,
        parseFloat(precio),
        parseInt(total),
        estado,
        fechaSorteo,
        JSON.stringify(galeria || []),
        req.params.id,
      ]
    );

    res.json({ message: 'Sorteo actualizado en MySQL' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sorteos/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM sorteos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sorteo eliminado de MySQL' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1.5 CATEGORÍAS
// ==========================================
app.get('/api/categorias', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categorias', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, slug, icono } = req.body;
    if (!nombre || !slug) return res.status(400).json({ error: 'Nombre y slug son obligatorios' });

    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, slug, icono) VALUES (?, ?, ?)',
      [nombre, slug, icono || 'award']
    );
    res.status(201).json({ id: result.insertId, message: 'Categoría creada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una categoría con ese slug' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categorias/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, slug, icono } = req.body;
    await pool.query(
      'UPDATE categorias SET nombre = ?, slug = ?, icono = ? WHERE id = ?',
      [nombre, slug, icono || 'award', req.params.id]
    );
    res.json({ message: 'Categoría actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categorias/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1.6 DESCUENTOS POR VOLUMEN (reemplaza "Paquetes")
// ==========================================
app.get('/api/descuentos', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM descuentos_volumen ORDER BY cantidad_minima ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/descuentos', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { cantidadMinima, porcentaje } = req.body;
    if (!cantidadMinima || porcentaje === undefined) {
      return res.status(400).json({ error: 'Cantidad mínima y porcentaje son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO descuentos_volumen (cantidad_minima, porcentaje) VALUES (?, ?)',
      [parseInt(cantidadMinima), parseInt(porcentaje)]
    );
    res.status(201).json({ id: result.insertId, message: 'Tramo de descuento creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/descuentos/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { cantidadMinima, porcentaje } = req.body;
    await pool.query(
      'UPDATE descuentos_volumen SET cantidad_minima = ?, porcentaje = ? WHERE id = ?',
      [parseInt(cantidadMinima), parseInt(porcentaje), req.params.id]
    );
    res.json({ message: 'Tramo de descuento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/descuentos/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM descuentos_volumen WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tramo de descuento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CHECKOUT & TICKET ENGINE (MySQL)
// ==========================================
app.post('/api/compras/checkout', async (req, res) => {
  const pool = getPool();
  const { sorteoId, cantidad, comprador, metodoPago } = req.body;
  const sId = parseInt(sorteoId);
  const cant = parseInt(cantidad);

  if (!sId || !cant || cant < 1 || !comprador || !comprador.cedula) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la compra' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [sorteos] = await conn.query('SELECT * FROM sorteos WHERE id = ?', [sId]);
    if (sorteos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Sorteo no encontrado' });
    }
    const sorteo = sorteos[0];
    if (sorteo.estado === 'finalizado') {
      await conn.rollback();
      return res.status(400).json({ error: 'Este sorteo ya finalizó y tiene un ganador' });
    }

    // 1. Get or create Customer
    let [clientes] = await conn.query('SELECT * FROM clientes WHERE cedula = ?', [comprador.cedula]);
    let clienteId;
    if (clientes.length === 0) {
      const [insC] = await conn.query(
        'INSERT INTO clientes (nombre, cedula, correo, celular) VALUES (?, ?, ?, ?)',
        [comprador.nombre, comprador.cedula, comprador.correo, comprador.celular]
      );
      clienteId = insC.insertId;
    } else {
      if (clientes[0].bloqueado) {
        await conn.rollback();
        return res.status(403).json({ error: 'Este cliente está bloqueado y no puede realizar compras' });
      }
      clienteId = clientes[0].id;
    }

    // 2. Lock and pick random available tickets inside the transaction
    const [disponibles] = await conn.query(
      "SELECT id, numero FROM boletos WHERE sorteo_id = ? AND estado = 'disponible' ORDER BY RAND() LIMIT ? FOR UPDATE",
      [sId, cant]
    );

    if (disponibles.length < cant) {
      await conn.rollback();
      return res.status(409).json({ error: 'No hay suficientes boletos disponibles para este sorteo' });
    }

    const numerosAsignados = disponibles.map((b) => b.numero);
    const boletosIds = disponibles.map((b) => b.id);
    const [tramos] = await conn.query('SELECT cantidad_minima, porcentaje FROM descuentos_volumen');
    const totalPagado = calcularTotal(parseFloat(sorteo.precio), cant, tramos);
    const codigoOrden = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Create purchase record
    const [insCompra] = await conn.query(
      `INSERT INTO compras
       (codigo, sorteo_id, sorteo_nombre, cliente_id, cliente_nombre, cliente_cedula, cliente_correo, cliente_celular, cantidad_boletos, total_pagado, metodo_pago, estado, boletos_asignados)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [
        codigoOrden,
        sId,
        sorteo.nombre,
        clienteId,
        comprador.nombre,
        comprador.cedula,
        comprador.correo,
        comprador.celular,
        cant,
        totalPagado,
        metodoPago || 'transferencia',
        JSON.stringify(numerosAsignados),
      ]
    );

    const compraId = insCompra.insertId;

    // 4. Claim the tickets atomically — re-checks estado='disponible' to guard against races
    const [updateResult] = await conn.query(
      "UPDATE boletos SET estado = 'reservado', compra_id = ?, cliente_id = ? WHERE id IN (?) AND estado = 'disponible'",
      [compraId, clienteId, boletosIds]
    );

    if (updateResult.affectedRows !== cant) {
      await conn.rollback();
      return res.status(409).json({ error: 'Algunos boletos ya no están disponibles, intenta de nuevo' });
    }

    await conn.commit();

    res.json({
      success: true,
      compraId,
      codigo: codigoOrden,
      boletos: numerosAsignados,
      total: totalPagado,
      sorteoNombre: sorteo.nombre,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Upload proof of payment file
app.post('/api/compras/:id/comprobante', upload.single('comprobante'), async (req, res) => {
  try {
    const pool = getPool();
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const fileUrl = `/uploads/${req.file.filename}`;

    await pool.query('UPDATE compras SET comprobante_url = ? WHERE id = ?', [fileUrl, req.params.id]);
    res.json({ success: true, comprobanteUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search tickets by Cédula (MySQL)
app.get('/api/compras/buscar', async (req, res) => {
  try {
    const pool = getPool();
    const { cedula } = req.query;
    if (!cedula) return res.status(400).json({ error: 'Proporcione un número de cédula' });

    const [compras] = await pool.query('SELECT * FROM compras WHERE cliente_cedula = ? ORDER BY id DESC', [cedula]);
    const parsed = compras.map((c) => ({
      ...c,
      sorteoNombre: c.sorteo_nombre,
      totalPagado: parseFloat(c.total_pagado),
      cantidadBoletos: c.cantidad_boletos,
      boletosAsignados: typeof c.boletos_asignados === 'string' ? JSON.parse(c.boletos_asignados || '[]') : c.boletos_asignados || [],
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ADMIN PANEL ENDPOINTS (MySQL)
// ==========================================
app.get('/api/admin/compras', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [compras] = await pool.query('SELECT * FROM compras ORDER BY id DESC');
    const parsed = compras.map((c) => ({
      ...c,
      sorteoNombre: c.sorteo_nombre,
      comprador: c.cliente_nombre,
      total: parseFloat(c.total_pagado),
      boletos: c.cantidad_boletos,
      metodo: c.metodo_pago,
      fecha: c.fecha_compra,
      boletosAsignados: typeof c.boletos_asignados === 'string' ? JSON.parse(c.boletos_asignados || '[]') : c.boletos_asignados || [],
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/compras/:id/estado', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { estado } = req.body;
    const [compras] = await pool.query('SELECT * FROM compras WHERE id = ?', [req.params.id]);
    if (compras.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    const compra = compras[0];

    await pool.query('UPDATE compras SET estado = ? WHERE id = ?', [estado, req.params.id]);

    if (estado === 'aprobado') {
      await pool.query("UPDATE boletos SET estado = 'vendido' WHERE compra_id = ?", [req.params.id]);
      await pool.query('UPDATE sorteos SET vendidos = vendidos + ? WHERE id = ?', [compra.cantidad_boletos, compra.sorteo_id]);
    } else if (estado === 'rechazado' || estado === 'cancelado') {
      await pool.query("UPDATE boletos SET estado = 'disponible', compra_id = NULL, cliente_id = NULL WHERE compra_id = ?", [req.params.id]);
    }

    res.json({ message: `Compra ${estado} exitosamente en MySQL` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [ventas] = await pool.query("SELECT COALESCE(SUM(total_pagado), 0) as total FROM compras WHERE estado = 'aprobado'");
    const [sorteos] = await pool.query("SELECT COUNT(*) as count FROM sorteos WHERE estado = 'activo'");
    const [boletos] = await pool.query("SELECT COALESCE(SUM(vendidos), 0) as total FROM sorteos");
    const [ultimas] = await pool.query(`
      SELECT c.*, s.categoria
      FROM compras c
      LEFT JOIN sorteos s ON s.id = c.sorteo_id
      ORDER BY c.id DESC LIMIT 5
    `);
    const [ventasMensuales] = await pool.query(`
      SELECT DATE_FORMAT(fecha_compra, '%Y-%m') AS ym,
        SUM(cantidad_boletos) AS ventas,
        SUM(total_pagado) AS ingresos
      FROM compras
      WHERE estado = 'aprobado' AND fecha_compra >= DATE_SUB(CURDATE(), INTERVAL 8 MONTH)
      GROUP BY ym
      ORDER BY ym ASC
    `);
    const [topSorteos] = await pool.query('SELECT nombre, categoria, vendidos, total FROM sorteos ORDER BY vendidos DESC LIMIT 3');

    res.json({
      totalVentas: parseFloat(ventas[0].total),
      sorteosActivos: sorteos[0].count,
      boletosVendidos: parseInt(boletos[0].total),
      ultimasCompras: ultimas.map((c) => ({
        ...c,
        sorteoNombre: c.sorteo_nombre,
        comprador: c.cliente_nombre,
        total: parseFloat(c.total_pagado),
        boletos: c.cantidad_boletos,
        boletosAsignados: typeof c.boletos_asignados === 'string' ? JSON.parse(c.boletos_asignados || '[]') : c.boletos_asignados || [],
      })),
      ventasMensuales: ventasMensuales.map((m) => ({
        ym: m.ym,
        ventas: parseInt(m.ventas),
        ingresos: parseFloat(m.ingresos),
      })),
      topSorteos: topSorteos.map((s) => ({
        nombre: s.nombre,
        categoria: s.categoria,
        vendidos: s.vendidos,
        total: s.total,
        porcentaje: s.total > 0 ? Math.round((s.vendidos / s.total) * 100) : 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Boletos of a given sorteo, for the admin ticket viewer
app.get('/api/admin/sorteos/:id/boletos', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [boletos] = await pool.query(
      `SELECT b.id, b.numero, b.estado, c.nombre AS cliente_nombre, c.cedula AS cliente_cedula
       FROM boletos b
       LEFT JOIN clientes c ON c.id = b.cliente_id
       WHERE b.sorteo_id = ?
       ORDER BY b.numero ASC`,
      [req.params.id]
    );
    res.json(boletos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clientes (admin)
app.get('/api/admin/clientes', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT cl.*,
        COUNT(co.id) AS compras,
        COALESCE(SUM(CASE WHEN co.estado = 'aprobado' THEN co.total_pagado ELSE 0 END), 0) AS total_gastado
      FROM clientes cl
      LEFT JOIN compras co ON co.cliente_id = cl.id
      GROUP BY cl.id
      ORDER BY cl.id DESC
    `);
    res.json(rows.map((c) => ({ ...c, total_gastado: parseFloat(c.total_gastado) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/clientes/:id/compras', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [compras] = await pool.query(
      'SELECT * FROM compras WHERE cliente_id = ? ORDER BY id DESC',
      [req.params.id]
    );
    res.json(compras.map((c) => ({
      ...c,
      sorteoNombre: c.sorteo_nombre,
      total: parseFloat(c.total_pagado),
      boletos: c.cantidad_boletos,
      boletosAsignados: typeof c.boletos_asignados === 'string' ? JSON.parse(c.boletos_asignados || '[]') : c.boletos_asignados || [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/clientes/:id/bloqueo', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { bloqueado } = req.body;
    await pool.query('UPDATE clientes SET bloqueado = ? WHERE id = ?', [bloqueado ? 1 : 0, req.params.id]);
    res.json({ message: bloqueado ? 'Cliente bloqueado' : 'Cliente desbloqueado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reportes (admin)
app.get('/api/admin/reportes', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [ingresosMes] = await pool.query(`
      SELECT COALESCE(SUM(total_pagado), 0) AS total FROM compras
      WHERE estado = 'aprobado' AND MONTH(fecha_compra) = MONTH(CURDATE()) AND YEAR(fecha_compra) = YEAR(CURDATE())
    `);
    const [masVendido] = await pool.query('SELECT nombre FROM sorteos ORDER BY vendidos DESC LIMIT 1');
    const [promedio] = await pool.query(`
      SELECT COALESCE(SUM(total_pagado) / NULLIF(COUNT(DISTINCT cliente_id), 0), 0) AS promedio
      FROM compras WHERE estado = 'aprobado'
    `);
    const [porSorteo] = await pool.query(`
      SELECT s.id, s.nombre, s.vendidos, s.total,
        COALESCE(SUM(CASE WHEN co.estado = 'aprobado' THEN co.total_pagado ELSE 0 END), 0) AS ingresos
      FROM sorteos s
      LEFT JOIN compras co ON co.sorteo_id = s.id
      GROUP BY s.id
      ORDER BY s.vendidos DESC
    `);

    res.json({
      ingresosMes: parseFloat(ingresosMes[0].total),
      sorteoMasVendido: masVendido[0]?.nombre || 'N/A',
      promedioPorCliente: parseFloat(promedio[0].promedio),
      porSorteo: porSorteo.map((s) => ({
        nombre: s.nombre,
        vendidos: s.vendidos,
        total: s.total,
        porcentaje: s.total > 0 ? Math.round((s.vendidos / s.total) * 100) : 0,
        ingresos: parseFloat(s.ingresos),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configuración
app.get('/api/configuracion', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM configuracion WHERE id = 1');
    if (rows.length === 0) return res.status(404).json({ error: 'Configuración no encontrada' });
    const config = rows[0];
    res.json({
      ...config,
      metodosPago: typeof config.metodos_pago === 'string' ? JSON.parse(config.metodos_pago) : config.metodos_pago,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/configuracion', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const {
      nombreEmpresa, whatsapp, correo, facebook, instagram, tiktok,
      colorTema, politicas, faqTexto, metodosPago, instruccionesPago,
    } = req.body;

    await pool.query(
      `UPDATE configuracion SET
        nombre_empresa = ?, whatsapp = ?, correo = ?, facebook = ?, instagram = ?, tiktok = ?,
        color_tema = ?, politicas = ?, faq_texto = ?, metodos_pago = ?, instrucciones_pago = ?
       WHERE id = 1`,
      [
        nombreEmpresa, whatsapp, correo, facebook, instagram, tiktok,
        colorTema, politicas, faqTexto, JSON.stringify(metodosPago || {}), instruccionesPago || '',
      ]
    );
    res.json({ message: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cuenta del administrador autenticado
app.put('/api/admin/account', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { usuario, passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Ingresa tu contraseña actual y la nueva contraseña' });
    }

    const [admins] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    if (admins.length === 0) return res.status(404).json({ error: 'Administrador no encontrado' });

    const valido = await bcrypt.compare(passwordActual, admins[0].password_hash);
    if (!valido) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const nuevoUsuario = usuario?.trim() || admins[0].usuario;
    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query('UPDATE admins SET usuario = ?, password_hash = ? WHERE id = ?', [nuevoUsuario, nuevoHash, req.admin.id]);

    res.json({ message: 'Cuenta actualizada, vuelve a iniciar sesión' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. GANADORES / SORTEO DE PREMIO (MySQL)
// ==========================================
app.get('/api/ganadores', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT g.*, s.categoria
       FROM ganadores g
       LEFT JOIN sorteos s ON s.id = g.sorteo_id
       ORDER BY g.fecha_sorteo DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sorteos/:id/sortear', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const sId = req.params.id;

    const [sorteos] = await pool.query('SELECT * FROM sorteos WHERE id = ?', [sId]);
    if (sorteos.length === 0) return res.status(404).json({ error: 'Sorteo no encontrado' });
    const sorteo = sorteos[0];

    const [candidatos] = await pool.query(
      `SELECT b.numero, b.cliente_id, c.nombre AS cliente_nombre
       FROM boletos b
       LEFT JOIN clientes c ON c.id = b.cliente_id
       WHERE b.sorteo_id = ? AND b.estado = 'vendido'
       ORDER BY RAND() LIMIT 1`,
      [sId]
    );

    if (candidatos.length === 0) {
      return res.status(400).json({ error: 'No hay boletos vendidos para sortear en este sorteo' });
    }

    const ganador = candidatos[0];
    const [insG] = await pool.query(
      `INSERT INTO ganadores (sorteo_id, sorteo_nombre, boleto_numero, cliente_id, cliente_nombre)
       VALUES (?, ?, ?, ?, ?)`,
      [sId, sorteo.nombre, ganador.numero, ganador.cliente_id, ganador.cliente_nombre || 'Cliente']
    );

    await pool.query("UPDATE sorteos SET estado = 'finalizado' WHERE id = ?", [sId]);

    res.status(201).json({
      id: insG.insertId,
      sorteoId: sId,
      sorteoNombre: sorteo.nombre,
      boletoNumero: ganador.numero,
      clienteNombre: ganador.cliente_nombre || 'Cliente',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/ganadores/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { ciudad, premioEntregado } = req.body;

    const campos = [];
    const valores = [];
    if (ciudad !== undefined) {
      campos.push('ciudad = ?');
      valores.push(ciudad);
    }
    if (premioEntregado !== undefined) {
      campos.push('premio_entregado = ?');
      valores.push(premioEntregado ? 1 : 0);
    }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    valores.push(req.params.id);
    await pool.query(`UPDATE ganadores SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ message: 'Ganador actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer error handler (file type/size rejected)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('no permitido')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend MySQL / MariaDB corriendo en puerto ${PORT}`);
});
