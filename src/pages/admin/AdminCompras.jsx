import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getAdminCompras, updateEstadoCompra } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminCompras() {
  const [list, setList] = useState(comprasMock);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const toggleEstado = (id) => {
    setList((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, estado: c.estado === "aprobado" ? "pendiente" : "aprobado" } : c
      )
    );
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
            {list.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.comprador}</td>
                <td>{c.sorteo}</td>
                <td>{c.boletos} boletos</td>
                <td><strong>{formatMoney(c.total)}</strong></td>
                <td><span className={styles.categoryBadge}>{c.metodo}</span></td>
                <td>
                  <span className={`${styles.statusPill} ${c.estado === "aprobado" ? styles.activo : styles.proximamente}`}>
                    {c.estado.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => toggleEstado(c.id)}
                      title="Cambiar Estado"
                    >
                      {c.estado === "aprobado" ? "⏸️ Pendiente" : "✅ Aprobar"}
                    </button>
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
              <h3>Comprobante {selectedReceipt.id}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedReceipt(null)}>×</button>
            </div>
            <div style={{ padding: "24px" }}>
              <p><strong>Comprador:</strong> {selectedReceipt.comprador}</p>
              <p style={{ marginTop: "8px" }}><strong>Sorteo:</strong> {selectedReceipt.sorteo}</p>
              <p style={{ marginTop: "8px" }}><strong>Total:</strong> {formatMoney(selectedReceipt.total)}</p>
              <p style={{ marginTop: "8px" }}><strong>Método:</strong> {selectedReceipt.metodo}</p>
              <p style={{ marginTop: "8px" }}><strong>Fecha:</strong> {selectedReceipt.fecha}</p>
              <div style={{ marginTop: "16px", padding: "16px", background: "#f8f7fc", borderRadius: "10px", textAlign: "center", border: "1px dashed #6d3cf5" }}>
                 comprobante-pago-transaccion.pdf (Verificado 100%)
              </div>
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
