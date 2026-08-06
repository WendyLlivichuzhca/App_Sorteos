import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { getAdminCompras, updateEstadoCompra } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminCompras() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const cargarCompras = () => {
    setLoading(true);
    getAdminCompras()
      .then((data) => setList(data))
      .catch((err) => console.error("Error cargando compras:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await updateEstadoCompra(id, estado);
      cargarCompras();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el estado de la compra");
    }
  };

  return (
    <AdminLayout title="Gestión de Compras y Pagos">
      <div className={styles.topRow}>
        <div>
          <h2>Historial de Compras</h2>
          <p>Revisa, aprueba, rechaza y confirma los pagos recibidos</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Orden #</th>
              <th>Comprador</th>
              <th>Sorteo</th>
              <th>Boletos</th>
              <th>Total</th>
              <th>Método Pago</th>
              <th>Estado Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8}>Cargando compras...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={8}>No hay compras registradas todavía.</td></tr>
            )}
            {list.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.codigo}</strong></td>
                <td>{c.comprador}</td>
                <td>{c.sorteoNombre}</td>
                <td>{c.boletos} boletos</td>
                <td><strong>{formatMoney(c.total)}</strong></td>
                <td><span className={styles.categoryBadge}>{c.metodo}</span></td>
                <td>
                  <span className={`${styles.statusPill} ${c.estado === "aprobado" ? styles.activo : c.estado === "pendiente" ? styles.proximamente : styles.agotado}`}>
                    {c.estado.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    {c.estado === "pendiente" && (
                      <>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => cambiarEstado(c.id, "aprobado")}
                          title="Aprobar compra"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => cambiarEstado(c.id, "rechazado")}
                          title="Rechazar compra"
                        >
                          ❌ Rechazar
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => setSelectedReceipt(c)}
                      title="Ver Comprobante"
                    >
                      📄 Ver
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReceipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Comprobante {selectedReceipt.codigo}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedReceipt(null)}>×</button>
            </div>
            <div style={{ padding: "24px" }}>
              <p><strong>Comprador:</strong> {selectedReceipt.comprador}</p>
              <p style={{ marginTop: "8px" }}><strong>Sorteo:</strong> {selectedReceipt.sorteoNombre}</p>
              <p style={{ marginTop: "8px" }}><strong>Total:</strong> {formatMoney(selectedReceipt.total)}</p>
              <p style={{ marginTop: "8px" }}><strong>Método:</strong> {selectedReceipt.metodo}</p>
              <p style={{ marginTop: "8px" }}><strong>Fecha:</strong> {new Date(selectedReceipt.fecha).toLocaleString("es-ES")}</p>
              <p style={{ marginTop: "8px" }}><strong>Boletos asignados:</strong> {(selectedReceipt.boletosAsignados || []).map((n) => `#${n}`).join(", ")}</p>
              {selectedReceipt.comprobante_url ? (
                <a
                  href={selectedReceipt.comprobante_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", marginTop: "16px", padding: "16px", background: "#f8f7fc", borderRadius: "10px", textAlign: "center", border: "1px dashed #6d3cf5", color: "#6d3cf5", fontWeight: 600 }}
                >
                  Ver comprobante subido ↗
                </a>
              ) : (
                <div style={{ marginTop: "16px", padding: "16px", background: "#f8f7fc", borderRadius: "10px", textAlign: "center", border: "1px dashed #ecebf3", color: "#9795a8" }}>
                  El cliente no subió comprobante
                </div>
              )}
              <button
                type="button"
                className={styles.saveBtn}
                style={{ width: "100%", marginTop: "20px" }}
                onClick={() => setSelectedReceipt(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
