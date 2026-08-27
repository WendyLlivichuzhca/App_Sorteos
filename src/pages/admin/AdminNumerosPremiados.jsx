import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteoById, getPremiadosAdmin, crearPremiado, actualizarPremiado, eliminarPremiado, generarPremiadosAlAzar } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminNumerosPremiados() {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  const [sorteo, setSorteo] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numero, setNumero] = useState("");
  const [premio, setPremio] = useState("");
  const [error, setError] = useState("");
  const [cantidadAzar, setCantidadAzar] = useState(10);
  const [generando, setGenerando] = useState(false);
  const [errorAzar, setErrorAzar] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPremio, setEditPremio] = useState("");

  const cargar = () => {
    setLoading(true);
    getPremiadosAdmin(sorteoId)
      .then(setList)
      .catch((err) => console.error("Error cargando números premiados:", err))
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
    if (!numero.trim() || !premio.trim()) return;
    try {
      await crearPremiado(sorteoId, { numero: numero.trim(), premio: premio.trim() });
      setNumero("");
      setPremio("");
      cargar();
    } catch (err) {
      setError(err.message || "No se pudo crear el número premiado");
    }
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditPremio(p.premio);
  };

  const handleSaveEdit = async (p) => {
    try {
      await actualizarPremiado(p.id, { premio: editPremio.trim() || p.premio });
      setEditingId(null);
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el premio");
    }
  };

  const toggleEntregado = async (p) => {
    try {
      await actualizarPremiado(p.id, { entregado: !p.entregado });
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo actualizar");
    }
  };

  const handleGenerarAzar = async (e) => {
    e.preventDefault();
    setErrorAzar("");
    if (!cantidadAzar || cantidadAzar < 1) return;
    setGenerando(true);
    try {
      await generarPremiadosAlAzar(sorteoId, { cantidad: cantidadAzar, premio: "Por definir" });
      cargar();
    } catch (err) {
      setErrorAzar(err.message || "No se pudieron generar los números");
    } finally {
      setGenerando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este número premiado?")) return;
    try {
      await eliminarPremiado(id);
      cargar();
    } catch (err) {
      alert(err.message || "No se pudo eliminar");
    }
  };

  const kpis = [
    { label: "Total Números", value: list.length, subtitle: "Configurados", icon: "award", color: "purple" },
    { label: "Ganados", value: list.filter((p) => p.ganado).length, subtitle: "Ya vendidos y coincidieron", icon: "ticket", color: "green" },
    { label: "Entregados", value: list.filter((p) => p.entregado).length, subtitle: "Premio ya entregado", icon: "box", color: "blue" },
  ];

  return (
    <AdminLayout
      title="Números Premiados"
      subtitle={sorteo ? `Premios instantáneos del sorteo: ${sorteo.nombre}` : "Cargando sorteo..."}
    >
      <div className={styles.topRow}>
        <Link to="/admin/sorteos" className={styles.iconBtn} style={{ textDecoration: "none" }}>
          <Icon name="chevronLeft" size={16} /> Volver a Sorteos
        </Link>
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
              <h3>Lista de Números Premiados</h3>
              <p>Cuando un cliente compre uno de estos números, se marca ganado automáticamente</p>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Premio</th>
                <th>Ganador</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5}>Cargando...</td></tr>}
              {!loading && list.length === 0 && (
                <tr><td colSpan={5}>Todavía no has agregado números premiados para este sorteo.</td></tr>
              )}
              {list.map((p) => (
                <tr key={p.id}>
                  <td><strong style={{ color: "#6d3cf5" }}>#{p.numero}</strong></td>
                  <td>
                    {editingId === p.id ? (
                      <input
                        type="text"
                        value={editPremio}
                        onChange={(e) => setEditPremio(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1.5px solid #6d3cf5", fontSize: "12px" }}
                      />
                    ) : (
                      p.premio
                    )}
                  </td>
                  <td>{p.cliente_nombre || "—"}</td>
                  <td>
                    {p.entregado ? (
                      <span className={`${styles.statusPill} ${styles.activo}`}>ENTREGADO</span>
                    ) : p.ganado ? (
                      <span className={`${styles.statusPill} ${styles.proximamente}`}>GANADO</span>
                    ) : (
                      <span className={`${styles.statusPill} ${styles.agotado}`}>SIN VENDER</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {editingId === p.id ? (
                        <button type="button" className={styles.iconBtn} onClick={() => handleSaveEdit(p)} title="Guardar">
                          💾
                        </button>
                      ) : (
                        <button type="button" className={styles.iconBtn} onClick={() => handleStartEdit(p)} title="Editar premio">
                          ✏️
                        </button>
                      )}
                      {p.ganado ? (
                        <button type="button" className={styles.iconBtn} onClick={() => toggleEntregado(p)} title={p.entregado ? "Marcar como pendiente" : "Marcar como entregado"}>
                          {p.entregado ? "↩️" : "✅"}
                        </button>
                      ) : null}
                      <button type="button" className={styles.iconBtn} onClick={() => handleEliminar(p.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", alignSelf: "start" }}>
          <div className={styles.tableCard} style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#17152b" }}>Agregar Número Premiado</h3>
            <form onSubmit={handleAgregar} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={styles.formGroup}>
                <label>Número de boleto</label>
                <input
                  type="text"
                  placeholder="Ej: 00472"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Premio</label>
                <input
                  type="text"
                  placeholder="Ej: $20 en efectivo"
                  value={premio}
                  onChange={(e) => setPremio(e.target.value)}
                />
              </div>
              {error && <span style={{ fontSize: "12px", color: "#ef4444" }}>⚠️ {error}</span>}
              <button type="submit" className={styles.createBtn} style={{ justifyContent: "center" }}>
                + Agregar Número
              </button>
            </form>
          </div>

          <div className={styles.tableCard} style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#17152b" }}>🎲 Generar al Azar</h3>
            <p style={{ fontSize: "11.5px", color: "#6b6880", marginTop: "4px" }}>
              Elige números reales de este sorteo al azar. Después ponle el premio a cada uno con el ✏️ de la tabla.
            </p>
            <form onSubmit={handleGenerarAzar} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={styles.formGroup}>
                <label>Cantidad de números</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadAzar}
                  onChange={(e) => setCantidadAzar(parseInt(e.target.value, 10) || "")}
                />
              </div>
              {errorAzar && <span style={{ fontSize: "12px", color: "#ef4444" }}>⚠️ {errorAzar}</span>}
              <button type="submit" className={styles.createBtn} style={{ justifyContent: "center" }} disabled={generando}>
                {generando ? "Generando..." : "🎲 Generar Números"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
