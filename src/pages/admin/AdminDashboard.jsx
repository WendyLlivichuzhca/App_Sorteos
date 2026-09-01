import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getAdminDashboard } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminDashboard.module.css";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Rellena los últimos 8 meses (incluido el actual) con los datos reales que haya,
// y 0 en los meses sin ventas todavía, para que el gráfico no se vea roto.
function construirRangoMeses(ventasMensuales) {
  const porMes = new Map(ventasMensuales.map((m) => [m.ym, m]));
  const hoy = new Date();
  const rango = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const real = porMes.get(ym);
    rango.push({
      mes: MESES[d.getMonth()],
      ventas: real ? real.ventas : 0,
      ingresos: real ? real.ingresos : 0,
      isCurrent: i === 0,
    });
  }
  return rango;
}

// Redondea hacia arriba a un número "bonito" (5, 10, 20, 25, 50, 100...) para usar como techo del eje.
function techoBonito(valor) {
  if (valor <= 0) return 5;
  const magnitud = 10 ** Math.floor(Math.log10(valor));
  const pasos = [1, 2, 2.5, 5, 10];
  for (const p of pasos) {
    const techo = p * magnitud;
    if (techo >= valor) return techo;
  }
  return 10 * magnitud;
}

// Genera las marcas del eje (0 a techo) de arriba hacia abajo, para mostrarlas en el gráfico.
function marcasEje(techo, cantidad = 5) {
  const marcas = [];
  for (let i = cantidad; i >= 0; i--) {
    marcas.push(Math.round((techo / cantidad) * i));
  }
  return marcas;
}

// Genera los puntos de un mini-gráfico de línea (sparkline) a partir de una serie de números reales.
function sparklinePoints(valores) {
  const max = Math.max(...valores, 1);
  const paso = 90 / Math.max(valores.length - 1, 1);
  return valores.map((v, i) => `${i * paso},${36 - (v / max) * 32}`).join(" ");
}

