import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";

const boletosMock = [
  { id: "#0421", sorteo: "PlayStation 5 Slim 1TB", cliente: "Carlos Mendoza", cedula: "1726384910", estado: "ganador" },
  { id: "#1894", sorteo: "Toyota Fortuner 4x4", cliente: "María Fernanda Ríos", cedula: "0918273645", estado: "vendido" },
  { id: "#0752", sorteo: "Yamaha MT-09", cliente: "Juan Pablo Torres", cedula: "0102938475", estado: "vendido" },
  { id: "#0012", sorteo: "iPhone 15 Pro Max", cliente: "Lucía Gómez", cedula: "1720394857", estado: "vendido" },
  { id: "#0013", sorteo: "iPhone 15 Pro Max", cliente: "Disponible", cedula: "-", estado: "disponible" },
];

export default function AdminBoletos() {
  const [list, setList] = useState(boletosMock);
  const [filter, setFilter] = useState("");

  const handleGenerarBoletos = () => {
    const nuevoCodigo = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const nuevoBoleto = {
      id: nuevoCodigo,
      sorteo: "Toyota Fortuner 4x4",
      cliente: "Disponible (Generado)",
      cedula: "-",
      estado: "disponible",
    };
    setList([nuevoBoleto, ...list]);
    alert(`¡Se ha generado con éxito el boleto ${nuevoCodigo}!`);
  };

  const filtered = list.filter(
    (b) =>
      b.id.toLowerCase().includes(filter.toLowerCase()) ||
      b.cliente.toLowerCase().includes(filter.toLowerCase()) ||
      b.sorteo.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AdminLayout title="Gestión de Boletos">
      <div className={styles.topRow}>
        <div>
          <h2>Monitoreo y Generación de Boletos</h2>
          <p>Genera boletos aleatorios, consulta asignaciones, vendidos y disponibles</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={handleGenerarBoletos}>
          🎫 Generar Boleto Nuevo
        </button>
      </div>

      <div className={styles.tableCard}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #ecebf3" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por # boleto, cliente o sorteo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #ecebf3" }}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th># Número Boleto</th>
              <th>Sorteo</th>
              <th>Cliente Asignado</th>
              <th>Cédula</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td><strong style={{ color: "#6d3cf5" }}>{b.id}</strong></td>
                <td>{b.sorteo}</td>
                <td><strong>{b.cliente}</strong></td>
                <td>{b.cedula}</td>
                <td>
                  <span className={`${styles.statusPill} ${b.estado === "ganador" ? styles.proximamente : b.estado === "vendido" ? styles.activo : styles.agotado}`}>
                    {b.estado.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
