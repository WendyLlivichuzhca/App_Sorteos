import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { getAdminClientes, getClienteHistorial, toggleBloqueoCliente } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminClientes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  const cargarClientes = () => {
    setLoading(true);
    getAdminClientes()
      .then(setList)
      .catch((err) => console.error("Error cargando clientes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const toggleBloqueo = async (c) => {
    try {
      await toggleBloqueoCliente(c.id, !c.bloqueado);
      cargarClientes();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el bloqueo del cliente");
    }
  };

  const verHistorial = async (c) => {
    setSelectedClient(c);
    setHistorialLoading(true);
    try {
      const data = await getClienteHistorial(c.id);
      setHistorial(data);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setHistorial([]);
    } finally {
      setHistorialLoading(false);
    }
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
              <th>Total Gastado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8}>Cargando clientes...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8}>No hay clientes registrados todavía.</td></tr>}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.correo}</td>
                <td>{c.celular}</td>
                <td>{c.cedula}</td>
                <td>{c.compras} compras</td>
                <td>{formatMoney(c.total_gastado)}</td>
                <td>
                  <span className={`${styles.statusPill} ${c.bloqueado ? styles.finalizado : styles.activo}`}>
                    {c.bloqueado ? "BLOQUEADO" : "ACTIVO"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <button type="button" className={styles.iconBtn} onClick={() => verHistorial(c)}>
                      📜 Historial
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => toggleBloqueo(c)}>
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
                {historialLoading && <p style={{ marginTop: "8px", fontSize: "13px" }}>Cargando...</p>}
                {!historialLoading && historial.length === 0 && (
                  <p style={{ marginTop: "8px", fontSize: "13px", color: "#6b6880" }}>Sin compras registradas.</p>
                )}
                <ul style={{ marginTop: "8px", fontSize: "13px", color: "#6b6880", lineHeight: "1.6" }}>
                  {historial.map((h) => (
                    <li key={h.id}>
                      • {h.sorteoNombre} - {h.boletos} boletos ({formatMoney(h.total)}) — {h.estado}
                    </li>
                  ))}
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
