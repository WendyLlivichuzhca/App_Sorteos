import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteos, getBoletosAdmin } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

const POR_PAGINA = 30;

export default function AdminBoletos() {
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [verDisponibles, setVerDisponibles] = useState(false);
  const [pagina, setPagina] = useState(1);

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

  useEffect(() => {
    setPagina(1);
  }, [sorteoId, filter, verDisponibles]);

  const cleanFilter = filter.replace(/^#/, "").trim().toLowerCase();
  const buscando = cleanFilter.length > 0;

  const base = buscando || verDisponibles ? boletos : boletos.filter((b) => b.estado === "vendido" || b.estado === "reservado");

  const filtered = base.filter(
    (b) =>
      b.numero.toLowerCase().includes(cleanFilter) ||
      (b.cliente_nombre || "").toLowerCase().includes(cleanFilter) ||
      (b.cliente_cedula || "").toLowerCase().includes(cleanFilter)
  );

  const totalPaginas = Math.max(Math.ceil(filtered.length / POR_PAGINA), 1);
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginados = filtered.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

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
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #ecebf3", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por # boleto o cliente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: 1, minWidth: "220px", maxWidth: "400px", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #ecebf3", fontSize: "12px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", fontWeight: 600, color: "#6b6880", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={verDisponibles} onChange={(e) => setVerDisponibles(e.target.checked)} />
            Ver también los disponibles
          </label>
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
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4}>{verDisponibles || buscando ? "No hay boletos para mostrar." : "No hay boletos vendidos o reservados todavía. Activa \"Ver también los disponibles\" para ver el resto."}</td></tr>
            )}
            {paginados.map((b) => (
              <tr key={b.id}>
                <td><strong style={{ color: "#1F8A5A" }}>#{b.numero}</strong></td>
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

        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderTop: "1.5px solid #ecebf3" }}>
            <span style={{ fontSize: "11.5px", color: "#6b6880" }}>
              Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–{Math.min(paginaSegura * POR_PAGINA, filtered.length)} de {filtered.length}
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
    </AdminLayout>
  );
}
