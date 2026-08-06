import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";
import { formatMoney } from "../../utils/format.js";

export default function AdminReportes() {
  const exportAlert = (type) => {
    alert(`Generando y descargando reporte en formato ${type}...`);
  };

  return (
    <AdminLayout title="Reportes y Estadísticas">
      <div className={styles.topRow}>
        <div>
          <h2>Informes de Ventas e Ingresos</h2>
          <p>Exporta informes de rendimiento de sorteos y clientes frecuentes</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className={styles.createBtn} style={{ background: "#16a34a" }} onClick={() => exportAlert("Excel (.xlsx)")}>
            📊 Exportar Excel
          </button>
          <button type="button" className={styles.createBtn} style={{ background: "#dc2626" }} onClick={() => exportAlert("PDF (.pdf)")}>
            📄 Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Ingresos Mes Actual</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#17152b", marginTop: "6px" }}>{formatMoney(6850.00)}</strong>
        </div>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Sorteo Más Vendido</span>
          <strong style={{ display: "block", fontSize: "20px", color: "#6d3cf5", marginTop: "6px" }}>Toyota Fortuner 4x4</strong>
        </div>
        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <span style={{ fontSize: "12.5px", color: "#6b6880", fontWeight: "600" }}>Promedio Venta por Cliente</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#17152b", marginTop: "6px" }}>{formatMoney(18.50)}</strong>
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
            <tr>
              <td><strong>Toyota Fortuner 4x4</strong></td>
              <td>650</td>
              <td>1200</td>
              <td><span className={styles.categoryBadge}>54%</span></td>
              <td><strong>{formatMoney(1300.00)}</strong></td>
            </tr>
            <tr>
              <td><strong>iPhone 15 Pro Max</strong></td>
              <td>300</td>
              <td>750</td>
              <td><span className={styles.categoryBadge}>40%</span></td>
              <td><strong>{formatMoney(450.00)}</strong></td>
            </tr>
            <tr>
              <td><strong>Yamaha MT-09</strong></td>
              <td>900</td>
              <td>1059</td>
              <td><span className={styles.categoryBadge}>85%</span></td>
              <td><strong>{formatMoney(2700.00)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
