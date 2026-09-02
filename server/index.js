import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { initDB, getPool, generarBoletosMySQL } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { calcularTotal } from './pricing.js';
import { validarDocumento } from './validarDocumento.js';
import { validarNombre } from './validarNombre.js';
import { validarCorreo } from './validarCorreo.js';
import { validarTelefono } from './validarTelefono.js';

const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Necesario para que req.ip refleje la IP real del cliente (no la del propio
// nginx) cuando el servidor corre detras de un reverse proxy, para que el
// limite de intentos de login funcione correctamente.
app.set('trust proxy', 1);

// Initialize MySQL / MariaDB Database
await initDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', exposedHeaders: ['X-Refresh-Token'] }));
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

// Aprueba/rechaza una compra: marca boletos vendido/disponible y ajusta sorteos.vendidos.
// Se usa tanto desde el panel admin como desde la confirmacion automatica de PayPhone,
// para que el comportamiento sea identico sin importar quien aprueba.
async function aprobarCompra(pool, compraId) {
  const [compras] = await pool.query('SELECT * FROM compras WHERE id = ?', [compraId]);
  if (compras.length === 0) return null;
  const compra = compras[0];
  if (compra.estado !== 'pendiente') return compra; // ya procesada, no duplicar

  await pool.query("UPDATE compras SET estado = 'aprobado' WHERE id = ?", [compraId]);
  await pool.query("UPDATE boletos SET estado = 'vendido' WHERE compra_id = ?", [compraId]);
  await pool.query('UPDATE sorteos SET vendidos = vendidos + ? WHERE id = ?', [compra.cantidad_boletos, compra.sorteo_id]);

  // Revisa si alguno de los boletos recién vendidos coincide con un número premiado
  // (premio instantáneo) todavía sin ganador, y lo marca automáticamente.
  const [boletosVendidos] = await pool.query('SELECT numero FROM boletos WHERE compra_id = ?', [compraId]);
  const numeros = boletosVendidos.map((b) => b.numero);
  if (numeros.length > 0) {
    const placeholders = numeros.map(() => '?').join(',');
    await pool.query(
      `UPDATE numeros_premiados SET ganado = 1, cliente_id = ?, cliente_nombre = ?, fecha_ganado = NOW()
       WHERE sorteo_id = ? AND numero IN (${placeholders}) AND ganado = 0`,
      [compra.cliente_id, compra.cliente_nombre, compra.sorteo_id, ...numeros]
    );
  }

  return { ...compra, estado: 'aprobado' };
}

async function rechazarCompra(pool, compraId, estadoFinal = 'rechazado') {
  const [compras] = await pool.query('SELECT * FROM compras WHERE id = ?', [compraId]);
  if (compras.length === 0) return null;
  const compra = compras[0];
  if (compra.estado !== 'pendiente') return compra;

  await pool.query('UPDATE compras SET estado = ? WHERE id = ?', [estadoFinal, compraId]);
  await pool.query("UPDATE boletos SET estado = 'disponible', compra_id = NULL, cliente_id = NULL WHERE compra_id = ?", [compraId]);
  return { ...compra, estado: estadoFinal };
}

// ==========================================
// 0. AUTH
// ==========================================

// Limite de intentos de login: 5 intentos fallidos por IP+usuario bloquean
// nuevos intentos de esa combinacion por 15 minutos. Es en memoria (no
// sobrevive un reinicio del servidor) pero alcanza para frenar un intento de
// adivinar la contraseña por fuerza bruta contra el panel admin.
const intentosLogin = new Map();
const LOGIN_MAX_INTENTOS = 5;
const LOGIN_VENTANA_MS = 15 * 60 * 1000;

function loginBloqueado(clave) {
  const registro = intentosLogin.get(clave);
  if (!registro) return false;
  if (Date.now() - registro.desde > LOGIN_VENTANA_MS) {
    intentosLogin.delete(clave);
    return false;
  }
  return registro.fallos >= LOGIN_MAX_INTENTOS;
}

function registrarLoginFallido(clave) {
  const registro = intentosLogin.get(clave);
  if (!registro || Date.now() - registro.desde > LOGIN_VENTANA_MS) {
    intentosLogin.set(clave, { fallos: 1, desde: Date.now() });
  } else {
    registro.fallos += 1;
  }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const pool = getPool();
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const clave = `${req.ip}:${usuario}`;
    if (loginBloqueado(clave)) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.' });
    }

    const [admins] = await pool.query('SELECT * FROM admins WHERE usuario = ?', [usuario]);
    if (admins.length === 0) {
      registrarLoginFallido(clave);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const admin = admins[0];
    const valido = await bcrypt.compare(password, admin.password_hash);
    if (!valido) {
      registrarLoginFallido(clave);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    intentosLogin.delete(clave);
    const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, usuario: admin.usuario } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. SORTEOS ENDPOINTS (MySQL)
// ==========================================
const ESTADOS_SORTEO_VALIDOS = ['activo', 'proximamente', 'agotado', 'finalizado'];

// Endpoint publico: solo expone el total agregado de boletos vendidos,
// sin ningun dato de ventas, clientes ni compras individuales.
app.get('/api/estadisticas', async (req, res) => {
  try {
    const pool = getPool();
    const [boletos] = await pool.query("SELECT COALESCE(SUM(vendidos), 0) as total FROM sorteos");
    res.json({ boletosVendidos: parseInt(boletos[0].total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del sorteo es obligatorio' });
    }
    if (!precio || parseFloat(precio) <= 0) {
      return res.status(400).json({ error: 'El precio por boleto debe ser mayor a 0' });
    }
    if (!total || parseInt(total) <= 0) {
      return res.status(400).json({ error: 'El total de boletos debe ser mayor a 0' });
    }
    if (parseInt(total) > 100000) {
      return res.status(400).json({ error: 'El total de boletos no puede superar 100,000 (revisa si no sobra un cero)' });
    }
    if (estado && !ESTADOS_SORTEO_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado de sorteo no válido' });
    }

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

    // Todo sorteo arranca con un lugar por defecto (1er lugar = el premio completo del
    // sorteo), así los sorteos simples de un solo ganador siguen funcionando igual que
    // siempre. Si la jefa quiere un combo con varios ganadores, agrega más lugares luego.
    await pool.query(
      'INSERT INTO sorteo_lugares (sorteo_id, orden, premio) VALUES (?, 1, ?)',
      [newId, nombre]
    );

    res.status(201).json({ id: newId, message: 'Sorteo creado exitosamente en MySQL' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sorteos/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, categoria, precio, total, estado, fechaSorteo, galeria } = req.body;
    const nuevoTotal = parseInt(total);

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del sorteo es obligatorio' });
    }
    if (!precio || parseFloat(precio) <= 0) {
      return res.status(400).json({ error: 'El precio por boleto debe ser mayor a 0' });
    }
    if (!nuevoTotal || nuevoTotal <= 0) {
      return res.status(400).json({ error: 'El total de boletos debe ser mayor a 0' });
    }
    if (nuevoTotal > 100000) {
      return res.status(400).json({ error: 'El total de boletos no puede superar 100,000 (revisa si no sobra un cero)' });
    }
    if (!ESTADOS_SORTEO_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado de sorteo no válido' });
    }

    const [sorteos] = await pool.query('SELECT * FROM sorteos WHERE id = ?', [req.params.id]);
    if (sorteos.length === 0) return res.status(404).json({ error: 'Sorteo no encontrado' });
    const sorteoActual = sorteos[0];

    if (nuevoTotal !== sorteoActual.total) {
      if (sorteoActual.vendidos > 0) {
        return res.status(400).json({
          error: 'No puedes cambiar la cantidad de boletos porque ya se vendieron algunos. Crea un sorteo nuevo si necesitas otra cantidad.',
        });
      }
      // Todavía no hay ventas: es seguro regenerar los boletos con la nueva cantidad.
      await pool.query('DELETE FROM boletos WHERE sorteo_id = ?', [req.params.id]);
      await generarBoletosMySQL(req.params.id, nuevoTotal, 0);
      await pool.query(
        `DELETE FROM numeros_premiados WHERE sorteo_id = ? AND numero NOT IN (SELECT numero FROM boletos WHERE sorteo_id = ?)`,
        [req.params.id, req.params.id]
      );
    }

    await pool.query(
      `UPDATE sorteos
       SET nombre = ?, categoria = ?, precio = ?, total = ?, estado = ?, fecha_sorteo = ?, galeria = ?
       WHERE id = ?`,
      [
        nombre,
        categoria,
        parseFloat(precio),
        nuevoTotal,
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
    const [compras] = await pool.query('SELECT COUNT(*) AS count FROM compras WHERE sorteo_id = ?', [req.params.id]);
    if (compras[0].count > 0) {
      return res.status(400).json({
        error: `Este sorteo tiene ${compras[0].count} compra(s) registrada(s) y no se puede eliminar (se perdería ese historial). Si ya no lo quieres visible, cambia su estado a "Finalizado" o "Agotado" en vez de borrarlo.`,
      });
    }
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
    if (!nombre || !slug) return res.status(400).json({ error: 'Nombre y slug son obligatorios' });
    await pool.query(
      'UPDATE categorias SET nombre = ?, slug = ?, icono = ? WHERE id = ?',
      [nombre, slug, icono || 'award', req.params.id]
    );
    res.json({ message: 'Categoría actualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una categoría con ese slug' });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categorias/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [cat] = await pool.query('SELECT slug FROM categorias WHERE id = ?', [req.params.id]);
    if (cat.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    const [enUso] = await pool.query('SELECT COUNT(*) AS count FROM sorteos WHERE categoria = ?', [cat[0].slug]);
    if (enUso[0].count > 0) {
      return res.status(400).json({ error: `Esta categoría está siendo usada por ${enUso[0].count} sorteo(s) y no se puede eliminar. Cambia esos sorteos a otra categoría primero.` });
    }
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
    if (!cantidadMinima || porcentaje === undefined || porcentaje === null || Number.isNaN(parseInt(porcentaje))) {
      return res.status(400).json({ error: 'Cantidad mínima y porcentaje son obligatorios' });
    }
    if (parseInt(cantidadMinima) < 1) {
      return res.status(400).json({ error: 'La cantidad mínima debe ser al menos 1' });
    }
    if (parseInt(porcentaje) < 0 || parseInt(porcentaje) > 90) {
      return res.status(400).json({ error: 'El descuento debe estar entre 0% y 90%' });
    }
    const [dup] = await pool.query('SELECT 1 FROM descuentos_volumen WHERE cantidad_minima = ?', [parseInt(cantidadMinima)]);
    if (dup.length > 0) {
      return res.status(400).json({ error: 'Ya existe un tramo con esa misma cantidad mínima' });
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
    if (!cantidadMinima || porcentaje === undefined || porcentaje === null || Number.isNaN(parseInt(porcentaje))) {
      return res.status(400).json({ error: 'Cantidad mínima y porcentaje son obligatorios' });
    }
    if (parseInt(cantidadMinima) < 1) {
      return res.status(400).json({ error: 'La cantidad mínima debe ser al menos 1' });
    }
    if (parseInt(porcentaje) < 0 || parseInt(porcentaje) > 90) {
      return res.status(400).json({ error: 'El descuento debe estar entre 0% y 90%' });
    }
    const [dup] = await pool.query(
      'SELECT 1 FROM descuentos_volumen WHERE cantidad_minima = ? AND id != ?',
      [parseInt(cantidadMinima), req.params.id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: 'Ya existe un tramo con esa misma cantidad mínima' });
    }
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
// 1.7 NÚMEROS PREMIADOS (premios instantáneos por sorteo)
// ==========================================
app.get('/api/sorteos/:id/premiados', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, numero, premio, entregado FROM numeros_premiados WHERE sorteo_id = ? ORDER BY numero ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sorteos/:id/premiados', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM numeros_premiados WHERE sorteo_id = ? ORDER BY numero ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sorteos/:id/premiados', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { numero, premio } = req.body;
    if (!numero || !premio) {
      return res.status(400).json({ error: 'Número y premio son obligatorios' });
    }

    // Se normaliza el número al mismo formato (con ceros a la izquierda) que usan los
    // boletos reales del sorteo, y se valida que exista de verdad — si no, ese número
    // premiado nunca lo podría ganar nadie.
    const [muestra] = await pool.query('SELECT numero FROM boletos WHERE sorteo_id = ? LIMIT 1', [req.params.id]);
    if (muestra.length === 0) {
      return res.status(400).json({ error: 'Este sorteo todavía no tiene boletos generados' });
    }
    const longitud = muestra[0].numero.length;
    const numeroNormalizado = String(numero).trim().padStart(longitud, '0');
    const [existe] = await pool.query('SELECT 1 FROM boletos WHERE sorteo_id = ? AND numero = ?', [req.params.id, numeroNormalizado]);
    if (existe.length === 0) {
      return res.status(400).json({ error: `El número ${numeroNormalizado} no existe en este sorteo` });
    }

    const [result] = await pool.query(
      'INSERT INTO numeros_premiados (sorteo_id, numero, premio) VALUES (?, ?, ?)',
      [req.params.id, numeroNormalizado, premio]
    );
    res.status(201).json({ id: result.insertId, message: 'Número premiado creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ese número ya está registrado como premiado en este sorteo' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sorteos/:id/premiados/generar', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const sorteoId = req.params.id;
    const cantidad = parseInt(req.body.cantidad, 10);
    const premio = (req.body.premio || '').trim();
    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }
    if (!premio) {
      return res.status(400).json({ error: 'El premio es obligatorio' });
    }

    // Elige números reales del sorteo (existen de verdad como boletos) que todavía
    // no estén registrados como premiados, para que siempre sean números válidos.
    const [disponibles] = await pool.query(
      `SELECT b.numero FROM boletos b
       WHERE b.sorteo_id = ?
       AND b.numero NOT IN (SELECT numero FROM numeros_premiados WHERE sorteo_id = ?)
       ORDER BY RAND() LIMIT ?`,
      [sorteoId, sorteoId, cantidad]
    );

    if (disponibles.length === 0) {
      return res.status(400).json({ error: 'No hay números disponibles para elegir (puede que ya estén todos registrados como premiados)' });
    }

    const values = disponibles.map((b) => [sorteoId, b.numero, premio]);
    await pool.query('INSERT INTO numeros_premiados (sorteo_id, numero, premio) VALUES ?', [values]);

    res.status(201).json({
      creados: values.length,
      numeros: disponibles.map((b) => b.numero),
      message: `${values.length} números premiados generados`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/premiados/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { premio, entregado } = req.body;
    const campos = [];
    const valores = [];
    if (premio !== undefined) {
      if (!premio.trim()) return res.status(400).json({ error: 'El premio no puede quedar vacío' });
      campos.push('premio = ?');
      valores.push(premio.trim());
    }
    if (entregado !== undefined) { campos.push('entregado = ?'); valores.push(entregado ? 1 : 0); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    valores.push(req.params.id);
    await pool.query(`UPDATE numeros_premiados SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ message: 'Número premiado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/premiados/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM numeros_premiados WHERE id = ?', [req.params.id]);
    res.json({ message: 'Número premiado eliminado' });
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

  if (!sId || !cant || cant < 1 || !comprador || !comprador.cedula || !comprador.nombre || !comprador.correo || !comprador.celular) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la compra' });
  }
  const correoValidado = validarCorreo(comprador.correo);
  if (!correoValidado.valido) {
    return res.status(400).json({ error: correoValidado.mensaje });
  }
  const docValidado = validarDocumento(comprador.tipoDocumento, comprador.cedula);
  if (!docValidado.valido) {
    return res.status(400).json({ error: docValidado.mensaje });
  }
  if (!validarNombre(comprador.nombre)) {
    return res.status(400).json({ error: 'Ingresa un nombre y apellido válidos (solo letras)' });
  }
  const telefonoValidado = validarTelefono(comprador.celular);
  if (!telefonoValidado.valido) {
    return res.status(400).json({ error: telefonoValidado.mensaje });
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

    const [compras] = await pool.query('SELECT id FROM compras WHERE id = ?', [req.params.id]);
    if (compras.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

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

    // Este endpoint es publico y no exige que quien consulta sea dueño de la
    // cedula, asi que solo se devuelve lo minimo necesario para "ver mis
    // boletos" -- nunca el correo, celular ni el link del comprobante de otra
    // persona, aunque alguien adivine o conozca su cedula.
    const [compras] = await pool.query(
      `SELECT id, codigo, sorteo_nombre, cantidad_boletos, total_pagado, estado, boletos_asignados
       FROM compras WHERE cliente_cedula = ? ORDER BY id DESC`,
      [cedula]
    );
    const parsed = compras.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      estado: c.estado,
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

    let resultado;
    if (estado === 'aprobado') {
      resultado = await aprobarCompra(pool, req.params.id);
    } else if (estado === 'rechazado' || estado === 'cancelado') {
      resultado = await rechazarCompra(pool, req.params.id, estado);
    } else {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    if (!resultado) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json({ message: `Compra ${estado} exitosamente en MySQL` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PAYPHONE (cobro real con tarjeta)
// ==========================================
app.post('/api/compras/:id/payphone/iniciar', async (req, res) => {
  try {
    const pool = getPool();
    const [compras] = await pool.query('SELECT * FROM compras WHERE id = ?', [req.params.id]);
    if (compras.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    const compra = compras[0];
    if (compra.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Esta compra ya fue procesada' });
    }

    const totalCentavos = Math.round(parseFloat(compra.total_pagado) * 100);
    const responseUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/payphone/confirmacion`;

    const prepareRes = await fetch(`${PAYPHONE_API_BASE}/api/button/Prepare`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalCentavos,
        amountWithoutTax: totalCentavos,
        amountWithTax: 0,
        tax: 0,
        clientTransactionId: compra.codigo,
        currency: 'USD',
        storeId: process.env.PAYPHONE_STORE_ID,
        reference: `Boletos ${compra.sorteo_nombre}`,
        responseUrl,
      }),
    });

    const prepareData = await prepareRes.json();
    if (!prepareRes.ok) {
      return res.status(502).json({ error: prepareData.message || 'No se pudo iniciar el pago con PayPhone' });
    }

    res.json({ payWithCard: prepareData.payWithCard, payWithPayPhone: prepareData.payWithPayPhone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compras/payphone/confirmar', async (req, res) => {
  try {
    const pool = getPool();
    const { id, clientTransactionId } = req.body;
    if (!id || !clientTransactionId) {
      return res.status(400).json({ error: 'Faltan datos para confirmar el pago' });
    }

    const [compras] = await pool.query('SELECT * FROM compras WHERE codigo = ?', [clientTransactionId]);
    if (compras.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    const compra = compras[0];

    const confirmRes = await fetch(`${PAYPHONE_API_BASE}/api/button/V2/Confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: parseInt(id), clientTxId: clientTransactionId }),
    });
    const confirmData = await confirmRes.json();

    await pool.query('UPDATE compras SET payphone_transaction_id = ? WHERE id = ?', [String(id), compra.id]);

    // No basta con que PayPhone diga "Approved": tambien hay que verificar que el
    // monto y el codigo de orden que ELLOS confirman coinciden con esta compra.
    // Sin esto, alguien podria pagar de verdad una compra barata y luego reusar
    // ese id de transaccion aprobado contra el codigo de una compra mas cara sin
    // haberla pagado, y el sistema la aprobaria igual.
    const montoEsperado = Math.round(parseFloat(compra.total_pagado) * 100);
    const montoCoincide = confirmData.amount === undefined || confirmData.amount === montoEsperado;
    const codigoCoincide = confirmData.clientTransactionId === undefined || confirmData.clientTransactionId === compra.codigo;
    if (!montoCoincide || !codigoCoincide) {
      console.error(
        `⚠️ PayPhone confirmo una transaccion pero el monto/codigo no coincide con la compra ${compra.codigo}. ` +
        `Esperado: ${montoEsperado} centavos / ${compra.codigo}. Recibido: ${confirmData.amount} / ${confirmData.clientTransactionId}.`
      );
    }

    const pagoValido = confirmRes.ok && confirmData.transactionStatus === 'Approved' && montoCoincide && codigoCoincide;
    let aprobado = false;
    let revisarManualmente = false;
    if (pagoValido) {
      if (compra.estado === 'pendiente') {
        await aprobarCompra(pool, compra.id);
        aprobado = true;
      } else {
        revisarManualmente = true;
        // El pago es real y valido, pero esta compra ya no esta "pendiente"
        // (ya se habia marcado aprobada o rechazada antes, por ejemplo en un
        // primer intento fallido). No se vuelve a aprobar automaticamente
        // porque sus boletos originales pudieron haberse liberado y vendido
        // a otra persona mientras tanto -- se deja un aviso claro para
        // resolverlo a mano en vez de fingir un exito que no paso.
        console.error(
          `🚨 PayPhone confirmo un pago real para la compra ${compra.codigo}, pero esa compra ya estaba en estado "${compra.estado}" (no pendiente). ` +
          `Revisar manualmente: el cliente probablemente pago sin recibir boletos. payphone_transaction_id=${id}`
        );
      }
    } else if (compra.estado === 'pendiente') {
      await rechazarCompra(pool, compra.id, 'rechazado');
    }

    res.json({
      aprobado,
      revisarManualmente,
      compra: {
        codigo: compra.codigo,
        sorteoNombre: compra.sorteo_nombre,
        total: parseFloat(compra.total_pagado),
        boletos: typeof compra.boletos_asignados === 'string' ? JSON.parse(compra.boletos_asignados || '[]') : compra.boletos_asignados || [],
      },
    });
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
      colorTema, politicas, faqTexto, metodosPago, instruccionesPago, qrPago, logoUrl,
    } = req.body;

    if (!nombreEmpresa || !nombreEmpresa.trim()) {
      return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' });
    }
    if (!correo || !correo.trim()) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }

    await pool.query(
      `UPDATE configuracion SET
        nombre_empresa = ?, whatsapp = ?, correo = ?, facebook = ?, instagram = ?, tiktok = ?,
        color_tema = ?, politicas = ?, faq_texto = ?, metodos_pago = ?, instrucciones_pago = ?, qr_pago = ?, logo_url = ?
       WHERE id = 1`,
      [
        nombreEmpresa, whatsapp, correo, facebook, instagram, tiktok,
        colorTema, politicas, faqTexto, JSON.stringify(metodosPago || {}), instruccionesPago || '', qrPago || null, logoUrl || null,
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
    if (passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
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
// 4. LUGARES Y GANADORES (un sorteo puede repartir varios premios/lugares)
// ==========================================
app.get('/api/ganadores', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT l.id, l.sorteo_id, s.nombre AS sorteo_nombre, s.categoria,
              l.orden, l.premio, l.boleto_numero, l.cliente_nombre,
              l.entregado AS premio_entregado, l.fecha_sorteo
       FROM sorteo_lugares l
       LEFT JOIN sorteos s ON s.id = l.sorteo_id
       WHERE l.boleto_numero IS NOT NULL
       ORDER BY l.fecha_sorteo DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/ganadores/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { premioEntregado } = req.body;
    if (premioEntregado === undefined) return res.status(400).json({ error: 'Nada que actualizar' });
    await pool.query('UPDATE sorteo_lugares SET entregado = ? WHERE id = ?', [premioEntregado ? 1 : 0, req.params.id]);
    res.json({ message: 'Ganador actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sorteos/:id/lugares', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, orden, premio, boleto_numero, cliente_nombre, entregado FROM sorteo_lugares WHERE sorteo_id = ? ORDER BY orden ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sorteos/:id/lugares', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM sorteo_lugares WHERE sorteo_id = ? ORDER BY orden ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sorteos/:id/lugares', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { premio } = req.body;
    if (!premio || !premio.trim()) return res.status(400).json({ error: 'El premio es obligatorio' });

    const [max] = await pool.query('SELECT MAX(orden) AS maxOrden FROM sorteo_lugares WHERE sorteo_id = ?', [req.params.id]);
    const siguienteOrden = (max[0].maxOrden || 0) + 1;

    const [result] = await pool.query(
      'INSERT INTO sorteo_lugares (sorteo_id, orden, premio) VALUES (?, ?, ?)',
      [req.params.id, siguienteOrden, premio.trim()]
    );

    // Si el sorteo ya estaba marcado como finalizado (porque se sortearon todos los
    // lugares que tenía), este lugar nuevo lo deja pendiente otra vez.
    await pool.query("UPDATE sorteos SET estado = 'activo' WHERE id = ? AND estado = 'finalizado'", [req.params.id]);

    res.status(201).json({ id: result.insertId, orden: siguienteOrden, message: 'Lugar creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/lugares/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { premio, entregado } = req.body;
    const campos = [];
    const valores = [];
    if (premio !== undefined) {
      if (!premio.trim()) return res.status(400).json({ error: 'El premio no puede quedar vacío' });
      campos.push('premio = ?');
      valores.push(premio.trim());
    }
    if (entregado !== undefined) { campos.push('entregado = ?'); valores.push(entregado ? 1 : 0); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    valores.push(req.params.id);
    await pool.query(`UPDATE sorteo_lugares SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ message: 'Lugar actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/lugares/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT boleto_numero FROM sorteo_lugares WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Lugar no encontrado' });
    if (rows[0].boleto_numero) {
      return res.status(400).json({ error: 'No se puede eliminar un lugar que ya fue sorteado' });
    }
    await pool.query('DELETE FROM sorteo_lugares WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lugar eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/lugares/:id/sortear', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const lugarId = req.params.id;

    const [lugares] = await pool.query('SELECT * FROM sorteo_lugares WHERE id = ?', [lugarId]);
    if (lugares.length === 0) return res.status(404).json({ error: 'Lugar no encontrado' });
    const lugar = lugares[0];
    if (lugar.boleto_numero) return res.status(400).json({ error: 'Este lugar ya fue sorteado' });

    const [sorteos] = await pool.query('SELECT * FROM sorteos WHERE id = ?', [lugar.sorteo_id]);
    const sorteo = sorteos[0];

    // No se puede sortear hasta que se hayan vendido todos los boletos del sorteo.
    if (sorteo.vendidos < sorteo.total) {
      return res.status(400).json({
        error: `Todavía faltan ${sorteo.total - sorteo.vendidos} boletos por vender. Debes vender el 100% antes de sortear.`,
      });
    }

    // Un boleto que ya ganó otro lugar de este mismo sorteo no puede volver a ganar.
    const [candidatos] = await pool.query(
      `SELECT b.numero, b.cliente_id, c.nombre AS cliente_nombre
       FROM boletos b
       LEFT JOIN clientes c ON c.id = b.cliente_id
       WHERE b.sorteo_id = ? AND b.estado = 'vendido'
       AND b.numero NOT IN (
         SELECT boleto_numero FROM sorteo_lugares WHERE sorteo_id = ? AND boleto_numero IS NOT NULL
       )
       ORDER BY RAND() LIMIT 1`,
      [lugar.sorteo_id, lugar.sorteo_id]
    );

    if (candidatos.length === 0) {
      return res.status(400).json({ error: 'No hay boletos vendidos disponibles para sortear este lugar' });
    }

    const ganador = candidatos[0];
    await pool.query(
      `UPDATE sorteo_lugares SET boleto_numero = ?, cliente_id = ?, cliente_nombre = ?, fecha_sorteo = NOW() WHERE id = ?`,
      [ganador.numero, ganador.cliente_id, ganador.cliente_nombre || 'Cliente', lugarId]
    );

    // Si ya no quedan lugares pendientes de este sorteo, se marca finalizado.
    const [pendientes] = await pool.query(
      'SELECT COUNT(*) AS count FROM sorteo_lugares WHERE sorteo_id = ? AND boleto_numero IS NULL',
      [lugar.sorteo_id]
    );
    if (pendientes[0].count === 0) {
      await pool.query("UPDATE sorteos SET estado = 'finalizado' WHERE id = ?", [lugar.sorteo_id]);
    }

    res.status(201).json({
      id: lugar.id,
      sorteoId: lugar.sorteo_id,
      sorteoNombre: sorteo.nombre,
      premio: lugar.premio,
      orden: lugar.orden,
      boletoNumero: ganador.numero,
      clienteNombre: ganador.cliente_nombre || 'Cliente',
    });
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
