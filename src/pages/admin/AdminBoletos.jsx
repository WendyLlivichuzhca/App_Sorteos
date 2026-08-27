import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteos, getBoletosAdmin } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminBoletos() {
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getSorteos()
      .then((data) => {
        setSorteos(data);
        if (data.length > 0) setSorteoId(String(data[0].id));
      })
      .catch((err) => console.error("Error cargando sorteos:", err));
  }, []);

  useEffect(() => {
    if (!sorteoId) return;
    setLoading(true);
    getBoletosAdmin(sorteoId)
      .then(setBoletos)
      .catch((err) => console.error("Error cargando boletos:", err))
      .finally(() => setLoading(false));
  }, [sorteoId]);

  const cleanFilter = filter.replace(/^#/, "").trim().toLowerCase();
  const filtered = boletos.filter(
    (b) =>
      b.numero.toLowerCase().includes(cleanFilter) ||
      (b.cliente_nombre || "").toLowerCase().includes(cleanFilter) ||
      (b.cliente_cedula || "").toLowerCase().includes(cleanFilter)
  );

  const kpis = [
    { label: "Total Boletos", value: boletos.length, subtitle: "En este sorteo", icon: "ticket", color: "purple" },
    { label: "Vendidos", value: boletos.filter((b) => b.estado === "vendido").length, subtitle: "Confirmados", icon: "award", color: "green" },
    { label: "Reservados", value: boletos.filter((b) => b.estado === "reservado").length, subtitle: "Pago pendiente", icon: "clock", color: "orange" },
    { label: "Disponibles", value: boletos.filter((b) => b.estado !== "vendido" && b.estado !== "reservado").length, subtitle: "Sin asignar", icon: "box", color: "blue" },
  ];

  return (
    <AdminLayout title="Gestión de Boletos" subtitle="Consulta el estado y asignación de boletos por sorteo">
      <div className={styles.topRow}>
        <div />
        <select
          className={styles.filterSelect}
          value={sorteoId}
          onChange={(e) => setSorteoId(e.target.value)}
        >
          {sorteos.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

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
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #ecebf3" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por # boleto o cliente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #ecebf3" }}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th># Número Boleto</th>
              <th>Cliente Asignado</th>
              <th>Cédula</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Cargando boletos...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={4}>No hay boletos para mostrar.</td></tr>}
            {filtered.map((b) => (
              <tr key={b.id}>
                <td><strong style={{ color: "#6d3cf5" }}>#{b.numero}</strong></td>
                <td><strong>{b.cliente_nombre || "Disponible"}</strong></td>
                <td>{b.cliente_cedula || "-"}</td>
                <td>
                  <span className={`${styles.statusPill} ${b.estado === "vendido" ? styles.activo : b.estado === "reservado" ? styles.proximamente : styles.agotado}`}>
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
