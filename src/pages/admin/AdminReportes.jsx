import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
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
      <AdminLayout title="Reportes y Estadísticas">
        <p>Cargando reportes...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reportes y Estadísticas">
      <div className={styles.topRow}>
        <div>
          <h2>Informes de Ventas e Ingresos</h2>
          <p>Exporta informes de rendimiento de sorteos y clientes frecuentes</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className={styles.createBtn} style={{ background: "#16a34a" }} onClick={exportarCSV}>
            📊 Exportar CSV
          </button>
          <button type="button" className={styles.createBtn} style={{ background: "#dc2626" }} onClick={exportarPDF}>
            📄 Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Ingresos Mes Actual</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#17152b", marginTop: "6px" }}>{formatMoney(reporte.ingresosMes)}</strong>
        </div>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Sorteo Más Vendido</span>
          <strong style={{ display: "block", fontSize: "20px", color: "#6d3cf5", marginTop: "6px" }}>{reporte.sorteoMasVendido}</strong>
        </div>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Promedio Venta por Cliente</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#17152b", marginTop: "6px" }}>{formatMoney(reporte.promedioPorCliente)}</strong>
        </div>
      </div>

      <div className={styles.tableCard}>
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
