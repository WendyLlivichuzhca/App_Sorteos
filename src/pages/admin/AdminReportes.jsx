import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getAdminReportes } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminReportes() {
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminReportes()
      .then(setReporte)
      .catch((err) => console.error("Error cargando reportes:", err))
      .finally(() => setLoading(false));
  }, []);

  const exportarCSV = () => {
    if (!reporte) return;
    const filas = [
      ["Sorteo", "Boletos Vendidos", "Total Boletos", "% Cumplido", "Ingresos Recaudados"],
      ...reporte.porSorteo.map((s) => [s.nombre, s.vendidos, s.total, `${s.porcentaje}%`, s.ingresos.toFixed(2)]),
    ];
    const csv = filas.map((f) => f.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-sorteos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminLayout title="Reportes y Estadísticas" subtitle="Exporta informes de rendimiento de sorteos y clientes frecuentes">
        <p>Cargando reportes...</p>
      </AdminLayout>
    );
  }

  const kpis = [
    { label: "Ingresos Mes Actual", value: formatMoney(reporte.ingresosMes), subtitle: "Recaudación aprobada", icon: "card", color: "green" },
    { label: "Sorteo Más Vendido", value: reporte.sorteoMasVendido, subtitle: "Mayor demanda", icon: "award", color: "purple" },
    { label: "Promedio por Cliente", value: formatMoney(reporte.promedioPorCliente), subtitle: "Gasto promedio", icon: "users", color: "blue" },
  ];

  return (
    <AdminLayout title="Reportes y Estadísticas" subtitle="Exporta informes de rendimiento de sorteos y clientes frecuentes">
      <div className={styles.topRow}>
        <div />
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className={styles.createBtn} style={{ background: "#16a34a" }} onClick={exportarCSV}>
            📊 Exportar CSV
          </button>
          <button type="button" className={styles.createBtn} style={{ background: "#dc2626" }} onClick={exportarPDF}>
            📄 Exportar PDF
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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
            <h3>Rendimiento por Sorteo</h3>
            <p>Boletos vendidos e ingresos recaudados en cada sorteo</p>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sorteo</th>
              <th>Boletos Vendidos</th>
              <th>Total Boletos</th>
              <th>% Cumplido</th>
              <th>Ingresos Recaudados</th>
            </tr>
          </thead>
          <tbody>
            {reporte.porSorteo.length === 0 && <tr><td colSpan={5}>No hay sorteos todavía.</td></tr>}
            {reporte.porSorteo.map((s) => (
              <tr key={s.nombre}>
                <td><strong>{s.nombre}</strong></td>
                <td>{s.vendidos}</td>
                <td>{s.total}</td>
                <td><span className={styles.categoryBadge}>{s.porcentaje}%</span></td>
                <td><strong>{formatMoney(s.ingresos)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
