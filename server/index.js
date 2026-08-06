import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDB, getPool, generarBoletosMySQL } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MySQL / MariaDB Database
await initDB();

// Middleware
app.use(cors());
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
const upload = multer({ storage });

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

app.post('/api/sorteos', async (req, res) => {
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

app.put('/api/sorteos/:id', async (req, res) => {
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

app.delete('/api/sorteos/:id', async (req, res) => {
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
  try {
    const pool = getPool();
    const { sorteoId, cantidad, comprador, metodoPago } = req.body;
    const sId = parseInt(sorteoId);
    const cant = parseInt(cantidad);

    if (!sId || !cant || !comprador || !comprador.cedula) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para la compra' });
    }

    const [sorteos] = await pool.query('SELECT * FROM sorteos WHERE id = ?', [sId]);
    if (sorteos.length === 0) return res.status(404).json({ error: 'Sorteo no encontrado' });
    const sorteo = sorteos[0];

    // 1. Get or create Customer
    let [clientes] = await pool.query('SELECT * FROM clientes WHERE cedula = ?', [comprador.cedula]);
    let clienteId;
    if (clientes.length === 0) {
      const [insC] = await pool.query(
        'INSERT INTO clientes (nombre, cedula, correo, celular) VALUES (?, ?, ?, ?)',
        [comprador.nombre, comprador.cedula, comprador.correo, comprador.celular]
      );
      clienteId = insC.insertId;
    } else {
      clienteId = clientes[0].id;
    }

    // 2. Random Ticket Allocation (Pick random available tickets in MySQL)
    const [disponibles] = await pool.query(
      "SELECT id, numero FROM boletos WHERE sorteo_id = ? AND estado = 'disponible' ORDER BY RAND() LIMIT ?",
      [sId, cant]
    );

    if (disponibles.length < cant) {
      return res.status(400).json({ error: 'No hay suficientes boletos disponibles para este sorteo' });
    }

    const numerosAsignados = disponibles.map((b) => b.numero);
    const boletosIds = disponibles.map((b) => b.id);
    const totalPagado = parseFloat(sorteo.precio) * cant;
    const codigoOrden = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Create purchase record
    const [insCompra] = await pool.query(
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

    // Update tickets status to reserved
    await pool.query(
      "UPDATE boletos SET estado = 'reservado', compra_id = ?, cliente_id = ? WHERE id IN (?)",
      [compraId, clienteId, boletosIds]
    );

    res.json({
      success: true,
      compraId,
      codigo: codigoOrden,
      boletos: numerosAsignados,
      total: totalPagado,
      sorteoNombre: sorteo.nombre,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
app.get('/api/admin/compras', async (req, res) => {
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

app.put('/api/admin/compras/:id/estado', async (req, res) => {
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

app.get('/api/admin/dashboard', async (req, res) => {
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend MySQL / MariaDB corriendo en puerto ${PORT}`);
});