const iniciales = (nombre) =>
  (nombre || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

const hace = (fecha) => {
  const diffMs = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Justo ahora";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVentas: 0,
    sorteosActivos: 0,
    boletosVendidos: 0,
    ultimasCompras: [],
    ventasMensuales: [],
    topSorteos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar dashboard admin:", err);
        setLoading(false);
      });
  }, []);

  const ventasMensuales = construirRangoMeses(stats.ventasMensuales);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const mesActual = ventasMensuales[ventasMensuales.length - 1];
  const mesMostrado = selectedMonth || mesActual;
  const maxVal = Math.max(...ventasMensuales.map((m) => m.ventas), 1);
  const maxIngresos = Math.max(...ventasMensuales.map((m) => m.ingresos), 1);
  const techoVentas = techoBonito(maxVal);
  const techoIngresos = techoBonito(maxIngresos);
  const marcasVentas = marcasEje(techoVentas);
  const marcasIngresos = marcasEje(techoIngresos);

  const kpis = [
    {
      label: "Ventas Totales",
      value: `${stats.boletosVendidos}`,
      subtitle: "Boletos vendidos",
      icon: "ticket",
      color: "purple",
      sparkline: sparklinePoints(ventasMensuales.map((m) => m.ventas)),
    },
    {
      label: "Ingresos Totales",
      value: formatMoney(stats.totalVentas),
      subtitle: "Recaudación neta (aprobado)",
      icon: "card",
      color: "green",
      sparkline: sparklinePoints(ventasMensuales.map((m) => m.ingresos)),
    },
    { label: "Sorteos Activos", value: `${stats.sorteosActivos} Activos`, subtitle: "En curso ahora", icon: "award", color: "blue" },
    { label: "Compras Recientes", value: `${stats.ultimasCompras.length}`, subtitle: "Últimas registradas", icon: "chart", color: "orange" },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard de Control" subtitle="Resumen general de tu sistema">
        <p>Cargando dashboard...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard de Control" subtitle="Resumen general de tu sistema">
      {/* 1. KPIs Grid Top */}
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={`${styles.kpiIconWrap} ${styles[k.color]}`}>
                <Icon name={k.icon} size={20} />
              </div>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <strong className={styles.kpiValue}>{k.value}</strong>
              <span className={styles.kpiSubtitle}>{k.subtitle}</span>
            </div>
            {k.sparkline && (
              <svg className={styles.kpiSpark} viewBox="0 0 90 36" preserveAspectRatio="none">
                <polyline
                  points={k.sparkline}
                  fill="none"
                  stroke={k.color === "green" ? "#16a34a" : "#1F8A5A"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* 2. Middle Grid: Interactive Chart + Top Sorteos */}
      <div className={styles.middleGrid}>
        {/* Gráfico de Ventas e Ingresos */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Rendimiento de Ventas Mensuales</h3>
              <p>Boletos vendidos e ingresos aprobados por mes</p>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} />
                <span>Boletos vendidos</span>
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.green}`} />
                <span>Ingresos aprobados</span>
              </span>
            </div>
          </div>

          {/* Renderizado del Gráfico de Barras */}
          <div className={styles.chartAxisRow}>
            <div className={styles.axisCol}>
              <span className={styles.axisTitle}>Boletos</span>
              <div className={styles.axisTicks}>
                {marcasVentas.map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
            </div>

            <div className={styles.barsContainer}>
            <svg
              className={styles.lineOverlay}
              viewBox={`0 0 ${ventasMensuales.length * 100} 100`}
              preserveAspectRatio="none"
            >
              <polyline
                points={ventasMensuales
                  .map((m, i) => `${(i + 0.5) * 100},${100 - (m.ingresos / techoIngresos) * 100}`)
                  .join(" ")}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {ventasMensuales.map((m, i) => (
                <circle
                  key={i}
                  cx={(i + 0.5) * 100}
                  cy={100 - (m.ingresos / techoIngresos) * 100}
                  r="4"
                  fill="#16a34a"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {ventasMensuales.map((m, i) => {
              const heightPercent = Math.round((m.ventas / techoVentas) * 100);
              const isSelected = mesMostrado === m || (!selectedMonth && m.isCurrent);

              return (
                <div
                  key={`${m.mes}-${i}`}
                  className={`${styles.barCol} ${isSelected ? styles.barColActive : ""}`}
                  onClick={() => setSelectedMonth(m)}
                >
                  <div className={styles.barTooltip}>
                    <strong>{formatMoney(m.ingresos)}</strong>
                    <span>{m.ventas} boletos</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ height: `${Math.max(heightPercent, m.ventas > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{m.mes}</span>
                </div>
              );
            })}
            </div>

            <div className={`${styles.axisCol} ${styles.axisColRight}`}>
              <span className={styles.axisTitle}>Ingresos</span>
              <div className={styles.axisTicks}>
                {marcasIngresos.map((v) => (
                  <span key={v}>{formatMoney(v)}</span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.chartFooter}>
            <div className={styles.footerStat}>
              <span>Mes Seleccionado: <strong>{mesMostrado.mes}</strong></span>
              <span>Total Recaudado: <strong className={styles.accentText}>{formatMoney(mesMostrado.ingresos)}</strong></span>
            </div>
            <Link to="/admin/reportes" className={styles.reportBtn}>
              Ver reporte detallado →
            </Link>
          </div>
        </div>

        {/* Top Sorteos Más Vendidos */}
        <div className={styles.topCard}>
          <div className={styles.cardHeader}>
            <h3>Sorteos en Tendencia</h3>
            <Link to="/admin/sorteos" className={styles.linkSmall}>
              Ver todos
            </Link>
          </div>

          <div className={styles.topList}>
            {stats.topSorteos.length === 0 && <p style={{ fontSize: "13px", color: "#57536D" }}>Todavía no hay sorteos.</p>}
            {stats.topSorteos.map((s) => (
              <div key={s.nombre} className={styles.topItem}>
                <div className={styles.topItemHead}>
                  <strong>{s.nombre}</strong>
                  <span className={styles.tagPill}>{s.categoria}</span>
                </div>
                <div className={styles.topItemMeta}>
                  <span>{s.vendidos} de {s.total} vendidos</span>
                  <strong>{s.porcentaje}%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${s.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.quickCreateBox}>
            <Link to="/admin/sorteos" className={styles.quickCreateBtn}>
              <Icon name="plus" size={16} /> Crear Nuevo Sorteo
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Tabla de Transacciones Recientes */}
      <div className={styles.bottomCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Últimas Compras Registradas</h3>
            <p>Listado en tiempo real de boletos adquiridos por clientes</p>
          </div>
          <Link to="/admin/compras" className={styles.verTodosLink}>
            Ver historial de compras →
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Orden #</th>
                <th>Cliente / Comprador</th>
                <th>Sorteo</th>
                <th>Categoría</th>
                <th>Boletos</th>
                <th>Total</th>
                <th>Estado Pago</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.ultimasCompras.length === 0 && (
                <tr><td colSpan={8}>No hay compras registradas todavía.</td></tr>
              )}
              {stats.ultimasCompras.map((c) => (
                <tr key={c.id}>
                  <td><strong className={styles.orderId}>{c.codigo}</strong></td>
                  <td>
                    <div className={styles.clientCell}>
                      <span className={styles.avatarPill}>{iniciales(c.comprador)}</span>
                      <strong>{c.comprador}</strong>
                    </div>
                  </td>
                  <td>{c.sorteoNombre}</td>
                  <td><span className={styles.categoryBadge}>{c.categoria || "—"}</span></td>
                  <td><strong>{c.boletos}</strong> boletos</td>
                  <td><strong className={styles.priceText}>{formatMoney(c.total)}</strong></td>
                  <td>
                    <span className={`${styles.statusPill} ${c.estado === "aprobado" ? styles.aprobado : styles.pendiente}`}>
                      {c.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.dateCol}>{hace(c.fecha_compra)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
