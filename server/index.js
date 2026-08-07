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
    const totalPagado = calcularTotal(parseFloat(sorteo.precio), cant);
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
    const [ultimas] = await pool.query('SELECT * FROM compras ORDER BY id DESC LIMIT 5');

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
