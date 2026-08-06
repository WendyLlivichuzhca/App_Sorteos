import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getAdminDashboard } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminDashboard.module.css";

const ventasMensuales = [
  { mes: "Ene", ventas: 240, ingresos: 480 },
  { mes: "Feb", ventas: 310, ingresos: 620 },
  { mes: "Mar", ventas: 450, ingresos: 900 },
  { mes: "Abr", ventas: 520, ingresos: 1040 },
  { mes: "May", ventas: 680, ingresos: 1360 },
  { mes: "Jun", ventas: 610, ingresos: 1220 },
  { mes: "Jul", ventas: 820, ingresos: 1640 },
  { mes: "Ago", ventas: 950, ingresos: 1900, isCurrent: true },
];

const topSorteos = [
  { nombre: "Toyota Fortuner 4x4", vendidos: 650, total: 1200, porcentaje: 54, tag: "Autos" },
  { nombre: "Yamaha MT-09", vendidos: 900, total: 1059, porcentaje: 85, tag: "Motos" },
  { nombre: "iPhone 15 Pro Max", vendidos: 300, total: 750, porcentaje: 40, tag: "Tecnología" },
];

const comprasRecientes = [
  { id: "ORD-9281", comprador: "Carlos Mendoza", avatar: "CM", sorteo: "Toyota Fortuner 4x4", categoria: "Autos", boletos: 10, total: 15.00, estado: "aprobado", fecha: "Hace 10 min" },
  { id: "ORD-9280", comprador: "María Fernanda Ríos", avatar: "MR", sorteo: "iPhone 15 Pro Max", categoria: "Tecnología", boletos: 5, total: 6.00, estado: "aprobado", fecha: "Hace 25 min" },
  { id: "ORD-9279", comprador: "Juan Pablo Torres", avatar: "JT", sorteo: "Yamaha MT-09", categoria: "Motos", boletos: 20, total: 42.00, estado: "pendiente", fecha: "Hace 40 min" },
  { id: "ORD-9278", comprador: "Lucía Gómez", avatar: "LG", sorteo: "Toyota Fortuner 4x4", categoria: "Autos", boletos: 1, total: 2.00, estado: "aprobado", fecha: "Hace 1 hora" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVentas: 0,
    sorteosActivos: 0,
    boletosVendidos: 0,
    ultimasCompras: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(ventasMensuales[ventasMensuales.length - 1]);

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

  const kpis = [
    { label: "Ventas Totales", value: `${stats.boletosVendidos}`, subtitle: "Boletos vendidos", trend: "+14.2%", isUp: true, icon: "ticket" },
    { label: "Ingresos Totales", value: formatMoney(stats.totalVentas), subtitle: "Recaudación neta", trend: "+18.4%", isUp: true, icon: "card" },
    { label: "Sorteos Activos", value: `${stats.sorteosActivos} Activos`, subtitle: "En curso ahora", trend: "En curso", isUp: true, icon: "award" },
    { label: "Ventas Hoy", value: `${stats.ultimasCompras.length}`, subtitle: "Compras recientes", trend: "+8.5%", isUp: true, icon: "chart" },
  ];

  return (
    <AdminLayout title="Dashboard de Control">
      {/* 1. KPIs Grid Top */}
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIconWrap}>
                <Icon name={k.icon} size={20} />
              </div>
              <span className={`${styles.kpiTrend} ${k.isUp ? styles.trendUp : ""}`}>
                {k.trend}
              </span>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <strong className={styles.kpiValue}>{k.value}</strong>
              <span className={styles.kpiSubtitle}>{k.subtitle}</span>
            </div>
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
              <p>Monitoreo del crecimiento de recaudación por mes</p>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendDot} />
              <span>Ventas acumuladas ($)</span>
            </div>
          </div>

          {/* Renderizado del Gráfico de Barras */}
          <div className={styles.barsContainer}>
            {ventasMensuales.map((m) => {
              const maxVal = 1000;
              const heightPercent = Math.round((m.ventas / maxVal) * 100);
              const isSelected = selectedMonth.mes === m.mes;

              return (
                <div
                  key={m.mes}
                  className={`${styles.barCol} ${isSelected ? styles.barColActive : ""}`}
                  onClick={() => setSelectedMonth(m)}
                >
                  <div className={styles.barTooltip}>
                    <strong>${m.ingresos}</strong>
                    <span>{m.ventas} boletos</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{m.mes}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.chartFooter}>
            <div className={styles.footerStat}>
              <span>Mes Seleccionado: <strong>{selectedMonth.mes}</strong></span>
              <span>Total Recaudado: <strong className={styles.accentText}>${selectedMonth.ingresos}.00</strong></span>
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
            {topSorteos.map((s) => (
              <div key={s.nombre} className={styles.topItem}>
                <div className={styles.topItemHead}>
                  <strong>{s.nombre}</strong>
                  <span className={styles.tagPill}>{s.tag}</span>
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
              {comprasRecientes.map((c) => (
                <tr key={c.id}>
                  <td><strong className={styles.orderId}>{c.id}</strong></td>
                  <td>
                    <div className={styles.clientCell}>
                      <span className={styles.avatarPill}>{c.avatar}</span>
                      <strong>{c.comprador}</strong>
                    </div>
                  </td>
                  <td>{c.sorteo}</td>
                  <td><span className={styles.categoryBadge}>{c.categoria}</span></td>
                  <td><strong>{c.boletos}</strong> boletos</td>
                  <td><strong className={styles.priceText}>{formatMoney(c.total)}</strong></td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[c.estado]}`}>
                      {c.estado === "aprobado" ? "APROBADO" : "PENDIENTE"}
                    </span>
                  </td>
                  <td className={styles.dateCol}>{c.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
