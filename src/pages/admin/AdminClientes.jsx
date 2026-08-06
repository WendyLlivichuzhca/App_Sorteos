import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";

const clientesMock = [
  { id: "c1", nombre: "Carlos Mendoza", correo: "carlos.mendoza@email.com", celular: "0991234567", cedula: "1726384910", compras: 3, totalGastado: 45.0, bloqueado: false },
  { id: "c2", nombre: "María Fernanda Ríos", correo: "maria.rios@email.com", celular: "0987654321", cedula: "0918273645", compras: 5, totalGastado: 78.0, bloqueado: false },
  { id: "c3", nombre: "Juan Pablo Torres", correo: "juan.torres@email.com", celular: "0998877665", cedula: "0102938475", compras: 2, totalGastado: 30.0, bloqueado: false },
  { id: "c4", nombre: "Lucía Gómez", correo: "lucia.gomez@email.com", celular: "0991122334", cedula: "1720394857", compras: 1, totalGastado: 2.0, bloqueado: true },
];

export default function AdminClientes() {
  const [list, setList] = useState(clientesMock);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const toggleBloqueo = (id) => {
    setList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, bloqueado: !c.bloqueado } : c))
    );
  };

  const filtered = list.filter(
    (c) =>
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.correo.toLowerCase().includes(query.toLowerCase()) ||
      c.cedula.includes(query)
  );

  return (
    <AdminLayout title="Gestión de Clientes">
      <div className={styles.topRow}>
        <div>
          <h2>Directorio de Clientes</h2>
          <p>Revisa el historial de compras de los compradores y gestiona bloqueos</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #ecebf3" }}>
          <input
            type="text"
            placeholder="🔍 Buscar cliente por nombre, correo o cédula..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #ecebf3" }}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo</th>
              <th>Celular</th>
              <th>Cédula</th>
              <th>Compras</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.correo}</td>
                <td>{c.celular}</td>
                <td>{c.cedula}</td>
                <td>{c.compras} compras</td>
                <td>
                  <span className={`${styles.statusPill} ${c.bloqueado ? styles.finalizado : styles.activo}`}>
                    {c.bloqueado ? "BLOQUEADO" : "ACTIVO"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <button type="button" className={styles.iconBtn} onClick={() => setSelectedClient(c)}>
                      📜 Historial
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => toggleBloqueo(c.id)}
                    >
                      {c.bloqueado ? "🔓 Desbloquear" : "🚫 Bloquear"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Historial de Compras: {selectedClient.nombre}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedClient(null)}>×</button>
            </div>
            <div style={{ padding: "20px" }}>
              <p><strong>Cédula:</strong> {selectedClient.cedula}</p>
              <p style={{ marginTop: "4px" }}><strong>Correo:</strong> {selectedClient.correo}</p>
              <div style={{ marginTop: "16px", background: "#f8f7fc", padding: "14px", borderRadius: "10px" }}>
                <p style={{ fontWeight: "700" }}>Sorteos Participados:</p>
                <ul style={{ marginTop: "8px", fontSize: "13px", color: "#6b6880", lineHeight: "1.6" }}>
                  <li>• Toyota Fortuner 4x4 - Boleto #1894 ($15.00)</li>
                  <li>• iPhone 15 Pro Max - Boleto #0012 ($6.00)</li>
                </ul>
              </div>
              <button
                type="button"
                className={styles.saveBtn}
                style={{ width: "100%", marginTop: "20px" }}
                onClick={() => setSelectedClient(null)}
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
