import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
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

  return (
    <AdminLayout title="Gestión de Ganadores">
      <div className={styles.topRow}>
        <div>
          <h2>Sorteo y Publicación de Ganadores</h2>
          <p>Elige un sorteo con boletos vendidos y realiza el sorteo del ganador</p>
        </div>
      </div>

      <div className={styles.tableCard} style={{ padding: "20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={sorteoId}
          onChange={(e) => setSorteoId(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #ecebf3", minWidth: "260px" }}
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

      <div className={styles.tableCard} style={{ marginTop: "16px" }}>
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
