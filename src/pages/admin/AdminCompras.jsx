import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getAdminCompras, updateEstadoCompra } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

const POR_PAGINA = 30;

export default function AdminCompras() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);

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

  useEffect(() => {
    setPagina(1);
  }, [filtroEstado]);

  const cambiarEstado = async (compra, estado) => {
    const mensaje =
      estado === "aprobado"
        ? `¿Confirmas que el pago de ${formatMoney(compra.total)} de "${compra.comprador}" (orden ${compra.codigo}) ya llegó a tu cuenta? Al aprobar, los boletos quedan marcados como vendidos.`
        : `¿Seguro que quieres rechazar la orden ${compra.codigo} de "${compra.comprador}"? Sus boletos volverán a estar disponibles.`;
    if (!window.confirm(mensaje)) return;
    try {
      await updateEstadoCompra(compra.id, estado);
      cargarCompras();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el estado de la compra");
    }
  };

  const kpis = [
    { label: "Total Compras", value: list.length, subtitle: "Registradas", icon: "cart", color: "purple" },
    { label: "Aprobadas", value: list.filter((c) => c.estado === "aprobado").length, subtitle: "Pagos confirmados", icon: "award", color: "green" },
    { label: "Pendientes", value: list.filter((c) => c.estado === "pendiente").length, subtitle: "Por revisar", icon: "clock", color: "orange" },
    { label: "Ingresos Aprobados", value: formatMoney(list.filter((c) => c.estado === "aprobado").reduce((acc, c) => acc + Number(c.total || 0), 0)), subtitle: "Recaudación real", icon: "card", color: "blue" },
  ];

  const listaFiltrada = filtroEstado === "todos" ? list : list.filter((c) => c.estado === filtroEstado);
  const totalPaginas = Math.max(Math.ceil(listaFiltrada.length / POR_PAGINA), 1);
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginados = listaFiltrada.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  return (
    <AdminLayout title="Gestión de Compras y Pagos" subtitle="Revisa, aprueba, rechaza y confirma los pagos recibidos">
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles[k.color]}`}>
              <Icon name={k.icon} size={19} />
            </div>
            <div>
              <span className={styles.kpiLabel}>{k.label}</span>
              <strong className={styles.kpiValue}>{k.value}</strong>
              <span className={styles.kpiSubtitle}>{k.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div>
            <h3>Historial de Compras</h3>
            <p>Todas las órdenes registradas en el sistema</p>
          </div>
          <select
            className={styles.filterSelect}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
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
            {!loading && listaFiltrada.length === 0 && (
              <tr><td colSpan={8}>No hay compras que coincidan con este filtro.</td></tr>
            )}
            {paginados.map((c) => (
              <tr key={c.id}>
                <td><strong style={{ color: "#1F8A5A" }}>{c.codigo}</strong></td>
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
                          onClick={() => cambiarEstado(c, "aprobado")}
                          title="Aprobar compra"
                        >
                          ✅
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => cambiarEstado(c, "rechazado")}
                          title="Rechazar compra"
                        >
                          ❌
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => setSelectedReceipt(c)}
                      title="Ver Comprobante"
                    >
                      📄
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {listaFiltrada.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderTop: "1.5px solid #ecebf3" }}>
            <span style={{ fontSize: "11.5px", color: "#6b6880" }}>
              Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–{Math.min(paginaSegura * POR_PAGINA, listaFiltrada.length)} de {listaFiltrada.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={paginaSegura <= 1}
                onClick={() => setPagina(paginaSegura - 1)}
                style={paginaSegura <= 1 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#17152b" }}>
                Página {paginaSegura} de {totalPaginas}
              </span>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPagina(paginaSegura + 1)}
                style={paginaSegura >= totalPaginas ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
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
                  style={{ display: "block", marginTop: "16px", padding: "16px", background: "#f8f7fc", borderRadius: "10px", textAlign: "center", border: "1px dashed #1F8A5A", color: "#1F8A5A", fontWeight: 600 }}
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
