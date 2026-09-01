import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteoById, getLugaresAdmin, crearLugar, actualizarLugar, eliminarLugar } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

const NOMBRES_LUGAR = ["1er Lugar", "2do Lugar", "3er Lugar", "4to Lugar", "5to Lugar"];
const nombreLugar = (orden) => NOMBRES_LUGAR[orden - 1] || `${orden}° Lugar`;

export default function AdminLugaresSorteo() {
  const { sorteoId } = useParams();
  const [sorteo, setSorteo] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [premio, setPremio] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPremio, setEditPremio] = useState("");
  const [agregando, setAgregando] = useState(false);

  const cargar = () => {
    setLoading(true);
    getLugaresAdmin(sorteoId)
      .then(setList)
      .catch((err) => console.error("Error cargando lugares:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getSorteoById(sorteoId)
      .then(setSorteo)
      .catch((err) => console.error("Error cargando sorteo:", err));
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorteoId]);

  const handleAgregar = async (e) => {
    e.preventDefault();
    setError("");
    if (!premio.trim() || agregando) return;
    setAgregando(true);
    try {
      await crearLugar(sorteoId, { premio: premio.trim() });
      setPremio("");
      cargar();
    } catch (err) {
      setError(err.message || "No se pudo crear el lugar");
    } finally {
      setAgregando(false);
    }
  };

  const handleStartEdit = (l) => {
    setEditingId(l.id);
    setEditPremio(l.premio);
  };

  const handleSaveEdit = async (l) => {
    try {
      await actualizarLugar(l.id, { premio: editPremio.trim() || l.premio });
      setEditingId(null);
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el premio");
    }
  };

  const toggleEntregado = async (l) => {
    try {
      await actualizarLugar(l.id, { entregado: !l.entregado });
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo actualizar");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este lugar?")) return;
    try {
      await eliminarLugar(id);
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo eliminar");
    }
  };

  const kpis = [
    { label: "Total Lugares", value: list.length, subtitle: "Premios configurados", icon: "award", color: "purple" },
    { label: "Ya Sorteados", value: list.filter((l) => l.boleto_numero).length, subtitle: "Con ganador", icon: "ticket", color: "green" },
    { label: "Pendientes", value: list.filter((l) => !l.boleto_numero).length, subtitle: "Por sortear", icon: "clock", color: "orange" },
  ];

  return (
    <AdminLayout
      title="Premio Mayor y Lugares"
      subtitle={sorteo ? `Lugares y ganadores del sorteo: ${sorteo.nombre}` : "Cargando sorteo..."}
    >
      <div className={styles.topRow}>
        <Link to="/admin/sorteos" className={styles.iconBtn} style={{ textDecoration: "none" }}>
          <Icon name="chevronLeft" size={16} /> Volver a Sorteos
        </Link>
        {list.some((l) => !l.boleto_numero) && (
          <Link to={`/admin/ganadores/en-vivo?sorteo=${sorteoId}`} className={styles.createBtn} style={{ textDecoration: "none" }}>
            🎉 Ir a Sorteo en Vivo
          </Link>
        )}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <div>
              <h3>Lugares del Sorteo</h3>
              <p>Cada lugar tiene su propio premio y su propio ganador</p>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lugar</th>
                <th>Premio</th>
                <th>Ganador</th>
                <th>Boleto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}>Cargando...</td></tr>}
              {!loading && list.length === 0 && (
                <tr><td colSpan={6}>Todavía no has agregado lugares para este sorteo.</td></tr>
              )}
              {list.map((l) => (
                <tr key={l.id}>
                  <td><span className={styles.categoryBadge}>{nombreLugar(l.orden)}</span></td>
                  <td>
                    {editingId === l.id ? (
                      <input
                        type="text"
                        value={editPremio}
                        onChange={(e) => setEditPremio(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1.5px solid #1F8A5A", fontSize: "12px" }}
                      />
                    ) : (
                      <strong>{l.premio}</strong>
                    )}
                  </td>
                  <td>{l.cliente_nombre || "—"}</td>
                  <td>{l.boleto_numero ? <strong style={{ color: "#34D399" }}>#{l.boleto_numero}</strong> : "—"}</td>
                  <td>
                    {l.entregado ? (
                      <span className={`${styles.statusPill} ${styles.activo}`}>ENTREGADO</span>
                    ) : l.boleto_numero ? (
                      <span className={`${styles.statusPill} ${styles.proximamente}`}>SORTEADO</span>
                    ) : (
                      <span className={`${styles.statusPill} ${styles.agotado}`}>PENDIENTE</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {editingId === l.id ? (
                        <button type="button" className={styles.iconBtn} onClick={() => handleSaveEdit(l)} title="Guardar">
                          💾
                        </button>
                      ) : (
                        <button type="button" className={styles.iconBtn} onClick={() => handleStartEdit(l)} title="Editar premio">
                          ✏️
                        </button>
                      )}
                      {l.boleto_numero ? (
                        <button type="button" className={styles.iconBtn} onClick={() => toggleEntregado(l)} title={l.entregado ? "Marcar como pendiente" : "Marcar como entregado"}>
                          {l.entregado ? "↩️" : "✅"}
                        </button>
                      ) : (
                        <button type="button" className={styles.iconBtn} onClick={() => handleEliminar(l.id)} title="Eliminar">
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableCard} style={{ padding: "18px", alignSelf: "start" }}>
          <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#F2F5F3" }}>Agregar un Lugar</h3>
          <p style={{ fontSize: "11.5px", color: "#A9B3AD", marginTop: "4px" }}>
            Por ejemplo, si ya tienes el 1er lugar (el premio principal), agrega aquí el 2do lugar con su propio premio.
          </p>
          <form onSubmit={handleAgregar} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className={styles.formGroup}>
              <label>Premio de este lugar</label>
              <input
                type="text"
                placeholder="Ej: KTM Duke 390 2026"
                value={premio}
                onChange={(e) => setPremio(e.target.value)}
              />
            </div>
            {error && <span style={{ fontSize: "12px", color: "#ef4444" }}>⚠️ {error}</span>}
            <button type="submit" className={styles.createBtn} style={{ justifyContent: "center" }} disabled={agregando}>
              {agregando ? "Agregando..." : "+ Agregar Lugar"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
