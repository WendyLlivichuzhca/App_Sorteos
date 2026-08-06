import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDB, getDB, generarBoletos } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize DB before routing
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
// 1. SORTEOS ENDPOINTS
// ==========================================
app.get('/api/sorteos', async (req, res) => {
  try {
    const db = getDB();
    const { categoria, estado } = req.query;
    let list = [...db.data.sorteos];

    if (categoria && categoria !== 'todos') {
      list = list.filter((s) => s.categoria === categoria);
    }
    if (estado && estado !== 'todos') {
      list = list.filter((s) => s.estado === estado);
    }

    res.json(list.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sorteos/:id', async (req, res) => {
  try {
    const db = getDB();
    const sorteoId = parseInt(req.params.id);
    const sorteo = db.data.sorteos.find((s) => s.id === sorteoId);
    if (!sorteo) return res.status(404).json({ error: 'Sorteo no encontrado' });

    const disponibles = db.data.boletos.filter((b) => b.sorteoId === sorteoId && b.estado === 'disponible').length;

    res.json({
      ...sorteo,
      disponibles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sorteos', async (req, res) => {
  try {
    const db = getDB();
    const { nombre, categoria, precio, total, estado, fechaSorteo, galeria } = req.body;
    const newId = Date.now();

    const newSorteo = {
      id: newId,
      nombre,
      categoria: categoria || 'autos',
      precio: parseFloat(precio),
      total: parseInt(total),
      vendidos: 0,
      estado: estado || 'activo',
      fechaSorteo: fechaSorteo || '2026-08-30',
      galeria: galeria || [],
    };

    db.data.sorteos.push(newSorteo);
    generarBoletos(newId, parseInt(total), 0);
    await db.write();

    res.status(201).json({ id: newId, message: 'Sorteo creado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sorteos/:id', async (req, res) => {
  try {
    const db = getDB();
    const sorteoId = parseInt(req.params.id);
    const index = db.data.sorteos.findIndex((s) => s.id === sorteoId);
    if (index === -1) return res.status(404).json({ error: 'Sorteo no encontrado' });

    const { nombre, categoria, precio, total, estado, fechaSorteo, galeria } = req.body;
    db.data.sorteos[index] = {
      ...db.data.sorteos[index],
      nombre: nombre ?? db.data.sorteos[index].nombre,
      categoria: categoria ?? db.data.sorteos[index].categoria,
      precio: precio ? parseFloat(precio) : db.data.sorteos[index].precio,
      total: total ? parseInt(total) : db.data.sorteos[index].total,
      estado: estado ?? db.data.sorteos[index].estado,
      fechaSorteo: fechaSorteo ?? db.data.sorteos[index].fechaSorteo,
      galeria: galeria ?? db.data.sorteos[index].galeria,
    };

    await db.write();
    res.json({ message: 'Sorteo actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sorteos/:id', async (req, res) => {
  try {
    const db = getDB();
    const sorteoId = parseInt(req.params.id);
    db.data.sorteos = db.data.sorteos.filter((s) => s.id !== sorteoId);
    db.data.boletos = db.data.boletos.filter((b) => b.sorteoId !== sorteoId);
    await db.write();
    res.json({ message: 'Sorteo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CHECKOUT & TICKET ENGINE (COMPRAS)
// ==========================================
app.post('/api/compras/checkout', async (req, res) => {
  try {
    const db = getDB();
    const { sorteoId, cantidad, comprador, metodoPago } = req.body;
    const sId = parseInt(sorteoId);
    const cant = parseInt(cantidad);

    if (!sId || !cant || !comprador || !comprador.cedula) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para la compra' });
    }

    const sorteo = db.data.sorteos.find((s) => s.id === sId);
    if (!sorteo) return res.status(404).json({ error: 'Sorteo no encontrado' });

    // 1. Get or create customer by Cédula
    let cliente = db.data.clientes.find((c) => c.cedula === comprador.cedula);
    if (!cliente) {
      cliente = {
        id: Date.now(),
        nombre: comprador.nombre,
        cedula: comprador.cedula,
        correo: comprador.correo,
        celular: comprador.celular,
        fecha: new Date().toISOString(),
      };
      db.data.clientes.push(cliente);
    }

    // 2. Random Ticket Allocation Engine (Pick random available tickets)
    const disponibles = db.data.boletos.filter((b) => b.sorteoId === sId && b.estado === 'disponible');

    if (disponibles.length < cant) {
      return res.status(400).json({ error: 'No hay suficientes boletos disponibles para este sorteo' });
    }

    // Shuffle disponibles array to assign truly random tickets
    const shuffled = [...disponibles].sort(() => 0.5 - Math.random());
    const seleccionados = shuffled.slice(0, cant);
    const numerosAsignados = seleccionados.map((b) => b.numero);
    const totalPagado = parseFloat(sorteo.precio) * cant;
    const codigoOrden = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const compraId = Date.now();

    // 3. Create purchase order & mark tickets as reserved
    const nuevaCompra = {
      id: compraId,
      codigo: codigoOrden,
      sorteoId: sId,
      sorteoNombre: sorteo.nombre,
      clienteId: cliente.id,
      clienteNombre: comprador.nombre,
      clienteCedula: comprador.cedula,
      clienteCorreo: comprador.correo,
      clienteCelular: comprador.celular,
      cantidadBoletos: cant,
      totalPagado,
      metodoPago: metodoPago || 'transferencia',
      estado: 'pendiente',
      boletosAsignados: numerosAsignados,
      comprobanteUrl: null,
      fechaCompra: new Date().toISOString(),
    };

    db.data.compras.push(nuevaCompra);

    // Update tickets status to reserved
    for (const b of seleccionados) {
      b.estado = 'reservado';
      b.compraId = compraId;
      b.clienteId = cliente.id;
    }

    await db.write();

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
    const db = getDB();
    const compraId = parseInt(req.params.id);
    const compra = db.data.compras.find((c) => c.id === compraId);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });

    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const fileUrl = `/uploads/${req.file.filename}`;

    compra.comprobanteUrl = fileUrl;
    await db.write();

    res.json({ success: true, comprobanteUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search tickets by Cédula
app.get('/api/compras/buscar', async (req, res) => {
  try {
    const db = getDB();
    const { cedula } = req.query;
    if (!cedula) return res.status(400).json({ error: 'Proporcione un número de cédula' });

    const compras = db.data.compras.filter((c) => c.clienteCedula === cedula);
    res.json(compras.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ADMIN PANEL ENDPOINTS
// ==========================================
app.get('/api/admin/compras', async (req, res) => {
  try {
    const db = getDB();
    res.json([...db.data.compras].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/compras/:id/estado', async (req, res) => {
  try {
    const db = getDB();
    const compraId = parseInt(req.params.id);
    const { estado } = req.body; // 'aprobado' or 'rechazado'

    const compra = db.data.compras.find((c) => c.id === compraId);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });

    compra.estado = estado;

    if (estado === 'aprobado') {
      // Mark tickets as 'vendido' and increment sorteo.vendidos
      const boletos = db.data.boletos.filter((b) => b.compraId === compraId);
      for (const b of boletos) {
        b.estado = 'vendido';
      }
      const sorteo = db.data.sorteos.find((s) => s.id === compra.sorteoId);
      if (sorteo) {
        sorteo.vendidos += compra.cantidadBoletos;
      }
    } else if (estado === 'rechazado' || estado === 'cancelado') {
      // Release tickets back to 'disponible'
      const boletos = db.data.boletos.filter((b) => b.compraId === compraId);
      for (const b of boletos) {
        b.estado = 'disponible';
        b.compraId = null;
        b.clienteId = null;
      }
    }

    await db.write();
    res.json({ message: `Compra ${estado} exitosamente` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const db = getDB();
    const totalVentas = db.data.compras
      .filter((c) => c.estado === 'aprobado')
      .reduce((sum, c) => sum + c.totalPagado, 0);

    const sorteosActivos = db.data.sorteos.filter((s) => s.estado === 'activo').length;
    const boletosVendidos = db.data.sorteos.reduce((sum, s) => sum + s.vendidos, 0);
    const ultimasCompras = [...db.data.compras].reverse().slice(0, 5);

    res.json({
      totalVentas,
      sorteosActivos,
      boletosVendidos,
      ultimasCompras,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend de Sorteos corriendo en puerto ${PORT}`);
});
