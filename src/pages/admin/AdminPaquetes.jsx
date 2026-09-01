import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getDescuentos, createDescuento, updateDescuento, deleteDescuento } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminPaquetes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ cantidadMinima: 5, porcentaje: 10 });
  const [editingId, setEditingId] = useState(null);
  const [editPorcentaje, setEditPorcentaje] = useState(0);
  const [creando, setCreando] = useState(false);

  const cargarDescuentos = () => {
    setLoading(true);
    getDescuentos()
      .then(setList)
      .catch((err) => console.error("Error cargando descuentos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDescuentos();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creando) return;
    setCreando(true);
    try {
      await createDescuento(formData);
      setShowModal(false);
      setFormData({ cantidadMinima: 5, porcentaje: 10 });
      cargarDescuentos();
    } catch (err) {
      alert(err.message || "No se pudo crear el tramo de descuento");
    } finally {
      setCreando(false);
    }
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditPorcentaje(p.porcentaje);
  };

  const handleSaveEdit = async (p) => {
    if (Number.isNaN(editPorcentaje) || editPorcentaje < 0 || editPorcentaje > 90) {
      alert("El descuento debe ser un número entre 0% y 90%");
      return;
    }
    try {
      await updateDescuento(p.id, { cantidadMinima: p.cantidad_minima, porcentaje: editPorcentaje });
      setEditingId(null);
      cargarDescuentos();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el tramo de descuento");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este tramo de descuento?")) return;
    try {
      await deleteDescuento(id);
      cargarDescuentos();
    } catch (err) {
      alert(err.message || "No se pudo eliminar el tramo de descuento");
    }
  };

  const porcentajes = list.map((p) => p.porcentaje);
  const cantidades = list.map((p) => p.cantidad_minima);
  const kpis = [
    { label: "Total Tramos", value: list.length, subtitle: "Tramos configurados", icon: "box", color: "purple" },
    { label: "Desde", value: list.length ? `${Math.min(...cantidades)}+` : "—", subtitle: "Boletos mínimos", icon: "ticket", color: "orange" },
    { label: "Descuento Mínimo", value: list.length ? `${Math.min(...porcentajes)}%` : "—", subtitle: "El más bajo", icon: "chart", color: "green" },
    { label: "Descuento Máximo", value: list.length ? `${Math.max(...porcentajes)}%` : "—", subtitle: "El más alto", icon: "award", color: "blue" },
  ];

  return (
    <AdminLayout
      title="Descuentos por Volumen"
      subtitle="Estos tramos son los que realmente usa el checkout: si un cliente compra desde la cantidad mínima, se le aplica automáticamente el porcentaje de descuento."
    >
      <div className={styles.topRow}>
        <div />
        <button type="button" className={styles.createBtn} onClick={() => setShowModal(true)}>
          <Icon name="plus" size={18} /> Crear Nuevo Tramo
        </button>
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Desde (boletos)</th>
              <th>Descuento (%)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3}>Cargando...</td></tr>}
            {!loading && list.length === 0 && <tr><td colSpan={3}>No hay tramos de descuento configurados.</td></tr>}
            {list.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.cantidad_minima}+ boletos</strong></td>
                <td>
                  {editingId === p.id ? (
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={editPorcentaje}
                      onChange={(e) => setEditPorcentaje(parseInt(e.target.value, 10))}
                      style={{ width: "70px", padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #1F8A5A" }}
                    />
                  ) : (
                    <span className={styles.categoryBadge}>{p.porcentaje}% OFF</span>
                  )}
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    {editingId === p.id ? (
                      <button type="button" className={styles.iconBtn} onClick={() => handleSaveEdit(p)} title="Guardar">
                        💾
                      </button>
                    ) : (
                      <button type="button" className={styles.iconBtn} onClick={() => handleStartEdit(p)} title="Editar">
                        ✏️
                      </button>
                    )}
                    <button type="button" className={styles.iconBtn} onClick={() => handleDelete(p.id)} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Crear Tramo de Descuento</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cantidad mínima de boletos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.cantidadMinima}
                    onChange={(e) => setFormData({ ...formData, cantidadMinima: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="90"
                    value={formData.porcentaje}
                    onChange={(e) => setFormData({ ...formData, porcentaje: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={creando}>{creando ? "Guardando..." : "Guardar Tramo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
