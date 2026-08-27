import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteos, getGanadores, sortearGanador, actualizarGanador } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminGanadores() {
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [ganadores, setGanadores] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [error, setError] = useState("");

  const cargarGanadores = () => {
    getGanadores().then(setGanadores).catch((err) => console.error("Error cargando ganadores:", err));
  };

  const cargarSorteos = () => {
    getSorteos()
      .then((data) => {
        setSorteos(data);
        const elegible = data.find((s) => s.estado !== "finalizado" && s.vendidos > 0);
        if (elegible) setSorteoId(String(elegible.id));
        else if (data.length > 0) setSorteoId(String(data[0].id));
      })
      .catch((err) => console.error("Error cargando sorteos:", err));
  };

  useEffect(() => {
    cargarSorteos();
    cargarGanadores();
  }, []);

  const handleSortear = async () => {
    if (!sorteoId) return;
    setError("");
    setSorteando(true);
    try {
      await sortearGanador(sorteoId);
      cargarSorteos();
      cargarGanadores();
    } catch (err) {
      setError(err.message || "No se pudo realizar el sorteo");
    } finally {
      setSorteando(false);
    }
  };

  const toggleEntregado = async (g) => {
    try {
      await actualizarGanador(g.id, { premioEntregado: !g.premio_entregado });
      cargarGanadores();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el ganador");
    }
  };

  const sorteoActual = sorteos.find((s) => String(s.id) === sorteoId);
  const puedeSortear = sorteoActual && sorteoActual.estado !== "finalizado" && sorteoActual.vendidos > 0;

  const kpis = [
    { label: "Total Ganadores", value: ganadores.length, subtitle: "Sorteos con ganador", icon: "award", color: "purple" },
    { label: "Premios Entregados", value: ganadores.filter((g) => g.premio_entregado).length, subtitle: "Ya entregados", icon: "box", color: "green" },
    { label: "Premios Pendientes", value: ganadores.filter((g) => !g.premio_entregado).length, subtitle: "Por entregar", icon: "clock", color: "orange" },
    { label: "Sorteos por Sortear", value: sorteos.filter((s) => s.estado !== "finalizado" && s.vendidos > 0).length, subtitle: "Listos para sortear", icon: "ticket", color: "blue" },
  ];

  return (
    <AdminLayout title="Gestión de Ganadores" subtitle="Elige un sorteo con boletos vendidos y realiza el sorteo del ganador">
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

      <div className={styles.tableCard} style={{ padding: "18px" }}>
        <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#17152b", marginBottom: "14px" }}>Realizar Sorteo</h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={sorteoId}
          onChange={(e) => setSorteoId(e.target.value)}
          className={styles.filterSelect}
          style={{ minWidth: "260px" }}
        >
          {sorteos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} {s.estado === "finalizado" ? "(finalizado)" : `— ${s.vendidos} vendidos`}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.createBtn}
          onClick={handleSortear}
          disabled={sorteando || !puedeSortear}
        >
          {sorteando ? "Sorteando..." : "🏆 Realizar Sorteo"}
        </button>
        {sorteoActual?.estado === "finalizado" && (
          <span style={{ fontSize: "13px", color: "#9795a8" }}>Este sorteo ya tiene ganador.</span>
        )}
        {sorteoActual && sorteoActual.estado !== "finalizado" && !sorteoActual.vendidos && (
          <span style={{ fontSize: "13px", color: "#9795a8" }}>Este sorteo todavía no tiene boletos vendidos.</span>
        )}
        {error && <span style={{ fontSize: "13px", color: "#ef4444" }}>⚠️ {error}</span>}
        </div>
      </div>

      <div className={styles.tableCard} style={{ marginTop: "16px" }}>
        <div className={styles.tableCardHeader} style={{ borderBottom: "1.5px solid #ecebf3" }}>
          <div>
            <h3>Historial de Ganadores</h3>
            <p>Ganadores sorteados y estado de entrega del premio</p>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sorteo</th>
              <th>Ganador</th>
              <th>Boleto Ganador</th>
              <th>Fecha Sorteo</th>
              <th>Premio Entregado</th>
            </tr>
          </thead>
          <tbody>
            {ganadores.length === 0 && (
              <tr><td colSpan={5}>Todavía no se ha sorteado ningún ganador.</td></tr>
            )}
            {ganadores.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.sorteo_nombre}</strong></td>
                <td>{g.cliente_nombre}</td>
                <td><span className={styles.categoryBadge}>#{g.boleto_numero}</span></td>
                <td>{new Date(g.fecha_sorteo).toLocaleDateString("es-ES")}</td>
                <td>
                  <button
                    type="button"
                    className={`${styles.statusPill} ${g.premio_entregado ? styles.activo : styles.proximamente}`}
                    style={{ border: "none", cursor: "pointer" }}
                    onClick={() => toggleEntregado(g)}
                  >
                    {g.premio_entregado ? "ENTREGADO" : "PENDIENTE"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
