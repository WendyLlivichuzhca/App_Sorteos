import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultData = {
  categorias: [
    { id: 1, nombre: 'Autos y Motos', slug: 'autos', icono: 'car' },
    { id: 2, nombre: 'Tecnología', slug: 'tecnologia', icono: 'smartphone' },
    { id: 3, nombre: 'Efectivo y Premios', slug: 'premios', icono: 'award' },
    { id: 4, nombre: 'Casas e Inmuebles', slug: 'casas', icono: 'home' },
  ],
  sorteos: [
    {
      id: 1,
      nombre: 'Toyota Fortuner 4x4 2026',
      categoria: 'autos',
      precio: 2.0,
      total: 1000,
      vendidos: 480,
      estado: 'activo',
      fechaSorteo: '2026-08-30',
      galeria: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
    },
    {
      id: 2,
      nombre: 'iPhone 15 Pro Max 1TB (Titanio)',
      categoria: 'tecnologia',
      precio: 1.0,
      total: 500,
      vendidos: 320,
      estado: 'activo',
      fechaSorteo: '2026-08-25',
      galeria: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'],
    },
  ],
  paquetes: [],
  clientes: [],
  compras: [],
  boletos: [],
};

const dbFile = path.join(__dirname, 'db.json');
let db;

export async function initDB() {
  db = await JSONFilePreset(dbFile, defaultData);
  await db.read();

  // Generate initial tickets for default raffles if empty
  if (db.data.boletos.length === 0) {
    for (const sorteo of db.data.sorteos) {
      generarBoletos(sorteo.id, sorteo.total, sorteo.vendidos);
    }
    await db.write();
  }

  console.log('✅ Base de datos JSON inicializada correctamente en db.json');
}

export function getDB() {
  return db;
}

export function generarBoletos(sorteoId, total, vendidosIniciales = 0) {
  const existing = db.data.boletos.filter((b) => b.sorteoId === sorteoId);
  if (existing.length > 0) return;

  for (let i = 1; i <= total; i++) {
    const numStr = String(i).padStart(4, '0');
    const estado = i <= vendidosIniciales ? 'vendido' : 'disponible';
    db.data.boletos.push({
      id: `${sorteoId}_${numStr}`,
      sorteoId,
      numero: numStr,
      estado,
      compraId: null,
      clienteId: null,
    });
  }
}

export default db;
